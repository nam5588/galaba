import { Router } from "express";

type ScheduleColor = "blue" | "green" | "yellow" | "red" | "purple";

export interface ScheduleTemplate {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  professor: string;
  room: string;
  color: ScheduleColor;
}

const schedule: ScheduleTemplate[] = [
  { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "10:15", courseCode: "CS301", courseName: "데이터 구조", professor: "김지훈", room: "공학관 301호", color: "blue" },
  { id: 2, dayOfWeek: 1, startTime: "13:00", endTime: "14:15", courseCode: "KOR201", courseName: "한국어 중급", professor: "박수진", room: "인문관 210호", color: "yellow" },
  { id: 3, dayOfWeek: 1, startTime: "16:00", endTime: "17:15", courseCode: "UNI101", courseName: "대학생활과 진로", professor: "정다은", room: "북악관 705호", color: "purple" },
  { id: 4, dayOfWeek: 2, startTime: "10:30", endTime: "11:45", courseCode: "CS302", courseName: "알고리즘", professor: "이서준", room: "공학관 402호", color: "green" },
  { id: 5, dayOfWeek: 2, startTime: "14:30", endTime: "15:45", courseCode: "CS305", courseName: "컴퓨터 네트워크", professor: "최유나", room: "공학관 303호", color: "red" },
  { id: 6, dayOfWeek: 3, startTime: "09:00", endTime: "10:15", courseCode: "CS301", courseName: "데이터 구조", professor: "김지훈", room: "공학관 301호", color: "blue" },
  { id: 7, dayOfWeek: 3, startTime: "13:00", endTime: "14:15", courseCode: "KOR201", courseName: "한국어 중급", professor: "박수진", room: "인문관 210호", color: "yellow" },
  { id: 8, dayOfWeek: 3, startTime: "15:00", endTime: "16:15", courseCode: "BUS210", courseName: "경영학 원론", professor: "오세훈", room: "경상관 401호", color: "green" },
  { id: 9, dayOfWeek: 4, startTime: "10:30", endTime: "11:45", courseCode: "CS302", courseName: "알고리즘", professor: "이서준", room: "공학관 402호", color: "green" },
  { id: 10, dayOfWeek: 4, startTime: "16:00", endTime: "17:15", courseCode: "CS399", courseName: "팀 프로젝트", professor: "한민준", room: "공학관 501호", color: "purple" },
  { id: 11, dayOfWeek: 5, startTime: "11:00", endTime: "12:15", courseCode: "KOR205", courseName: "한국 사회와 문화", professor: "윤서연", room: "인문관 305호", color: "yellow" },
  { id: 12, dayOfWeek: 5, startTime: "14:30", endTime: "15:45", courseCode: "CS305", courseName: "컴퓨터 네트워크", professor: "최유나", room: "공학관 303호", color: "red" },
];

/** 화면과 채팅이 같은 원본 시간표를 사용하도록 날짜별 수업을 돌려준다. */
export function getClassesForDate(date: string): ScheduleTemplate[] {
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  return schedule.filter((item) => item.dayOfWeek === dayOfWeek);
}

export const scheduleRouter = Router();

scheduleRouter.get("/", (req, res) => {
  const week = typeof req.query.week === "string" ? req.query.week : getMonday(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || Number.isNaN(Date.parse(`${week}T00:00:00Z`))) {
    res.status(400).json({ message: "week은 YYYY-MM-DD 형식이어야 합니다." });
    return;
  }

  const weekStart = new Date(`${week}T00:00:00Z`);
  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + index);
    const dayOfWeek = index + 1;
    const dateString = date.toISOString().slice(0, 10);
    return { dayOfWeek, date: dateString, classes: getClassesForDate(dateString) };
  });

  res.json({ weekStart: week, days });
});

function getMonday(date: Date) {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() - day + 1);
  return utcDate.toISOString().slice(0, 10);
}
