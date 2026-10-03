import { useCallback, useMemo, useSyncExternalStore } from "react";
import { api } from "@/lib/api";

// FD1 체류·건강보험 일정 (docs/PRD-FD1.md). 타입은 backend/src/types.ts의 FD1 부분과 같은 모양이다.

export type Fd1Lang = "ko" | "en" | "uz" | "ru";
export type VisaType = "D-2" | "D-4";
export type Fd1TaskType = "ARC_REGISTER" | "ARC_EXTEND" | "NHIS_PAY" | "ADDRESS_CHANGE";
export type Fd1TaskStatus = "UPCOMING" | "OPEN" | "OVERDUE";
export type Fd1Urgency = "red" | "yellow" | "blue";

export interface Fd1Profile {
  visaType: VisaType;
  entryDate: string;
  arcIssuedDate?: string;
  stayExpiryDate?: string;
  moveDate?: string;
  paidMonths?: string[];
}

export interface Fd1Task {
  type: Fd1TaskType;
  dueDate: string;
  openDate?: string;
  daysLeft: number;
  status: Fd1TaskStatus;
  urgency: Fd1Urgency;
}

export interface Fd1InsuranceMonth {
  month: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  overdue: boolean;
}

export interface Fd1Insurance {
  enrolled: boolean;
  startDate?: string;
  monthsEnrolled: number;
  monthlyFee: number;
  totalDue: number;
  paidTotal: number;
  unpaidMonths: number;
  benefitRestricted: boolean;
  nextDueDate?: string;
  months: Fd1InsuranceMonth[];
}

export interface Fd1Plan {
  today: string;
  profile: Fd1Profile;
  tasks: Fd1Task[];
  insurance: Fd1Insurance;
  rulesVerified: boolean;
}

export interface Fd1Guide {
  title: string;
  summary: string;
  checklist: { id: string; text: string }[];
  links: { label: string; url: string }[];
}

export interface Fd1Guides {
  lang: Fd1Lang;
  guides: Record<Fd1TaskType, Fd1Guide>;
  disclaimer: string;
  sources: { label: string; url: string }[];
}

export interface Fd1ReminderItem {
  key: string;
  taskType: Fd1TaskType;
  milestone: string;
  dueDate: string;
  daysLeft: number;
  month?: string;
  title: string;
  body: string;
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const fetchDemoProfile = () => api<Fd1Profile>("/api/fd1/demo-profile");
export const fetchPlan = (profile: Fd1Profile, today?: string) => api<Fd1Plan>("/api/fd1/plan", post({ ...profile, today }));
export const fetchGuides = (lang: Fd1Lang) => api<Fd1Guides>(`/api/fd1/guides?lang=${lang}`);
export const fetchReminders = (profile: Fd1Profile, lang: Fd1Lang, today?: string) =>
  api<{ today: string; lang: Fd1Lang; items: Fd1ReminderItem[] }>("/api/fd1/reminders", post({ ...profile, lang, today }));

// ---------- 브라우저 저장 (DB 연결 전까지) ----------
// useSyncExternalStore로 읽어서 서버 렌더(값 없음)와 브라우저 값이 어긋나지 않게 한다.
// 사생활 모드 등에서 localStorage가 막혀 있어도 화면은 기본값으로 동작한다.

const CHANGE_EVENT = "fd1-storage";

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // 저장이 막혀 있으면 이번 화면에서만 유지되지 않는다 (기능은 계속 동작)
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

/** localStorage의 JSON 값. 서버 렌더와 첫 렌더에서는 null */
export function useStored<T>(key: string): [T | null, (value: T | null) => void] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null);
  // 같은 문자열이면 같은 객체를 돌려줘서 effect가 다시 돌지 않게 한다
  const value = useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, [raw]);
  const set = useCallback((next: T | null) => writeRaw(key, next === null ? null : JSON.stringify(next)), [key]);
  return [value, set];
}

