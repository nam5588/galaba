#!/usr/bin/env node
// PreToolUse(Bash) 훅: main에 직접 push하는 팀 규칙을 지키기 위한 안전장치.
//  1) force push / --mirror / main 삭제 push 차단
//  2) .env 같은 비밀 파일이 커밋·푸시에 섞이면 차단
//  3) git push 전: 커밋 안 된 변경이 있으면 차단, `npm run check`(타입체크) 실패 시 차단
// exit 2 = 차단(stderr가 Claude에게 전달됨), exit 0 = 통과.
//
// 명령 문자열을 셸처럼 토큰으로 나눠서 "실제로 실행되는 git 하위 명령"만 본다.
// 그래서 `echo "git push --force"`, `git commit -m "push 알림"`, `git stash push`는 push로 보지 않는다.
// `bash -c "..."`처럼 문자열 안에 숨긴 명령까지는 보지 않는다.
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PULL_HINT = "`git pull --rebase --autostash origin main`";

let input = "";
for await (const chunk of process.stdin) input += chunk;

let command = "";
try {
  command = JSON.parse(input)?.tool_input?.command ?? "";
} catch {
  process.exit(0);
}
if (typeof command !== "string" || !command.includes("git")) process.exit(0);

const block = (msg) => {
  process.stderr.write(`[guard-git] ${msg}\n`);
  process.exit(2);
};

