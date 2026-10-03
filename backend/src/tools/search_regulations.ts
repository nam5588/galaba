// 메인(김희경) 도구: 학칙 조 단위 RAG 검색 (PRD 6장)
import { searchRegulations } from "../rag/regulations.js";
import type { ToolDef } from "./types.js";

export interface RegulationHit {
  doc: string;
  article: string; // "제32조"
  title: string; // "학기당 이수학점"
  chapter: string;
  text: string;
  url?: string;
}

export const searchRegulationsTool: ToolDef<{ query: string }, RegulationHit[]> = {
  name: "search_regulations",
  description:
    "국민대학교 학칙·학교 규정(학사규정, 장학규정, 등록금 반환, 생활관(기숙사), 계절학기, 교환학생 학점인정, 졸업인증제, 학생 징계, 현장실습, 외국인유학생지원센터)과 " +
    "유학생 체류 규정(출입국관리법, 하이코리아 체류민원 매뉴얼 유학 D-2, 국민건강보험법 외국인 특례)에서 관련 조항을 찾는다. " +
    "졸업·학점·수강신청·성적·휴학·복학·제적·등록금·장학금·기숙사 같은 학교 규정과, 알바(시간제취업 허가·허용 시간·제한 업종), 비자(체류기간) 연장, 외국인등록, 이사(체류지 변경 신고), 건강보험 질문에 쓴다. " +
    "질문이 영어 등 다른 언어여도 query는 규정에 쓰일 한국어 용어로 바꿔서 보낸다(예: 'leave of absence' → '휴학기간', 'part-time job on weekends' → '시간제취업 허용 시간 주말').",
  inputSchema: {
    type: "object",
    properties: { query: { type: "string", description: "한국어 학칙 용어 검색어. 예: '졸업에 필요한 최저이수학점'" } },
    required: ["query"],
    additionalProperties: false,
  },
  label: (input) => `규정 검색: ${input.query}`,
  async run({ query }) {
    if (!query?.trim()) return { error: "query가 비어 있어요" };
    return searchRegulations(query, 5).map(({ doc, article, title, chapter, text, url }) => ({ doc, article, title, chapter, text, url }));
  },
};
