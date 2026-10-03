import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "demo-user.json");

export interface DemoUser {
  name: string;
  department: string;
  visa: { type: string; expires: string };
  [key: string]: unknown;
}

/** 요청마다 파일을 읽으므로 FD1이 값을 바꾸면 서버 재시작 없이 반영된다. */
export function loadDemoUser(): DemoUser {
  const { _note, ...user } = JSON.parse(readFileSync(FILE, "utf8")) as DemoUser & { _note?: string };
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
