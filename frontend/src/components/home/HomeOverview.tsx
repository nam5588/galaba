'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bell, BookOpen, BriefcaseBusiness, CalendarDays, ChevronRight, ClipboardList, GraduationCap, IdCard, Megaphone, MessageCircle, ShieldPlus, Sparkles, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { dDayLabel, routeOfTask, shortDate } from '@/lib/fd1'
import { tr, useLang } from '@/lib/i18n'
import { SHELL } from '@/lib/i18n/shell'
import type { Notice, NoticesResponse, AcademicsResponse } from '@/lib/types'
import type { Fd1State } from '@/components/fd1/useFd1'
import styles from './home-overview.module.css'

type Shortcut = { title: string; detail: string; badge: string; href: string; icon: typeof IdCard; tone: 'rose' | 'amber' | 'blue' | 'mint' }

export function HomeOverview({ fd1, onAskChat }: { fd1: Fd1State; onAskChat: () => void }) {
  const router = useRouter()
  const lang = useLang()
  const [academics, setAcademics] = useState<AcademicsResponse | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [noticesError, setNoticesError] = useState(false)

  useEffect(() => {
    api<AcademicsResponse>('/api/academics').then(setAcademics).catch(() => {})
    api<NoticesResponse>('/api/notices?limit=3').then((data) => setNotices(data.items)).catch(() => setNoticesError(true))
  }, [])

  const firstTask = fd1.plan?.tasks.find((task) => task.type === 'ARC_EXTEND')
  const unpaid = fd1.plan?.insurance.unpaidMonths ?? 0
  const progress = academics?.credits.progress ?? 0
  const shortcuts: Shortcut[] = [
    { title: `비자 (${fd1.profile?.visaType ?? 'D-2'})`, detail: firstTask ? `체류 기한 ${dDayLabel(firstTask.daysLeft)} · 연장 절차를 확인하세요.` : '체류 기간과 연장 절차를 확인하세요.', badge: firstTask ? dDayLabel(firstTask.daysLeft) : '확인하기', href: '/visa', icon: IdCard, tone: 'rose' },
    { title: '건강보험', detail: unpaid ? `확인할 미납 내역 ${unpaid}건이 있어요.` : '보험 가입과 납부 내역을 확인하세요.', badge: unpaid ? `${unpaid}건 확인` : '확인하기', href: '/insurance', icon: ShieldPlus, tone: 'amber' },
    { title: '졸업 요건', detail: academics ? `${academics.credits.remaining}학점이 남았어요. 수강 계획을 확인하세요.` : '학점과 졸업 요건을 확인하세요.', badge: academics ? `${progress}%` : '확인하기', href: '/academics', icon: GraduationCap, tone: 'blue' },
    { title: '인턴십', detail: '내게 맞는 일자리와 인턴십을 찾아보세요.', badge: '공고 보기', href: '/jobs', icon: BriefcaseBusiness, tone: 'mint' },
  ]
  const tasks = [
    { icon: IdCard, tone: 'rose', title: '비자 연장 서류 준비하기', detail: firstTask ? `체류 기한까지 ${dDayLabel(firstTask.daysLeft)} 남았어요. 필요한 서류와 절차를 확인하세요.` : '필요한 서류와 절차를 미리 확인하세요.', href: '/visa' },
    { icon: ShieldPlus, tone: 'amber', title: '건강보험 납부내역 확인하기', detail: unpaid ? `미납 내역 ${unpaid}건을 확인해 보세요.` : '최근 납부 내역과 다음 납부일을 확인하세요.', href: '/insurance' },
    { icon: GraduationCap, tone: 'blue', title: '필수 과목 수강 계획 세우기', detail: academics ? `졸업까지 ${academics.credits.remaining}학점이 남았어요.` : '필수 과목과 수강 현황을 확인하세요.', href: '/academics' },
    { icon: BriefcaseBusiness, tone: 'mint', title: '지원 가능한 공고 확인하기', detail: '관심 있는 아르바이트와 인턴십을 찾아보세요.', href: '/jobs' },
  ] as const

  return (
    <section className={styles.overview} aria-label="홈 대시보드">
      <div className={styles.primary}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>YOUR STUDENT DASHBOARD</span>
            <h1>Good morning,<br /><strong>{tr(SHELL, 'profileName', lang)} 👋</strong></h1>
            <p>오늘 확인해야 할 중요한 일정이 {fd1.plan?.tasks.length ?? 0}개 있어요.<br />하나씩 완료하며 도장을 찍어보세요!</p>
            <a href="#ai-chat" className={styles.heroChat} onClick={onAskChat}><Sparkles size={16} /> AI에게 물어보기 <ArrowRight size={16} /></a>
          </div>
          <div className={styles.heroArt} aria-hidden="true"><span className={styles.sun} /><span className={styles.building}><i /><i /><i /><i /><i /><i /></span><span className={styles.stamp}>★ STAY<br />★ STUDY<br />★ GRADUATE<br /><b>DOJANG</b></span></div>
        </section>

        <div className={styles.shortcuts} aria-label="주요 서비스">
          {shortcuts.map(({ title, detail, badge, href, icon: Icon, tone }) => <Link href={href} className={`${styles.shortcut} ${styles[tone]}`} key={title}><div className={styles.shortcutTop}><span className={styles.shortcutIcon}><Icon size={22} /></span><ChevronRight size={17} /></div><div className={styles.shortcutTitle}><strong>{title}</strong><span>{badge}</span></div><p>{detail}</p></Link>)}
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeading}><div><ClipboardList size={19} /><h2>내 전체 상태</h2></div><small>오늘의 학생 생활 한눈에 보기</small></div>
          <div className={styles.statusGrid}>
            <Link href="/visa" className={styles.statusItem}><span className={`${styles.statusIcon} ${styles.rose}`}><IdCard size={17} /></span><strong>비자 & 체류</strong><span className={`${styles.meter} ${styles.rose}`}><i style={{ width: firstTask ? `${Math.max(18, Math.min(100, firstTask.daysLeft))}%` : '68%' }} /></span><b>{firstTask ? `만료 ${dDayLabel(firstTask.daysLeft)}` : '체류 정보 확인'}</b><small>연장 준비 필요</small></Link>
            <Link href="/insurance" className={styles.statusItem}><span className={`${styles.statusIcon} ${styles.amber}`}><ShieldPlus size={17} /></span><strong>건강보험</strong><span className={`${styles.meter} ${styles.amber}`}><i style={{ width: unpaid ? '42%' : '100%' }} /></span><b>{unpaid ? '최근 납부 내역 확인 필요' : '납부 내역 확인'}</b><small>{unpaid ? `미납 ${unpaid}건` : '보험 상태 보기'}</small></Link>
            <Link href="/academics" className={styles.statusItem}><span className={`${styles.statusIcon} ${styles.blue}`}><GraduationCap size={17} /></span><strong>졸업 요건</strong><span className={`${styles.meter} ${styles.blue}`}><i style={{ width: `${progress}%` }} /></span><b>{academics ? `이수 학점 ${academics.credits.earned} / ${academics.credits.required}` : '학점 확인하기'}</b><small>{academics ? `${progress}% 완료` : '수강 현황 보기'}</small></Link>
            <Link href="/schedule" className={styles.statusItem}><span className={`${styles.statusIcon} ${styles.mint}`}><CalendarDays size={17} /></span><strong>수강 계획</strong><span className={`${styles.meter} ${styles.mint}`}><i style={{ width: '0%' }} /></span><b>이번 주 시간표</b><small>수업 일정 확인하기</small></Link>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}><div><ClipboardList size={19} /><h2>오늘의 할 일</h2></div><Link href="/visa">전체 보기 <ChevronRight size={15} /></Link></div>
          <div className={styles.taskList}>{tasks.map(({ icon: Icon, tone, title, detail, href }) => <Link className={styles.task} href={href} key={title}><span className={`${styles.taskIcon} ${styles[tone]}`}><Icon size={20} /></span><span className={styles.taskCopy}><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={17} /><span className={`${styles.taskButton} ${styles[tone]}`}>바로가기</span></Link>)}</div>
        </section>
      </div>

      <aside className={styles.secondary}>
        <section className={`${styles.panel} ${styles.profileCard}`}>
          <div className={styles.profileTop}><span className={styles.portrait}><UserRound size={36} /></span><div><strong>{tr(SHELL, 'profileName', lang)}</strong><small>Muhammad Ali</small></div></div>
          <dl><div><dt><UserRound size={15} /> Nationality</dt><dd>Pakistan</dd></div><div><dt><GraduationCap size={15} /> Major</dt><dd>Computer Science</dd></div><div><dt><BookOpen size={15} /> Year</dt><dd>{academics ? `Year ${academics.profile.year}` : 'Year 3'}</dd></div><div><dt><IdCard size={15} /> Visa</dt><dd>{fd1.profile?.visaType ?? 'D-2'} (Student)</dd></div><div><dt><MessageCircle size={15} /> Language</dt><dd>{lang === 'ko' ? '한국어' : lang.toUpperCase()}</dd></div></dl>
          <Link href="/settings" className={styles.profileEdit}>내 정보 수정 <ChevronRight size={16} /></Link>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}><div><CalendarDays size={18} /><h2>주요 일정</h2></div><Link href="/visa">전체 보기 <ChevronRight size={15} /></Link></div>
          <div className={styles.timeline}>{fd1.plan?.tasks.length ? fd1.plan.tasks.slice(0, 5).map((task) => <button type="button" key={task.type} onClick={() => router.push(routeOfTask(task.type))} className={styles.timelineRow}><time>{shortDate(task.dueDate, lang)}</time><i className={styles[task.urgency]} /><span><strong>{fd1.guides?.guides[task.type].title ?? task.type}</strong><small>{dDayLabel(task.daysLeft)}</small></span></button>) : <p className={styles.emptyState}>{fd1.planError ? '일정을 불러오지 못했어요.' : fd1.planLoading ? '일정을 불러오는 중…' : '다가오는 일정이 없어요.'}</p>}</div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}><div><Megaphone size={19} /><h2>학교 공지</h2></div><Link href="/notices">전체 보기 <ChevronRight size={15} /></Link></div>
          <div className={styles.noticeList}>{notices.length ? notices.map((notice) => <Link href="/notices" key={notice.id}><span>{notice.category}</span><strong>{notice.title}</strong><time>{notice.date}</time></Link>) : <p className={styles.emptyState}>{noticesError ? '공지를 불러오지 못했어요.' : '최신 공지를 불러오는 중…'}</p>}</div>
        </section>
        <a href="#ai-chat" className={styles.aiCard} onClick={onAskChat}><span><Bell size={18} /></span><strong>궁금한 점이 있나요?</strong><small>아래로 스크롤해 AI에게 질문해보세요.</small><ChevronRight size={18} /></a>
      </aside>
    </section>
  )
}
