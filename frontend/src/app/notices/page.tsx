'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bell, ChevronDown, ChevronUp, ExternalLink, Search, TriangleAlert } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { api } from '@/lib/api'
import type { Notice, NoticeCategory, NoticesResponse } from '@/lib/types'

const categories: Array<{ label: string; value: 'all' | NoticeCategory }> = [
  { label: '전체', value: 'all' },
  { label: '학사', value: '학사' },
  { label: '장학', value: '장학' },
  { label: '행정', value: '행정' },
  { label: '공모·행사', value: '공모행사' },
]

export default function NoticesPage() {
  return <Suspense fallback={<PageFallback />}><NoticesRoute /></Suspense>
}

function NoticesRoute() {
  const params = useSearchParams()
  const routedSearch = params.get('search') ?? ''
  return <NoticesContent initialSearch={routedSearch} key={routedSearch} />
}

function NoticesContent({ initialSearch }: { initialSearch: string }) {
  const [category, setCategory] = useState<'all' | NoticeCategory>('all')
  const [search, setSearch] = useState(initialSearch)
  const [notices, setNotices] = useState<Notice[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotices = useCallback(async () => {
    try {
      const query = new URLSearchParams()
      if (category !== 'all') query.set('category', category)
      query.set('limit', '20')
      const data = await api<NoticesResponse>(`/api/notices?${query.toString()}`)
      const needle = search.trim().toLocaleLowerCase('ko')
      const items = needle
        ? data.items.filter((notice) => `${notice.title} ${notice.text} ${notice.dept}`.toLocaleLowerCase('ko').includes(needle))
        : data.items
      setError('')
      setNotices(items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '공지사항을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [category, search])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotices(), 250)
    return () => window.clearTimeout(timer)
  }, [loadNotices])

  useEffect(() => {
    if (!notices.length || !window.location.hash.startsWith('#notice-')) return
    const id = Number(window.location.hash.replace('#notice-', ''))
    if (notices.some((notice) => notice.id === id)) {
      const timer = window.setTimeout(() => {
        setExpanded(id)
        document.getElementById(`notice-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [notices])

  return (
    <AppShell>
      <div className="feature-page">
        <div className="page-heading"><div><span className="eyebrow">학생생활 정보</span><h1>학교 공지사항</h1><p>학사, 장학, 국제처의 중요한 소식을 한곳에서 확인하세요.</p></div><div className="page-heading-icon"><Bell size={30} /></div></div>

        <section className="feature-panel filter-panel" aria-label="공지사항 필터">
          <div className="feature-search"><Search size={19} /><input value={search} onChange={(event) => { setLoading(true); setSearch(event.target.value) }} placeholder="공지 제목이나 담당 부서를 검색하세요" aria-label="공지사항 검색" />{search && <button onClick={() => { setLoading(true); setSearch('') }}>지우기</button>}</div>
          <div className="filter-chips">{categories.map((item) => <button key={item.value} className={category === item.value ? 'active' : ''} onClick={() => { setLoading(true); setCategory(item.value) }}>{item.label}</button>)}</div>
        </section>

        <div className="results-summary"><strong>{loading ? '공지를 불러오는 중이에요' : `총 ${notices.length}건의 공지`}</strong><span>최신 등록순</span></div>

        {error ? <StateMessage icon={TriangleAlert} title="공지사항을 불러오지 못했어요" text={error} action={() => { setLoading(true); setError(''); void loadNotices() }} /> : loading ? <NoticeSkeleton /> : notices.length === 0 ? <StateMessage icon={Search} title="검색 결과가 없어요" text="다른 검색어나 카테고리를 선택해보세요." action={() => { setLoading(true); setSearch(''); setCategory('all') }} actionLabel="필터 초기화" /> : (
          <section className="notice-list" aria-live="polite">{notices.map((notice) => {
            const isOpen = expanded === notice.id
            return <article className={isOpen ? 'notice-list-item open' : 'notice-list-item'} id={`notice-${notice.id}`} key={notice.id}>
              <button className="notice-list-button" onClick={() => setExpanded(isOpen ? null : notice.id)} aria-expanded={isOpen}>
                <div className="notice-badges"><span className={`category-badge ${notice.category}`}>{notice.tag || notice.category}</span>{notice.pinned && <span className="important-badge">중요</span>}</div>
                <div className="notice-list-copy"><h2>{notice.title}</h2><p>{notice.text}</p><small>{notice.dept || '국민대학교'} · {notice.date}</small></div>
                {isOpen ? <ChevronUp size={21} /> : <ChevronDown size={21} />}
              </button>
              {isOpen && <div className="notice-detail"><p>{notice.text}</p><div><strong>담당 부서</strong><span>{notice.dept || '국민대학교'}</span><a href={notice.url} target="_blank" rel="noreferrer">원문 보기 <ExternalLink size={13} /></a></div></div>}
            </article>
          })}</section>
        )}
      </div>
    </AppShell>
  )
}

function PageFallback() {
  return <AppShell><div className="feature-page"><NoticeSkeleton /></div></AppShell>
}

function NoticeSkeleton() {
  return <div className="notice-list">{Array.from({ length: 4 }, (_, index) => <div className="notice-list-skeleton" key={index}><i /><div><span /><span /><span /></div></div>)}</div>
}

function StateMessage({ icon: Icon, title, text, action, actionLabel = '다시 시도' }: { icon: typeof Search; title: string; text: string; action: () => void; actionLabel?: string }) {
  return <div className="state-message"><div><Icon size={27} /></div><h2>{title}</h2><p>{text}</p><button onClick={action}>{actionLabel}</button></div>
}
