// FD1 일정 계산: 사용자가 넣은 날짜 몇 개로 등록·연장·건강보험 일정을 만든다.
// 순수 함수라서 DB 없이 테스트할 수 있다. `today`를 넘기면 그 날짜 기준으로 계산한다.

import type {
  Fd1Insurance,
  Fd1InsuranceMonth,
  Fd1PlanResponse,
  Fd1Profile,
  Fd1Task,
  Fd1TaskStatus,
  Fd1TaskType,
  Fd1Urgency,
  VisaType,
} from "../types.js";
import { FD1_CONFIG, nhisMonthlyFee } from "./config.js";
import { addDays, addMonths, daysBetween, isIsoDate, monthsBetween, withDay } from "./dates.js";

const VISA_TYPES: VisaType[] = ["D-2", "D-4"];
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export type ProfileResult = { ok: true; profile: Fd1Profile } | { ok: false; error: string };

/** 요청 body 검사. 날짜 형식과 앞뒤 순서를 확인한다. */
export function parseProfile(body: unknown): ProfileResult {
  if (typeof body !== "object" || body === null) return { ok: false, error: "요청 body가 비어 있습니다." };
  const b = body as Record<string, unknown>;

  if (!VISA_TYPES.includes(b.visaType as VisaType)) {
    return { ok: false, error: `visaType은 ${VISA_TYPES.join(", ")} 중 하나여야 합니다.` };
  }
  if (!isIsoDate(b.entryDate)) return { ok: false, error: "entryDate는 YYYY-MM-DD 형식이어야 합니다." };
  for (const key of ["arcIssuedDate", "stayExpiryDate", "moveDate"] as const) {
    if (b[key] !== undefined && b[key] !== null && !isIsoDate(b[key])) {
      return { ok: false, error: `${key}는 YYYY-MM-DD 형식이어야 합니다.` };
    }
  }

  const profile: Fd1Profile = { visaType: b.visaType as VisaType, entryDate: b.entryDate };
  if (isIsoDate(b.arcIssuedDate)) profile.arcIssuedDate = b.arcIssuedDate;
  if (isIsoDate(b.stayExpiryDate)) profile.stayExpiryDate = b.stayExpiryDate;
  if (isIsoDate(b.moveDate)) profile.moveDate = b.moveDate;

  if (b.paidMonths !== undefined && b.paidMonths !== null) {
    if (!Array.isArray(b.paidMonths) || !b.paidMonths.every((m) => typeof m === "string" && YEAR_MONTH.test(m))) {
      return { ok: false, error: "paidMonths는 \"YYYY-MM\" 문자열 배열이어야 합니다." };
    }
    profile.paidMonths = [...new Set(b.paidMonths as string[])].sort();
  }

  if (profile.arcIssuedDate && profile.arcIssuedDate < profile.entryDate) {
    return { ok: false, error: "외국인등록일은 입국일보다 빠를 수 없습니다." };
  }
  if (profile.stayExpiryDate && profile.stayExpiryDate <= profile.entryDate) {
    return { ok: false, error: "체류만료일은 입국일보다 뒤여야 합니다." };
  }
  if (profile.moveDate && profile.moveDate < profile.entryDate) {
    return { ok: false, error: "이사한 날은 입국일보다 빠를 수 없습니다." };
  }
  return { ok: true, profile };
}

function urgencyOf(type: Fd1TaskType, status: Fd1TaskStatus, daysLeft: number): Fd1Urgency {
  if (status === "OVERDUE") return "red";
  if (status === "UPCOMING") return "blue";
  if (type === "NHIS_PAY") return daysLeft <= 5 ? "red" : daysLeft <= 10 ? "yellow" : "blue";
  // 등록·연장은 하이코리아 예약이 빨리 차므로 30일 전부터 빨간색
  return daysLeft <= 30 ? "red" : "yellow";
}

function makeTask(type: Fd1TaskType, today: string, dueDate: string, openDate?: string): Fd1Task {
  const daysLeft = daysBetween(today, dueDate);
  const status: Fd1TaskStatus =
    daysLeft < 0 ? "OVERDUE" : openDate && today < openDate ? "UPCOMING" : "OPEN";
  const task: Fd1Task = { type, dueDate, daysLeft, status, urgency: urgencyOf(type, status, daysLeft) };
  if (openDate) task.openDate = openDate;
  return task;
}

