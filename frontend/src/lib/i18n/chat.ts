// 메인 화면(AI 채팅 · 시간표 카드 · 다가오는 일정 카드) 문구. 사용: tr(CHAT_T, 'key', useLang())
import type { Dict } from '@/lib/i18n'

export const CHAT_T = {
  // ---- 채팅 패널 ----
  panelAria: { ko: 'Dojang AI 채팅', en: 'Dojang AI chat', uz: 'Dojang AI suhbati', ru: 'Чат Dojang AI' },
  consult: { ko: 'Dojang AI 상담', en: 'Dojang AI Assistant', uz: 'Dojang AI maslahat', ru: 'Консультация Dojang AI' },
  newChat: { ko: '새 대화', en: 'New chat', uz: 'Yangi suhbat', ru: 'Новый чат' },
  emptyTitle: { ko: '귀찮은걸 물어보세요', en: 'Ask me the tedious stuff', uz: "Mayda-chuyda ishlarni so'rang", ru: 'Спрашивайте о рутине' },
  emptyLead: {
    ko: '비자·보험 기한, 수업과 휴강, 알바, 학칙까지. 필요한 걸 찾아 출처와 함께 알려드려요.',
    en: 'Visa and insurance deadlines, classes and cancellations, part-time jobs, school rules. I find what you need and show the sources.',
    uz: "Viza va sug'urta muddatlari, darslar va bekor qilingan darslar, yarim kunlik ish, universitet nizomi. Keraklisini topib, manbasi bilan aytib beraman.",
    ru: 'Сроки визы и страховки, занятия и отмены, подработка, правила университета. Найду нужное и покажу источники.',
  },
  qHero: {
    ko: '이번 주에 내가 챙겨야 할 거 정리해줘',
    en: 'Summarize what I need to take care of this week',
    uz: 'Bu hafta nimalarni qilishim kerakligini jamlab ber',
    ru: 'Собери, что мне нужно сделать на этой неделе',
  },
  qVisa: {
    ko: '내 비자 언제까지야? 연장하려면 뭐 해야 돼?',
    en: 'When does my visa expire? What do I need to extend it?',
    uz: 'Vizam qachongacha amal qiladi? Uzaytirish uchun nima qilishim kerak?',
    ru: 'До какого числа действует моя виза? Что нужно для продления?',
  },
  qToday: {
    ko: '오늘 수업 뭐 있고, 휴강 공지 있어?',
    en: 'What classes do I have today, and are any cancelled?',
    uz: 'Bugun qanday darslarim bor, bekor qilingan dars bormi?',
    ru: 'Какие у меня сегодня занятия и есть ли отмены?',
  },
  // PRD 시연: 한국어 화면에서도 영어 질문 그대로
  qJob: {
    ko: 'Can I work at a convenience store on weekends?',
    en: 'Can I work at a convenience store on weekends?',
    uz: "Dam olish kunlari do'konda ishlasam bo'ladimi?",
    ru: 'Можно ли мне работать в магазине у дома по выходным?',
  },
  qLeave: {
    ko: '휴학하면 어떻게 돼?',
    en: 'What happens if I take a leave of absence?',
    uz: "Akademik ta'til olsam nima bo'ladi?",
    ru: 'Что будет, если я возьму академический отпуск?',
  },
  askTitle: { ko: '궁금한 걸 물어보세요!', en: 'Ask me anything!', uz: 'Savolingizni bering!', ru: 'Задайте вопрос!' },
  askDesc: {
    ko: 'DOJANG AI가 학교 생활, 비자, 수강신청, 생활 정보 등 무엇이든 도와드립니다.',
    en: 'DOJANG AI helps with campus life, visas, course registration, daily life and more.',
    uz: 'DOJANG AI universitet hayoti, viza, kursga yozilish, kundalik hayot va boshqa masalalarda yordam beradi.',
    ru: 'DOJANG AI поможет с учёбой, визой, записью на курсы, бытом и не только.',
  },
  inputAria: { ko: 'Dojang에게 질문하기', en: 'Ask Dojang', uz: "Dojang'dan so'rash", ru: 'Спросить Dojang' },
  placeholder: {
    ko: '예) 비자 연장에 필요한 서류가 무엇인가요? (English OK)',
    en: 'e.g. What documents do I need to extend my visa?',
    uz: 'Masalan: vizani uzaytirish uchun qanday hujjatlar kerak?',
    ru: 'Например: какие документы нужны для продления визы?',
  },
  webSearch: { ko: '웹 검색', en: 'Web search', uz: 'Veb qidiruv', ru: 'Веб-поиск' },
  waiting: { ko: '답변을 기다리는 중', en: 'Waiting for the answer', uz: 'Javob kutilmoqda', ru: 'Ждём ответ' },
  send: { ko: '질문 보내기', en: 'Send question', uz: 'Savolni yuborish', ru: 'Отправить вопрос' },

  // ---- 답변 말풍선 ----
  offlineTitle: {
    ko: 'AI 키 없이 학칙 검색 결과만으로 답했어요',
    en: 'Answered from school rule search results only, without AI',
    uz: 'AI ishlatilmadi, javob faqat nizom qidiruvi natijalaridan',
    ru: 'Ответ только по результатам поиска в правилах, без ИИ',
  },
  offlineBadge: { ko: '오프라인 모드(학칙 검색 결과만)', en: 'Offline mode (rule search only)', uz: 'Oflayn rejim (faqat nizom qidiruvi)', ru: 'Офлайн-режим (только поиск по правилам)' },
  emptyAnswer: {
    ko: '답변 내용이 비어 있어요. 질문을 조금 바꿔서 다시 물어봐 주세요.',
    en: 'The answer came back empty. Try rephrasing your question.',
    uz: "Javob bo'sh keldi. Savolni biroz o'zgartirib qayta so'rang.",
    ru: 'Ответ пустой. Попробуйте переформулировать вопрос.',
  },
  toolsUsed: { ko: '사용한 도구', en: 'Tools used', uz: 'Ishlatilgan vositalar', ru: 'Инструменты' },
  collapse: { ko: '접기', en: 'Hide', uz: 'Yopish', ru: 'Свернуть' },
  showSteps: { ko: '{n}단계 보기', en: 'Show {n} steps', uz: "{n} bosqichni ko'rish", ru: 'Шаги: {n}' },
  done: { ko: '완료', en: 'Done', uz: 'Bajarildi', ru: 'Готово' },
  sources: { ko: '출처', en: 'Sources', uz: 'Manbalar', ru: 'Источники' },
  hintExcerpt: { ko: '조항을 누르면 원문', en: 'Tap an article for the text', uz: "Matn uchun bandni bosing", ru: 'Нажмите на статью — откроется текст' },
  hintLinks: { ko: '링크는 새 탭', en: 'Links open in a new tab', uz: 'Havolalar yangi oynada', ru: 'Ссылки — в новой вкладке' },
  openNewTab: { ko: '{title} (새 탭에서 열기)', en: '{title} (opens in a new tab)', uz: '{title} (yangi oynada ochiladi)', ru: '{title} (откроется в новой вкладке)' },
  noExcerpt: { ko: '발췌문이 제공되지 않았어요.', en: 'No excerpt available.', uz: 'Parcha mavjud emas.', ru: 'Фрагмент недоступен.' },
  viewOriginal: { ko: '원문 보기', en: 'View original', uz: "Asl matnni ko'rish", ru: 'Открыть оригинал' },
  quickActions: { ko: '바로 처리하기', en: 'Do it now', uz: 'Hoziroq bajarish', ru: 'Сделать сейчас' },
  addCalendar: { ko: '구글 캘린더에 추가', en: 'Add to Google Calendar', uz: "Google Calendar'ga qo'shish", ru: 'Добавить в Google Календарь' },

  // ---- 기다리는 중 ----
  pendingTitle: { ko: 'Dojang이 필요한 도구를 고르고 있어요…', en: 'Dojang is picking the right tools…', uz: 'Dojang kerakli vositalarni tanlamoqda…', ru: 'Dojang подбирает нужные инструменты…' },
  hintRegs: { ko: '학칙 찾는 중', en: 'Searching school rules', uz: 'Nizom qidirilmoqda', ru: 'Ищу в правилах' },
  hintDeadlines: { ko: '기한 확인 중', en: 'Checking deadlines', uz: 'Muddatlar tekshirilmoqda', ru: 'Проверяю сроки' },
  hintNotices: { ko: '공지 확인 중', en: 'Checking notices', uz: "E'lonlar tekshirilmoqda", ru: 'Проверяю объявления' },
  hintTimetable: { ko: '시간표 확인 중', en: 'Checking the timetable', uz: 'Dars jadvali tekshirilmoqda', ru: 'Проверяю расписание' },
  hintJobs: { ko: '알바 공고 찾는 중', en: 'Looking for job posts', uz: "Ish e'lonlari qidirilmoqda", ru: 'Ищу вакансии' },

  // ---- 오류 ----
  retry: { ko: '다시 시도', en: 'Try again', uz: 'Qayta urinish', ru: 'Повторить' },
  errOffline: {
    ko: '서버에 연결할 수 없어요. 백엔드(npm run dev:backend)가 켜져 있는지 확인해주세요.',
    en: "Can't reach the server. Check that the backend (npm run dev:backend) is running.",
    uz: "Serverga ulanib bo'lmadi. Backend (npm run dev:backend) ishlayotganini tekshiring.",
    ru: 'Не удаётся подключиться к серверу. Проверьте, что бэкенд (npm run dev:backend) запущен.',
  },
  errTimeout: {
    ko: '답변이 너무 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.',
    en: 'The answer is taking too long. Please try again in a moment.',
    uz: "Javob juda uzoq kechikmoqda. Birozdan keyin qayta urinib ko'ring.",
    ru: 'Ответ занимает слишком много времени. Попробуйте чуть позже.',
  },
  errServer: {
    ko: '답변을 만드는 중 서버에서 문제가 생겼어요 ({detail}). 잠시 후 다시 시도해주세요.',
    en: 'The server ran into a problem while answering ({detail}). Please try again in a moment.',
    uz: "Javob tayyorlashda serverda xatolik yuz berdi ({detail}). Birozdan keyin qayta urinib ko'ring.",
    ru: 'На сервере произошла ошибка при подготовке ответа ({detail}). Попробуйте чуть позже.',
  },

  // ---- 시간표 카드 ----
  timetable: { ko: '시간표', en: 'Timetable', uz: 'Dars jadvali', ru: 'Расписание' },
  thisWeek: { ko: '이번 주', en: 'This week', uz: 'Shu hafta', ru: 'Эта неделя' },
  nextWeek: { ko: '다음 주', en: 'Next week', uz: 'Keyingi hafta', ru: 'След. неделя' },
  scheduleFail: { ko: '시간표를 불러오지 못했어요.', en: "Couldn't load the timetable.", uz: "Dars jadvalini yuklab bo'lmadi.", ru: 'Не удалось загрузить расписание.' },
  noClasses: { ko: '수업 없음', en: 'No classes', uz: "Dars yo'q", ru: 'Нет занятий' },
  loading: { ko: '불러오는 중…', en: 'Loading…', uz: 'Yuklanmoqda…', ru: 'Загрузка…' },
  fullTimetable: { ko: '전체 시간표 보기', en: 'View full timetable', uz: "To'liq jadvalni ko'rish", ru: 'Всё расписание' },
  wd0: { ko: '일', en: 'Sun', uz: 'Ya', ru: 'Вс' },
  wd1: { ko: '월', en: 'Mon', uz: 'Du', ru: 'Пн' },
  wd2: { ko: '화', en: 'Tue', uz: 'Se', ru: 'Вт' },
  wd3: { ko: '수', en: 'Wed', uz: 'Ch', ru: 'Ср' },
  wd4: { ko: '목', en: 'Thu', uz: 'Pa', ru: 'Чт' },
  wd5: { ko: '금', en: 'Fri', uz: 'Ju', ru: 'Пт' },
  wd6: { ko: '토', en: 'Sat', uz: 'Sh', ru: 'Сб' },

  // ---- 다가오는 일정 카드 ----
  upcoming: { ko: '다가오는 일정', en: 'Upcoming', uz: 'Yaqin muddatlar', ru: 'Ближайшие дела' },
  aiSummary: { ko: 'AI로 정리', en: 'Summarize with AI', uz: 'AI bilan jamlash', ru: 'Сводка от ИИ' },
} satisfies Dict

