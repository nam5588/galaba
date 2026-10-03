// FD1 알림 규칙 (docs/PRD-FD1.md "알림 시점" 표).
// 매일 cron이 사용자마다 이 함수를 부르고, 아직 안 보낸 `key`만 보낸다(NotificationLog로 중복 방지).
//
// "오늘이 정확히 D-30인가"가 아니라 "지나간 마지막 시점이 아직 안 보내졌나"로 판단한다.
// 그래서 cron이 하루 빠져도 다음 날 보내고, D-20에 가입한 사용자도 D-30 알림을 바로 받는다
// (PRD의 "입국 직후" 알림 역할). 지나간 시점이 여러 개여도 가장 최근 것 하나만 보낸다.

import type { Fd1Profile, Fd1TaskType } from "../types.js";
import { addDays, addMonths, daysBetween } from "./dates.js";
import { computeFd1Plan } from "./plan.js";

export type Fd1Milestone =
  | "OPEN" // 연장 신청 가능 시작 / 이사 당일 / 등록 마감 안내 시작
  | "D-60"
  | "D-30"
  | "D-14"
  | "D-7"
  | "D-1"
  | "OVERDUE" // 마감 다음 날 (과태료·불법 체류 경고)
  | "PAY_SOON" // 매월 20일
  | "PAY_DUE" // 매월 25일
  | "BENEFIT_RESTRICTED"; // 미납 다음 달 1일

export interface Fd1Reminder {
  /** 중복 방지 키. 같은 키는 한 번만 보낸다. */
  key: string;
  taskType: Fd1TaskType;
  milestone: Fd1Milestone;
  dueDate: string;
  /** 보내는 날 기준 남은 날 (지났으면 음수) */
  daysLeft: number;
  /** 건강보험 알림의 대상 달 "YYYY-MM" */
  month?: string;
}

/** 마감 기준 알림 시점 (PRD 표) */
const SCHEDULES: Record<Exclude<Fd1TaskType, "NHIS_PAY">, Fd1Milestone[]> = {
  ARC_REGISTER: ["OPEN", "D-30", "D-14", "D-7", "D-1", "OVERDUE"],
  ARC_EXTEND: ["OPEN", "D-60", "D-30", "D-14", "D-7", "D-1", "OVERDUE"],
  ADDRESS_CHANGE: ["OPEN", "D-7", "D-1", "OVERDUE"],
};

function milestoneDate(milestone: Fd1Milestone, dueDate: string, openDate: string): string {
  if (milestone === "OPEN") return openDate;
  if (milestone === "OVERDUE") return addDays(dueDate, 1);
  return addDays(dueDate, -Number(milestone.slice(2)));
}

/** 지나간(오늘 포함) 시점 중 가장 최근 것 */
function latestPassed<T extends { date: string }>(points: T[], today: string): T | undefined {
  return points.filter((p) => p.date <= today).sort((a, b) => a.date.localeCompare(b.date)).at(-1);
}

export function remindersFor(profile: Fd1Profile, today: string): Fd1Reminder[] {
  const plan = computeFd1Plan(profile, today);
  const reminders: Fd1Reminder[] = [];

  for (const task of plan.tasks) {
    if (task.type === "NHIS_PAY") continue;
    const openDate = task.openDate ?? today;
    const points = SCHEDULES[task.type]
      .map((milestone) => ({ milestone, date: milestoneDate(milestone, task.dueDate, openDate) }))
      // 신청 기간 시작 전의 D-60 같은 시점은 버린다
      .filter((p) => p.milestone === "OPEN" || p.date >= openDate);
    const latest = latestPassed(points, today);
    if (!latest) continue;
    reminders.push({
      key: `${task.type}:${task.dueDate}:${latest.milestone}`,
      taskType: task.type,
      milestone: latest.milestone,
      dueDate: task.dueDate,
      daysLeft: task.daysLeft,
    });
  }

  // 건강보험: 가장 이른 미납 달 하나만 (여러 달 밀려도 알림 폭탄이 되지 않게)
  const unpaid = plan.insurance.months.find((m) => !m.paid);
  if (unpaid) {
    const latest = latestPassed(
      [
        { milestone: "PAY_SOON" as const, date: `${unpaid.month}-20` },
        { milestone: "PAY_DUE" as const, date: unpaid.dueDate },
        { milestone: "BENEFIT_RESTRICTED" as const, date: addMonths(`${unpaid.month}-01`, 1) },
      ],
      today,
    );
    // 가입 전 날짜(예: 20일 이후 가입한 첫 달의 PAY_SOON)는 보내지 않는다
    if (latest && plan.insurance.startDate && latest.date >= plan.insurance.startDate) {
      reminders.push({
        key: `NHIS_PAY:${unpaid.month}:${latest.milestone}`,
        taskType: "NHIS_PAY",
        milestone: latest.milestone,
        dueDate: unpaid.dueDate,
        daysLeft: daysBetween(today, unpaid.dueDate),
        month: unpaid.month,
      });
    }
  }

  return reminders;
}