function nhisDueDateOf(month: string): string {
  return `${month}-${String(FD1_CONFIG.nhisDueDay).padStart(2, "0")}`;
}

function insuranceOf(profile: Fd1Profile, today: string): Fd1Insurance {
  const monthlyFee = nhisMonthlyFee(Number(today.slice(0, 4)));
  const start = profile.arcIssuedDate;
  // PRD FD1-3: 가입일 = 외국인등록일. 등록 전이면 아직 가입 전으로 본다.
  if (!start || start > today) {
    return {
      enrolled: false,
      monthsEnrolled: 0,
      monthlyFee,
      totalDue: 0,
      paidTotal: 0,
      unpaidMonths: 0,
      benefitRestricted: false,
      months: [],
    };
  }

  // PRD 예시 "가입 8개월째 · 634,560원"처럼 가입한 달부터 이번 달까지 매달 1회씩 센다.
  const paid = new Set(profile.paidMonths ?? []);
  const monthsEnrolled = monthsBetween(start, today) + 1;
  const months: Fd1InsuranceMonth[] = [];
  for (let i = 0; i < monthsEnrolled; i++) {
    const month = addMonths(withDay(start, 1), i).slice(0, 7);
    const dueDate = nhisDueDateOf(month);
    const isPaid = paid.has(month);
    months.push({
      month,
      amount: nhisMonthlyFee(Number(month.slice(0, 4))),
      dueDate,
      paid: isPaid,
      overdue: !isPaid && today > dueDate,
    });
  }

  const unpaid = months.filter((m) => !m.paid);
  // 체납: 마감 다음 달 1일부터 병원 혜택 제한 (PRD 규정 근거)
  const benefitRestricted = unpaid.some((m) => today >= addMonths(`${m.month}-01`, 1));
  const lastMonth = months[months.length - 1].month;
  const nextDueDate = unpaid[0]?.dueDate ?? nhisDueDateOf(addMonths(`${lastMonth}-01`, 1).slice(0, 7));

  return {
    enrolled: true,
    startDate: start,
    monthsEnrolled,
    monthlyFee,
    totalDue: months.reduce((sum, m) => sum + m.amount, 0),
    paidTotal: months.filter((m) => m.paid).reduce((sum, m) => sum + m.amount, 0),
    unpaidMonths: months.filter((m) => m.overdue).length,
    benefitRestricted,
    nextDueDate,
    months,
  };
}

export function computeFd1Plan(profile: Fd1Profile, today: string): Fd1PlanResponse {
  const tasks: Fd1Task[] = [];

  // FD1-1: 외국인등록증이 아직 없으면 입국일 + 90일 마감
  if (!profile.arcIssuedDate) {
    tasks.push(makeTask("ARC_REGISTER", today, addDays(profile.entryDate, FD1_CONFIG.arcRegisterDays), profile.entryDate));
  }

  // FD1-2: 만료 4개월 전부터 만료일까지 연장 신청
  if (profile.stayExpiryDate) {
    const openDate = addMonths(profile.stayExpiryDate, -FD1_CONFIG.extendOpenMonths);
    tasks.push(makeTask("ARC_EXTEND", today, profile.stayExpiryDate, openDate));
  }

  // FD1-6: 이사한 날로부터 14일 이내 체류지 변경 신고
  if (profile.moveDate) {
    tasks.push(makeTask("ADDRESS_CHANGE", today, addDays(profile.moveDate, FD1_CONFIG.addressChangeDays), profile.moveDate));
  }

  // FD1-3·4: 가입 중이면 가장 이른 미납 달(없으면 다음 달)의 25일
  const insurance = insuranceOf(profile, today);
  if (insurance.enrolled && insurance.nextDueDate) {
    tasks.push(makeTask("NHIS_PAY", today, insurance.nextDueDate));
  }

  tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return {
    today,
    profile,
    tasks,
    insurance,
    rulesVerified: (FD1_CONFIG.verifiedVisaTypes as readonly string[]).includes(profile.visaType),
  };
}
