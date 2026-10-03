// AI 오케스트레이터 (PRD 5장): LLM tool use 루프 하나로 도구 레지스트리(tools/index.ts)의 도구를 골라 부르고,
// 결과를 출처와 함께 한 답으로 합친다. 도구 호출은 최대 5회.
// LLM은 학교 AI 게이트웨이(Claude 호환, LLM_BASE_URL + LLM_AUTH_TOKEN). 키가 없으면 오프라인 모드(도구 결과만으로 답).
import Anthropic from "@anthropic-ai/sdk";
import { calendarUrl, type CalendarAction } from "../tools/create_calendar_event.js";
import { loadDemoUser, todayKST, weekdayKo } from "../tools/demo-user.js";
import { TOOL_BY_NAME, TOOLS } from "../tools/index.js";
import type { RegulationHit } from "../tools/search_regulations.js";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}
export type SourceKind = "regulation" | "notice" | "deadline" | "timetable" | "job" | "other";
export interface ChatSource {
  title: string;
  url?: string;
  kind: SourceKind;
  text?: string;
}
export interface ChatStep {
  tool: string;
  label: string;
}
export interface ChatResponse {
  answer: string;
  toolsUsed: string[];
  sources: ChatSource[];
  steps: ChatStep[];
  actions: CalendarAction[];
  mode: "claude" | "offline";
}

const MODEL = process.env.CHAT_MODEL || "claude-opus-5";
const EFFORT = process.env.CHAT_EFFORT as "low" | "medium" | "high" | undefined;
const MAX_TOOL_CALLS = 5;

const client =
  process.env.LLM_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY
    ? new Anthropic({
        apiKey: process.env.LLM_AUTH_TOKEN ? null : process.env.ANTHROPIC_API_KEY,
        authToken: process.env.LLM_AUTH_TOKEN ?? null,
        baseURL: process.env.LLM_BASE_URL || undefined,
        timeout: 60_000,
        maxRetries: 1,
      })
    : null;

console.log(`[chat] LLM: ${client ? `${MODEL} @ ${process.env.LLM_BASE_URL || "api.anthropic.com"}` : "없음 (오프라인 모드)"}`);

const TOOL_PARAMS: Anthropic.Tool[] = TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
}));

const RULES = `너는 Dojang이야. 국민대학교 외국인 유학생의 학교·체류·알바 행정을 대신 챙겨주는 AI 비서야.
학생이 무엇을 물어도 이 채팅 하나에서 답한다. 필요한 도구를 골라 부르고, 결과를 출처와 함께 한 답으로 합친다.

규칙:
- 질문한 언어로 답한다(영어 질문 → 영어 답). 도구에 보내는 검색어는 한국어로 바꿔 보낸다.
- 도구 결과와 학칙 조항에 없는 사실은 말하지 않는다. 특히 비자·보험·알바 규정은 추측하지 않는다.
- 근거를 못 찾으면 "확인하지 못했어요"라고 말하고 문의처를 안내한다: 학사·학칙은 학사지원팀, 비자·체류는 국제교류팀 또는 외국인종합안내센터(1345).
- 학칙을 근거로 쓰면 "학칙 제N조"를 인용한다. 법령은 "출입국관리법 제N조"처럼 법 이름과 조를 쓰고, 하이코리아 매뉴얼은 "하이코리아 체류민원 매뉴얼에 따르면"처럼 밝힌다. 비자·보험 답에는 출처를 붙인다.
- 알바 질문은 search_regulations로 시간제취업 허용 시간·제한 업종을 확인하고, 허가를 먼저 받아야 한다는 점을 꼭 말한다.
- 여러 도구가 필요하면 한 번에 같이 부른다. 도구 호출은 모두 합쳐 최대 ${MAX_TOOL_CALLS}번이다.
- "챙겨야 할 것/할 일" 질문에는 get_deadlines·get_timetable·get_notices를 한 번에 함께 불러 확인하고, 날짜순 목록으로 답한다: "- 10/7(수) 무엇 — 할 일". 공지 중 마감이 있는 것도 넣는다.
- 답에 날짜가 분명한 중요한 마감(비자 만료, 납부 기한, 신청 마감)이 나오면 묻지 말고 create_calendar_event로 1~2개를 바로 만든다. 답 끝에 "캘린더 버튼을 만들어 뒀어요"라고 한 줄로 알린다.
- 알바 공고(search_jobs)는 데모용 가상 공고다. 추천할 때 "예시 공고"라고 밝힌다.
- 사용자에게 보여줄 내용은 마지막 답 하나에 모두 쓴다. 도구 호출 사이에 쓴 글은 화면에 보이지 않는다.
- 캘린더 링크나 URL을 답에 직접 쓰지 않는다. 캘린더 버튼과 출처 링크는 화면에 자동으로 붙는다.
- 사용자를 부를 때는 프로필 name의 이름을 쓴다(예: 무하마드님).
- 짧게: 핵심 답을 첫 줄에, 전체 3~10줄. 목록은 "- ", 강조는 **굵게**만 쓴다.`;

