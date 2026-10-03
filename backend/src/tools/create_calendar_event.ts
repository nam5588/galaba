// '대신 처리' 후보 ① (PRD 4장 P1, 10장 미결정): 답 속 기한을 구글 캘린더 일정 링크로 만든다.
import type { ToolDef } from "./types.js";

export interface CalendarAction {
  type: "calendar";
  title: string;
  date: string;
  url: string;
}

export function calendarUrl(title: string, date: string, details = ""): string {
  const start = date.replace(/-/g, "");
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replace(/-/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: `${details}\n\nDojang이 만든 일정`.trim(),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export const createCalendarEventTool: ToolDef<{ title: string; date: string; details?: string }, CalendarAction> = {
  name: "create_calendar_event",
  description:
    "학생의 구글 캘린더에 기한·일정을 추가하는 버튼을 만든다. 날짜가 분명한 중요한 마감(비자 만료, 납부 기한, 신청 마감)이 있을 때 1~2개만 쓴다.",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "일정 제목. 예: 'D-2 비자 연장 신청'" },
      date: { type: "string", description: "YYYY-MM-DD" },
      details: { type: "string", description: "메모(선택)" },
    },
    required: ["title", "date"],
    additionalProperties: false,
  },
  label: (input) => `캘린더 추가: ${input.title} (${input.date})`,
  async run({ title, date, details }) {
    if (!title?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) return { error: "title과 YYYY-MM-DD 형식의 date가 필요해요" };
    return { type: "calendar", title: title.trim(), date, url: calendarUrl(title.trim(), date, details) };
  },
};