const git = (...args) => {
  try {
    return execFileSync("git", ["-C", repoRoot, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
};
const lines = (s) => s.split("\n").map((l) => l.trim()).filter(Boolean);

// --- 셸 명령을 세그먼트(;, &&, ||, |, 줄바꿈으로 구분)와 토큰으로 나눈다 ---
function segments(cmd) {
  const segs = [];
  let tokens = [];
  let cur = "";
  let has = false;
  const endToken = () => {
    if (has) tokens.push(cur);
    cur = "";
    has = false;
  };
  const endSeg = () => {
    endToken();
    if (tokens.length) segs.push(tokens);
    tokens = [];
  };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (c === "'") {
      const j = cmd.indexOf("'", i + 1);
      cur += j === -1 ? cmd.slice(i + 1) : cmd.slice(i + 1, j);
      has = true;
      i = j === -1 ? cmd.length : j;
    } else if (c === '"') {
      let j = i + 1;
      while (j < cmd.length && cmd[j] !== '"') {
        if (cmd[j] === "\\" && j + 1 < cmd.length) j++;
        cur += cmd[j++];
      }
      has = true;
      i = j;
    } else if (c === "\\" && i + 1 < cmd.length) {
      cur += cmd[++i];
      has = true;
    } else if (c === "#" && !has) {
      while (i < cmd.length && cmd[i] !== "\n") i++;
      endSeg();
    } else if (c === ";" || c === "|" || c === "&" || c === "\n" || c === "(" || c === ")") {
      endSeg();
    } else if (/\s/.test(c)) {
      endToken();
    } else {
      cur += c;
      has = true;
    }
  }
  endSeg();
  return segs;
}

// git 전역 옵션(-C <dir>, -c <k=v>, --no-pager 등)을 건너뛰고 하위 명령과 인자를 돌려준다.
function gitInvocation(tokens) {
  let i = 0;
  while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i++; // FOO=bar git ...
  if (["command", "exec", "time", "nohup"].includes(tokens[i])) i++;
  const bin = tokens[i];
  if (!bin || !/(^|[\\/])git(\.exe)?$/.test(bin)) return null;
  i++;
  while (i < tokens.length && tokens[i].startsWith("-")) {
    const opt = tokens[i];
    i += ["-C", "-c", "--git-dir", "--work-tree", "--namespace"].includes(opt) ? 2 : 1;
  }
  if (i >= tokens.length) return null;
  return { sub: tokens[i], args: tokens.slice(i + 1) };
}

const calls = segments(command).map(gitInvocation).filter(Boolean);
if (!calls.length) process.exit(0);

const pushes = calls.filter((c) => c.sub === "push");
const adds = calls.filter((c) => c.sub === "add");
const commits = calls.filter((c) => c.sub === "commit");

// 1) 위험한 push
for (const { args } of pushes) {
  const forced = args.some(
    (a) =>
      /^--force(-with-lease(=.*)?|-if-includes)?$/.test(a) ||
      /^-[A-Za-z]*f[A-Za-z]*$/.test(a) ||
      a === "--mirror" ||
      (a.startsWith("+") && a.length > 1),
  );
  if (forced) {
    block(
      "force push(--force, -f, +브랜치, --mirror)는 막혀 있어요. 팀이 main에 직접 push해서 다른 사람 커밋이 지워질 수 있어요. " +
        `${PULL_HINT}로 최신 내용을 받은 뒤 일반 \`git push origin main\`을 쓰세요.`,
    );
  }
  const deletesMain =
    (args.some((a) => a === "--delete" || /^-[A-Za-z]*d[A-Za-z]*$/.test(a)) && args.some((a) => /(^|\/)main$/.test(a))) ||
    args.some((a) => /^:(refs\/heads\/)?main$/.test(a));
  if (deletesMain) block("원격 main 브랜치를 지우는 push는 막혀 있어요.");
}

// 2) 비밀 파일 (.env, .env.local 등. .env.example은 허용, 삭제는 허용)
const envPattern = /(^|[\\/])\.env(\.(?!example$)[^\\/]*)?$/;
const leaked = new Set();
for (const { args } of [...adds, ...commits]) {
  for (const a of args) if (!a.startsWith("-") && envPattern.test(a)) leaked.add(a);
}
if (adds.length || commits.length || pushes.length) {
  for (const line of git("status", "--porcelain", "--untracked-files=all").split("\n")) {
    if (!line.trim() || line[0] === "D" || line[1] === "D") continue;
    const path = line.slice(3).split(" -> ").pop().replace(/^"|"$/g, "");
    if (envPattern.test(path)) leaked.add(path);
  }
}
const upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}").trim() || "origin/main";
if (pushes.length) {
  for (const p of lines(git("log", "--format=", "--name-only", "--diff-filter=ACMR", `${upstream}..HEAD`))) {
    if (envPattern.test(p)) leaked.add(`${p} (push할 커밋 안에 있음)`);
  }
}
if (leaked.size) {
  block(
    `비밀 파일이 커밋·푸시될 수 있는 상태예요: ${[...leaked].join(", ")}\n` +
      "레포가 public이라 API 키가 GitHub에 올라가면 바로 유출돼요. 파일을 .gitignore에 넣고, 이미 스테이징했다면 " +
      "`git rm --cached <파일>`로 빼세요. 이미 커밋했다면 push하지 말고 그 커밋을 고친 뒤(예: `git reset --soft " +
      upstream +
      "` 후 다시 커밋) 키도 새로 발급하세요. 공유할 값은 .env.example에 키 이름만 적으세요.",
  );
}

// 3) push 전 검사: 작업 트리가 "올라갈 커밋"과 같아야 타입체크 결과를 믿을 수 있다.
//    같은 명령 안에서 push보다 먼저 실행되는 `git add`/`git commit`이 반영할 변경은 커밋될 것으로 본다.
if (pushes.length) {
  const firstPush = calls.indexOf(pushes[0]);
  const before = calls.slice(0, firstPush);
  const willCommit = before.some((c) => c.sub === "commit");
  const commitAll = before.some(
    (c) => c.sub === "commit" && c.args.some((a) => a === "--all" || /^-[A-Za-z]*a[A-Za-z]*$/.test(a)),
  );
  const addArgs = before.filter((c) => c.sub === "add").flatMap((c) => c.args);
  const addAll = addArgs.some((a) => ["-A", "--all", ".", ":/"].includes(a));
  const addPaths = addArgs.filter((a) => !a.startsWith("-")).map((a) => a.replace(/^\.\//, "").replace(/\/$/, ""));
  const added = (p) => addAll || addPaths.some((a) => p === a || p.startsWith(`${a}/`));
  const covered = (line) => {
    if (!willCommit) return false;
    const path = line.slice(3).split(" -> ").pop().replace(/^"|"$/g, "");
    if (line.startsWith("??")) return added(path);
    return line[1] === " " || commitAll || added(path);
  };

  // porcelain 줄은 앞 공백(" M")이 의미가 있으니 trim하지 않는다
  const status = git("status", "--porcelain", "--untracked-files=all")
    .split("\n")
    .filter((l) => l.trim() && !covered(l));
  const modified = status.filter((l) => !l.startsWith("??"));
  const newSource = status
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3))
    .filter((p) => /^(frontend|backend)\//.test(p));
  if (modified.length || newSource.length) {
    block(
      "커밋 안 된 변경이 있어서 push 전 검사를 할 수 없어요. 올릴 것은 커밋하고, 아닌 것은 `git stash`로 치워주세요.\n" +
        (newSource.length ? `커밋 안 된 새 파일(이게 빠지면 main이 깨질 수 있어요): ${newSource.slice(0, 10).join(", ")}\n` : "") +
        (modified.length ? `수정됐지만 커밋 안 된 파일: ${modified.slice(0, 10).map((l) => l.slice(3)).join(", ")}` : ""),
    );
  }
  const result = spawnSync("npm", ["run", "check", "--silent"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split("\n").slice(-30).join("\n");
    block(
      "push 전에 `npm run check`(타입체크)가 실패했어요. main이 깨지면 팀 전체가 막히니 먼저 고쳐주세요.\n" +
        "(node_modules가 없다면 `npm run install:all` 먼저)\n\n" +
        out,
    );
  }
}

process.exit(0);