function systemPrompt(): string {
  const today = todayKST();
  return `${RULES}\n\n오늘: ${today} (${weekdayKo(today)}요일, 한국 시간)\n데모 사용자 프로필:\n${JSON.stringify(loadDemoUser(), null, 1)}`;
}

const KIND_BY_TOOL: Record<string, SourceKind> = {
  search_regulations: "regulation",
  get_notices: "notice",
  get_deadlines: "deadline",
  get_timetable: "timetable",
  search_jobs: "job",
};

interface RunState {
  toolsUsed: string[];
  steps: ChatStep[];
  sources: Map<string, ChatSource & { tool: string }>;
  actions: CalendarAction[];
}

function newState(): RunState {
  return { toolsUsed: [], steps: [], sources: new Map(), actions: [] };
}

/** 도구 하나 실행. 실패해도 throw하지 않고 { error }를 돌려준다(PRD 7.4). */
async function runTool(name: string, input: unknown, state: RunState): Promise<{ content: string; isError: boolean }> {
  const tool = TOOL_BY_NAME.get(name);
  if (!tool) return { content: JSON.stringify({ error: `알 수 없는 도구: ${name}` }), isError: true };
  const args = (input ?? {}) as Record<string, unknown>;
  if (!state.toolsUsed.includes(name)) state.toolsUsed.push(name);
  state.steps.push({ tool: name, label: tool.label?.(args) ?? name });
  let output: unknown;
  try {
    output = await tool.run(args);
  } catch (err) {
    output = { error: String((err as Error)?.message ?? err) };
  }
  if (output && typeof output === "object" && "error" in output) {
    console.warn(`[chat] 도구 실패 ${name}: ${(output as { error: string }).error}`);
    return { content: JSON.stringify(output), isError: true };
  }
  collect(name, output, state);
  return { content: JSON.stringify(output).slice(0, 12_000), isError: false };
}

/** 도구 결과에서 출처(학칙 조항, url 있는 항목)와 캘린더 액션을 모은다. */
function collect(name: string, output: unknown, state: RunState): void {
  if (name === "create_calendar_event") {
    state.actions.push(output as CalendarAction);
    return;
  }
  for (const item of Array.isArray(output) ? output : []) {
    if (name === "search_regulations") {
      const r = item as RegulationHit;
      const doc = r.doc === "국민대학교 학칙" ? "학칙" : r.doc;
      const title = r.article ? `${doc} ${r.article}(${r.title})` : `${doc} · ${r.title}`; // 조 번호 없는 안내문은 항목 제목
      state.sources.set(title, { title, ...(r.url && { url: r.url }), kind: "regulation", text: r.text.length > 300 ? `${r.text.slice(0, 300)}…` : r.text, tool: name });
    } else if (item && typeof item === "object" && typeof (item as { url?: unknown }).url === "string" && (item as { url: string }).url) {
      const { title, url } = item as { title?: string; url: string };
      const label = title ?? url;
      state.sources.set(`${name}:${url}:${label}`, { title: label, url, kind: KIND_BY_TOOL[name] ?? "other", tool: name });
    }
  }
}

