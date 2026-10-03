#!/usr/bin/env node
// SessionStart 훅: 세션을 열 때 팀 main과 내 작업 상태를 알려준다.
// 모두가 main에 직접 push하므로, 작업 전에 최신 내용을 받았는지가 가장 중요하다.
// stdout은 Claude의 컨텍스트에 추가된다. 실패해도 세션을 막지 않는다(항상 exit 0).
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const git = (...args) => {
  try {
    return execFileSync("git", ["-C", repoRoot, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 8000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    }).trim();
  } catch {
    return null;
  }
};

const fetched = git("fetch", "--quiet", "origin") !== null;
const branch = git("rev-parse", "--abbrev-ref", "HEAD") ?? "?";
const counts = git("rev-list", "--left-right", "--count", "HEAD...origin/main");
const [ahead, behind] = counts ? counts.split(/\s+/).map(Number) : [null, null];
const dirty = (git("status", "--porcelain") ?? "").split("\n").filter(Boolean).length;

const lines = [`[galaba] 브랜치: ${branch}`];
if (!fetched) lines.push("- origin fetch 실패(오프라인?). 아래 숫자는 마지막 fetch 기준이에요.");
if (behind) lines.push(`- origin/main보다 ${behind}커밋 뒤처져 있어요. 작업 전에 \`git pull --rebase --autostash origin main\` 하세요.`);
if (ahead) lines.push(`- 아직 push 안 한 커밋 ${ahead}개가 있어요.`);
if (dirty) lines.push(`- 커밋 안 한 변경 파일 ${dirty}개가 있어요.`);
if (!behind && !ahead && !dirty) lines.push("- origin/main과 같은 상태예요.");
console.log(lines.join("\n"));
