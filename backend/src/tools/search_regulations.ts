// 메인(김희경) 도구: 학칙 조 단위 RAG 검색 (PRD 6장)
import { searchRegulations } from "../rag/regulations.js";
import type { ToolDef } from "./types.js";

export interface RegulationHit {
  doc: string;
  article: string; // "제32조"
  title: string; // "학기당 이수학점"
  chapter: string;
  text: string;
}

export const searchRegulationsTool: ToolDef<{ query: string }, RegulationHit[]> = {
  name: "search_regulations",
  description:
    "국민대학교 학칙 원문에서 관련 조항을 찾는다. 졸업·학점·수강·휴학·복학·제적·등록금·장학·외국인학생 등 학교 규정 질문에 쓴다. " +
    "질문이 영어 등 다른 언어여도 query는 학칙에 쓰일 한국어 용어로 바꿔서 보낸다(예: 'leave of absence' → '휴학기간').",
  inputSchema: {
    type: "object",
    properties: { query: { type: "string", description: "한국어 학칙 용어 검색어. 예: '졸업에 필요한 최저이수학점'" } },
    required: ["query"],
    additionalProperties: false,
  },
  label: (input) => `학칙 검색: ${input.query}`,
  async run({ query }) {
    if (!query?.trim()) return { error: "query가 비어 있어요" };
    return searchRegulations(query, 5).map(({ doc, article, title, chapter, text }) => ({ doc, article, title, chapter, text }));
  },
};
