import { Router } from "express";
import { isIsoDate, todayInSeoul } from "../fd1/dates.js";
import { FD1_LANGS, getFd1Guides, isFd1Lang } from "../fd1/guides.js";
import { renderReminder } from "../fd1/messages.js";
import { computeFd1Plan, parseProfile } from "../fd1/plan.js";
import { remindersFor } from "../fd1/reminders.js";
import { demoProfile } from "../tools/get_deadlines.js";

export const fd1Router = Router();

/**
 * POST /api/fd1/plan
 * body: { visaType, entryDate, arcIssuedDate?, stayExpiryDate?, today? }
 * `today`는 데모·테스트용 (없으면 한국 시간 오늘)
 */

fd1Router.post("/plan", (req, res) => {
  const parsed = parseProfile(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const today = isIsoDate(req.body.today) ? req.body.today : todayInSeoul();
  res.json(computeFd1Plan(parsed.profile, today));
});

/**
 * GET /api/fd1/guides?lang=ko|en|uz
 * 작업별 설명·서류 체크리스트·신청 링크 (기본 ko)
 */
fd1Router.get("/guides", (req, res) => {
  const lang = req.query.lang ?? "ko";
  if (!isFd1Lang(lang)) {
    res.status(400).json({ error: `lang은 ${FD1_LANGS.join(", ")} 중 하나여야 합니다.` });
    return;
  }
  res.json(getFd1Guides(lang));
});

/**
 * POST /api/fd1/reminders
 * body: /plan과 같은 profile + { lang?: "ko"|"en"|"uz", today? }
 * 오늘 보여줄 알림 (사이트 알림 벨). 읽음 처리는 DB 연결 전까지 프론트가 `key`로 보관한다.
 */
fd1Router.post("/reminders", (req, res) => {
  const parsed = parseProfile(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const lang = req.body.lang ?? "ko";
  if (!isFd1Lang(lang)) {
    res.status(400).json({ error: `lang은 ${FD1_LANGS.join(", ")} 중 하나여야 합니다.` });
    return;
  }
  const today = isIsoDate(req.body.today) ? req.body.today : todayInSeoul();
  const items = remindersFor(parsed.profile, today).map((r) => ({ ...r, ...renderReminder(r, lang) }));
  res.json({ today, lang, items });
});

/**
 * GET /api/fd1/demo-profile
 * 데모 사용자(data/demo-user.json)의 FD1 입력. 채팅(get_deadlines)과 같은 사람을 화면에도 보여주기 위함.
 */
fd1Router.get("/demo-profile", (_req, res) => {
  res.json(demoProfile());
});
