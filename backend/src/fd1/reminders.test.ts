import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FD1_LANGS } from "./guides.js";
import { formatDate, renderReminder } from "./messages.js";
import { remindersFor } from "./reminders.js";

const keys = (profile: Parameters<typeof remindersFor>[0], today: string) =>
  remindersFor(profile, today).map((r) => r.key);

describe("FD1 알림 시점", () => {
  const newcomer = { visaType: "D-2" as const, entryDate: "2026-09-01" }; // 등록 마감 2026-11-30

  it("외국인등록: 입국 직후 OPEN → D-30 → D-1 → OVERDUE", () => {
    assert.deepEqual(keys(newcomer, "2026-09-01"), ["ARC_REGISTER:2026-11-30:OPEN"]);
    assert.deepEqual(keys(newcomer, "2026-10-31"), ["ARC_REGISTER:2026-11-30:D-30"]);
    assert.deepEqual(keys(newcomer, "2026-11-29"), ["ARC_REGISTER:2026-11-30:D-1"]);
    assert.deepEqual(keys(newcomer, "2026-12-01"), ["ARC_REGISTER:2026-11-30:OVERDUE"]);
  });

  it("cron이 하루 빠져도 다음 날 같은 키로 다시 나온다 (중복 방지는 NotificationLog)", () => {
    assert.deepEqual(keys(newcomer, "2026-11-01"), ["ARC_REGISTER:2026-11-30:D-30"]);
  });

  it("체류기간 연장: 신청 가능일 전에는 알림 없음, 시작일에 OPEN, 그 뒤 D-60", () => {
    const p = { visaType: "D-2" as const, entryDate: "2026-03-01", arcIssuedDate: "2026-03-20", stayExpiryDate: "2027-03-15",
      paidMonths: ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"] };
    assert.deepEqual(keys(p, "2026-11-14"), []);
    assert.deepEqual(keys(p, "2026-11-15"), ["ARC_EXTEND:2027-03-15:OPEN"]);
    assert.ok(keys(p, "2027-01-14").includes("ARC_EXTEND:2027-03-15:D-60"));
  });

  it("체류지 변경: 이사 당일 OPEN, 마감 7일 전 D-7", () => {
    const p = { visaType: "D-2" as const, entryDate: "2026-03-01", moveDate: "2026-10-01" }; // 마감 10-15
    assert.ok(keys(p, "2026-10-01").includes("ADDRESS_CHANGE:2026-10-15:OPEN"));
    assert.ok(keys(p, "2026-10-08").includes("ADDRESS_CHANGE:2026-10-15:D-7"));
  });
});

describe("FD1 건강보험 알림", () => {
  const paidToAug = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
  const p = { visaType: "D-2" as const, entryDate: "2026-03-01", arcIssuedDate: "2026-03-20", paidMonths: paidToAug };

  it("미납 달: 20일 PAY_SOON → 25일 PAY_DUE → 다음 달 1일 BENEFIT_RESTRICTED", () => {
    assert.deepEqual(keys(p, "2026-09-19"), []);
    assert.deepEqual(keys(p, "2026-09-20"), ["NHIS_PAY:2026-09:PAY_SOON"]);
    assert.deepEqual(keys(p, "2026-09-25"), ["NHIS_PAY:2026-09:PAY_DUE"]);
    assert.deepEqual(keys(p, "2026-10-01"), ["NHIS_PAY:2026-09:BENEFIT_RESTRICTED"]);
  });

  it("여러 달 밀려도 가장 이른 미납 달 하나만", () => {
    const r = remindersFor({ ...p, paidMonths: [] }, "2026-10-03").filter((x) => x.taskType === "NHIS_PAY");
    assert.equal(r.length, 1);
    assert.equal(r[0].month, "2026-03");
  });

  it("납부하면 그 달 알림은 사라진다", () => {
    assert.deepEqual(keys({ ...p, paidMonths: [...paidToAug, "2026-09"] }, "2026-09-25"), []);
  });

  it("20일 이후 가입한 첫 달에는 PAY_SOON을 보내지 않는다", () => {
    const late = { visaType: "D-2" as const, entryDate: "2026-03-01", arcIssuedDate: "2026-03-22" };
    assert.deepEqual(keys(late, "2026-03-23"), []);
    assert.deepEqual(keys(late, "2026-03-25"), ["NHIS_PAY:2026-03:PAY_DUE"]);
  });
});

describe("FD1 알림 문구", () => {
  it("날짜를 언어별로 쓴다", () => {
    assert.equal(formatDate("2026-11-15", "ko"), "11월 15일");
    assert.equal(formatDate("2026-11-15", "en"), "Nov 15");
    assert.equal(formatDate("2026-11-15", "uz"), "15-noyabr");
    assert.equal(formatDate("2026-11-15", "ru"), "15 ноября");
  });

  it("모든 알림이 모든 언어로 제목·본문을 만든다", () => {
    const profiles = [
      { visaType: "D-2" as const, entryDate: "2026-09-01" },
      { visaType: "D-2" as const, entryDate: "2026-03-01", arcIssuedDate: "2026-03-20", stayExpiryDate: "2026-11-15", moveDate: "2026-10-01" },
    ];
    const days = ["2026-09-01", "2026-09-20", "2026-09-25", "2026-10-01", "2026-10-31", "2026-11-14", "2026-11-29", "2026-12-01"];
    let count = 0;
    for (const profile of profiles) for (const day of days) for (const r of remindersFor(profile, day)) {
      for (const lang of FD1_LANGS) {
        const m = renderReminder(r, lang);
        assert.ok(m.title && m.body && !m.body.includes("undefined"), `${r.key} ${lang}`);
        count++;
      }
    }
    assert.ok(count > 20);
  });

  it("PRD 데모: 우즈벡어 연장 알림", () => {
    const [r] = remindersFor({ visaType: "D-2", entryDate: "2026-03-01", arcIssuedDate: "2026-03-20", stayExpiryDate: "2026-11-15",
      paidMonths: ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"] }, "2026-10-16");
    const m = renderReminder(r, "uz");
    assert.equal(r.key, "ARC_EXTEND:2026-11-15:D-30");
    assert.equal(m.title, "Yashash muddatini uzaytirish");
    assert.equal(m.body, "Muddat tugashiga 30 kun qoldi (15-noyabr). Oldindan tayyorlaning.");
  });

  it("러시아어: 연장 D-30 알림과 건강보험 월 이름", () => {
    const profile = { visaType: "D-2" as const, entryDate: "2026-03-01", arcIssuedDate: "2026-03-20", stayExpiryDate: "2026-11-15",
      paidMonths: ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"] };
    const [r] = remindersFor(profile, "2026-10-16");
    const m = renderReminder(r, "ru");
    assert.equal(m.title, "Продление срока пребывания");
    assert.equal(m.body, "До крайнего срока осталось 30 дней (15 ноября). Подготовьтесь заранее.");
    const pay = remindersFor(profile, "2026-10-25").find((x) => x.taskType === "NHIS_PAY");
    assert.ok(pay, "10월 납부 알림");
    assert.match(renderReminder(pay, "ru").body, /за октябрь/);
  });
});
