import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AcademicsSummary } from "./get_academics.js";
import { getAcademicsTool } from "./get_academics.js";

describe("get_academics (수강 & 학업 채팅 도구)", () => {
  it("데모 사용자의 학점·GPA·요건을 돌려준다", async () => {
    const res = (await getAcademicsTool.run({})) as AcademicsSummary;

    assert.ok(res.name && res.department && res.semester);
    assert.equal(res.earnedCredits, 92);
    assert.equal(res.requiredCredits, 130);
    assert.equal(res.remainingCredits, 38);
    assert.equal(res.progressPercent, 71);

    assert.equal(res.gpa, 3.42);
    assert.ok(res.gpaScale > 0);
    assert.ok(["safe", "warning", "danger"].includes(res.gpaStatus));

    assert.ok(res.requirements.length > 0);
    assert.ok(res.requirements.every((r) => r.title && r.summary && ["safe", "warning", "danger"].includes(r.status)));
    assert.ok(res.disclaimer.length > 0);
  });

  it("입력 스키마는 파라미터가 없다", () => {
    const schema = getAcademicsTool.inputSchema as { properties: Record<string, unknown> };
    assert.deepEqual(schema.properties, {});
  });
});
