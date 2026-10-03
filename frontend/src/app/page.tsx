'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe2,
  GraduationCap,
  HeartPulse,
  Home,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react'

const navItems = [
  { label: '홈', icon: Home },
  { label: 'AI 상담하기', icon: MessageCircle },
  { label: '비자 & 체류', icon: FileText },
  { label: '수강 & 학업', icon: GraduationCap },
  { label: '건강보험', icon: ShieldCheck },
  { label: '생활 정보', icon: Home },
  { label: '커뮤니티', icon: MessageCircle },
  { label: '설정', icon: Settings },
]

const notices = [
  { tag: '중요', tone: 'red', date: '2024. 10. 16', title: 'D-2 비자 연장 서류 제출 마감', text: '12월 만료 예정인 학생들은 10월 31일까지 서류를 제출해주세요.' },
  { tag: '학교', tone: 'blue', date: '2024. 10. 14', title: '2026-1학기 수강신청 안내', text: '수강신청이 11월 3일(월)부터 시작됩니다. 미리 준비해주세요.' },
  { tag: '기타', tone: 'green', date: '2024. 10. 10', title: '외국인 유학생 축제 안내', text: '10월 25일 국제학생 페스티벌이 열립니다. 많은 참여 부탁드립니다.' },
]

const schedule = [
  ['09:00', '10:15', '데이터 구조 (CS301)', '공학관 301호', 'blue'],
  ['10:30', '11:45', '알고리즘 (CS302)', '공학관 402호', 'green'],
  ['13:00', '14:15', '한국어 중급 (KOR201)', '인문관 210호', 'yellow'],
  ['14:30', '15:45', '컴퓨터 네트워크 (CS305)', '공학관 303호', 'red'],
  ['16:00', '17:15', '팀 프로젝트 (CS399)', '공학관 501호', 'purple'],
]

function SectionHeading({ icon: Icon, title, action = '전체 보기' }: { icon: typeof Bell; title: string; action?: string }) {
  return (
    <div className="section-heading">
      <div className="heading-title"><Icon size={21} strokeWidth={2.5} /><h2>{title}</h2></div>
      <button className="text-action">{action}<ChevronRight size={16} /></button>
    </div>
  )
}

