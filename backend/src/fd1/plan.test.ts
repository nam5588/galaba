import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addMonths, todayInSeoul } from "./dates.js";
import { computeFd1Plan, parseProfile } from "./plan.js";

describe("dates", () => {
  it("월 빼기는 없는 날짜를 그 달 말일로 맞춘다", () => {
    assert.equal(addMonths("2026-06-30", -4), "2026-02-28");
    assert.equal(addMonths("2026-03-15", -4), "2025-11-15");
  });

  it("오늘 날짜는 한국 시간 기준이다", () => {
    // UTC 10월 2일 16:00 = 한국 10월 3일 01:00
    assert.equal(todayInSeoul(new Date("2026-10-02T16:00:00Z")), "2026-10-03");
  });
});

describe("FD1-1 외국인등록", () => {
  it("등록증이 없으면 입국일 + 90일 마감", () => {
    const plan = computeFd1Plan({ visaType: "D-2", entryDate: "2026-09-01" }, "2026-10-03");
    const task = plan.tasks.find((t) => t.type === "ARC_REGISTER");
    assert.equal(task?.dueDate, "2026-11-30");
    assert.equal(task?.daysLeft, 58);
    assert.equal(task?.status, "OPEN");
    assert.equal(plan.insurance.enrolled, false);
  });

  it("마감이 지나면 OVERDUE + red", () => {
    const plan = computeFd1Plan({ visaType: "D-2", entryDate: "2026-06-01" }, "2026-10-03");
    const task = plan.tasks.find((t) => t.type === "ARC_REGISTER");
    assert.equal(task?.status, "OVERDUE");
    assert.equal(task?.urgency, "red");
  });

  it("등록증이 있으면 등록 일정은 없다", () => {
    const plan = computeFd1Plan({ visaType: "D-2", entryDate: "2026-03-01", arcIssuedDate: "2026-03-20" }, "2026-10-03");
    assert.equal(plan.tasks.some((t) => t.type === "ARC_REGISTER"), false);
  });
});

describe("FD1-2 체류기간 연장", () => {
  const base = { visaType: "D-2" as const, entryDate: "2026-03-01", arcIssuedDate: "2026-03-20" };

  it("만료 4개월 전부터 OPEN", () => {
    const plan = computeFd1Plan({ ...base, stayExpiryDate: "2026-11-15" }, "2026-10-03");
    const task = plan.tasks.find((t) => t.type === "ARC_EXTEND");
    assert.equal(task?.openDate, "2026-07-15");
    assert.equal(task?.daysLeft, 43);
    assert.equal(task?.status, "OPEN");
  });

  it("신청 가능일 전이면 UPCOMING + blue", () => {
    const plan = computeFd1Plan({ ...base, stayExpiryDate: "2027-08-31" }, "2026-10-03");
    const task = plan.tasks.find((t) => t.type === "ARC_EXTEND");
    assert.equal(task?.openDate, "2027-04-30");
    assert.equal(task?.status, "UPCOMING");
    assert.equal(task?.urgency, "blue");
  });

  it("만료 당일은 아직 OPEN (D-0)", () => {
    const plan = computeFd1Plan({ ...base, stayExpiryDate: "2026-10-03" }, "2026-10-03");
    const task = plan.tasks.find((t) => t.type === "ARC_EXTEND");
    assert.equal(task?.daysLeft, 0);
    assert.equal(task?.status, "OPEN");
  });
});

