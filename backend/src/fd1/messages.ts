// FD1 알림 문구 (카카오톡·사이트 알림 공통). 언어: ko / en / uz / ru

import type { Fd1Lang } from "../types.js";
import { getFd1Guides } from "./guides.js";
import type { Fd1Reminder } from "./reminders.js";

export interface Fd1Message {
  title: string;
  body: string;
}

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

const RU_DAY_MONTH = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
const RU_MONTH = new Intl.DateTimeFormat("ru-RU", { month: "long", timeZone: "UTC" });
const RU_PLURAL = new Intl.PluralRules("ru-RU");

/** "2026-11-15" → 11월 15일 / Nov 15 / 15-noyabr / 15 ноября */
export function formatDate(date: string, lang: Fd1Lang): string {
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  if (lang === "ko") return `${month}월 ${day}일`;
  if (lang === "en") return `${EN_MONTHS[month - 1]} ${day}`;
  if (lang === "ru") return RU_DAY_MONTH.format(new Date(Date.UTC(2000, month - 1, day)));
  return `${day}-${UZ_MONTHS[month - 1]}`;
}

/** "2026-09" → 9월 / September / sentabr / сентябрь */
function formatMonth(month: string, lang: Fd1Lang): string {
  const m = Number(month.slice(5, 7));
  if (lang === "ko") return `${m}월`;
  if (lang === "en") return new Date(Date.UTC(2000, m - 1, 1)).toLocaleString("en", { month: "long", timeZone: "UTC" });
  if (lang === "ru") return RU_MONTH.format(new Date(Date.UTC(2000, m - 1, 1)));
  return UZ_MONTHS[m - 1];
}

/** 러시아어 일수: "остался 1 день" / "осталось 3 дня" / "осталось 30 дней" */
function ruDaysLeft(n: number): string {
  const form = RU_PLURAL.select(n);
  if (form === "one") return `остался ${n} день`;
  return `осталось ${n} ${form === "few" ? "дня" : "дней"}`;
}

type Vars = { due: string; days: number; month: string };
type Template = Record<Fd1Lang, (v: Vars) => string>;

const COUNTDOWN: Template = {
  ko: (v) => `마감까지 ${v.days}일 남았어요 (${v.due}). 미리 준비하세요.`,
  en: (v) => `${v.days} days left until the deadline (${v.due}). Get ready early.`,
  uz: (v) => `Muddat tugashiga ${v.days} kun qoldi (${v.due}). Oldindan tayyorlaning.`,
  ru: (v) => `До крайнего срока ${ruDaysLeft(v.days)} (${v.due}). Подготовьтесь заранее.`,
};