export default function Page() {
  const [activeNav, setActiveNav] = useState('홈')
  const [question, setQuestion] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const submitQuestion = () => {
    if (!question.trim()) return
    setSubmitted(true)
    setQuestion('')
  }

  return (
    <main className="app-shell">
      <aside className={mobileNavOpen ? 'sidebar mobile-open' : 'sidebar'}>
        <div className="brand-row">
          <img className="brand-logo" src="/images/logo.png" alt="DOJANG International Student Admin Assistant" />
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="메뉴 닫기"><X size={20} /></button>
        </div>
        <nav className="main-nav" aria-label="주요 메뉴">
          {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActiveNav(label); setMobileNavOpen(false) }} className={activeNav === label ? 'nav-item active' : 'nav-item'}><Icon size={20} /><span>{label}</span></button>)}
        </nav>
        <div className="chat-list">
          <div className="chat-heading"><span>이전 채팅들</span><Plus size={18} /></div>
          {['비자 연장 서류 문의', '수강신청 방법', '기숙사 신청 조건', '졸업 요건 확인', '아르바이트 가능 시간'].map((item, i) => <button className="chat-item" key={item}><MessageCircle size={17} /><span>{item}</span><small>{['2시간 전', '어제', '3일 전', '5일 전', '1주 전'][i]}</small></button>)}
        </div>
        <div className="ai-help"><div className="bot-icon">●</div><div><strong>언제든지 물어보세요!</strong><span>UniMate AI가<br />24시간 도와드립니다.</span></div></div>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="메뉴 열기"><MoreHorizontal size={24} /></button>
          <div className="search-box"><Search size={20} /><input aria-label="검색" placeholder="학교 생활, 비자, 수강신청 등 궁금한 내용을 질문해보세요... (예: 다음 학기 수강신청 일정이 언제인가요?)" /></div>
          <div className="top-actions"><button><Globe2 size={19} />한국어<ChevronDown size={14} /></button><button className="icon-button notification"><Bell size={21} /><i /></button><div className="profile"><div className="avatar">김</div><div><strong>문함마드</strong><small>컴퓨터공학과 · 3학년</small></div><ChevronDown size={15} /></div></div>
        </header>

        <div className="dashboard-grid">
          <section className="main-column">
            <div className="hero-card">
              <div className="hero-copy"><div className="greeting">Good morning! <span>☀️</span></div><h1>문함마드님, 좋은 하루예요!</h1><p>중요한 일정과 공지사항을 한눈에 확인하고,<br />궁금한 점이 있으면 언제든지 UniMate에게 물어보세요.</p><div className="hero-actions"><button className="primary-button"><CalendarDays size={19} />내 할 일 보기<ArrowRight size={18} /></button><button className="secondary-button"><CalendarDays size={19} />구글 캘린더에 저장</button></div></div>
              <div className="hero-calendar"><CalendarDays size={24} /><strong>주요 공지와 내 할 일을<br />구글 캘린더에 자동으로 저장해드려요!</strong></div>
            </div>

            <section className="panel"><SectionHeading icon={Bell} title="주요 공지사항" /> <div className="notice-grid">{notices.map((notice) => <article className={`notice-card ${notice.tone}`} key={notice.title}><div className="notice-meta"><span className="tag">{notice.tag}</span><small>{notice.date}</small></div><h3>{notice.title}<ChevronRight size={18} /></h3><p>{notice.text}</p></article>)}</div></section>

            <section className="panel status-panel"><div className="section-heading"><div className="heading-title"><span className="status-spark">✦</span><h2>내 주요 상태</h2></div><small className="updated">마지막 업데이트: 2024. 10. 15. 14:30 <span>↻</span></small></div><div className="status-grid"><StatusCard icon={FileText} tone="red" title="비자 (D-2)" badge="D-43" text="만료일까지 43일 남았어요. 연장 준비를 시작하세요." /><StatusCard icon={HeartPulse} tone="yellow" title="건강보험" badge="정상 가입" text="현재 국민건강보험이 정상적으로 유지되고 있습니다." /><StatusCard icon={GraduationCap} tone="blue" title="수강 요건" badge="3/5" text="이번 학기 필수 과목 5개 중 3개를 이수했어요." progress /><StatusCard icon={WalletCards} tone="green" title="등록금" badge="납부 완료" text="2026-1학기 등록금이 정상적으로 납부되었습니다." /></div></section>

            <section className="ask-card"><div className="ask-heading"><Sparkles size={20} /><strong>궁금한 걸 물어보세요!</strong><span>UniMate AI가 학교 생활, 비자, 수강신청, 생활 정보 등 무엇이든 도와드립니다.</span></div><div className="ask-input"><Paperclip size={20} /><input value={question} onChange={(e) => { setQuestion(e.target.value); setSubmitted(false) }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) submitQuestion() }} placeholder={submitted ? '질문이 접수되었습니다. 곧 답변드릴게요!' : '예) 비자 연장에 필요한 서류가 무엇인가요?'} /><button><Globe2 size={17} />웹 검색</button><button className="send-button" onClick={submitQuestion} aria-label="질문 보내기"><Send size={20} /></button></div></section>
          </section>

          <aside className="right-column"><section className="panel schedule-panel"><div className="section-heading"><div className="heading-title"><CalendarDays size={22} /><h2>시간표</h2></div><button className="week-button">이번 주 <ChevronDown size={15} /></button></div><div className="weekdays">{['월\n10.14', '화\n10.15', '수\n10.16', '목\n10.17', '금\n10.18'].map((day, i) => <button className={i === 2 ? 'selected-day' : ''} key={day}>{day.split('\n').map((line) => <span key={line}>{line}</span>)}</button>)}</div><div className="timeline">{schedule.map(([from, to, title, room, tone]) => <div className="timeline-row" key={title}><div className="time">{from}<br />{to}</div><div className={`timeline-dot ${tone}`} /><div className="class-card"><strong>{title}</strong><span>{room}</span></div></div>)}</div><button className="full-button">전체 시간표 보기 <ArrowRight size={17} /></button></section><section className="panel upcoming-panel"><SectionHeading icon={CalendarDays} title="다가오는 일정" /><div className="upcoming-list">{[['10.20 (월)', '건강보험료 납부 기한', 'D-4', 'red'], ['10.25 (토)', '국제학생 페스티벌', 'D-9', 'yellow'], ['11.03 (월)', '수강신청 시작', 'D-18', 'blue'], ['12.15 (월)', '성적 정정 마감', 'D-60', 'purple']].map(([date, title, badge, tone]) => <div className="upcoming-row" key={title}><span className="upcoming-date">{date}</span><i className={`upcoming-dot ${tone}`} /><strong>{title}</strong><b className={tone}>{badge}</b></div>)}</div></section></aside>
        </div>
      </div>
    </main>
  )
}

function StatusCard({ icon: Icon, tone, title, badge, text, progress = false }: { icon: typeof FileText; tone: string; title: string; badge: string; text: string; progress?: boolean }) {
  return <article className={`status-card ${tone}`}><div className="status-top"><div className="status-icon"><Icon size={21} /></div><strong>{title}</strong><b>{badge}</b></div>{progress && <div className="progress"><span /></div>}<p>{text}</p><ChevronRight className="card-arrow" size={18} /></article>
}

