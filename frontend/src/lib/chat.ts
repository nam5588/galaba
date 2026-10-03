import { api } from "@/lib/api";

/**
 * POST /api/chat 계약 (docs/PRD-ai-chat-orchestration.md 5장의 { answer, toolsUsed, sources }를 넓힌 모양)
 *
 * {
 *   answer, toolsUsed: string[],
 *   sources: { title, url?, kind, text? }[],
 *   steps: { tool, label }[], actions: { type: "calendar", title, date, url }[],
 *   mode: "claude" | "offline"
 * }
 */

export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export type SourceKind = "regulation" | "notice" | "deadline" | "timetable" | "job" | "other";

export interface ChatSource {
  /** 화면 key 용 (백엔드가 안 주면 순서로 만든다) */
  id: string;
  /** 예: "학칙 제32조(학기당 이수학점)" 또는 공지 제목 */
  title: string;
  /** http(s)만 남긴다. 있으면 새 탭 링크로 보여준다 */
  url?: string;
  kind: SourceKind;
  /** 조항 발췌 등. 있으면 칩을 눌러 펼쳐 본다 */
  text?: string;
}

export interface ChatStep {
  /** search_regulations | get_deadlines | get_notices | get_timetable | search_jobs | create_calendar_event | ... */
  tool: string;
  /** 예: "학칙 검색: 휴학기간" */
  label: string;
}

export interface CalendarAction {
  type: "calendar";
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** Google Calendar 일정 추가 링크 */
  url: string;
}

export type ChatAction = CalendarAction;

/** offline = API 키 없이 학칙 검색 결과만으로 만든 답 */
export type ChatMode = "claude" | "offline";

export interface ChatResponse {
  answer: string;
  /** 부른 순서대로, 중복 없이 */
  toolsUsed: string[];
  sources: ChatSource[];
  steps: ChatStep[];
  actions: ChatAction[];
  mode: ChatMode;
}

export interface ChatRequest {
  messages: ChatTurn[];
}

export async function sendChat(messages: ChatTurn[], signal?: AbortSignal): Promise<ChatResponse> {
  const body: ChatRequest = { messages };
  const raw = await api<unknown>("/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
  return normalizeChatResponse(raw);
}

/*
 * 백엔드가 동시에 개발 중이라, 필드가 빠지거나 모양이 조금 달라도 화면이 깨지지 않게 정리한다.
 * 예전 응답({ sources: {id, doc, article, text}[] }, toolsUsed 없음)도 그대로 보여준다.
 */

type Loose = Record<string, unknown>;

const SOURCE_KINDS: readonly SourceKind[] = ["regulation", "notice", "deadline", "timetable", "job", "other"];

const isObject = (v: unknown): v is Loose => typeof v === "object" && v !== null;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const list = (v: unknown): Loose[] => (Array.isArray(v) ? v.filter(isObject) : []);
const unique = (items: string[]) => [...new Set(items.filter(Boolean))];

function normalizeSource(s: Loose, i: number): ChatSource | null {
  const doc = str(s.doc);
  const article = str(s.article);
  const legacy = Boolean(doc || article);
  const rawUrl = str(s.url) || str(s.link);
  const url = isSafeUrl(rawUrl) ? rawUrl : undefined;
  const text = str(s.text) || str(s.excerpt) || undefined;

  const declared = str(s.kind) as SourceKind;
  const kind: SourceKind = SOURCE_KINDS.includes(declared)
    ? declared
    : legacy || /제\s*\d+\s*조/.test(str(s.title))
      ? "regulation"
      : "other";

  const title = str(s.title) || (legacy ? formatRegulationTitle(doc, article) : "");
  if (!title && !text && !url) return null;

  return {
    id: str(s.id) || `src-${i}`,
    title: title || (kind === "regulation" ? "학칙 발췌" : url ? hostOf(url) : "출처"),
    url,
    kind,
    text,
  };
}

export function normalizeChatResponse(raw: unknown): ChatResponse {
  const r = isObject(raw) ? raw : {};

  const steps = list(r.steps)
    .map((s) => ({ tool: str(s.tool) || str(s.name), label: str(s.label) }))
    .filter((s) => s.label || s.tool);

  // toolsUsed가 없으면(예전 응답) steps의 도구 이름으로 만든다. 둘 다 있으면 순서를 지켜 합친다.
  const declaredTools = Array.isArray(r.toolsUsed) ? r.toolsUsed.map((t) => (isObject(t) ? str(t.name) : str(t))) : [];
  const toolsUsed = unique([...declaredTools, ...steps.map((s) => s.tool)]);

  const seen = new Set<string>();
  const sources = list(r.sources)
    .map(normalizeSource)
    .filter((s): s is ChatSource => s !== null)
    .filter((s) => {
      const key = s.url ?? `${s.kind}:${s.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return {
    answer: typeof r.answer === "string" ? r.answer : str(r.answer),
    toolsUsed,
    sources,
    steps,
    actions: list(r.actions)
      .filter((a) => a.type === "calendar" && isSafeUrl(str(a.url)))
      .map((a) => ({ type: "calendar" as const, title: str(a.title), date: str(a.date), url: str(a.url) })),
    mode: r.mode === "offline" ? "offline" : "claude",
  };
}

/** http(s) 링크만 허용 (javascript: 등 차단) */
export function isSafeUrl(url: string) {
  return /^https?:\/\/\S+$/i.test(url.trim());
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "링크";
  }
}

/** "2026-10-31" -> "10/31" */
export function formatShortDate(date: string) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(date.trim());
  return m ? `${Number(m[2])}/${Number(m[3])}` : date;
}

/** "국민대학교 학칙" + "제32조(학기당 이수학점)" -> "학칙 제32조(학기당 이수학점)" */
export function formatRegulationTitle(doc: string, article: string) {
  const shortDoc = doc.replace(/^국민대(학교)?\s*/, "").trim();
  return [shortDoc, article.trim()].filter(Boolean).join(" ") || "학칙 발췌";
}
