// FD1 규정 값. 매년 바뀌므로 코드 곳곳에 숫자를 쓰지 말고 여기서만 바꾼다.
// 출처: docs/PRD-FD1.md "규정 근거" 표

export const FD1_CONFIG = {
  /** 외국인등록: 입국일로부터 90일 이내 */
  arcRegisterDays: 90,
  /** 체류기간 연장: 만료 4개월 전부터 신청 가능 */
  extendOpenMonths: 4,
  /** 체류지 변경: 이사일로부터 14일 이내 (P1, FD1-6) */
  addressChangeDays: 14,
  /** 건강보험료 납부 마감일 (매월) */
  nhisDueDay: 25,
  /** 연도별 월 건강보험료(원). 새 해 금액이 나오면 한 줄 추가한다. */
  nhisMonthlyFeeByYear: {
    2026: 79_320,
  } as Record<number, number>,
  /** 출처로 규칙을 확인한 비자. D-4는 건강보험·연장 규칙 확인 전이다. */
  verifiedVisaTypes: ["D-2"],
  timeZone: "Asia/Seoul",
} as const;

/** 해당 연도 보험료. 없는 연도면 가장 최근 연도 금액을 쓴다. */
export function nhisMonthlyFee(year: number): number {
  const table = FD1_CONFIG.nhisMonthlyFeeByYear;
  if (table[year] !== undefined) return table[year];
  const known = Object.keys(table).map(Number).sort((a, b) => a - b);
  const fallback = known.filter((y) => y <= year).at(-1) ?? known[0];
  return table[fallback];
}
