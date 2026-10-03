// FD1 get_deadlines: 데모 사용자의 체류·건강보험 기한 (docs/PRD-FD1.md).
// 계산은 src/fd1/plan.ts, 안내 문구는 src/fd1/guides.ts를 그대로 쓴다.
import { addMonths, todayInSeoul } from "../fd1/dates.js";
import { getFd1Guides } from "../fd1/guides.js";
import { computeFd1Plan } from "../fd1/plan.js";
import type { Fd1Profile, Fd1Task, Fd1TaskType, VisaType } from "../types.js";
import { loadDemoUser } from "./demo-user.js";
import type { ToolDef } from "./types.js";

export interface Deadline {
  type: "visa" | "insurance" | "address";
  title: string;
  dueDate: string; // YYYY-MM-DD
  /** 남은 날 (지났으면 음수) */
  dDay: number;
  /** 지금 할 일 + 준비물 */
  todo: string;
  url: string;
  status: Fd1Task["status"];
}

interface DemoFd1 {
  entryDate: string;
  arcIssuedDate?: string;
  /** "YYYY-MM": 이 달까지 건강보험료 납부 */
  paidThrough?: string;
}

const TYPE_OF: Record<Fd1TaskType, Deadline["type"]> = {
  ARC_REGISTER: "visa",
  ARC_EXTEND: "visa",
  NHIS_PAY: "insurance",
  ADDRESS_CHANGE: "address",
};

/** 가입한 달부터 paidThrough까지 */
function paidMonths(start: string | undefined, paidThrough: string | undefined): string[] {
  if (!start || !paidThrough) return [];
  const months: string[] = [];
  for (let m = `${start.slice(0, 7)}-01`; m.slice(0, 7) <= paidThrough; m = addMonths(m, 1)) months.push(m.slice(0, 7));
  return months;
}

export function demoProfile(): Fd1Profile {
  const user = loadDemoUser();
  const fd1 = user.fd1 as DemoFd1;
  return {
    visaType: (user.visa.type.startsWith("D-4") ? "D-4" : "D-2") as VisaType,
    entryDate: fd1.entryDate,
    arcIssuedDate: fd1.arcIssuedDate,
    stayExpiryDate: user.visa.expires,
    paidMonths: paidMonths(fd1.arcIssuedDate, fd1.paidThrough),
  };
}

function todoOf(task: Fd1Task, unpaidMonths: number): string {
  const guide = getFd1Guides("ko").guides[task.type];
  const items = guide.checklist.filter((c) => c.id !== "reservation" && c.id !== "check").map((c) => c.text);
  const when =
    task.status === "OVERDUE"
      ? "마감이 지났어요. 바로 처리하고 1345에 문의"
      : task.status === "UPCOMING" && task.openDate
        ? `${task.openDate}부터 신청 가능`
        : task.type === "NHIS_PAY"
          ? unpaidMonths > 0
            ? `미납 ${unpaidMonths}개월. 다음 달 1일부터 병원 혜택 제한, 연장 시 불이익`
            : "매월 25일까지 납부. 체납하면 체류기간 연장 때 불이익"
          : "지금 신청 가능. 하이코리아 방문 예약(빨리 참) 또는 국제처 일괄 신청 확인";
  return task.type === "NHIS_PAY" ? when : `${when}. 준비물: ${items.join(", ")}`;
}

export const getDeadlinesTool: ToolDef<{ withinDays?: number }, Deadline[]> = {
  name: "get_deadlines",
  description:
    "데모 사용자의 체류·건강보험 기한(외국인등록, 체류기간 연장, 건강보험료 납부, 체류지 변경)을 날짜순으로 돌려준다. 각 항목에 D-day(지났으면 음수), 상태, 해야 할 일과 준비물, 신청 링크가 있다.",
  inputSchema: {
    type: "object",
    properties: { withinDays: { type: "integer", description: "오늘부터 며칠 안의 기한만(기본: 전부). 이미 지난 기한은 항상 포함" } },
    additionalProperties: false,
  },
  label: (input) => (input.withinDays ? `기한 확인: ${input.withinDays}일 이내` : "기한 확인"),
  async run({ withinDays }) {
    const plan = computeFd1Plan(demoProfile(), todayInSeoul());
    const guides = getFd1Guides("ko").guides;
    return plan.tasks
      .filter((t) => withinDays === undefined || t.daysLeft <= withinDays)
      .map((t) => ({
        type: TYPE_OF[t.type],
        title: t.type === "ARC_EXTEND" ? `${guides[t.type].title} (${plan.profile.visaType} 비자 만료)` : guides[t.type].title,
        dueDate: t.dueDate,
        dDay: t.daysLeft,
        todo: todoOf(t, plan.insurance.unpaidMonths),
        url: guides[t.type].links[0].url,
        status: t.status,
      }));
  },
};