/** 오케스트레이터 도구 이름 -> 칩 이름 */
export const TOOL_T = {
  search_regulations: { ko: '규정 검색', en: 'Rule search', uz: 'Nizom qidiruvi', ru: 'Поиск по правилам' },
  get_deadlines: { ko: '기한 확인', en: 'Deadlines', uz: 'Muddatlar', ru: 'Сроки' },
  get_notices: { ko: '공지 확인', en: 'Notices', uz: "E'lonlar", ru: 'Объявления' },
  get_timetable: { ko: '시간표 확인', en: 'Timetable', uz: 'Dars jadvali', ru: 'Расписание' },
  get_academics: { ko: '학업 확인', en: 'Academics', uz: "O'qish holati", ru: 'Учёба' },
  search_jobs: { ko: '알바 검색', en: 'Job search', uz: 'Ish qidiruvi', ru: 'Поиск подработки' },
  create_calendar_event: { ko: '캘린더 추가', en: 'Add to calendar', uz: "Kalendarga qo'shish", ru: 'В календарь' },
  get_student_profile: { ko: '내 정보 확인', en: 'My profile', uz: "Mening ma'lumotlarim", ru: 'Мой профиль' },
  process: { ko: '처리 과정', en: 'Processing', uz: 'Jarayon', ru: 'Обработка' },
} satisfies Dict
