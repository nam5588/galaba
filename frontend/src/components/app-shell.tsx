'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FormEvent, ReactNode, useState } from 'react'
import { Fd1TopActions } from '@/components/fd1/Fd1Header'
import { useFd1 } from '@/components/fd1/useFd1'
import {
  Bell,
  Briefcase,
  CalendarDays,
  ChevronDown,
  FileText,
  GraduationCap,
  Home,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react'

// AI 채팅은 메인(/) 가운데에 있다. '홈 (AI 상담하기)'를 누르면 메인으로 가고, 메인에서는 입력창에 커서를 둔다.
const navItems = [
  { label: '홈 (AI 상담하기)', icon: Home, href: '/', ai: true },
  { label: '학교 공지사항', icon: Bell, href: '/notices' },
  { label: '시간표', icon: CalendarDays, href: '/schedule' },
  { label: '비자 & 체류', icon: FileText, href: '/visa' },
  { label: '수강 & 학업', icon: GraduationCap, href: '/academics' },
  { label: '건강보험', icon: ShieldCheck, href: '/insurance' },
  { label: '알바 찾기', icon: Briefcase, href: '/jobs' }, // 이신애(JOB)
  { label: '설정', icon: Settings, href: '/settings' },
]

const recentChats = [
  ['비자 연장 서류 문의', '2시간 전'],
  ['수강신청 방법', '어제'],
  ['기숙사 신청 조건', '3일 전'],
  ['졸업 요건 확인', '5일 전'],
  ['아르바이트 가능 시간', '1주 전'],
]

interface AppShellProps {
  children: ReactNode
  /** 메인처럼 화면 높이에 고정하고 가운데만 스크롤할 때 */
  fixed?: boolean
  /** 위쪽 통합 검색(공지 검색). 메인은 질문 입력이 한 곳이라 끈다 */
  showSearch?: boolean
  /** 메인에서: 이전 채팅을 누르면 바로 질문. 다른 화면에서는 메인으로 가서 질문(/?q=) */
  onRecentChat?: (question: string) => void
  /** 메인에서: 새 대화 */
  onNewChat?: () => void
  /** 메인에서: 'AI 상담하기'를 누르면 입력창에 커서 */
  onAiNav?: () => void
  /** 메인에서: 채팅이 답하는 중이면 이전 채팅 버튼을 잠근다 */
  busy?: boolean
}

export function AppShell({ children, fixed = false, showSearch = true, onRecentChat, onNewChat, onAiNav, busy = false }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [siteSearch, setSiteSearch] = useState('')
  const fd1 = useFd1()

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const query = siteSearch.trim()
    if (query) router.push(`/notices?search=${encodeURIComponent(query)}`)
  }

  const askRecent = (question: string) => {
    setMobileNavOpen(false)
    if (onRecentChat) onRecentChat(question)
    else router.push(`/?q=${encodeURIComponent(question)}`)
  }

  return (
    <main className={fixed ? 'app-shell dash-fixed' : 'app-shell'}>
      <aside className={mobileNavOpen ? 'sidebar mobile-open' : 'sidebar'}>
        <div className="brand-row">
          <Link className="brand-link" href="/" onClick={() => setMobileNavOpen(false)}>
            <img className="brand-logo" src="/images/logo.png" alt="DOJANG International Student Admin Assistant" />
          </Link>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="메뉴 닫기"><X size={20} /></button>
        </div>
        <nav className="main-nav" aria-label="주요 메뉴">
          {navItems.map(({ label, icon: Icon, href, ai }) => href ? (
            <Link
              key={label}
              href={href}
              onClick={() => {
                setMobileNavOpen(false)
                if (ai) onAiNav?.()
              }}
              className={pathname === href ? 'nav-item active' : 'nav-item'}
            >
              <Icon size={20} /><span>{label}</span>
            </Link>
          ) : (
            <button key={label} className="nav-item" type="button" title="준비 중인 메뉴입니다">
              <Icon size={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="chat-list">
          <div className="chat-heading">
            <span>이전 채팅들</span>
            {onNewChat ? (
              <button type="button" onClick={() => { setMobileNavOpen(false); onNewChat() }} aria-label="새 대화"><Plus size={18} /></button>
            ) : (
              <Link href="/" aria-label="새 대화"><Plus size={18} /></Link>
            )}
          </div>
          {recentChats.map(([item, when]) => (
            <button className="chat-item" key={item} onClick={() => askRecent(item)} disabled={busy} title={`"${item}" 물어보기`}>
              <MessageCircle size={17} /><span>{item}</span><small>{when}</small>
            </button>
          ))}
        </div>
        <div className="ai-help"><div className="bot-icon">●</div><div><strong>언제든지 물어보세요!</strong><span>DOJANG AI가<br />24시간 도와드립니다.</span></div></div>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="메뉴 열기"><Menu size={24} /></button>
          {showSearch && (
            <form className="search-box" onSubmit={submitSearch}>
              <Search size={20} />
              <input value={siteSearch} onChange={(event) => setSiteSearch(event.target.value)} aria-label="통합 검색" placeholder="학교 공지, 비자, 수강신청 등 궁금한 내용을 검색해보세요" />
            </form>
          )}
          <div className="top-actions"><Fd1TopActions fd1={fd1} /><div className="profile"><div className="avatar">무</div><div><strong>무하마드</strong><small>컴퓨터공학과 · 3학년</small></div><ChevronDown size={15} /></div></div>
        </header>
        {children}
      </div>
    </main>
  )
}
