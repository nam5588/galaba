'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { api } from '@/lib/api'
import { tr, useLang } from '@/lib/i18n'
import { CHAT_T } from '@/lib/i18n/chat'
import type { ScheduleResponse } from '@/lib/types'

const WEEKDAYS = ['wd0', 'wd1', 'wd2', 'wd3', 'wd4', 'wd5', 'wd6'] as const

/** 한국 시간 오늘 (YYYY-MM-DD) */
function todayKST() {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10)
}

/** 오른쪽 '시간표' 카드: 요리(FD2)의 /api/schedule 실제 데이터. 기본은 오늘, 주말이면 다음 월요일 주. */
export function WeekSchedule() {
  const [data, setData] = useState<ScheduleResponse | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const lang = useLang()
  const t = (key: keyof typeof CHAT_T) => tr(CHAT_T, key, lang)

  useEffect(() => {
    const today = todayKST()
    const day = new Date(`${today}T00:00:00Z`).getUTCDay()
    // 주말에는 다음 주 시간표를 보여준다
    const ref = new Date(`${today}T00:00:00Z`)
    ref.setUTCDate(ref.getUTCDate() + (day === 6 ? 2 : day === 0 ? 1 : 1 - day))
    const week = ref.toISOString().slice(0, 10)
    api<ScheduleResponse>(`/api/schedule?week=${week}`)
      .then((res) => {
        setData(res)
        setSelected(res.days.some((d) => d.date === today) ? today : res.days[0]?.date ?? null)
      })
      .catch(() => setError(true))
  }, [])

  const day = data?.days.find((d) => d.date === selected)
  const today = todayKST()

  return (
    <section className="panel schedule-panel">
      <div className="section-heading">
        <div className="heading-title"><CalendarDays size={22} /><h2>{t('timetable')}</h2></div>
        <span className="week-button">{data && data.days[0]?.date !== undefined && data.days.every((d) => d.date !== today) ? t('nextWeek') : t('thisWeek')}</span>
      </div>
      {error && <p className="upcoming-empty">{t('scheduleFail')}</p>}
      {data && (
        <>
          <div className="weekdays">
            {data.days.map((d) => (
              <button key={d.date} className={d.date === selected ? 'selected-day' : ''} onClick={() => setSelected(d.date)}>
                <span>{t(WEEKDAYS[new Date(`${d.date}T00:00:00Z`).getUTCDay()])}</span>
                <span>{d.date.slice(5, 7)}.{d.date.slice(8, 10)}</span>
              </button>
            ))}
          </div>
          <div className="timeline">
            {day && day.classes.length === 0 && <p className="upcoming-empty">{t('noClasses')}</p>}
            {day?.classes.map((c) => (
              <div className="timeline-row" key={c.id}>
                <div className="time">{c.startTime}<br />{c.endTime}</div>
                <div className={`timeline-dot ${c.color}`} />
                <div className="class-card"><strong>{c.courseName} ({c.courseCode})</strong><span>{c.room} · {c.professor}</span></div>
              </div>
            ))}
          </div>
        </>
      )}
      {!data && !error && <p className="upcoming-empty">{t('loading')}</p>}
      <Link href="/schedule" className="full-button">{t('fullTimetable')} <ArrowRight size={17} /></Link>
    </section>
  )
}
