'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  Home,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react'
import { ChatPanel, type ChatPanelHandle } from '@/components/chat/ChatPanel'
import { Fd1TopActions } from '@/components/fd1/Fd1Header'
import { Fd1UpcomingRows } from '@/components/fd1/Fd1Upcoming'
import { useFd1 } from '@/components/fd1/useFd1'
import { routeOfTask } from '@/lib/fd1'
import { useChat } from '@/components/chat/useChat'

const navItems = [
  { label: '홈', icon: Home },
  { label: 'AI 상담하기', icon: MessageCircle },
  { label: '비자 & 체류', icon: FileText, href: '/visa' },
  { label: '수강 & 학업', icon: GraduationCap },
  { label: '건강보험', icon: ShieldCheck, href: '/insurance' },
  { label: '생활 정보', icon: Home },
  { label: '커뮤니티', icon: MessageCircle },
  { label: '설정', icon: Settings },
]

const recentChats = [
  ['비자 연장 서류 문의', '2시간 전'],
  ['수강신청 방법', '어제'],
  ['기숙사 신청 조건', '3일 전'],
  ['졸업 요건 확인', '5일 전'],
  ['아르바이트 가능 시간', '1주 전'],
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

// 메인 = 왼쪽 사이드바(2번, 고정) + 가운데 LLM 채팅창(1번, 이 영역만 스크롤) + 오른쪽 시간표·일정(3번, 고정)
export default function Page() {
  const chat = useChat()
  const fd1 = useFd1()
  const router = useRouter()
  const panelRef = useRef<ChatPanelHandle>(null)
  const [activeNav, setActiveNav] = useState('홈')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const askFromOutside = (q: string) => {
    setMobileNavOpen(false)
    void chat.ask(q)
  }

  return (
    <main className="app-shell dash-fixed">
      <Suspense fallback={null}>
        <AutoAsk onAsk={askFromOutside} />
      </Suspense>

      <aside className={mobileNavOpen ? 'sidebar mobile-open' : 'sidebar'}>
        <div className="brand-row">
          <img className="brand-logo" src="/images/logo.png" alt="DOJANG International Student Admin Assistant" />
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="메뉴 닫기"><X size={20} /></button>
        </div>
        <nav className="main-nav" aria-label="주요 메뉴">
          {navItems.map(({ label, icon: Icon, href }) => (
            <button
              key={label}
              onClick={() => {
                setMobileNavOpen(false)
                if (href) {
                  router.push(href)
                  return
                }
                if (label === 'AI 상담하기' || label === '홈') {
                  setActiveNav('홈')
                  panelRef.current?.focus()
                  return
                }
                setActiveNav(label)
              }}
              className={activeNav === label ? 'nav-item active' : 'nav-item'}
            >
              <Icon size={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="chat-list">
          <div className="chat-heading">
            <span>이전 채팅들</span>
            <button type="button" onClick={() => { chat.reset(); panelRef.current?.focus() }} aria-label="새 대화"><Plus size={18} /></button>
          </div>
          {recentChats.map(([item, when]) => (
            <button className="chat-item" key={item} onClick={() => askFromOutside(item)} disabled={chat.pending} title={`"${item}" 물어보기`}>
              <MessageCircle size={17} /><span>{item}</span><small>{when}</small>
            </button>
          ))}
        </div>
        <div className="ai-help"><div className="bot-icon">●</div><div><strong>언제든지 물어보세요!</strong><span>DOJANG AI가<br />24시간 도와드립니다.</span></div></div>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="메뉴 열기"><MoreHorizontal size={24} /></button>
          <div className="top-actions"><Fd1TopActions fd1={fd1} /><div className="profile"><div className="avatar">무</div><div><strong>무하마드</strong><small>컴퓨터공학과 · 3학년</small></div><ChevronDown size={15} /></div></div>
        </header>

        <div className="dashboard-grid">
          <section className="main-column">
            <ChatPanel ref={panelRef} chat={chat} />
          </section>

          <aside className="right-column"><section className="panel schedule-panel"><div className="section-heading"><div className="heading-title"><CalendarDays size={22} /><h2>시간표</h2></div><button className="week-button">이번 주 <ChevronDown size={15} /></button></div><div className="weekdays">{['월\n10.14', '화\n10.15', '수\n10.16', '목\n10.17', '금\n10.18'].map((day, i) => <button className={i === 2 ? 'selected-day' : ''} key={day}>{day.split('\n').map((line) => <span key={line}>{line}</span>)}</button>)}</div><div className="timeline">{schedule.map(([from, to, title, room, tone]) => <div className="timeline-row" key={title}><div className="time">{from}<br />{to}</div><div className={`timeline-dot ${tone}`} /><div className="class-card"><strong>{title}</strong><span>{room}</span></div></div>)}</div><button className="full-button">전체 시간표 보기 <ArrowRight size={17} /></button></section><section className="panel upcoming-panel"><SectionHeading icon={CalendarDays} title="다가오는 일정" /><div className="upcoming-list"><Fd1UpcomingRows fd1={fd1} onOpenTask={(type) => router.push(routeOfTask(type))} />{[['10.25 (토)', '국제학생 페스티벌', 'D-9', 'yellow'], ['11.03 (월)', '수강신청 시작', 'D-18', 'blue'], ['12.15 (월)', '성적 정정 마감', 'D-60', 'purple']].map(([date, title, badge, tone]) => <div className="upcoming-row" key={title}><span className="upcoming-date">{date}</span><i className={`upcoming-dot ${tone}`} /><strong>{title}</strong><b className={tone}>{badge}</b></div>)}</div></section></aside>
        </div>
      </div>
    </main>
  )
}

/** /?q=질문 (예전 /chat?q= 포함)으로 들어오면 그 질문을 한 번 자동으로 보내고 주소에서 q를 지운다. */
function AutoAsk({ onAsk }: { onAsk: (question: string) => void }) {
  const q = useSearchParams().get('q')?.trim() || null
  const router = useRouter()
  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (!q) {
      handled.current = null
      return
    }
    if (handled.current === q) return
    handled.current = q
    onAsk(q)
    router.replace('/', { scroll: false })
  }, [q, onAsk, router])

  return null
}
