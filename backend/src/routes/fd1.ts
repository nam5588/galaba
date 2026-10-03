import { Router } from "express";
import { isIsoDate, todayInSeoul } from "../fd1/dates.js";
import { FD1_LANGS, getFd1Guides, isFd1Lang } from "../fd1/guides.js";
import { computeFd1Plan, parseProfile } from "../fd1/plan.js";

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