export const STORAGE_KEYS = {
  profile: "fd1.profile",
  lang: "fd1.lang",
  readReminders: "fd1.readReminders",
  /** 데모용 오늘 날짜 (?today=YYYY-MM-DD 로 설정, ?today= 로 해제) */
  demoToday: "fd1.demoToday",
};

// ---------- 화면 문구 (FD1-5) ----------

export const LANG_LABEL: Record<Fd1Lang, string> = { ko: "한국어", en: "English", uz: "O'zbekcha", ru: "Русский" };

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
const KO_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const RU_SHORT_DATE = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-11-15" → 11.15 (일) / Nov 15 / 15-noy / 15 нояб. */
export function shortDate(date: string, lang: Fd1Lang): string {
  const m = Number(date.slice(5, 7));
  const d = Number(date.slice(8, 10));
  if (lang === "ko") {
    const wd = KO_WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
    return `${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${wd})`;
  }
  if (lang === "en") return `${EN_MONTHS[m - 1]} ${d}`;
  if (lang === "ru") return RU_SHORT_DATE.format(new Date(`${date}T00:00:00Z`));
  return `${d}-${UZ_MONTHS[m - 1]}`;
}

/** D-43 / D-Day / D+3 */
export function dDayLabel(daysLeft: number): string {
  if (daysLeft === 0) return "D-Day";
  return daysLeft > 0 ? `D-${daysLeft}` : `D+${-daysLeft}`;
}

export function won(amount: number, lang: Fd1Lang): string {
  if (lang === "ru") return `${amount.toLocaleString("ru-RU")} ₩`;
  const n = amount.toLocaleString("ko-KR");
  return lang === "ko" ? `${n}원` : `₩${n}`;
}

type Dict = Record<string, Record<Fd1Lang, string>>;

