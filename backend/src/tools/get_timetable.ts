import { getClassesForDate } from "../routes/schedule.js";
import { addDays, todayKST, weekdayKo } from "./demo-user.js";
import type { ToolDef } from "./types.js";

export interface ClassItem {
  date: string;
  day: string;
  start: string;
  end: string;
  course: string;
  room: string;
  note?: string;
}

const HOLIDAYS: Record<string, string> = {
  "2026-10-03": "개천절",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
};

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export const getTimetableTool: ToolDef<{ date?: string }, ClassItem[]> = {
  name: "get_timetable",
  description:
    "데모 사용자의 수업 시간표. date(YYYY-MM-DD)를 주면 그날 수업, 없으면 오늘부터 7일간 수업을 돌려준다. 공휴일 휴강은 note에 적혀 있다.",
  inputSchema: {
    type: "object",
    properties: {
      date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "YYYY-MM-DD (선택)" },
    },
    additionalProperties: false,
  },
  label: (input) => (input.date ? `시간표 확인: ${input.date}` : "시간표 확인: 이번 주"),
  async run({ date }) {
    if (date && !isValidDate(date)) return { error: "date는 YYYY-MM-DD 형식이어야 해요" };

    const dates = date ? [date] : Array.from({ length: 7 }, (_, index) => addDays(todayKST(), index));
    return dates.flatMap((dateString) => {
      const day = weekdayKo(dateString);
      const holiday = HOLIDAYS[dateString];
      return getClassesForDate(dateString).map((item) => ({
        date: dateString,
        day,
        start: item.startTime,
        end: item.endTime,
        course: `${item.courseName} (${item.courseCode})`,
        room: item.room,
        ...(holiday ? { note: `${holiday} 휴강` } : {}),
      }));
    });
  },
};
