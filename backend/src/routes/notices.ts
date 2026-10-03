import { Router } from "express";
import { CATEGORIES, fetchNoticeBody, fetchNoticeList, type RawNotice } from "../notices/crawler.js";
import type { Notice, NoticesResponse, NoticeTone } from "../types.js";

const CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;
const BODY_CONCURRENCY = 4;
const SNIPPET_LEN = 70;

const RED = /마감|필수|중요|비자|체류|외국인|유학생|등록금|보험/;

const cache = new Map<string, { at: number; data: NoticesResponse }>();
const inflight = new Map<string, Promise<NoticesResponse>>();

/** "2026.10.02" -> "2026. 10. 02" */
function formatDate(raw: string): string {
  const m = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(raw);
  return m ? `${m[1]}. ${m[2].padStart(2, "0")}. ${m[3].padStart(2, "0")}` : raw;
}

function toneOf(title: string, category: string): NoticeTone {
  if (RED.test(title)) return "red";
  return category === "학사" || category === "장학" ? "blue" : "green";
}

function snippet(body: string): string {
  const line = body.replace(/[​﻿]/g, "").replace(/\s*\|\s*/g, " ").replace(/\s+/g, " ").trim();
  if (!line) return "이미지·첨부파일로 된 공지입니다. 원문에서 확인하세요.";
  return line.length > SNIPPET_LEN ? `${line.slice(0, SNIPPET_LEN).trimEnd()}…` : line;
}

/** 최대 `limit`개씩 동시에 실행 */
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function enrich(raw: RawNotice): Promise<Notice> {
  let text = "";
  let date = raw.date;
  let dept = raw.dept;
  try {
    const detail = await fetchNoticeBody(raw.url);
    text = detail.body;
    date ||= detail.date; // 상단 고정 공지는 목록에 날짜·부서가 없다
    dept ||= detail.dept;
  } catch (err) {
    console.warn(`[notices] body fetch failed ${raw.url}:`, (err as Error).message);
  }
  return {
    id: raw.id,
    category: raw.category,
    tag: raw.tag.replace(/\s*공지$/, "") || raw.category,
    tone: toneOf(raw.title, raw.category),
    title: raw.title,
    date: formatDate(date),
    text: snippet(text),
    url: raw.url,
    dept,
    pinned: raw.pinned,
  };
}

async function fetchLive(category: string, limit: number): Promise<NoticesResponse> {
  const list = await fetchNoticeList(category, 1);
  // 고정 공지와 일반 공지를 합쳐 최신순(글 번호 내림차순)으로
  const seen = new Set<number>();
  const top = list
    .filter((n) => !seen.has(n.id) && seen.add(n.id))
    .sort((a, b) => b.id - a.id)
    .slice(0, limit);
  const items = await mapPool(top, BODY_CONCURRENCY, enrich);
  return { source: "live", fetchedAt: new Date().toISOString(), items };
}