export const T = {
  visaStay: { ko: "비자 & 체류", en: "Visa & stay", uz: "Viza va yashash", ru: "Виза и пребывание" },
  visaStayDesc: {
    ko: "외국인등록·체류기간 연장·체류지 변경 마감을 자동으로 계산해요.",
    en: "Registration, extension and address-change deadlines, calculated for you.",
    uz: "Ro'yxatdan o'tish, muddatni uzaytirish va manzil o'zgarishi muddatlari avtomatik hisoblanadi.",
    ru: "Сроки регистрации, продления пребывания и смены адреса рассчитываются автоматически.",
  },
  insuranceDesc: {
    ko: "가입 기간, 납부 내역, 다음 납부일을 한눈에 확인하세요.",
    en: "Coverage, payment history and your next due date at a glance.",
    uz: "Sug'urta muddati, to'lovlar tarixi va keyingi to'lov sanasi bir joyda.",
    ru: "Период страхования, история платежей и дата следующего платежа — всё в одном месте.",
  },
  eyebrow: { ko: "체류·건강보험 필수 일정", en: "Stay & health insurance", uz: "Yashash va sug'urta muddatlari", ru: "Пребывание и медстраховка" },
  insurance: { ko: "건강보험", en: "Health insurance", uz: "Tibbiy sug'urta", ru: "Медицинская страховка" },
  myInfo: { ko: "내 정보", en: "My info", uz: "Ma'lumotlarim", ru: "Мои данные" },
  editInfo: { ko: "정보 수정", en: "Edit", uz: "Tahrirlash", ru: "Изменить" },
  demoNote: {
    ko: "데모 사용자 정보로 보여주고 있어요. 내 날짜를 넣으면 내 일정으로 바뀝니다.",
    en: "Showing the demo student. Enter your own dates to see your schedule.",
    uz: "Demo talaba ma'lumotlari ko'rsatilmoqda. O'z sanalaringizni kiriting, jadval sizniki bo'ladi.",
    ru: "Показаны данные демо-студента. Введите свои даты, чтобы увидеть своё расписание.",
  },
  visaType: { ko: "비자 종류", en: "Visa type", uz: "Viza turi", ru: "Тип визы" },
  entryDate: { ko: "입국일", en: "Entry date", uz: "Koreyaga kirgan sana", ru: "Дата въезда" },
  hasArc: { ko: "외국인등록증이 있어요", en: "I have an ARC", uz: "Menda ARC (ro'yxat kartasi) bor", ru: "У меня есть карта регистрации иностранца (ARC)" },
  arcIssuedDate: { ko: "외국인등록일", en: "ARC issue date", uz: "ARC berilgan sana", ru: "Дата выдачи ARC" },
  stayExpiryDate: { ko: "체류만료일", en: "Stay expiry date", uz: "Yashash muddati tugash sanasi", ru: "Дата окончания срока пребывания" },
  moveDate: { ko: "이사한 날 (선택)", en: "Moving date (optional)", uz: "Ko'chgan sana (ixtiyoriy)", ru: "Дата переезда (необязательно)" },
  save: { ko: "저장", en: "Save", uz: "Saqlash", ru: "Сохранить" },
  cancel: { ko: "취소", en: "Cancel", uz: "Bekor qilish", ru: "Отмена" },
  useDemo: { ko: "데모 사용자로 되돌리기", en: "Back to demo student", uz: "Demo talabaga qaytish", ru: "Вернуться к демо-студенту" },
  todo: { ko: "지금 해야 할 일", en: "To do now", uz: "Hozir qilish kerak", ru: "Нужно сделать сейчас" },
  noTasks: { ko: "지금 챙길 일정이 없어요.", en: "Nothing to do right now.", uz: "Hozircha bajariladigan ish yo'q.", ru: "Сейчас срочных дел нет." },
  checklist: { ko: "준비물", en: "Checklist", uz: "Kerakli hujjatlar", ru: "Что подготовить" },
  opensOn: { ko: "부터 신청 가능", en: "applications open", uz: "dan ariza topshirish mumkin", ru: "— открывается приём заявлений" },
  overdue: { ko: "마감 지남", en: "Overdue", uz: "Muddat o'tgan", ru: "Срок истёк" },
  monthsEnrolled: { ko: "가입 {n}개월째", en: "Month {n} of coverage", uz: "Sug'urtaning {n}-oyi", ru: "{n}-й месяц страхования" },
  paidTotal: { ko: "납부", en: "Paid", uz: "To'langan", ru: "Оплачено" },
  unpaid: { ko: "미납 {n}개월", en: "{n} unpaid", uz: "{n} oy to'lanmagan", ru: "Не оплачено: {n} мес." },
  unpaidLabel: { ko: "미납", en: "Unpaid", uz: "To'lanmagan", ru: "Не оплачено" },
  nextDue: { ko: "다음 납부", en: "Next payment", uz: "Keyingi to'lov", ru: "Следующий платёж" },
  notEnrolled: {
    ko: "외국인등록을 하면 그날 건강보험에 자동 가입돼요.",
    en: "You are enrolled in health insurance automatically on your registration date.",
    uz: "Ro'yxatdan o'tgan kuningiz tibbiy sug'urtaga avtomatik qo'shilasiz.",
    ru: "В день регистрации иностранца вы автоматически подключаетесь к медицинской страховке.",
  },
  benefitRestricted: {
    ko: "미납으로 병원 혜택이 제한된 상태예요. 바로 납부하세요.",
    en: "Hospital benefits are restricted because of unpaid fees. Pay now.",
    uz: "To'lanmagan oylar sababli kasalxona imtiyozlari cheklangan. Darhol to'lang.",
    ru: "Из-за неоплаты страховое покрытие лечения ограничено. Оплатите как можно скорее.",
  },
  markPaid: { ko: "납부했어요", en: "I paid", uz: "To'ladim", ru: "Я оплатил(а)" },
  paid: { ko: "납부 완료", en: "Paid", uz: "To'langan", ru: "Оплачено" },
  notifications: { ko: "알림", en: "Notifications", uz: "Bildirishnomalar", ru: "Уведомления" },
  noNotifications: { ko: "새 알림이 없어요.", en: "No new notifications.", uz: "Yangi bildirishnoma yo'q.", ru: "Новых уведомлений нет." },
  markAllRead: { ko: "모두 읽음", en: "Mark all read", uz: "Hammasini o'qildi qilish", ru: "Прочитать все" },
  rulesUnverified: {
    ko: "D-4 비자 규칙은 아직 확인 중이에요. D-2 기준으로 계산했어요.",
    en: "D-4 rules are still being verified. Calculated with D-2 rules.",
    uz: "D-4 viza qoidalari hali tekshirilmoqda. Hisob D-2 qoidalari bo'yicha qilindi.",
    ru: "Правила для визы D-4 ещё уточняются. Расчёт выполнен по правилам D-2.",
  },
  loadError: {
    ko: "일정을 불러오지 못했어요. 백엔드가 켜져 있는지 확인해주세요.",
    en: "Couldn't load your schedule. Check that the backend is running.",
    uz: "Jadvalni yuklab bo'lmadi. Backend ishlayotganini tekshiring.",
    ru: "Не удалось загрузить расписание. Проверьте, запущен ли бэкенд.",
  },
  loading: { ko: "불러오는 중…", en: "Loading…", uz: "Yuklanmoqda…", ru: "Загрузка…" },
  demoDate: { ko: "데모 날짜: {date} 기준으로 계산 중", en: "Demo date: calculating as of {date}", uz: "Demo sana: {date} holatiga hisoblanmoqda", ru: "Демо-дата: расчёт на {date}" },
  backToToday: { ko: "오늘로 돌아가기", en: "Back to today", uz: "Bugunga qaytish", ru: "Вернуться к сегодняшнему дню" },
  done: { ko: "완료했어요", en: "Done", uz: "Bajarildi", ru: "Готово" },
  doneArcHint: {
    ko: "외국인등록을 마쳤나요? 등록일과 체류만료일을 넣으면 다음 일정(건강보험·연장)이 만들어져요.",
    en: "Registered? Enter the dates to create your next steps (insurance, extension).",
    uz: "Ro'yxatdan o'tdingizmi? Sanalarni kiriting — keyingi bosqichlar (sug'urta, uzaytirish) yaratiladi.",
    ru: "Зарегистрировались? Введите даты — появятся следующие шаги (страховка, продление).",
  },
  doneExtendHint: {
    ko: "연장을 마쳤나요? 새 체류만료일을 넣으면 다음 연장 일정이 만들어져요.",
    en: "Extended? Enter your new expiry date to schedule the next extension.",
    uz: "Uzaytirdingizmi? Yangi tugash sanasini kiriting — keyingi uzaytirish rejalashtiriladi.",
    ru: "Продлили? Введите новую дату окончания срока — запланируем следующее продление.",
  },
  newExpiry: { ko: "새 체류만료일", en: "New expiry date", uz: "Yangi tugash sanasi", ru: "Новая дата окончания срока" },
  moved: { ko: "이사했어요", en: "I moved", uz: "Ko'chdim", ru: "Я переехал(а)" },
  movedDone: {
    ko: "이사일을 {date}로 저장했어요. 14일 안에 체류지 변경 신고를 하세요.",
    en: "Moving date saved as {date}. Report your new address within 14 days.",
    uz: "Ko'chish sanasi {date} deb saqlandi. 14 kun ichida yangi manzilni xabar qiling.",
    ru: "Дата переезда сохранена: {date}. Сообщите о новом адресе в течение 14 дней.",
  },
} satisfies Dict;

export function t(key: keyof typeof T, lang: Fd1Lang, vars?: Record<string, string | number>): string {
  let text = T[key][lang];
  for (const [k, v] of Object.entries(vars ?? {})) text = text.replace(`{${k}}`, String(v));
  return text;
}

/** 알림을 누르면 열 화면 */
export function routeOfTask(type: Fd1TaskType): "/visa" | "/insurance" {
  return type === "NHIS_PAY" ? "/insurance" : "/visa";
}

/** 브라우저에서 한국 시간 기준 오늘 */
export function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}
