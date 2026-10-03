import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AcademicsProfile } from "../types.js";
import { ACADEMICS_CONFIG } from "./config.js";
import { computeAcademics, creditProgress, gpaStatus } from "./compute.js";

const profile: AcademicsProfile = {
  name: "무하마드",
  university: "국민대학교",
  department: "컴퓨터공학과",
  year: 3,
  semester: "2026학년도 2학기",
  status: "외국인 유학생, 학부 재학",
};

describe("creditProgress", () => {
  it("이수/필요 학점의 백분율을 반올림한다", () => {
    assert.equal(creditProgress(92, 130), 71); // 70.7 -> 71
    assert.equal(creditProgress(65, 130), 50);
  });

  it("required가 0 이하면 0을 돌려준다 (0 나눗셈 방지)", () => {
    assert.equal(creditProgress(10, 0), 0);
    assert.equal(creditProgress(10, -5), 0);
  });

  it("이수가 필요 학점을 넘어도 100을 넘지 않는다", () => {
    assert.equal(creditProgress(140, 130), 100);
  });
});

describe("gpaStatus", () => {
  it("경고선 미만이면 danger", () => {
    assert.equal(gpaStatus(1.8), "danger");
  });

  it("경고선 ~ 경고선+margin 사이면 warning", () => {
    // 기본: warningBelow 2.0, margin 0.3 -> [2.0, 2.3)
    assert.equal(gpaStatus(2.0), "warning");
    assert.equal(gpaStatus(2.29), "warning");
  });

  it("충분히 높으면 safe", () => {
    assert.equal(gpaStatus(2.3), "safe");
    assert.equal(gpaStatus(3.42), "safe");
  });
});

describe("computeAcademics", () => {
  it("데모 사용자 수치로 올바른 학점·GPA·요건을 만든다", () => {
    const res = computeAcademics({
      profile,
      earnedCredits: 92,
      graduationCreditsRequired: 130,
      gpa: 3.42,
    });

    assert.equal(res.credits.earned, 92);
    assert.equal(res.credits.required, 130);
    assert.equal(res.credits.remaining, 38);
    assert.equal(res.credits.progress, 71);

    assert.equal(res.gpa.value, 3.42);
    assert.equal(res.gpa.scale, ACADEMICS_CONFIG.gpaScale);
    assert.equal(res.gpa.warningBelow, ACADEMICS_CONFIG.gpaWarningBelow);
    assert.equal(res.gpa.status, "safe");

    assert.ok(res.requirements.length >= 1);
    assert.ok(res.requirements.every((r) => r.id && r.title && r.summary));
    assert.ok(res.disclaimer.length > 0);
    assert.ok(res.sources.length > 0 && res.sources.every((s) => s.label && s.url));
  });

  it("graduationCreditsRequired가 없으면 config 기본값을 쓴다", () => {
    const res = computeAcademics({ profile, earnedCredits: 0, gpa: 4.0 });
    assert.equal(res.credits.required, ACADEMICS_CONFIG.defaultGraduationCredits);
    assert.equal(res.credits.remaining, ACADEMICS_CONFIG.defaultGraduationCredits);
    assert.equal(res.credits.progress, 0);
  });

  it("이수를 다 하면 졸업 요건 상태가 safe", () => {
    const res = computeAcademics({ profile, earnedCredits: 130, graduationCreditsRequired: 130, gpa: 3.0 });
    assert.equal(res.credits.remaining, 0);
    const grad = res.requirements.find((r) => r.id === "graduation-progress");
    assert.equal(grad?.status, "safe");
  });

  it("낮은 GPA면 성적 요건 상태가 danger", () => {
    const res = computeAcademics({ profile, earnedCredits: 50, graduationCreditsRequired: 130, gpa: 1.5 });
    const minGpa = res.requirements.find((r) => r.id === "min-gpa");
    assert.equal(minGpa?.status, "danger");
    assert.equal(res.gpa.status, "danger");
  });
});