/** 출처 고르기: 학칙은 답에서 인용한 조항만, 공지는 답에 언급된 것만, 기한·알바는 도구가 돌려준 항목(최대 3개). */
function pickSources(answer: string, state: RunState): ChatSource[] {
  const all = [...state.sources.values()];
  const picked: (ChatSource & { tool: string })[] = [];
  for (const tool of new Set(all.map((s) => s.tool))) {
    const group = all.filter((s) => s.tool === tool);
    if (group[0].kind === "regulation") {
      picked.push(...group.filter((s) => {
        const num = s.title.match(/제(\d+)조/)?.[1];
        return !!num && new RegExp(`제\\s*${num}\\s*조`).test(answer);
      }));
      // 조 번호가 없는 안내문(하이코리아 매뉴얼)은 인용 확인이 어려워 검색 상위 2개를 출처로 붙인다
      picked.push(...group.filter((s) => !/제\d+조/.test(s.title)).slice(0, 2));
    } else if (group[0].kind === "notice") {
      picked.push(...group.filter((s) => {
        // 제목의 단어(괄호 머리말·숫자 제외) 중 3개 이상(짧은 제목은 전부)이 답에 나오면 언급된 것으로 본다
        const words = s.title.replace(/\[[^\]]*\]/g, " ").split(/[\s()~·,]+/).filter((w) => w.length >= 2 && !/^\d/.test(w));
        const hits = words.filter((w) => answer.includes(w)).length;
        return words.length > 0 && hits >= Math.min(3, words.length);
      }));
    } else {
      picked.push(...group.slice(0, 3));
    }
  }
  return picked.slice(0, 6).map(({ tool: _tool, ...s }) => s);
}

// ---------- 오프라인 모드 (키 없음 / LLM 실패) ----------
async function offlineAnswer(question: string, notice?: string): Promise<ChatResponse> {
  const state = newState();
  const lines: string[] = [];
  if (/비자|체류|visa|보험|insurance|기한|마감/i.test(question)) {
    await runTool("get_deadlines", {}, state);
    const deadlines = (await TOOL_BY_NAME.get("get_deadlines")!.run({})) as { title: string; dueDate: string; dDay: number; todo: string }[];
    lines.push("내 체류·보험 기한이에요.", ...deadlines.map((d) => `- **${d.dueDate} (D-${d.dDay}) ${d.title}** — ${d.todo}`));
    const visa = deadlines.find((d) => /비자/.test(d.title));
    if (visa) state.actions.push({ type: "calendar", title: visa.title, date: visa.dueDate, url: calendarUrl(visa.title, visa.dueDate) });
  } else if (/이번\s*주|챙겨|할\s*일|오늘|수업|시간표|this week/i.test(question)) {
    await runTool("get_deadlines", { withinDays: 30 }, state);
    await runTool("get_timetable", {}, state);
    const deadlines = (await TOOL_BY_NAME.get("get_deadlines")!.run({ withinDays: 30 })) as { title: string; dueDate: string; dDay: number; todo: string }[];
    const classes = (await TOOL_BY_NAME.get("get_timetable")!.run({})) as { date: string; day: string; start: string; course: string; note?: string }[];
    const byDate = new Map<string, string[]>();
    for (const c of classes) {
      const list = byDate.get(c.date) ?? [];
      list.push(c.note ? `${c.course} — **${c.note}**` : `${c.start} ${c.course}`);
      byDate.set(c.date, list);
    }
    lines.push("**이번 주 할 일이에요 (날짜순).**");
    for (const [date, list] of [...byDate].sort()) {
      lines.push(`- ${Number(date.slice(5, 7))}/${Number(date.slice(8))}(${classes.find((c) => c.date === date)!.day}) 수업: ${list.join(", ")}`);
    }
    for (const d of deadlines) lines.push(`- **${Number(d.dueDate.slice(5, 7))}/${Number(d.dueDate.slice(8))} (D-${d.dDay}) ${d.title}** — ${d.todo}`);
  } else {
    await runTool("search_regulations", { query: question }, state);
    const hits = [...state.sources.values()].slice(0, 3);
    lines.push(
      hits.length ? "학칙에서 관련 조항을 찾았어요." : "확인하지 못했어요. 학사지원팀이나 국제교류팀에 문의해 주세요.",
      ...hits.map((h) => `- **${h.title}** ${(h.text ?? "").replace(/\n/g, " ").slice(0, 110)}…`),
    );
  }
  const answer = [notice, ...lines].filter(Boolean).join("\n");
  return {
    answer,
    toolsUsed: state.toolsUsed,
    sources: [...state.sources.values()].slice(0, 4).map(({ tool: _t, ...s }) => s),
    steps: state.steps,
    actions: state.actions,
    mode: "offline",
  };
}

