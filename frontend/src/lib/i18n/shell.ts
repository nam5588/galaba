// 앱 공통 화면(왼쪽 메뉴·위쪽 바·첫 화면·설정·404/오류) 문구. 사용: tr(SHELL, 'key', useLang())
// API·팀원 화면에서 오는 데이터(공지 제목, 과목명 등)는 여기서 번역하지 않는다.
import type { Dict } from '@/lib/i18n'

export const SHELL = {
  // ---------- 왼쪽 메뉴 ----------
  navHome: { ko: "홈 (AI 상담하기)", en: "Home (Ask AI)", uz: "Bosh sahifa (AI chat)", ru: "Главная (ИИ-чат)" },
  navNotices: { ko: "학교 공지사항", en: "School notices", uz: "Universitet e'lonlari", ru: "Объявления вуза" },
  navSchedule: { ko: "시간표", en: "Timetable", uz: "Dars jadvali", ru: "Расписание" },
  navVisa: { ko: "비자 & 체류", en: "Visa & stay", uz: "Viza va yashash", ru: "Виза и пребывание" },
  navAcademics: { ko: "수강 & 학업", en: "Courses & study", uz: "Kurslar va o'qish", ru: "Курсы и учёба" },
  navInsurance: { ko: "건강보험", en: "Health insurance", uz: "Tibbiy sug'urta", ru: "Медстраховка" },
  navJobs: { ko: "알바 찾기", en: "Part-time jobs", uz: "Yarim kunlik ish", ru: "Подработка" },
  navSettings: { ko: "설정", en: "Settings", uz: "Sozlamalar", ru: "Настройки" },
  navAria: { ko: "주요 메뉴", en: "Main menu", uz: "Asosiy menyu", ru: "Главное меню" },
  comingSoon: { ko: "준비 중인 메뉴입니다", en: "Coming soon", uz: "Tez orada", ru: "Скоро появится" },
  menuOpen: { ko: "메뉴 열기", en: "Open menu", uz: "Menyuni ochish", ru: "Открыть меню" },
  menuClose: { ko: "메뉴 닫기", en: "Close menu", uz: "Menyuni yopish", ru: "Закрыть меню" },

  recentChats: { ko: "이전 채팅들", en: "Recent chats", uz: "Oldingi suhbatlar", ru: "Недавние чаты" },
  newChat: { ko: "새 대화", en: "New chat", uz: "Yangi suhbat", ru: "Новый чат" },
  askThis: { ko: "\"{q}\" 물어보기", en: "Ask \"{q}\"", uz: "\"{q}\" deb so'rash", ru: "Спросить: «{q}»" },
  chatVisaDocs: { ko: "비자 연장 서류 문의", en: "Visa extension documents", uz: "Vizani uzaytirish hujjatlari", ru: "Документы для продления визы" },
  chatRegister: { ko: "수강신청 방법", en: "How to register for courses", uz: "Kurslarga qanday yozilish", ru: "Как записаться на курсы" },
  chatDorm: { ko: "기숙사 신청 조건", en: "Dorm application requirements", uz: "Yotoqxonaga ariza shartlari", ru: "Условия заселения в общежитие" },
  chatGraduation: { ko: "졸업 요건 확인", en: "Graduation requirements", uz: "Bitiruv talablari", ru: "Требования для выпуска" },
  chatWorkHours: { ko: "아르바이트 가능 시간", en: "Allowed part-time work hours", uz: "Ruxsat etilgan ish soatlari", ru: "Разрешённые часы подработки" },
  ago2h: { ko: "2시간 전", en: "2h ago", uz: "2 soat oldin", ru: "2 ч назад" },
  yesterday: { ko: "어제", en: "Yesterday", uz: "Kecha", ru: "Вчера" },
  ago3d: { ko: "3일 전", en: "3d ago", uz: "3 kun oldin", ru: "3 дня назад" },
  ago5d: { ko: "5일 전", en: "5d ago", uz: "5 kun oldin", ru: "5 дней назад" },
  ago1w: { ko: "1주 전", en: "1w ago", uz: "1 hafta oldin", ru: "Неделю назад" },

  aiHelpTitle: { ko: "언제든지 물어보세요!", en: "Ask anytime!", uz: "Istalgan vaqtda so'rang!", ru: "Спрашивайте в любое время!" },
  aiHelpLine1: { ko: "DOJANG AI가", en: "DOJANG AI is here", uz: "DOJANG AI sizga", ru: "DOJANG AI поможет" },
  aiHelpLine2: { ko: "24시간 도와드립니다.", en: "to help 24/7.", uz: "24/7 yordam beradi.", ru: "круглосуточно." },

  // ---------- 위쪽 바 ----------
  searchAria: { ko: "통합 검색", en: "Search", uz: "Qidiruv", ru: "Поиск" },
  searchPlaceholder: {
    ko: "학교 공지, 비자, 수강신청 등 궁금한 내용을 검색해보세요",
    en: "Search school notices, visa, course registration and more",
    uz: "E'lonlar, viza, kursga yozilish va boshqalarni qidiring",
    ru: "Поиск: объявления, виза, запись на курсы и другое",
  },
  profileName: { ko: "무하마드", en: "Muhammad", uz: "Muhammad", ru: "Мухаммад" },
  profileInitial: { ko: "무", en: "M", uz: "M", ru: "М" },
  profileSub: { ko: "컴퓨터공학과 · 3학년", en: "Computer Science · Year 3", uz: "Kompyuter injiniringi · 3-kurs", ru: "Компьютерные науки · 3 курс" },

  // ---------- 첫 화면 ----------
  introTitle: { ko: "시작할까요?", en: "Shall we begin?", uz: "Boshlaymizmi?", ru: "Начнём?" },

  // ---------- 설정 ----------
  setEyebrow: { ko: "내 계정 · 환경 설정", en: "My account · Preferences", uz: "Hisobim · Sozlamalar", ru: "Мой аккаунт · Параметры" },
  setDesc: {
    ko: "언어, 알림, 캘린더 연동과 개인정보를 한곳에서 관리하세요.",
    en: "Manage language, notifications, calendar and privacy in one place.",
    uz: "Til, bildirishnomalar, kalendar va maxfiylikni bir joyda boshqaring.",
    ru: "Язык, уведомления, календарь и конфиденциальность — в одном месте.",
  },
  setFooter: {
    ko: "정확한 체류·학사 정보는 국제교류팀 또는 외국인종합안내센터(☎ 1345)에서 확인하세요.",
    en: "For official stay and academic information, check with the International Office or the Immigration Contact Center (☎ 1345).",
    uz: "Aniq yashash va o'qish ma'lumotlarini xalqaro bo'limdan yoki chet elliklar uchun aloqa markazidan (☎ 1345) bilib oling.",
    ru: "Точную информацию о пребывании и учёбе уточняйте в международном отделе или в контакт-центре для иностранцев (☎ 1345).",
  },

  langTitle: { ko: "언어", en: "Language", uz: "Til", ru: "Язык" },
  langLegend: { ko: "화면 언어 선택", en: "Choose display language", uz: "Interfeys tilini tanlang", ru: "Выбор языка интерфейса" },
  langNote: {
    ko: "화면 안내와 알림 언어가 바뀌어요. AI 채팅은 질문한 언어로 답해요.",
    en: "Changes the language of screens and reminders. AI chat also replies in English.",
    uz: "Ekran va eslatmalar tili o'zgaradi. AI chat ham o'zbekcha javob beradi.",
    ru: "Меняет язык интерфейса и напоминаний. ИИ-чат тоже отвечает по-русски.",
  },

  profileTitle: { ko: "내 정보", en: "My info", uz: "Ma'lumotlarim", ru: "Мои данные" },
  profileDesc: {
    ko: "체류·건강보험 일정 계산에 쓰는 정보예요.",
    en: "Used to calculate your stay and health insurance deadlines.",
    uz: "Yashash va sug'urta muddatlarini hisoblash uchun kerak.",
    ru: "Нужны для расчёта сроков пребывания и медстраховки.",
  },
  visaType: { ko: "비자 종류", en: "Visa type", uz: "Viza turi", ru: "Тип визы" },
  entryDate: { ko: "입국일", en: "Entry date", uz: "Koreyaga kirgan sana", ru: "Дата въезда" },
  arcIssuedDate: { ko: "외국인등록증 발급일", en: "ARC issue date", uz: "ARC berilgan sana", ru: "Дата выдачи ARC" },
  stayExpiryDate: { ko: "체류 만료일", en: "Stay expiry date", uz: "Yashash muddati tugash sanasi", ru: "Окончание срока пребывания" },
  visaD2: { ko: "D-2 · 유학", en: "D-2 · Student", uz: "D-2 · Talaba", ru: "D-2 · Учёба" },
  visaD4: { ko: "D-4 · 어학연수", en: "D-4 · Language trainee", uz: "D-4 · Til kursi", ru: "D-4 · Языковые курсы" },
  demoBadge: { ko: "데모 사용자 정보", en: "Demo user info", uz: "Demo foydalanuvchi ma'lumotlari", ru: "Данные демо-пользователя" },
  myBadge: { ko: "내가 입력한 정보", en: "Entered by you", uz: "Siz kiritgan ma'lumotlar", ru: "Введено вами" },
  notEntered: { ko: "입력 안 함", en: "Not entered", uz: "Kiritilmagan", ru: "Не указано" },
  profileError: {
    ko: "정보를 불러오지 못했어요. 비자 & 체류 화면에서 직접 입력할 수 있어요.",
    en: "Couldn't load your info. You can enter it on the Visa & stay screen.",
    uz: "Ma'lumotlarni yuklab bo'lmadi. Ularni \"Viza va yashash\" sahifasida kiritishingiz mumkin.",
    ru: "Не удалось загрузить данные. Их можно ввести на экране «Виза и пребывание».",
  },
  profileLoading: { ko: "내 정보를 불러오는 중이에요…", en: "Loading your info…", uz: "Ma'lumotlar yuklanmoqda…", ru: "Загружаем ваши данные…" },
  editProfile: { ko: "내 정보 수정", en: "Edit my info", uz: "Ma'lumotlarni tahrirlash", ru: "Изменить данные" },

  notifyTitle: { ko: "알림", en: "Reminders", uz: "Eslatmalar", ru: "Напоминания" },
  notifyDesc: {
    ko: "체류·보험 기한을 언제, 어디로 알려드릴지 골라요.",
    en: "Choose when and where to get stay and insurance deadline reminders.",
    uz: "Yashash va sug'urta muddatlari haqida qachon va qayerga eslatishni tanlang.",
    ru: "Выберите, когда и куда напоминать о сроках пребывания и страховки.",
  },
  notifyWhen: { ko: "언제 알려드릴까요?", en: "When should we remind you?", uz: "Qachon eslataylik?", ru: "Когда напомнить?" },
  dayBefore: { ko: "하루 전", en: "1 day before", uz: "1 kun oldin", ru: "За 1 день" },
  daysBefore: { ko: "{n}일 전", en: "{n} days before", uz: "{n} kun oldin", ru: "За {n} дней" },
  notifyAllOff: {
    ko: "모든 알림이 꺼져 있어요. 기한을 놓치지 않게 하나 이상 켜 두세요.",
    en: "All reminders are off. Turn at least one on so you don't miss a deadline.",
    uz: "Barcha eslatmalar o'chirilgan. Muddatni o'tkazib yubormaslik uchun kamida bittasini yoqing.",
    ru: "Все напоминания выключены. Включите хотя бы одно, чтобы не пропустить срок.",
  },
  notifyWhere: { ko: "어디로 받을까요?", en: "Where should we send them?", uz: "Qayerga yuboraylik?", ru: "Куда присылать?" },
  channelWeb: { ko: "웹 알림", en: "Web notification", uz: "Veb-bildirishnoma", ru: "Веб-уведомление" },
  channelKakao: { ko: "카카오톡", en: "KakaoTalk", uz: "KakaoTalk", ru: "KakaoTalk" },
  channelTelegram: { ko: "텔레그램", en: "Telegram", uz: "Telegram", ru: "Telegram" },
  notifyNote: {
    ko: "카카오톡·텔레그램 발송은 준비 중이에요 (시연용 설정)",
    en: "KakaoTalk and Telegram delivery is coming soon (demo setting)",
    uz: "KakaoTalk va Telegram orqali yuborish tez orada (demo sozlama)",
    ru: "Отправка в KakaoTalk и Telegram скоро появится (демо-настройка)",
  },

  calTitle: { ko: "캘린더 연동", en: "Calendar", uz: "Kalendar", ru: "Календарь" },
  calDesc: {
    ko: "AI가 알려준 기한을 내 캘린더에 바로 넣어요.",
    en: "Put deadlines from the AI straight into your calendar.",
    uz: "AI aytgan muddatlarni darhol kalendaringizga qo'shing.",
    ru: "Добавляйте сроки из ответов ИИ сразу в свой календарь.",
  },
  calSwitch: {
    ko: "AI 답변에 구글 캘린더 추가 버튼 보여주기",
    en: "Show a Google Calendar button on AI answers",
    uz: "AI javoblarida Google Kalendar tugmasini ko'rsatish",
    ru: "Показывать кнопку Google Календаря в ответах ИИ",
  },
  calSwitchHint: {
    ko: "기한이 있는 답변 아래에 ‘구글 캘린더에 추가’ 버튼이 붙어요.",
    en: "Answers with a deadline get an ‘Add to Google Calendar’ button.",
    uz: "Muddati bor javoblar ostida ‘Google Kalendarga qo'shish’ tugmasi chiqadi.",
    ru: "Под ответами со сроком появится кнопка «Добавить в Google Календарь».",
  },
  calOn: {
    ko: "켜짐 — 채팅 답변에 캘린더 버튼이 보여요.",
    en: "On — chat answers show the calendar button.",
    uz: "Yoqilgan — chat javoblarida kalendar tugmasi ko'rinadi.",
    ru: "Вкл. — в ответах чата есть кнопка календаря.",
  },
  calOff: {
    ko: "꺼짐 — 채팅 답변에서 캘린더 버튼을 숨겨요.",
    en: "Off — the calendar button is hidden in chat answers.",
    uz: "O'chirilgan — chat javoblarida kalendar tugmasi yashirilgan.",
    ru: "Выкл. — кнопка календаря в ответах чата скрыта.",
  },

  privacyTitle: { ko: "개인정보", en: "Privacy", uz: "Maxfiylik", ru: "Конфиденциальность" },
  privacyText: {
    ko: "대화 내용은 서버에 저장하지 않아요. 내 정보와 설정은 이 브라우저에만 저장돼요.",
    en: "Chats are not stored on the server. Your info and settings are saved only in this browser.",
    uz: "Suhbatlar serverda saqlanmaydi. Ma'lumotlar va sozlamalar faqat shu brauzerda saqlanadi.",
    ru: "Переписка не хранится на сервере. Данные и настройки сохраняются только в этом браузере.",
  },
  resetTrigger: {
    ko: "이 브라우저의 내 정보·설정 초기화",
    en: "Reset my info and settings in this browser",
    uz: "Shu brauzerdagi ma'lumot va sozlamalarni tiklash",
    ru: "Сбросить мои данные и настройки в этом браузере",
  },
  resetConfirmAria: { ko: "초기화 확인", en: "Confirm reset", uz: "Tiklashni tasdiqlash", ru: "Подтверждение сброса" },
  resetConfirmQ: { ko: "정말 초기화할까요?", en: "Reset everything?", uz: "Rostdan ham tiklaysizmi?", ru: "Точно сбросить?" },
  resetButton: { ko: "초기화", en: "Reset", uz: "Tiklash", ru: "Сбросить" },
  cancel: { ko: "취소", en: "Cancel", uz: "Bekor qilish", ru: "Отмена" },
  resetDone: {
    ko: "초기화했어요. 언어·알림·캘린더는 기본값, 내 정보는 데모 사용자로 돌아갔어요.",
    en: "Reset done. Language, reminders and calendar are back to defaults; your info is the demo user again.",
    uz: "Tiklandi. Til, eslatmalar va kalendar standart holatga, ma'lumotlar demo foydalanuvchiga qaytdi.",
    ru: "Готово. Язык, напоминания и календарь сброшены, данные снова демо-пользователя.",
  },

  // ---------- 404 · 오류 ----------
  nfEyebrow: { ko: "길을 잘못 들었어요", en: "Wrong turn", uz: "Yo'ldan adashdingiz", ru: "Кажется, вы заблудились" },
  nfTitle: { ko: "페이지를 찾을 수 없어요", en: "Page not found", uz: "Sahifa topilmadi", ru: "Страница не найдена" },
  nfLine1: {
    ko: "요청한 주소가 변경되었거나 삭제되었을 수 있어요.",
    en: "The address may have changed or been removed.",
    uz: "Manzil o'zgargan yoki o'chirilgan bo'lishi mumkin.",
    ru: "Адрес мог измениться или быть удалён.",
  },
  nfLine2: {
    ko: "주소를 다시 확인하거나 홈으로 돌아가세요.",
    en: "Check the address or go back home.",
    uz: "Manzilni tekshiring yoki bosh sahifaga qayting.",
    ru: "Проверьте адрес или вернитесь на главную.",
  },
  goHome: { ko: "홈으로 가기", en: "Go home", uz: "Bosh sahifaga", ru: "На главную" },
  seeNotices: { ko: "학교 공지 보기", en: "School notices", uz: "E'lonlarni ko'rish", ru: "Объявления вуза" },
  errEyebrow: { ko: "일시적인 문제", en: "Temporary problem", uz: "Vaqtinchalik muammo", ru: "Временная проблема" },
  errTitle: { ko: "예기치 못한 오류가 발생했어요", en: "Something went wrong", uz: "Kutilmagan xatolik yuz berdi", ru: "Произошла непредвиденная ошибка" },
  errBody: {
    ko: "잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.",
    en: "Please try again in a moment. If the problem continues, contact the administrator.",
    uz: "Birozdan so'ng qayta urinib ko'ring. Muammo davom etsa, administratorga murojaat qiling.",
    ru: "Попробуйте ещё раз чуть позже. Если ошибка повторится, обратитесь к администратору.",
  },
  errCode: { ko: "오류 코드: {code}", en: "Error code: {code}", uz: "Xato kodi: {code}", ru: "Код ошибки: {code}" },
  retry: { ko: "다시 시도", en: "Try again", uz: "Qayta urinish", ru: "Повторить" },
} satisfies Dict
