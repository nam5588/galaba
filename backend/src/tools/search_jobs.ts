// FD3 이신애(DOJANG JOB) → 메인 채팅 도구 search_jobs (PRD 7장).
// 공고·매칭은 이신애 화면(/jobs)과 같은 규칙(backend/src/jobs/ 복사본). JOB PRD 정책에 따라
// '취업 가능' 판정은 하지 않고, 모든 공고에 '취업 관련 추가 확인 필요'를 붙인다. 데이터는 데모용 가상 공고.
import { defaultProfile, getWorkplace, getWorkplaceReviews, jobs, type Day, type Job } from "../jobs/data.js";
import { matchJob, matchLabels, rankJobs, summarizeReviews } from "../jobs/match.js";
import type { ToolDef } from "./types.js";

const SITE = "https://galaba.vercel.app";
const WEEKEND: Day[] = ["토", "일"];

export interface JobResult {
  id: number;
  title: string; // 공고 제목
  employer: string; // 사업장 이름
  category: string;
  wage: string; // "시급 11,000원"
  hourlyWage: number;
  hoursPerWeek: number | null;
  schedule: string; // "월 18:00–22:00 · 수 …"
  weekend: boolean;
  location: string;
  walkMinutes: number;
  requiredTopik: string;
  match: { status: string; count: number; reasons: string[] }; // 데모 학생(D-2, TOPIK 4, 월·수·금 18–22시) 기준
  rating: number | null;
  reviewCount: number;
  workPermitNote: string;
  demo: true;
  url: string;
}

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

function toResult(job: Job): JobResult {
  const workplace = getWorkplace(job);
  const match = matchJob(job, defaultProfile);
  const reviews = summarizeReviews(getWorkplaceReviews(job.workplaceId));
  const shifts = job.shifts ?? [];
  return {
    id: job.id,
    title: `[예시] ${job.title}`, // JOB PRD: 데모용 가상 공고임을 답과 출처에 드러낸다
    employer: workplace.name,
    category: job.category,
    wage: `시급 ${job.hourlyWage.toLocaleString("ko-KR")}원`,
    hourlyWage: job.hourlyWage,
    hoursPerWeek: shifts.length ? Math.round(shifts.reduce((h, s) => h + (minutes(s.endTime) - minutes(s.startTime)) / 60, 0) * 10) / 10 : null,
    schedule: shifts.length ? shifts.map((s) => `${s.day} ${s.startTime}–${s.endTime}`).join(" · ") : "근무시간 미확인",
    weekend: shifts.some((s) => WEEKEND.includes(s.day)),
    location: workplace.location,
    walkMinutes: job.walkMinutes,
    requiredTopik: job.requiredTopik === null ? "미확인" : job.requiredTopik === 0 ? "요구 없음" : `TOPIK ${job.requiredTopik} 이상`,
    match: { status: matchLabels[match.status], count: match.count, reasons: match.checks.map((c) => `${c.label}: ${c.reason}`) },
    rating: reviews.average === null ? null : Math.round(reviews.average * 10) / 10,
    reviewCount: reviews.count,
    workPermitNote: "취업 관련 추가 확인 필요: 유학생은 시간제취업 허가를 먼저 받아야 하며, 허용 시간·업종은 학교 국제처·하이코리아에서 확인",
    demo: true,
    url: `${SITE}/jobs/${job.id}`,
  };
}

export const searchJobsTool: ToolDef<{ query?: string; category?: string; weekend?: boolean }, JobResult[]> = {
  name: "search_jobs",
  description:
    "유학생 알바 공고(데모용 가상 데이터)를 찾는다. 데모 학생(D-2, TOPIK 4, 월·수·금 18~22시 가능) 기준 매칭 순서로 돌려주며, 공고마다 시급, 근무 요일·시간, 요구 TOPIK, 조건 일치 여부와 사유, 후기 평점이 있다. " +
    "답할 때 반드시 '예시(데모) 공고'라고 밝히고, 취업 가능 여부를 단정하지 말고 workPermitNote를 함께 안내한다. 검색어·업종은 한국어로(업종: 카페·편의점·음식점).",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "제목·사업장·설명 키워드(한국어, 선택)" },
      category: { type: "string", enum: ["카페", "편의점", "음식점"], description: "업종(선택)" },
      weekend: { type: "boolean", description: "주말(토·일) 근무 공고만" },
    },
    additionalProperties: false,
  },
  label: (input) => `알바 검색${input.category ? `: ${input.category}` : input.query ? `: ${input.query}` : ""}${input.weekend ? " (주말)" : ""}`,
  async run({ query, category, weekend }) {
    const ranked = rankJobs(jobs, defaultProfile).map(({ job }) => toResult(job));
    return ranked.filter(
      (r) =>
        (!category || r.category === category) &&
        (!query || `${r.title} ${r.employer} ${r.category}`.includes(query.trim())) &&
        (weekend === undefined || r.weekend === weekend),
    );
  },
};