// ---------- 메인 루프 ----------
export async function chat(history: ChatTurn[]): Promise<ChatResponse> {
  const question = history.at(-1)?.content ?? "";
  if (!client) return offlineAnswer(question);

  const state = newState();
  const messages: Anthropic.MessageParam[] = history.map((t) => ({ role: t.role, content: t.content }));
  const system = systemPrompt();
  let calls = 0;
  let extras = true; // 게이트웨이가 effort/cache 옵션을 거부하면 끄고 다시 시도
  let earlierText = ""; // 도구 호출과 함께 쓴 긴 본문(마지막 답이 너무 짧을 때 대신 보여준다)

  try {
    for (let round = 0; round <= MAX_TOOL_CALLS; round++) {
      const capped = calls >= MAX_TOOL_CALLS;
      const params: Anthropic.MessageCreateParamsNonStreaming = {
        model: MODEL,
        max_tokens: 8000,
        system,
        tools: TOOL_PARAMS,
        ...(capped ? { tool_choice: { type: "none" } } : {}),
        messages,
        ...(extras && EFFORT ? { output_config: { effort: EFFORT } } : {}),
        ...(extras ? { cache_control: { type: "ephemeral" } } : {}),
      };
      let response: Anthropic.Message;
      try {
        response = await client.messages.create(params);
      } catch (err) {
        if (extras && err instanceof Anthropic.BadRequestError) {
          console.warn(`[chat] 게이트웨이가 옵션을 거부해 기본 옵션으로 재시도: ${err.message}`);
          extras = false;
          round--;
          continue;
        }
        throw err;
      }

      if (response.stop_reason === "refusal") {
        return { answer: "이 질문에는 답하기 어려워요. 학교·체류·알바에 관한 질문을 해주세요.", toolsUsed: state.toolsUsed, sources: [], steps: state.steps, actions: [], mode: "claude" };
      }
      const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (response.stop_reason !== "tool_use" || !toolUses.length) {
        const final = response.content
          .flatMap((b) => (b.type === "text" ? [b.text] : []))
          .join("")
          .trim();
        let answer = final.length < 120 && earlierText ? earlierText : final; // 짧은 마무리 인사보다 본문을 보여준다
        // 캘린더를 실제로 만들지 않았는데 "만들어 뒀어요"라고 쓰는 경우가 있어 지운다
        if (!state.actions.length) answer = answer.replace(/[ \t]*캘린더 버튼을 만들어 뒀어요[.!]?/g, "").trim();
        return {
          answer: answer || "답변을 만들지 못했어요. 다시 물어봐 주세요.",
          toolsUsed: state.toolsUsed,
          sources: pickSources(answer, state),
          steps: state.steps,
          actions: state.actions,
          mode: "claude",
        };
      }

      messages.push({ role: "assistant", content: response.content });
      const draft = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
      if (draft.length > 120) earlierText = draft;
      const results = await Promise.all(
        toolUses.map(async (block): Promise<Anthropic.ToolResultBlockParam> => {
          if (calls >= MAX_TOOL_CALLS) {
            return { type: "tool_result", tool_use_id: block.id, is_error: true, content: `도구 호출 한도(${MAX_TOOL_CALLS}회)에 도달했어. 지금까지 결과로 답해.` };
          }
          calls++;
          const { content, isError } = await runTool(block.name, block.input, state);
          return { type: "tool_result", tool_use_id: block.id, content, ...(isError ? { is_error: true } : {}) };
        }),
      );
      messages.push({ role: "user", content: results });
    }
    console.warn("[chat] 루프 한도 도달");
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.warn(`[chat] LLM 오류 ${err.status}: ${err.message}`);
    else console.warn("[chat] 오케스트레이션 오류", err);
  }
  // PRD 8장: LLM 호출이 실패하면 "잠시 후 다시" 안내. 그동안 도구로 찾은 것은 보여준다.
  return offlineAnswer(question, "AI 응답이 지연되고 있어요. 잠시 후 다시 물어봐 주세요. 그동안 찾은 정보예요:");
}
