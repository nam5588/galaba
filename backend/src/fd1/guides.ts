// FD1 작업별 안내(체크리스트·링크)와 다국어 문구 (FD1-5).
// 알림(7단계)도 백엔드에서 보내므로 문구는 백엔드에 둔다.
// 서류 목록은 학교·출입국 공지 기준의 일반적인 항목이다. 국민대 국제처 확인 후 갱신한다(docs/PRD-FD1.md "확인 필요").

import type { Fd1Guide, Fd1GuidesResponse, Fd1Lang, Fd1TaskType } from "../types.js";

export const FD1_LANGS: Fd1Lang[] = ["ko", "en", "uz", "ru"];

const LINKS = {
  hikorea: "https://www.hikorea.go.kr",
  nhis: "https://www.nhis.or.kr",
  call1345: "tel:1345",
};

type Text = Record<Fd1Lang, string>;

interface GuideSource {
  title: Text;
  summary: Text;
  checklist: { id: string; text: Text }[];
  links: { label: Text; url: string }[];
}

const hikoreaLink = { label: { ko: "하이코리아 방문 예약", en: "HiKorea visit reservation", uz: "HiKorea'da navbatga yozilish", ru: "Запись на приём через HiKorea" }, url: LINKS.hikorea };
const call1345Link = { label: { ko: "외국인종합안내센터 1345", en: "Immigration Contact Center 1345", uz: "Chet elliklar uchun ma'lumot markazi 1345", ru: "Справочный центр для иностранцев 1345" }, url: LINKS.call1345 };
const nhisLink = { label: { ko: "국민건강보험공단", en: "National Health Insurance Service", uz: "Milliy tibbiy sug'urta xizmati (NHIS)", ru: "Служба национального медицинского страхования (NHIS)" }, url: LINKS.nhis };