const BODIES: Record<string, Template> = {
  "ARC_REGISTER:OPEN": {
    ko: (v) => `입국일로부터 90일 안에 외국인등록을 해야 해요. 마감: ${v.due}. 하이코리아 예약이 빨리 차니 지금 예약하세요.`,
    en: (v) => `You must register within 90 days of entry. Deadline: ${v.due}. HiKorea slots fill up fast, so book now.`,
    uz: (v) => `Kirgan kundan boshlab 90 kun ichida ro'yxatdan o'tishingiz kerak. Muddat: ${v.due}. HiKorea'da joylar tez tugaydi, hozir yoziling.`,
    ru: (v) => `Зарегистрироваться как иностранец нужно в течение 90 дней после въезда. Крайний срок: ${v.due}. Места на HiKorea быстро заканчиваются — запишитесь сейчас.`,
  },
  "ARC_EXTEND:OPEN": {
    ko: (v) => `오늘부터 체류기간 연장을 신청할 수 있어요. 만료일: ${v.due}.`,
    en: (v) => `You can now apply to extend your stay. Expiry date: ${v.due}.`,
    uz: (v) => `Bugundan yashash muddatini uzaytirishga ariza topshirishingiz mumkin. Tugash sanasi: ${v.due}.`,
    ru: (v) => `С сегодняшнего дня можно подать заявление на продление срока пребывания. Срок пребывания истекает: ${v.due}.`,
  },
  "ADDRESS_CHANGE:OPEN": {
    ko: (v) => `이사하셨네요. ${v.due}까지 체류지 변경 신고를 하고, 건강보험 주소도 확인하세요.`,
    en: (v) => `You moved. Report your new address by ${v.due} and check your health insurance address too.`,
    uz: (v) => `Siz ko'chdingiz. ${v.due}gacha yangi manzilni xabar qiling va tibbiy sug'urtadagi manzilni ham tekshiring.`,
    ru: (v) => `Вы переехали. До ${v.due} сообщите о новом адресе и проверьте адрес в медицинской страховке.`,
  },
  "ARC_REGISTER:OVERDUE": {
    ko: (v) => `외국인등록 마감(${v.due})이 지났어요. 과태료 대상이 될 수 있으니 바로 1345에 문의하세요.`,
    en: (v) => `The registration deadline (${v.due}) has passed. You may be fined. Call 1345 right away.`,
    uz: (v) => `Ro'yxatdan o'tish muddati (${v.due}) o'tib ketdi. Jarima solinishi mumkin, darhol 1345 ga qo'ng'iroq qiling.`,
    ru: (v) => `Срок регистрации иностранца (${v.due}) истёк. Вам может грозить штраф — срочно позвоните в 1345.`,
  },
  "ARC_EXTEND:OVERDUE": {
    ko: (v) => `체류기간(${v.due})이 지났어요. 불법 체류가 될 수 있으니 바로 1345나 출입국에 문의하세요.`,
    en: (v) => `Your period of stay ended on ${v.due}. You may be staying illegally. Contact 1345 or immigration right away.`,
    uz: (v) => `Yashash muddatingiz ${v.due} da tugagan. Noqonuniy yashayotgan hisoblanishingiz mumkin, darhol 1345 yoki migratsiya idorasiga murojaat qiling.`,
    ru: (v) => `Срок вашего пребывания истёк ${v.due}. Ваше пребывание может считаться незаконным — срочно обратитесь в 1345 или в иммиграционную службу.`,
  },
  "ADDRESS_CHANGE:OVERDUE": {
    ko: (v) => `체류지 변경 신고 마감(${v.due})이 지났어요. 범칙금 대상이 될 수 있으니 바로 신고하세요.`,
    en: (v) => `The address report deadline (${v.due}) has passed. You may be fined, so report it now.`,
    uz: (v) => `Manzilni xabar qilish muddati (${v.due}) o'tib ketdi. Jarima solinishi mumkin, darhol xabar qiling.`,
    ru: (v) => `Срок уведомления о смене адреса (${v.due}) истёк. Может быть наложен штраф — подайте уведомление немедленно.`,
  },
  "NHIS_PAY:PAY_SOON": {
    ko: (v) => `${v.month} 건강보험료 납부 마감이 ${v.due}이에요. 내셨다면 앱에서 '납부했어요'를 눌러 주세요.`,
    en: (v) => `Your ${v.month} health insurance payment is due ${v.due}. If you paid, tap "I paid" in the app.`,
    uz: (v) => `${v.month} oyi uchun tibbiy sug'urta to'lovi muddati ${v.due}. To'lagan bo'lsangiz, ilovada "To'ladim" tugmasini bosing.`,
    ru: (v) => `Срок оплаты медицинской страховки за ${v.month} — ${v.due}. Если вы уже оплатили, нажмите «Я оплатил(а)» в приложении.`,
  },
  "NHIS_PAY:PAY_DUE": {
    ko: (v) => `오늘(${v.due})이 ${v.month} 건강보험료 납부 마감일이에요.`,
    en: (v) => `Today (${v.due}) is the deadline for your ${v.month} health insurance payment.`,
    uz: (v) => `Bugun (${v.due}) ${v.month} oyi tibbiy sug'urta to'lovining oxirgi kuni.`,
    ru: (v) => `Сегодня (${v.due}) последний день оплаты медицинской страховки за ${v.month}.`,
  },
  "NHIS_PAY:BENEFIT_RESTRICTED": {
    ko: (v) => `${v.month} 건강보험료가 미납이에요. 오늘부터 병원 혜택이 제한되고 체류기간 연장에 불이익이 있을 수 있어요. 바로 납부하세요.`,
    en: (v) => `Your ${v.month} health insurance payment is unpaid. Hospital benefits are restricted from today and your visa extension may be affected. Pay now.`,
    uz: (v) => `${v.month} oyi tibbiy sug'urtasi to'lanmagan. Bugundan kasalxona imtiyozlari cheklanadi va viza uzaytirishda muammo bo'lishi mumkin. Darhol to'lang.`,
    ru: (v) => `Медицинская страховка за ${v.month} не оплачена. С сегодняшнего дня страховое покрытие лечения ограничено, а при продлении срока пребывания могут возникнуть проблемы. Оплатите как можно скорее.`,
  },
};

const DUE_TOMORROW: Template = {
  ko: (v) => `내일(${v.due})이 마감이에요!`,
  en: (v) => `The deadline is tomorrow (${v.due})!`,
  uz: (v) => `Muddat ertaga (${v.due}) tugaydi!`,
  ru: (v) => `Срок истекает завтра (${v.due})!`,
};

export function renderReminder(reminder: Fd1Reminder, lang: Fd1Lang): Fd1Message {
  const title = getFd1Guides(lang).guides[reminder.taskType].title;
  const vars: Vars = {
    due: formatDate(reminder.dueDate, lang),
    days: reminder.daysLeft,
    month: reminder.month ? formatMonth(reminder.month, lang) : "",
  };
  const specific = BODIES[`${reminder.taskType}:${reminder.milestone}`];
  const template = specific ?? (reminder.milestone === "D-1" ? DUE_TOMORROW : COUNTDOWN);
  return { title, body: template[lang](vars) };
}