describe("FD1-3·4 건강보험", () => {
  const base = { visaType: "D-2" as const, entryDate: "2026-03-01", arcIssuedDate: "2026-03-20" };
  const marToSep = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];

  it("PRD 예시: 3월 등록, 9월까지 납부 → 가입 8개월째 · 미납 0개월 · 다음 납부 10월 25일", () => {
    const { insurance } = computeFd1Plan({ ...base, paidMonths: marToSep }, "2026-10-03");
    assert.equal(insurance.monthsEnrolled, 8);
    assert.equal(insurance.totalDue, 634_560);
    assert.equal(insurance.paidTotal, 555_240);
    assert.equal(insurance.unpaidMonths, 0);
    assert.equal(insurance.benefitRestricted, false);
    assert.equal(insurance.nextDueDate, "2026-10-25");
    assert.equal(insurance.months.length, 8);
  });

  it("이번 달까지 다 냈으면 다음 달 25일 (연말 포함)", () => {
    const paidMonths = [...marToSep, "2026-10", "2026-11", "2026-12"];
    const { insurance } = computeFd1Plan({ ...base, paidMonths }, "2026-12-26");
    assert.equal(insurance.nextDueDate, "2027-01-25");
  });

  it("이번 달 25일 전이면 이번 달은 아직 미납으로 세지 않는다", () => {
    const { insurance } = computeFd1Plan({ ...base, paidMonths: marToSep }, "2026-10-25");
    assert.equal(insurance.unpaidMonths, 0);
    assert.equal(insurance.months.at(-1)?.overdue, false);
  });

  it("미납: 마감(25일) 다음 날부터 미납, 다음 달 1일부터 병원 혜택 제한", () => {
    const paidMonths = marToSep.filter((m) => m !== "2026-09");
    const sep26 = computeFd1Plan({ ...base, paidMonths }, "2026-09-26").insurance;
    assert.equal(sep26.unpaidMonths, 1);
    assert.equal(sep26.benefitRestricted, false);

    const oct1 = computeFd1Plan({ ...base, paidMonths }, "2026-10-01");
    assert.equal(oct1.insurance.unpaidMonths, 1);
    assert.equal(oct1.insurance.benefitRestricted, true);
    assert.equal(oct1.insurance.nextDueDate, "2026-09-25");
    const task = oct1.tasks.find((t) => t.type === "NHIS_PAY");
    assert.equal(task?.status, "OVERDUE");
    assert.equal(task?.urgency, "red");
  });

  it("작업 목록은 마감 가까운 순", () => {
    const plan = computeFd1Plan({ ...base, stayExpiryDate: "2026-11-15", paidMonths: marToSep }, "2026-10-03");
    assert.deepEqual(plan.tasks.map((t) => t.type), ["NHIS_PAY", "ARC_EXTEND"]);
  });
});

describe("FD1-6 체류지 변경", () => {
  it("이사한 날 + 14일 마감", () => {
    const plan = computeFd1Plan(
      { visaType: "D-2", entryDate: "2026-03-01", arcIssuedDate: "2026-03-20", moveDate: "2026-10-01" },
      "2026-10-03",
    );
    const task = plan.tasks.find((t) => t.type === "ADDRESS_CHANGE");
    assert.equal(task?.dueDate, "2026-10-15");
    assert.equal(task?.daysLeft, 12);
    assert.equal(task?.urgency, "red");
  });
});

describe("parseProfile", () => {
  it("올바른 입력", () => {
    const r = parseProfile({ visaType: "D-2", entryDate: "2026-03-01", stayExpiryDate: "2027-02-28" });
    assert.equal(r.ok, true);
  });

  it("없는 날짜, 잘못된 비자, 순서가 틀린 날짜는 거부", () => {
    assert.equal(parseProfile({ visaType: "D-2", entryDate: "2026-02-30" }).ok, false);
    assert.equal(parseProfile({ visaType: "E-9", entryDate: "2026-03-01" }).ok, false);
    assert.equal(parseProfile({ visaType: "D-2", entryDate: "2026-03-01", arcIssuedDate: "2026-02-01" }).ok, false);
    assert.equal(parseProfile(null).ok, false);
    assert.equal(parseProfile({ visaType: "D-2", entryDate: "2026-03-01", paidMonths: ["2026-13"] }).ok, false);
    assert.equal(parseProfile({ visaType: "D-2", entryDate: "2026-03-01", moveDate: "2026-01-01" }).ok, false);
  });

  it("D-4는 규칙 미확인으로 표시", () => {
    const plan = computeFd1Plan({ visaType: "D-4", entryDate: "2026-09-01" }, "2026-10-03");
    assert.equal(plan.rulesVerified, false);
  });
});
