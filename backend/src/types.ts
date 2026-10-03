export type NoticeTone = "red" | "blue" | "green";

export interface Notice {
  id: number;
  category: string;
  tag: string;
  tone: NoticeTone;
  title: string;
  /** "2026. 10. 02" 형식 (화면 표기와 동일) */
  date: string;
  /** 본문 앞부분 한 줄 요약(약 70자) */
  text: string;
  url: string;
  dept: string;
  pinned: boolean;
}

export interface NoticesResponse {
  source: "live" | "cache" | "sample";
  fetchedAt: string;
  items: Notice[];
}

// ── FD1: 체류·건강보험 필수 일정 ─────────────────────────────

export type VisaType = "D-2" | "D-4";

/** 사용자가 입력하는 날짜. 모두 "YYYY-MM-DD" (한국 시간 기준 날짜) */
export interface Fd1Profile {
  visaType: VisaType;
  entryDate: string;
  arcIssuedDate?: string;
  stayExpiryDate?: string;
  /** 이사한 날 (FD1-6 체류지 변경) */
  moveDate?: string;
  /** 건강보험료를 납부했다고 체크한 달 ("YYYY-MM"). DB 연결 전까지는 프론트가 보관해서 보낸다. */
  paidMonths?: string[];
}

export type Fd1TaskType = "ARC_REGISTER" | "ARC_EXTEND" | "NHIS_PAY" | "ADDRESS_CHANGE";

/** UPCOMING: 아직 신청 기간 전 · OPEN: 지금 해야 함 · OVERDUE: 마감 지남 */
export type Fd1TaskStatus = "UPCOMING" | "OPEN" | "OVERDUE";

export type Fd1Urgency = "red" | "yellow" | "blue";

/** 화면 문구는 프론트가 type + 날짜로 만든다(다국어 대응). 서버는 문구를 보내지 않는다. */
export interface Fd1Task {
  type: Fd1TaskType;
  dueDate: string;
  /** 신청 가능 시작일 (연장: 만료 4개월 전) */
  openDate?: string;
  /** 오늘부터 dueDate까지 남은 날 (지났으면 음수) */
  daysLeft: number;
  status: Fd1TaskStatus;
  urgency: Fd1Urgency;
}

export interface Fd1InsuranceMonth {
  /** "YYYY-MM" */
  month: string;
  amount: number;
  /** 그 달 25일 */
  dueDate: string;
  paid: boolean;
  /** 납부 마감이 지났는데 미납 */
  overdue: boolean;
}

export interface Fd1Insurance {
  /** 외국인등록 전이면 false (등록일에 자동 가입) */
  enrolled: boolean;
  startDate?: string;
  /** 가입 N개월째 (가입한 달 포함) */
  monthsEnrolled: number;
  monthlyFee: number;
  /** 가입한 달부터 이번 달까지 낼 보험료 합계 */
  totalDue: number;
  /** 납부 체크한 금액 합계 */
  paidTotal: number;
  /** 마감이 지난 미납 개월 수 (화면에 빨간색) */
  unpaidMonths: number;
  /** 미납 상태로 다음 달 1일이 지나 병원 혜택이 제한된 상태 */
  benefitRestricted: boolean;
  /** 가장 이른 미납 달의 마감일, 다 냈으면 다음 달 25일 */
  nextDueDate?: string;
  /** 가입한 달부터 이번 달까지, 오래된 순 */
  months: Fd1InsuranceMonth[];
}

export interface Fd1PlanResponse {
  today: string;
  profile: Fd1Profile;
  /** 마감 가까운 순 */
  tasks: Fd1Task[];
  insurance: Fd1Insurance;
  /** 규칙이 출처로 확인된 비자인지 (현재 D-2만 확인됨) */
  rulesVerified: boolean;
}

export type Fd1Lang = "ko" | "en" | "uz" | "ru";

export interface Fd1Guide {
  title: string;
  summary: string;
  checklist: { id: string; text: string }[];
  links: { label: string; url: string }[];
}

export interface Fd1GuidesResponse {
  lang: Fd1Lang;
  guides: Record<Fd1TaskType, Fd1Guide>;
  /** 모든 화면에 표시: 최종 확인은 하이코리아·1345 */
  disclaimer: string;
  /** 규정 출처 (docs/PRD-FD1.md) */
  sources: { label: string; url: string }[];
}

export interface Fd1ReminderItem {
  /** 중복·읽음 처리 키 */
  key: string;
  taskType: Fd1TaskType;
  milestone: string;
  dueDate: string;
  daysLeft: number;
  month?: string;
  title: string;
  body: string;
}

export interface Fd1RemindersResponse {
  today: string;
  lang: Fd1Lang;
  items: Fd1ReminderItem[];
}