const GUIDES: Record<Fd1TaskType, GuideSource> = {
  ARC_REGISTER: {
    title: { ko: "외국인등록", en: "Alien registration (ARC)", uz: "Chet ellik sifatida ro'yxatdan o'tish (ARC)", ru: "Регистрация иностранца (ARC)" },
    summary: {
      ko: "입국일로부터 90일 안에 출입국·외국인관서를 방문해 등록해야 합니다. 지문과 사진을 등록하며, 기한을 넘기면 과태료 대상입니다.",
      en: "You must register at the immigration office within 90 days of entry. Fingerprints and a photo are taken. Missing the deadline can result in a fine.",
      uz: "Koreyaga kirgan kundan boshlab 90 kun ichida migratsiya idorasiga borib ro'yxatdan o'tishingiz shart. Barmoq izi va surat olinadi. Muddat o'tkazib yuborilsa, jarima solinishi mumkin.",
      ru: "В течение 90 дней после въезда в Корею необходимо лично пройти регистрацию в иммиграционной службе. У вас снимут отпечатки пальцев и сделают фотографию. За пропуск срока может быть наложен штраф.",
    },
    checklist: [
      { id: "reservation", text: { ko: "하이코리아에서 방문 예약 (예약이 빨리 차니 미리)", en: "Book a visit on HiKorea (slots fill up fast)", uz: "HiKorea'da tashrifga yoziling (joylar tez to'lib qoladi)", ru: "Запишитесь на приём через HiKorea (свободные места быстро заканчиваются)" } },
      { id: "application", text: { ko: "통합신청서", en: "Integrated application form", uz: "Yagona ariza shakli", ru: "Единая форма заявления (통합신청서)" } },
      { id: "passport", text: { ko: "여권 원본", en: "Original passport", uz: "Pasport (asl nusxa)", ru: "Оригинал паспорта" } },
      { id: "photo", text: { ko: "증명사진 1매 (3.5×4.5cm)", en: "1 ID photo (3.5×4.5 cm)", uz: "1 dona hujjat surati (3,5×4,5 sm)", ru: "1 фотография на документы (3,5×4,5 см)" } },
      { id: "enrollment", text: { ko: "재학증명서 또는 표준입학허가서", en: "Certificate of enrollment or admission letter", uz: "O'qish joyidan ma'lumotnoma yoki qabul xati", ru: "Справка с места учёбы или письмо о зачислении" } },
      { id: "residence", text: { ko: "체류지 입증서류 (임대차계약서, 기숙사 거주확인서 등)", en: "Proof of residence (lease contract, dormitory certificate, etc.)", uz: "Yashash joyini tasdiqlovchi hujjat (ijara shartnomasi, yotoqxona ma'lumotnomasi va h.k.)", ru: "Документ, подтверждающий место проживания (договор аренды, справка о проживании в общежитии и т. п.)" } },
      { id: "fee", text: { ko: "수수료", en: "Application fee", uz: "Davlat boji", ru: "Госпошлина" } },
    ],
    links: [hikoreaLink, call1345Link],
  },
  ARC_EXTEND: {
    title: { ko: "체류기간 연장", en: "Extension of stay", uz: "Yashash muddatini uzaytirish", ru: "Продление срока пребывания" },
    summary: {
      ko: "체류만료일 4개월 전부터 신청할 수 있고, 만료일이 지나면 불법 체류가 됩니다. 재학생은 직전 학기 성적증명서가 발급된 뒤 신청합니다.",
      en: "You can apply from 4 months before your stay expires. After the expiry date you are staying illegally. Current students apply after the previous semester's transcript is issued.",
      uz: "Ariza yashash muddati tugashidan 4 oy oldin topshirilishi mumkin. Muddat o'tib ketsa, noqonuniy yashayotgan hisoblanasiz. Talabalar oldingi semestr baholari varaqasi berilgandan keyin ariza topshiradi.",
      ru: "Подать заявление можно не ранее чем за 4 месяца до окончания срока пребывания. Если срок истечёт, ваше пребывание станет незаконным. Студенты подают заявление после выдачи выписки с оценками за предыдущий семестр.",
    },
    checklist: [
      { id: "reservation", text: { ko: "하이코리아 방문 예약 또는 학교 국제처 일괄 신청 확인", en: "Book on HiKorea, or check if the international office applies for you", uz: "HiKorea'da navbatga yoziling yoki xalqaro bo'lim siz uchun ariza topshirishini aniqlang", ru: "Запишитесь на приём через HiKorea или уточните, не подаёт ли международный отдел университета заявление за вас" } },
      { id: "application", text: { ko: "통합신청서", en: "Integrated application form", uz: "Yagona ariza shakli", ru: "Единая форма заявления (통합신청서)" } },
      { id: "passport", text: { ko: "여권 원본", en: "Original passport", uz: "Pasport (asl nusxa)", ru: "Оригинал паспорта" } },
      { id: "arc", text: { ko: "외국인등록증", en: "Alien registration card (ARC)", uz: "Chet ellik ro'yxat kartasi (ARC)", ru: "Карта регистрации иностранца (ARC)" } },
      { id: "enrollment", text: { ko: "재학증명서", en: "Certificate of enrollment", uz: "O'qish joyidan ma'lumotnoma", ru: "Справка с места учёбы" } },
      { id: "transcript", text: { ko: "직전 학기 성적증명서", en: "Transcript of the previous semester", uz: "Oldingi semestr baholari varaqasi", ru: "Выписка с оценками за предыдущий семестр" } },
      { id: "residence", text: { ko: "체류지 입증서류", en: "Proof of residence", uz: "Yashash joyini tasdiqlovchi hujjat", ru: "Документ, подтверждающий место проживания" } },
      { id: "insurance", text: { ko: "건강보험료 체납 없음 확인 (체납 시 연장 기간이 제한될 수 있음)", en: "Make sure there are no unpaid health insurance fees (unpaid fees can shorten your extension)", uz: "Tibbiy sug'urta bo'yicha qarz yo'qligini tekshiring (qarz bo'lsa, uzaytirish muddati qisqarishi mumkin)", ru: "Убедитесь, что у вас нет задолженности по медицинской страховке (при долге срок продления могут сократить)" } },
      { id: "fee", text: { ko: "수수료", en: "Application fee", uz: "Davlat boji", ru: "Госпошлина" } },
    ],
    links: [hikoreaLink, call1345Link],
  },
  NHIS_PAY: {
    title: { ko: "건강보험료 납부", en: "Health insurance payment", uz: "Tibbiy sug'urta to'lovi", ru: "Оплата медицинской страховки" },
    summary: {
      ko: "D-2 유학생은 외국인등록일에 국민건강보험에 자동 가입되며, 보험료는 매월 25일까지 냅니다. 미납이면 다음 달 1일부터 병원 혜택이 제한되고 체류기간 연장에 불이익이 있습니다.",
      en: "D-2 students are enrolled in National Health Insurance automatically on their registration date. Pay by the 25th of every month. If unpaid, hospital benefits are restricted from the 1st of the next month and your visa extension can be affected.",
      uz: "D-2 talabalar ro'yxatdan o'tgan kunidan boshlab Milliy tibbiy sug'urtaga avtomatik qo'shiladi. To'lov har oyning 25-sanasigacha amalga oshiriladi. To'lanmasa, keyingi oyning 1-sanasidan kasalxona imtiyozlari cheklanadi va viza uzaytirishda muammo bo'lishi mumkin.",
      ru: "Студенты с визой D-2 автоматически подключаются к Национальному медицинскому страхованию (NHIS) в день регистрации иностранца. Взнос нужно оплачивать до 25-го числа каждого месяца. При неоплате с 1-го числа следующего месяца ограничивается страховое покрытие лечения, а при продлении срока пребывания могут возникнуть проблемы.",
    },
    checklist: [
      { id: "bill", text: { ko: "이번 달 고지서(금액·가상계좌) 확인", en: "Check this month's bill (amount and virtual account)", uz: "Shu oygi hisobni tekshiring (summa va virtual hisob raqami)", ru: "Проверьте квитанцию за этот месяц (сумма и виртуальный счёт для оплаты)" } },
      { id: "pay", text: { ko: "25일까지 납부", en: "Pay by the 25th", uz: "25-sanagacha to'lang", ru: "Оплатите до 25-го числа" } },
      { id: "check", text: { ko: "앱에서 '납부했어요' 체크", en: "Tap \"I paid\" in the app", uz: "Ilovada \"To'ladim\" tugmasini bosing", ru: "Нажмите «Я оплатил(а)» в приложении" } },
    ],
    links: [nhisLink],
  },
  ADDRESS_CHANGE: {
    title: { ko: "체류지 변경 신고", en: "Change of address report", uz: "Yashash manzili o'zgarganini xabar qilish", ru: "Уведомление о смене адреса проживания" },
    summary: {
      ko: "이사한 날로부터 14일 안에 새 주소를 신고해야 하며, 늦으면 범칙금 대상입니다. 건강보험 주소도 함께 바뀌었는지 확인하세요.",
      en: "Report your new address within 14 days of moving, or you may be fined. Also check that your health insurance address was updated.",
      uz: "Ko'chgan kundan boshlab 14 kun ichida yangi manzilni xabar qilishingiz kerak, aks holda jarima solinishi mumkin. Tibbiy sug'urtadagi manzilingiz ham yangilanganini tekshiring.",
      ru: "О новом адресе нужно сообщить в течение 14 дней после переезда, иначе может быть наложен штраф. Также проверьте, обновился ли адрес в медицинской страховке.",
    },
    checklist: [
      { id: "report", text: { ko: "주민센터·출입국 방문 또는 하이코리아 온라인 신고", en: "Report at a community center or immigration office, or online on HiKorea", uz: "Mahalla markazi (주민센터) yoki migratsiya idorasida, yoxud HiKorea orqali onlayn xabar qiling", ru: "Подайте уведомление в местном центре обслуживания населения (주민센터), в иммиграционной службе или онлайн через HiKorea" } },
      { id: "arc", text: { ko: "외국인등록증", en: "Alien registration card (ARC)", uz: "Chet ellik ro'yxat kartasi (ARC)", ru: "Карта регистрации иностранца (ARC)" } },
      { id: "residence", text: { ko: "새 체류지 입증서류 (임대차계약서 등)", en: "Proof of the new residence (lease contract, etc.)", uz: "Yangi yashash joyini tasdiqlovchi hujjat (ijara shartnomasi va h.k.)", ru: "Документ, подтверждающий новое место проживания (договор аренды и т. п.)" } },
      { id: "insurance", text: { ko: "건강보험 주소 변경 확인", en: "Check your health insurance address", uz: "Tibbiy sug'urtadagi manzilni tekshiring", ru: "Проверьте адрес в медицинской страховке" } },
    ],
    links: [hikoreaLink, nhisLink],
  },
};

