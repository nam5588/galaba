// 학칙 RAG (PRD 6장): 규정 텍스트를 조(條) 단위로 자르고(긴 조는 항 단위로 다시 자름) BM25로 검색한다.
// 임베딩 API 없이 동작하도록 한국어는 글자 2-gram으로 토큰화한다.
// 원본: backend/data/regulations/*.txt (파일명 = 문서명) → `npm run build:rag` → backend/data/regulations.json
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// 정적 import: 배포(Vercel) 번들에 학칙 색인이 반드시 포함되게 한다
import INDEX from "../../data/regulations.json" with { type: "json" };

export interface RegulationChunk {
  id: string;
  doc: string; // "국민대학교 학칙"
  chapter: string; // "제9장 교육과정 및 이수"
  article: string; // "제32조"
  title: string; // "학기당 이수학점"
  text: string;
}

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data");
const SOURCE_DIR = join(DATA, "regulations");
export const INDEX_FILE = join(DATA, "regulations.json");

const ARTICLE = /^제(\d+)조(의\d+)?\s*\(([^)]+)\)\s*(.*)$/;
const CHAPTER = /^제\d+장\s/;
const SUPPLEMENT = /^부\s*칙/;
const LONG = 900; // 이보다 긴 조는 항(①②…) 단위로 나눈다
const MIN_SCORE = 8; // 이보다 낮으면 관련 없는 조항으로 본다 (관련 질문 10점 이상, 엉뚱한 질문 3~5점)

function clean(text: string): string {
  return text
    .replace(/<(개정|신설|전문개정|본조신설)[^>]*>/g, "") // 개정 이력 태그
    .replace(/\s+/g, " ")
    .replace(/\s*([①-⑳])/g, "\n$1")
    .trim();
}

function chunkDocument(doc: string, raw: string): RegulationChunk[] {
  const articles: Omit<RegulationChunk, "id">[] = [];
  let chapter = "";
  let current: Omit<RegulationChunk, "id"> | null = null;
  for (const line of raw.split("\n").map((l) => l.trim())) {
    if (!line) continue;
    if (SUPPLEMENT.test(line)) break; // 부칙(개정 이력)은 검색 잡음이라 제외
    if (CHAPTER.test(line)) {
      chapter = line.replace(/<[^>]*>/g, "").trim();
      continue;
    }
    const m = ARTICLE.exec(line);
    if (m) {
      current = { doc, chapter, article: `제${m[1]}조${m[2] ?? ""}`, title: m[3], text: m[4] };
      articles.push(current);
    } else if (current) {
      current.text += ` ${line}`;
    }
  }
  const chunks: RegulationChunk[] = [];
  for (const a of articles) {
    const text = clean(a.text);
    const key = `${doc}#${a.article}`;
    const paragraphs = text.split("\n").filter(Boolean);
    if (text.length <= LONG || paragraphs.length < 2) {
      chunks.push({ ...a, id: key, text });
    } else {
      paragraphs.forEach((p, i) => chunks.push({ ...a, id: `${key}-${i + 1}`, text: p }));
    }
  }
  return chunks;
}

/** data/regulations/*.txt 를 모두 청킹한다 (빌드 스크립트와 JSON이 없을 때 사용). */
export function chunkSources(): RegulationChunk[] {
  return readdirSync(SOURCE_DIR)
    .filter((f) => f.endsWith(".txt"))
    .sort()
    .flatMap((f) => chunkDocument(f.replace(/\.txt$/, ""), readFileSync(join(SOURCE_DIR, f), "utf8")));
}

// --- BM25 ---
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const word of text.toLowerCase().split(/[^0-9a-z가-힣]+/)) {
    if (!word) continue;
    if (/[가-힣]/.test(word)) {
      if (word.length === 1) continue;
      for (let i = 0; i < word.length - 1; i++) tokens.push(word.slice(i, i + 2));
    } else {
      tokens.push(word);
    }
  }
  return tokens;
}

// 학생들이 쓰는 말 → 학칙 용어 (LLM이 검색어를 바꿔 주지만, 오프라인 모드에서도 잘 찾도록)
const SYNONYMS: [RegExp, string][] = [
  [/졸업\s*학점|몇\s*학점.*졸업|졸업.*몇\s*학점/, "졸업에 필요한 최저이수학점 수료인정 학점"],
  [/최대\s*학점|최대.*몇\s*학점|몇\s*학점.*들|수강\s*신청.*학점/, "학기당 이수학점 초과 이수"],
  [/쉬고|쉬려|휴학/, "휴학 휴학기간 복학"],
  [/다시\s*다니|복학/, "복학"],
  [/잘리|쫓겨|제적/, "제적 성적경고"],
  [/f\s*학점|낙제|성적\s*경고|학사\s*경고/, "성적경고 성적평가"],
  [/돈|등록금|학비/, "등록금 납부 반환"],
  [/외국인|유학생/, "외국인학생 위탁생"],
  [/전과|과\s*바꾸|전공\s*바꾸/, "전과 전부 전공 변경"],
  [/조기\s*졸업|빨리\s*졸업/, "조기졸업 수업연한"],
];

function expandQuery(q: string): string {
  let out = q;
  for (const [re, add] of SYNONYMS) if (re.test(q)) out += ` ${add}`;
  return out;
}

interface Indexed {
  chunk: RegulationChunk;
  tf: Map<string, number>;
  len: number;
}

let index: Indexed[] = [];
const df = new Map<string, number>();
let avgLen = 1;

function build(): void {
  const chunks = INDEX as RegulationChunk[];
  index = chunks.map((chunk) => {
    const heading = `${chunk.article} ${chunk.title}`;
    const tokens = tokenize(`${heading} ${heading} ${heading} ${chunk.text}`); // 조 제목 3배 가중치
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { chunk, tf, len: tokens.length };
  });
  df.clear();
  for (const { tf } of index) for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  avgLen = index.reduce((s, d) => s + d.len, 0) / Math.max(index.length, 1);
  console.log(`[rag] 규정 청크 ${index.length}개 색인 (regulations.json)`);
}

/** 상위 k개 조항. 같은 조의 여러 항이 걸리면 점수가 가장 높은 항 하나만 남긴다. */
export function searchRegulations(query: string, k = 5): RegulationChunk[] {
  return searchRegulationsScored(query, k).map((s) => s.chunk);
}

export function searchRegulationsScored(query: string, k = 5): { chunk: RegulationChunk; score: number }[] {
  if (!index.length) build();
  const qTokens = [...new Set(tokenize(expandQuery(query)))];
  const N = index.length;
  const k1 = 1.2;
  const b = 0.75;
  const scored = index
    .map((d) => {
      let score = 0;
      for (const t of qTokens) {
        const f = d.tf.get(t);
        if (!f) continue;
        const n = df.get(t) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        score += (idf * (f * (k1 + 1))) / (f + k1 * (1 - b + (b * d.len) / avgLen));
      }
      return { chunk: d.chunk, score };
    })
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, c) => c.score - a.score);
  const seen = new Set<string>();
  const out: { chunk: RegulationChunk; score: number }[] = [];
  for (const hit of scored) {
    const key = `${hit.chunk.doc}#${hit.chunk.article}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
    if (out.length >= k) break;
  }
  return out;
}
