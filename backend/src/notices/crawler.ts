// 국민대 공지사항 크롤러 (kmu_notice_crawler.py 의 TypeScript 포팅).
// ON국민 포털 공지는 공개 홈페이지(www.kookmin.ac.kr) 게시판에 그대로 게시되므로 로그인 없이 수집한다.
import * as cheerio from "cheerio";

export const BASE = "https://www.kookmin.ac.kr";

export const CATEGORIES: Record<string, string> = {
  전체: "",
  대학원입학: "3",
  학사: "4",
  행정: "5",
  특강: "6",
  장학: "7",
  사회봉사: "8",
  공모행사: "9",
  교내채용: "10",
  교외채용: "11",
  시스템: "16",
  교원채용: "17",
};

const CODE_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORIES)
    .filter(([, code]) => code)
    .map(([name, code]) => [code, name]),
);

const USER_AGENT = "Mozilla/5.0 (KMU notice crawler for personal use)";
const TIMEOUT_MS = 8_000; // 시연 중 사이트가 멈춰도 8초 안에 샘플/캐시로 넘어가도록

export interface RawNotice {
  id: number;
  category: string;
  tag: string;
  pinned: boolean;
  title: string;
  /** 목록 원본 표기 "2026.10.02" (상단 고정 공지는 빈 문자열) */
  date: string;
  dept: string;
  url: string;
}

export interface NoticeDetail {
  body: string;
  date: string;
  dept: string;
}

async function get(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

export function listUrl(category: string, page = 1): string {
  const code = CATEGORIES[category] ?? "";
  const path = code ? `/user/kmuNews/notice/${code}/index.do` : "/user/kmuNews/notice/index.do";
  return `${BASE}${path}?currentPageNo=${page}`;
}

export function parseList(html: string): RawNotice[] {
  const $ = cheerio.load(html);
  const items: RawNotice[] = [];
  $("div.board_list li > a[href*='/view.do']").each((_, el) => {
    const a = $(el);
    const m = /\/notice\/(\d+)\/(\d+)\/view\.do/.exec(a.attr("href") ?? "");
    if (!m) return;
    const etc = a
      .find("div.board_etc > span")
      .map((_, s) => $(s).text().trim())
      .get();
    const tag = a.find("span.ctg_name").first().text().trim();
    items.push({
      id: Number(m[2]),
      // 탭에 없는 게시판(예: 14 = 졸준위)은 숫자 코드 대신 목록의 분류명을 쓴다
      category: CODE_TO_CATEGORY[m[1]] ?? (tag.replace(/\s*공지$/, "") || m[1]),
      tag,
      pinned: a.parent().hasClass("notice"), // 상단 고정 공지는 목록에 제목만 나온다
      title: a.find("p.title").first().text().trim(),
      date: etc[0] ?? "",
      dept: etc[1] ?? "",
      url: `${BASE}/user/kmuNews/notice/${m[1]}/${m[2]}/view.do`,
    });
  });
  return items;
}

export async function fetchNoticeList(category: string, page = 1): Promise<RawNotice[]> {
  return parseList(await get(listUrl(category, page)));
}

// 한글(HWP)에서 붙여넣은 본문은 글자 조각마다 <span>이 나뉘어 있어,
// 블록 요소 단위로만 줄을 바꾸고 표 셀은 " | "로 잇는다.
function htmlToText(node: ReturnType<cheerio.CheerioAPI>): string {
  node.find("br").replaceWith("\n");
  node.find("td, th").append(" | ");
  node.find("p, div, li, tr, h1, h2, h3, h4, h5, h6").append("\n");
  return node
    .text()
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t ]+/g, " ").trim().replace(/^[ |]+|[ |]+$/g, ""))
    .filter(Boolean)
    .join("\n");
}

export async function fetchNoticeBody(url: string): Promise<NoticeDetail> {
  const $ = cheerio.load(await get(url));

  // 상세 페이지 메타: "작성일 2026.10.02", "담당부서 교무팀", ...
  const meta: Record<string, string> = {};
  $("div.view_top div.board_etc > span").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const i = text.indexOf(" ");
    if (i > 0) meta[text.slice(0, i)] = text.slice(i + 1);
  });

  const body = $("div.view_inner").first();
  return {
    body: body.length ? htmlToText(body) : "",
    date: meta["작성일"] ?? "",
    dept: meta["담당부서"] ?? "",
  };
}