const DISCLAIMER: Text = {
  ko: "이 안내는 참고용입니다. 최종 확인은 하이코리아 또는 1345(외국인종합안내센터)에서 하세요.",
  en: "This guide is for reference only. Always confirm with HiKorea or call 1345 (Immigration Contact Center).",
  uz: "Bu ma'lumot faqat yo'l-yo'riq uchun. Yakuniy ma'lumotni HiKorea yoki 1345 (chet elliklar uchun ma'lumot markazi) orqali tasdiqlang.",
  ru: "Эта информация носит справочный характер. Окончательно уточняйте на HiKorea или в Справочном центре для иностранцев 1345.",
};

const SOURCES = [
  { label: "아주대 국제처 (외국인등록)", url: "https://www.ajou.ac.kr/cie/admission/studentlife.do" },
  { label: "부산대 국제처 (연장·체류지 변경)", url: "https://international.pusan.ac.kr/international/70678/subview.do" },
  { label: "성신여대 (건강보험 가입·보험료)", url: "https://sungshin.ac.kr/bbs/main_eng/4941/152421/artclView.do" },
  { label: "인하대 국제처 (보험료 체납)", url: "https://internationalcenter.inha.ac.kr/bbs/internationalcenter/2507/146572/artclView.do" },
];

export function isFd1Lang(value: unknown): value is Fd1Lang {
  return FD1_LANGS.includes(value as Fd1Lang);
}

function localize(source: GuideSource, lang: Fd1Lang): Fd1Guide {
  return {
    title: source.title[lang],
    summary: source.summary[lang],
    checklist: source.checklist.map((item) => ({ id: item.id, text: item.text[lang] })),
    links: source.links.map((link) => ({ label: link.label[lang], url: link.url })),
  };
}

export function getFd1Guides(lang: Fd1Lang): Fd1GuidesResponse {
  const guides = Object.fromEntries(
    (Object.keys(GUIDES) as Fd1TaskType[]).map((type) => [type, localize(GUIDES[type], lang)]),
  ) as Record<Fd1TaskType, Fd1Guide>;
  return { lang, guides, disclaimer: DISCLAIMER[lang], sources: SOURCES };
}
