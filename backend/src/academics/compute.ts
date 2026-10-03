// 수강 & 학업 계산 (순수 함수). 기준 숫자는 ./config.ts에서만 바꾼다.
// 화면 문구는 프론트가 만들고, 서버는 수치·상태만 돌려준다.
import type {
  AcademicRequirement,
  AcademicStatus,
  AcademicsCredits,
  AcademicsGpa,
  AcademicsProfile,
  AcademicsResponse,
} from "../types.js";
import { ACADEMICS_CONFIG } from "./config.js";

export interface AcademicsInput {
  profile: AcademicsProfile;
  earnedCredits: number;
  /** 없으면 config의 기본 졸업 학점을 쓴다 */
  graduationCreditsRequired?: number;
  gpa: number;
}

/** 졸업 진척도. required가 0 이하면 0 (0 나눗셈 방지). */
export function creditProgress(earned: number, required: number): number {
  if (required <= 0) return 0;
  return Math.min(100, Math.round((earned / required) * 100));
}

/** GPA 상태: 경고선 미만이면 danger, 경고선+margin 미만이면 warning, 그 외 safe. */
export function gpaStatus(
  value: number,
  warningBelow: number = ACADEMICS_CONFIG.gpaWarningBelow,
  margin: number = ACADEMICS_CONFIG.gpaWarningMargin,
): AcademicStatus {
  if (value < warningBelow) return "danger";
  if (value < warningBelow + margin) return "warning";
  return "safe";
}

function buildCredits(earned: number, required: number): AcademicsCredits {
  const remaining = Math.max(0, required - earned);
  return { earned, required, remaining, progress: creditProgress(earned, required) };
}

function buildGpa(value: number): AcademicsGpa {
  return {
    value,
    scale: ACADEMICS_CONFIG.gpaScale,
    warningBelow: ACADEMICS_CONFIG.gpaWarningBelow,
    status: gpaStatus(value),
  };
}

/** 유학생이 특히 신경 써야 하는 핵심 수강 요건. 충족 여부를 현재 수치로 판정한다. */
function buildRequirements(credits: AcademicsCredits, gpa: AcademicsGpa): AcademicRequirement[] {
  return [
    {
      id: "min-gpa",
      title: "성적 유지 (학사경고 방지)",
      summary: `평점이 ${gpa.warningBelow} 미만이면 학사경고 대상이 될 수 있어요. 유학생은 성적이 비자 자격에도 영향을 줄 수 있으니 꾸준히 관리하세요.`,
      status: gpa.status,
    },
    {
      id: "graduation-progress",
      title: "졸업 학점 이수",
      summary: `졸업까지 총 ${credits.required}학점이 필요하고, 현재 ${credits.earned}학점을 이수했어요. 남은 학점은 ${credits.remaining}학점입니다.`,
      status: credits.remaining === 0 ? "safe" : credits.progress >= 50 ? "warning" : "danger",
    },
    {
      id: "full-time-enrollment",
      title: "학기당 최소 이수 학점",
      summary: "유학(D-2) 비자는 학업을 유지해야 자격이 유지됩니다. 매 학기 최소 이수 학점은 학과·국제처 기준을 꼭 확인하세요.",
      status: "safe",
    },
  ];
}

export function computeAcademics(input: AcademicsInput): AcademicsResponse {
  const required = input.graduationCreditsRequired ?? ACADEMICS_CONFIG.defaultGraduationCredits;
  const credits = buildCredits(input.earnedCredits, required);
  const gpa = buildGpa(input.gpa);
  return {
    profile: input.profile,
    credits,
    gpa,
    requirements: buildRequirements(credits, gpa),
    disclaimer: ACADEMICS_CONFIG.disclaimer,
    sources: ACADEMICS_CONFIG.sources.map((s) => ({ ...s })),
  };
}
