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
