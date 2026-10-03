// get_academics: 데모 사용자의 수강·학업 현황(이수/졸업 학점, 남은 학점, GPA, 유학생 수강 요건).
// 계산은 src/academics/compute.ts(순수 함수), 기준값은 src/academics/config.ts를 그대로 쓴다.
import { computeAcademics } from "../academics/compute.js";
import { ACADEMICS_CONFIG } from "../academics/config.js";
import type { AcademicStatus, AcademicsProfile } from "../types.js";
import { loadDemoUser } from "./demo-user.js";
import type { ToolDef } from "./types.js";

export interface AcademicsSummary {
  name: string;
  department: string;
  year: number;
  semester: string;
  earnedCredits: number;
  requiredCredits: number;
  remainingCredits: number;
  progressPercent: number;
  gpa: number;
  gpaScale: number;
  gpaStatus: AcademicStatus;
  /** 유학생이 챙겨야 할 수강 요건 (제목 + 쉬운 설명 + 상태) */
  requirements: { title: string; summary: string; status: AcademicStatus }[];
  disclaimer: string;
}

interface DemoAcademics {
  name: string;
  university: string;
  department: string;
  year: number;
  semester: string;
  status: string;
  earnedCredits: number;
  graduationCreditsRequired?: number;
  gpa: number;
}

export const getAcademicsTool: ToolDef<Record<string, never>, AcademicsSummary> = {
  name: "get_academics",
  description:
    "데모 사용자의 수강·학업 현황을 돌려준다. 이수 학점, 졸업 필요 학점, 남은 학점, 졸업 진척도(%), 평점(GPA)과 경고 상태(safe/warning/danger), 그리고 유학생이 챙겨야 할 수강 요건(성적 유지·졸업 학점·학기당 최소 이수)을 담는다. '학점 얼마나 남았어?', '내 평점 괜찮아?', '졸업까지 얼마나?' 같은 질문에 쓴다.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  label: () => "학업 현황 확인",
  async run() {
    const user = loadDemoUser() as unknown as DemoAcademics;
    const profile: AcademicsProfile = {
      name: user.name,
      university: user.university,
      department: user.department,
      year: user.year,
      semester: user.semester,
      status: user.status,
    };
    const data = computeAcademics({
      profile,
      earnedCredits: user.earnedCredits,
      graduationCreditsRequired: user.graduationCreditsRequired ?? ACADEMICS_CONFIG.defaultGraduationCredits,
      gpa: user.gpa,
    });

    return {
      name: data.profile.name,
      department: data.profile.department,
      year: data.profile.year,
      semester: data.profile.semester,
      earnedCredits: data.credits.earned,
      requiredCredits: data.credits.required,
      remainingCredits: data.credits.remaining,
      progressPercent: data.credits.progress,
      gpa: data.gpa.value,
      gpaScale: data.gpa.scale,
      gpaStatus: data.gpa.status,
      requirements: data.requirements.map((r) => ({ title: r.title, summary: r.summary, status: r.status })),
      disclaimer: data.disclaimer,
    };
  },
};
