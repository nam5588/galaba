'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FormEvent, ReactNode, useEffect, useState } from 'react'
import { Fd1TopActions } from '@/components/fd1/Fd1Header'
import { useFd1 } from '@/components/fd1/useFd1'
import { SiteFooter } from '@/components/SiteFooter'
import { useStored } from '@/lib/fd1'
import { tr, useLang } from '@/lib/i18n'
import { SHELL } from '@/lib/i18n/shell'
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
// 문구는 lib/i18n/shell.ts (SHELL)에서 화면 언어로 꺼낸다
type ShellKey = keyof typeof SHELL
const navItems: Array<{ label: ShellKey; icon: typeof Home; href: string; ai?: boolean }> = [
  { label: 'navHome', icon: Home, href: '/', ai: true },
  { label: 'navNotices', icon: Bell, href: '/notices' },
  { label: 'navSchedule', icon: CalendarDays, href: '/schedule' },
  { label: 'navVisa', icon: FileText, href: '/visa' },
  { label: 'navAcademics', icon: GraduationCap, href: '/academics' },
  { label: 'navInsurance', icon: ShieldCheck, href: '/insurance' },
  { label: 'navJobs', icon: Briefcase, href: '/jobs' }, // 이신애(JOB)
  { label: 'navSettings', icon: Settings, href: '/settings' },
]

// [질문, 언제]. 누르면 화면 언어로 된 질문이 그대로 채팅에 들어간다
const recentChats: Array<[ShellKey, ShellKey]> = [
  ['chatVisaDocs', 'ago2h'],
  ['chatRegister', 'yesterday'],
  ['chatDorm', 'ago3d'],
  ['chatGraduation', 'ago5d'],
  ['chatWorkHours', 'ago1w'],
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
  const [sidebarCollapsed, setSidebarCollapsed] = useStored<boolean>('dojang.sidebarCollapsed')
  const [siteSearch, setSiteSearch] = useState('')
  const fd1 = useFd1()
  const lang = useLang()
  const L = (key: ShellKey, vars?: Record<string, string | number>) => tr(SHELL, key, lang, vars)

  // 화면 언어를 <html lang>에도 맞춘다 (읽기 프로그램·번역기·글꼴 선택용)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)

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
    <main className={`${fixed ? 'app-shell dash-fixed' : 'app-shell'}${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {mobileNavOpen && <button type="button" className="sidebar-backdrop" aria-label={L('menuClose')} onClick={() => setMobileNavOpen(false)} />}
      <aside className={mobileNavOpen ? 'sidebar mobile-open' : 'sidebar'}>
        <div className="brand-row">
          <Link className="brand-link" href="/" onClick={() => setMobileNavOpen(false)}>
            <img className="brand-logo" src="/images/dojang_newlogo.png" alt="DOJANG International Student Admin Assistant" />
          </Link>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label={L('menuClose')}><X size={20} /></button>
          <button className="sidebar-close" type="button" onClick={toggleSidebar} aria-label={L('menuClose')} title={L('menuClose')}><Menu size={19} /></button>
        </div>
        <nav className="main-nav" aria-label={L('navAria')}>
          {navItems.map(({ label, icon: Icon, href, ai }) => href ? (
            <Link
              key={href}
              href={href}
              onClick={() => {
                setMobileNavOpen(false)
                if (ai) onAiNav?.()
              }}
              className={pathname === href ? 'nav-item active' : 'nav-item'}
            >
              <Icon size={20} /><span>{L(label)}</span>
            </Link>
          ) : (
            <button key={label} className="nav-item" type="button" title={L('comingSoon')}>
              <Icon size={20} /><span>{L(label)}</span>
            </button>
          ))}
        </nav>
        <div className="chat-list">
          <div className="chat-heading">
            <span>{L('recentChats')}</span>
            {onNewChat ? (
              <button type="button" onClick={() => { setMobileNavOpen(false); onNewChat() }} aria-label={L('newChat')}><Plus size={18} /></button>
            ) : (
              <Link href="/" aria-label={L('newChat')}><Plus size={18} /></Link>
            )}
          </div>
          {recentChats.map(([itemKey, whenKey]) => {
            const item = L(itemKey)
            return (
              <button className="chat-item" key={itemKey} onClick={() => askRecent(item)} disabled={busy} title={L('askThis', { q: item })}>
                <MessageCircle size={17} /><span>{item}</span><small>{L(whenKey)}</small>
              </button>
            )
          })}
        </div>
        <div className="ai-help"><div className="bot-icon">●</div><div><strong>{L('aiHelpTitle')}</strong><span>{L('aiHelpLine1')}<br />{L('aiHelpLine2')}</span></div></div>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label={L('menuOpen')}><Menu size={24} /></button>
          <button className="desktop-menu" type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? L('menuOpen') : L('menuClose')} aria-expanded={!sidebarCollapsed} title={sidebarCollapsed ? L('menuOpen') : L('menuClose')}><Menu size={21} /></button>
          {showSearch && (
            <form className="search-box" onSubmit={submitSearch}>
              <Search size={20} />
              <input value={siteSearch} onChange={(event) => setSiteSearch(event.target.value)} aria-label={L('searchAria')} placeholder={L('searchPlaceholder')} />
            </form>
          )}
          <div className="top-actions"><Fd1TopActions fd1={fd1} /><div className="profile"><div className="avatar">{L('profileInitial')}</div><div><strong>{L('profileName')}</strong><small>{L('profileSub')}</small></div><ChevronDown size={15} /></div></div>
        </header>
        {children}
        {!fixed && <SiteFooter />}
      </div>
    </main>
  )
}
