import { Router } from "express";
import type { AcademicsProfile } from "../types.js";
import { loadDemoUser } from "../tools/demo-user.js";
import { ACADEMICS_CONFIG } from "../academics/config.js";
import { computeAcademics } from "../academics/compute.js";

export const academicsRouter = Router();

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

/**
 * GET /api/academics
 * 데모 사용자(data/demo-user.json)의 수강·학업 현황. MVP는 쿼리 파라미터 없음.
 * 계산은 src/academics/compute.ts(순수 함수), 기준값은 src/academics/config.ts.
 */
academicsRouter.get("/", (_req, res) => {
  const user = loadDemoUser() as unknown as DemoAcademics;

  const profile: AcademicsProfile = {
    name: user.name,
    university: user.university,
    department: user.department,
    year: user.year,
    semester: user.semester,
    status: user.status,
  };

  res.json(
    computeAcademics({
      profile,
      earnedCredits: user.earnedCredits,
      graduationCreditsRequired: user.graduationCreditsRequired ?? ACADEMICS_CONFIG.defaultGraduationCredits,
      gpa: user.gpa,
    }),
  );
});
