// FD 도구 예시 구현 (PRD 7.5: 실제 함수가 오기 전까지 같은 형식의 예시 데이터로 먼저 돌린다).
// FD 담당이 backend/src/tools/<도구이름>.ts 를 만들면 tools/index.ts의 import만 그 파일로 바꾼다.
//   get_deadlines → FD1 무하마드 / get_timetable → FD2 요리 / search_jobs → FD3 이신애
//   get_notices   → FD2 요리 (공지 API는 이미 있어서 그 함수를 그대로 감싼다)
import { getNotices } from "../routes/notices.js";
import { addDays, dDay, loadDemoUser, todayKST, weekdayKo } from "./demo-user.js";
import type { ToolDef } from "./types.js";

// ---------- FD1: get_deadlines ----------
export interface Deadline {
  type: "visa" | "insurance" | "school" | string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  dDay: number;
  todo: string;
  url: string;
}

/** 다음 달 보험료 납부일(매월 25일) */
function next25th(today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const date = d <= 25 ? new Date(Date.UTC(y, m - 1, 25)) : new Date(Date.UTC(y, m, 25));
  return date.toISOString().slice(0, 10);
}

export const getDeadlinesExample: ToolDef<{ withinDays?: number }, Deadline[]> = {
  name: "get_deadlines",
  description:
    "데모 사용자의 체류·건강보험 관련 기한(비자 만료, 보험료 납부 등)을 날짜순으로 돌려준다. 각 항목에 D-day, 해야 할 일, 출처 링크가 있다.",
  inputSchema: {
    type: "object",
    properties: { withinDays: { type: "integer", description: "오늘부터 며칠 안의 기한만(기본: 전부)" } },
    additionalProperties: false,
  },
  label: (input) => (input.withinDays ? `기한 확인: ${input.withinDays}일 이내` : "기한 확인"),
  async run({ withinDays }) {
    const today = todayKST();
    const user = loadDemoUser();
    const insurance = next25th(today);
    const items: Deadline[] = [
      {
        type: "insurance",
        title: "건강보험료 납부",
        dueDate: insurance,
        dDay: dDay(insurance, today),
        todo: "다음 달 보험료를 미리 납부. 체납하면 비자 연장 때 불이익",
        url: "https://www.nhis.or.kr",
      },
      {
        type: "visa",
        title: `${user.visa.type} 비자 만료 (체류기간 연장 신청)`,
        dueDate: user.visa.expires,
        dDay: dDay(user.visa.expires, today),
        todo: "만료 전 하이코리아에서 방문 예약 또는 전자민원으로 연장 신청. 재학증명서·성적증명서·등록금 납부확인서 준비",
        url: "https://www.hikorea.go.kr",
      },
    ];
    return items
      .filter((i) => i.dDay >= 0 && (withinDays === undefined || i.dDay <= withinDays))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },
};

// ---------- FD2: get_timetable ----------
export interface ClassItem {
  date: string;
  day: string; // "월"
  start: string;
  end: string;
  course: string;
  room: string;
  note?: string;
}

const WEEKLY: Record<string, Omit<ClassItem, "date" | "day">[]> = {
  월: [
    { start: "09:00", end: "10:15", course: "데이터 구조 (CS301)", room: "공학관 301호" },
    { start: "10:30", end: "11:45", course: "알고리즘 (CS302)", room: "공학관 402호" },
  ],
  화: [
    { start: "13:00", end: "14:15", course: "한국어 중급 (KOR201)", room: "인문관 210호" },
    { start: "14:30", end: "15:45", course: "컴퓨터 네트워크 (CS305)", room: "공학관 303호" },
  ],
  수: [
    { start: "09:00", end: "10:15", course: "데이터 구조 (CS301)", room: "공학관 301호" },
    { start: "10:30", end: "11:45", course: "알고리즘 (CS302)", room: "공학관 402호" },
  ],
  목: [
    { start: "13:00", end: "14:15", course: "한국어 중급 (KOR201)", room: "인문관 210호" },
    { start: "14:30", end: "15:45", course: "컴퓨터 네트워크 (CS305)", room: "공학관 303호" },
  ],
  금: [{ start: "16:00", end: "17:15", course: "팀 프로젝트 (CS399)", room: "공학관 501호" }],
};
const HOLIDAYS: Record<string, string> = { "2026-10-03": "개천절", "2026-10-09": "한글날", "2026-12-25": "성탄절" };