const SAMPLE: Notice[] = [
  {
    id: 900008,
    category: "학사",
    tag: "학사",
    tone: "red",
    title: "2026학년도 2학기 외국인 유학생 체류기간 연장 신청 안내 (~10/17 마감)",
    date: "2026. 10. 02",
    text: "체류기간 만료 예정인 외국인 유학생은 국제교류팀에 서류를 제출하고 출입국 연장 신청을 완료해야…",
    url: "https://www.kookmin.ac.kr/user/kmuNews/notice/index.do",
    dept: "국제교류팀",
    pinned: true,
  },
  {
    id: 900007,
    category: "행정",
    tag: "국제학생",
    tone: "red",
    title: "외국인 유학생 국민건강보험 안내 및 상담 일정",
    date: "2026. 10. 01",
    text: "국민건강보험 가입, 보험료 납부와 체납 관련 상담을 국제관에서 진행합니다. 여권과 외국인등록증을 지참하세요.",
    url: "https://www.kookmin.ac.kr/user/kmuNews/notice/5/index.do",
    dept: "국제교류팀",
    pinned: true,
  },
  {
    id: 900006,
    category: "장학",
    tag: "장학",
    tone: "blue",
    title: "2026학년도 2학기 국가장학금 2차 신청 안내",
    date: "2026. 09. 29",
    text: "한국장학재단 홈페이지에서 2차 신청을 받습니다. 신청 기간 내 서류 제출 및 가구원 동의를 완료하세요.",
    url: "https://www.kookmin.ac.kr/user/kmuNews/notice/7/index.do",
    dept: "학생지원팀",
    pinned: false,
  },
  {
    id: 900005,
    category: "공모행사",
    tag: "공모·행사",
    tone: "green",
    title: "2026 외국인 유학생 한국문화 체험 참가자 모집",
    date: "2026. 09. 28",
    text: "서울 역사 탐방과 전통문화 체험 프로그램 참가자를 모집합니다. 선착순 30명이며 참가비는 무료입니다.",
    url: "https://www.kookmin.ac.kr/user/kmuNews/notice/9/index.do",
    dept: "국제교류팀",
    pinned: false,
  },
  {
    id: 900004,
    category: "학사",
    tag: "학사",
    tone: "blue",
    title: "2026학년도 2학기 수강철회 신청 안내",
    date: "2026. 09. 26",
    text: "수강철회를 희망하는 학생은 ON국민 포털에서 신청 기간과 대상 과목을 확인한 뒤 온라인으로 신청하세요.",
    url: "https://www.kookmin.ac.kr/user/kmuNews/notice/4/index.do",
    dept: "교무팀",
    pinned: false,
  },
  {
    id: 900003,
    category: "행정",
    tag: "행정",
    tone: "green",
    title: "2026학년도 2학기 재학생 학생증 발급 안내",
    date: "2026. 09. 25",
    text: "모바일 학생증 및 실물 학생증 발급 방법과 수령 장소를 안내합니다. 신청은 ON국민 포털에서 가능합니다.",
    url: "https://www.kookmin.ac.kr/user/kmuNews/notice/5/index.do",
    dept: "학생처",
    pinned: false,
  },
  {
    id: 900002,
    category: "공모행사",
    tag: "공모·행사",
    tone: "green",
    title: "글로벌 버디 프로그램 2학기 참가자 추가 모집",
    date: "2026. 09. 23",
    text: "한국인 재학생과 외국인 유학생이 한 팀이 되어 언어와 문화를 교류하는 글로벌 버디 프로그램 참가자를 모집합니다.",
    url: "https://www.kookmin.ac.kr/user/kmuNews/notice/9/index.do",
    dept: "국제교류팀",
    pinned: false,
  },
  {
    id: 900001,
    category: "장학",
    tag: "장학",
    tone: "blue",
    title: "외국인 성적우수 장학금 제출 서류 안내",
    date: "2026. 09. 21",
    text: "장학금 신청 대상과 성적 기준, 제출 서류를 확인하고 기한 내 국제교류팀으로 제출해 주세요.",
    url: "https://www.kookmin.ac.kr/user/kmuNews/notice/7/index.do",
    dept: "국제교류팀",
    pinned: false,
  },
];

export async function getNotices(category: string, limit: number): Promise<NoticesResponse> {
  const key = `${category}:${limit}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return { ...hit.data, source: "cache" };

  let pending = inflight.get(key);
  if (!pending) {
    pending = fetchLive(category, limit).finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  try {
    const data = await pending;
    if (data.items.length === 0) throw new Error("0 items parsed");
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch (err) {
    console.warn(`[notices] live fetch failed (${key}):`, (err as Error).message);
    if (hit) return { ...hit.data, source: "cache" };
    const items = SAMPLE.filter((n) => category === "전체" || n.category === category);
    return {
      source: "sample",
      fetchedAt: new Date().toISOString(),
      items: (items.length ? items : SAMPLE).slice(0, limit),
    };
  }
}

export const noticesRouter = Router();

noticesRouter.get("/", async (req, res) => {
  const rawCategory = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const category = Object.hasOwn(CATEGORIES, rawCategory) ? rawCategory : "전체";
  const n = Number.parseInt(String(req.query.limit ?? ""), 10);
  const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_LIMIT) : DEFAULT_LIMIT;
  res.json(await getNotices(category, limit));
});
