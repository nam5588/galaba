// 정적 import: 배포(Vercel) 번들에 데모 사용자 파일이 반드시 포함되게 한다. 로컬 dev는 tsx watch가 바뀌면 재시작한다.
import DEMO_USER from "../../data/demo-user.json" with { type: "json" };

export interface DemoUser {
  name: string;
  department: string;
  visa: { type: string; expires: string };
  [key: string]: unknown;
}

export function loadDemoUser(): DemoUser {
  const { _note, ...user } = DEMO_USER as DemoUser & { _note?: string };
  return user;
}

/** 한국 시간 기준 오늘 (YYYY-MM-DD) */
export function todayKST(now = new Date()): string {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dDay(date: string, today = todayKST()): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export function weekdayKo(date: string): string {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
}
