// 오케스트레이터 도구 계약 (PRD 7장). FD 담당은 backend/src/tools/<도구이름>.ts 에서 ToolDef 하나를 export한다.
export interface ToolDef<I = any, O = unknown> {
  name: string; // 예: "get_deadlines"
  description: string; // LLM이 언제 이 도구를 쓸지 판단하는 설명
  inputSchema: object; // 입력 JSON Schema
  run: (input: I) => Promise<O | { error: string }>;
  /** (선택) 채팅 화면 도구 칩의 상세 문구. 예: input => `공지 확인: ${input.query}` */
  label?: (input: I) => string;
}
