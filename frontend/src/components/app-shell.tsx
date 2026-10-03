'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FormEvent, ReactNode, useState } from 'react'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  FileText,
  Globe2,
  GraduationCap,
  HeartPulse,
  Home,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react'

const navItems = [
  { label: '홈', icon: Home, href: '/' },
  { label: '학교 공지사항', icon: Bell, href: '/notices' },
  { label: '시간표', icon: CalendarDays, href: '/schedule' },
  { label: 'AI 상담하기', icon: MessageCircle },
  { label: '비자 & 체류', icon: FileText },
  { label: '수강 & 학업', icon: GraduationCap },
  { label: '건강보험', icon: ShieldCheck },
  { label: '생활 정보', icon: HeartPulse },
  { label: '설정', icon: Settings },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [siteSearch, setSiteSearch] = useState('')

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const query = siteSearch.trim()
    if (query) router.push(`/notices?search=${encodeURIComponent(query)}`)
  }

  return (
    <main className="app-shell">
      <aside className={mobileNavOpen ? 'sidebar mobile-open' : 'sidebar'}>
        <div className="brand-row">
          <Link className="brand-link" href="/" onClick={() => setMobileNavOpen(false)}>
            <span className="brand-symbol">도</span>
            <span className="brand-copy"><strong>DOJANG</strong><small>International Student Assistant</small></span>
          </Link>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="메뉴 닫기"><X size={20} /></button>
        </div>
        <nav className="main-nav" aria-label="주요 메뉴">
          {navItems.map(({ label, icon: Icon, href }) => href ? (
            <Link key={label} href={href} onClick={() => setMobileNavOpen(false)} className={pathname === href ? 'nav-item active' : 'nav-item'}>
              <Icon size={20} /><span>{label}</span>
            </Link>
          ) : (
            <button key={label} className="nav-item" type="button" title="준비 중인 메뉴입니다">
              <Icon size={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="chat-list">
          <div className="chat-heading"><span>이전 채팅들</span><Plus size={18} /></div>
          {['비자 연장 서류 문의', '수강신청 방법', '기숙사 신청 조건'].map((item, index) => (
            <button className="chat-item" key={item}><MessageCircle size={17} /><span>{item}</span><small>{['2시간 전', '어제', '3일 전'][index]}</small></button>
          ))}
        </div>
        <div className="ai-help"><div className="bot-icon">●</div><div><strong>언제든지 물어보세요!</strong><span>UniMate AI가<br />24시간 도와드립니다.</span></div></div>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="메뉴 열기"><Menu size={24} /></button>
          <form className="search-box" onSubmit={submitSearch}>
            <Search size={20} />
            <input value={siteSearch} onChange={(event) => setSiteSearch(event.target.value)} aria-label="통합 검색" placeholder="학교 공지, 비자, 수강신청 등 궁금한 내용을 검색해보세요" />
          </form>
          <div className="top-actions"><button type="button"><Globe2 size={19} />한국어<ChevronDown size={14} /></button><button type="button" className="icon-button notification" aria-label="알림"><Bell size={21} /><i /></button><div className="profile"><div className="avatar">김</div><div><strong>문함마드</strong><small>컴퓨터공학과 · 3학년</small></div><ChevronDown size={15} /></div></div>
        </header>
        {children}
      </div>
    </main>
  )
}
