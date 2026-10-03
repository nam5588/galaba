// 도구 레지스트리 (PRD 7.1). 오케스트레이터는 여기 등록된 도구만 LLM에 보여준다.
// FD 담당 파일이 오면 아래 import를 `./get_deadlines.js` 같은 실제 파일로 바꾼다.
import { createCalendarEventTool } from "./create_calendar_event.js";
import { getNoticesTool, getTimetableExample, searchJobsExample } from "./examples.js";
import { getDeadlinesTool } from "./get_deadlines.js";
import { searchRegulationsTool } from "./search_regulations.js";
import type { ToolDef } from "./types.js";

export const TOOLS: ToolDef[] = [
  searchRegulationsTool, // 메인(김희경)
  getDeadlinesTool, // FD1 무하마드 — 실제 계산 (src/fd1)
  getNoticesTool, // FD2 요리 — 실제 공지 API
  getTimetableExample, // FD2 요리 — 예시 데이터
  searchJobsExample, // FD3 이신애 — 예시 데이터
  createCalendarEventTool, // '대신 처리' 후보 ①
];

export const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));
