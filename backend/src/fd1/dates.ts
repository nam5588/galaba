// 날짜는 모두 "YYYY-MM-DD" 문자열(한국 시간 기준 달력 날짜)로 다룬다.
// 계산은 UTC 자정으로 바꿔서 해서 서버 시간대와 서머타임의 영향을 받지 않게 한다.

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === value;
}

function toUtc(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** 지금 한국 시간 기준 오늘 날짜 */
export function todayInSeoul(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

/** 월 단위 더하기. 없는 날짜는 그 달 마지막 날로 맞춘다 (6/30 − 4개월 = 2/28) */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return fromUtc(target.getTime());
}

/** b − a (일) */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

/** "2026-10" 같은 달 차이 (같은 달이면 0) */
export function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

export function withDay(date: string, day: number): string {
  return `${date.slice(0, 8)}${String(day).padStart(2, "0")}`;
}