export const getTimetableExample: ToolDef<{ date?: string }, ClassItem[]> = {
  name: "get_timetable",
  description:
    "데모 사용자의 수업 시간표. date(YYYY-MM-DD)를 주면 그날 수업, 없으면 오늘부터 7일간 수업을 돌려준다. 공휴일 휴강은 note에 적혀 있다.",
  inputSchema: {
    type: "object",
    properties: { date: { type: "string", description: "YYYY-MM-DD (선택)" } },
    additionalProperties: false,
  },
  label: (input) => (input.date ? `시간표 확인: ${input.date}` : "시간표 확인: 이번 주"),
  async run({ date }) {
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "date는 YYYY-MM-DD 형식이어야 해요" };
    const days = date ? [date] : Array.from({ length: 7 }, (_, i) => addDays(todayKST(), i));
    return days.flatMap((d) => {
      const day = weekdayKo(d);
      const holiday = HOLIDAYS[d];
      return (WEEKLY[day] ?? []).map((c) => ({ date: d, day, ...c, ...(holiday ? { note: `${holiday} 휴강` } : {}) }));
    });
  },
};

// ---------- FD3: search_jobs ----------
export interface Job {
  title: string;
  employer: string;
  wage: string;
  hoursPerWeek: number;
  location: string;
  weekend: boolean;
  allowedForD2: boolean;
  note?: string;
  url: string;
}

const JOBS: Job[] = [
  { title: "편의점 주말 오후 근무", employer: "CU 국민대점", wage: "시급 10,320원", hoursPerWeek: 12, location: "서울 성북구 정릉동", weekend: true, allowedForD2: true, url: "" },
  { title: "편의점 평일 오전 근무", employer: "GS25 길음역점", wage: "시급 10,320원", hoursPerWeek: 15, location: "서울 성북구 길음동", weekend: false, allowedForD2: true, url: "" },
  { title: "국제교류팀 행정 보조 (교내 근로)", employer: "국민대학교", wage: "시급 11,000원", hoursPerWeek: 10, location: "국민대학교 본부관", weekend: false, allowedForD2: true, url: "https://www.kookmin.ac.kr" },
  { title: "건설현장 보조 (주말)", employer: "OO건설", wage: "일급 150,000원", hoursPerWeek: 16, location: "서울 강북구", weekend: true, allowedForD2: false, note: "건설업은 유학생 시간제 취업이 제한되는 업종", url: "" },
];

export const searchJobsExample: ToolDef<{ query?: string; area?: string; weekend?: boolean }, Job[]> = {
  name: "search_jobs",
  description:
    "유학생(D-2)이 지원할 수 있는 아르바이트 공고를 찾는다. 각 공고에 시급, 주당 시간, D-2 가능 여부(allowedForD2)가 있다. 검색어는 한국어로 보낸다(예: '편의점').",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "업종·키워드(한국어)" },
      area: { type: "string", description: "지역(예: 성북구)" },
      weekend: { type: "boolean", description: "주말 근무만" },
    },
    additionalProperties: false,
  },
  label: (input) => `알바 검색${input.query ? `: ${input.query}` : ""}${input.weekend ? " (주말)" : ""}`,
  async run({ query, area, weekend }) {
    return JOBS.filter(
      (j) =>
        (!query || `${j.title} ${j.employer}`.includes(query)) &&
        (!area || j.location.includes(area)) &&
        (weekend === undefined || j.weekend === weekend),
    );
  },
};

// ---------- FD2: get_notices (실제 공지 API 함수) ----------
export const getNoticesTool: ToolDef<{ category?: string; query?: string; limit?: number }> = {
  name: "get_notices",
  description:
    "국민대 홈페이지의 최신 공지를 실시간으로 가져온다(제목, 날짜, 요약, 링크). category: 전체·학사·장학·행정·특강·공모행사·사회봉사·교내채용·교외채용. query로 제목·본문 키워드를 거른다(한국어).",
  inputSchema: {
    type: "object",
    properties: {
      category: { type: "string", description: "공지 카테고리(기본 전체)" },
      query: { type: "string", description: "제목·본문에 들어갈 키워드(선택)" },
      limit: { type: "integer", description: "최대 개수(기본 5)" },
    },
    additionalProperties: false,
  },
  label: (input) => `공지 확인: ${input.category ?? "전체"}${input.query ? ` · ${input.query}` : ""}`,
  async run({ category, query, limit }) {
    const { items } = await getNotices(category || "전체", 20);
    const filtered = query ? items.filter((n) => `${n.title} ${n.text}`.includes(query)) : items;
    return filtered.slice(0, Math.min(Math.max(limit ?? 5, 1), 10));
  },
};
