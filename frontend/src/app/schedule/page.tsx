'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, RotateCcw, TriangleAlert, UserRound } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { api } from '@/lib/api'
import { DAY_LABELS, formatShortDate, getMonday, shiftDate } from '@/lib/date'
import type { ScheduleDay, ScheduleResponse } from '@/lib/types'

export default function SchedulePage() {
  const currentMonday = useMemo(() => getMonday(), [])
  const [weekStart, setWeekStart] = useState(currentMonday)
  const [days, setDays] = useState<ScheduleDay[]>([])
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay()
    return today >= 1 && today <= 5 ? today : 1
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSchedule = useCallback(async () => {
    try {
      const data = await api<ScheduleResponse>(`/api/schedule?week=${weekStart}`)
      setError('')
      setDays(data.days)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '시간표를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSchedule(), 0)
    return () => window.clearTimeout(timer)
  }, [loadSchedule])

  const selected = days.find((day) => day.dayOfWeek === selectedDay)
  const weekEnd = shiftDate(weekStart, 4)

  return (
    <AppShell>
      <div className="feature-page schedule-page">
        <div className="page-heading"><div><span className="eyebrow">나의 학사 일정</span><h1>시간표</h1><p>이번 학기 수업 시간과 강의실을 요일별로 확인하세요.</p></div><div className="page-heading-icon"><CalendarDays size={30} /></div></div>

        <section className="feature-panel schedule-toolbar">
          <button className="week-nav-button" onClick={() => { setLoading(true); setWeekStart(shiftDate(weekStart, -7)) }} aria-label="이전 주"><ChevronLeft size={20} /></button>
          <div><span>{weekStart.slice(0, 4)}년</span><strong>{formatWeekRange(weekStart, weekEnd)}</strong></div>
          <button className="week-nav-button" onClick={() => { setLoading(true); setWeekStart(shiftDate(weekStart, 7)) }} aria-label="다음 주"><ChevronRight size={20} /></button>
          <button className="today-button" onClick={() => { setLoading(true); setWeekStart(currentMonday) }} disabled={weekStart === currentMonday}><RotateCcw size={16} />이번 주</button>
        </section>

        {error ? <div className="state-message"><div><TriangleAlert size={27} /></div><h2>시간표를 불러오지 못했어요</h2><p>{error}</p><button onClick={() => { setLoading(true); setError(''); void loadSchedule() }}>다시 시도</button></div> : loading ? <ScheduleSkeleton /> : <>
          <section className="week-grid" aria-label={`${weekStart} 주간 시간표`}>
            {days.map((day, index) => <div className="week-column" key={day.date}><div className={isToday(day.date) ? 'week-column-heading today' : 'week-column-heading'}><span>{DAY_LABELS[index]}요일</span><strong>{formatShortDate(day.date)}</strong>{isToday(day.date) && <small>오늘</small>}</div><div className="week-class-list">{day.classes.length ? day.classes.map((item) => <article className={`week-class ${item.color}`} key={item.id}><div className="week-class-time"><Clock3 size={14} />{item.startTime} - {item.endTime}</div><h2>{item.courseName}</h2><span>{item.courseCode}</span><p><MapPin size={14} />{item.room}</p><p><UserRound size={14} />{item.professor} 교수</p></article>) : <div className="day-off">수업 없음</div>}</div></div>)}
          </section>

          <section className="mobile-day-schedule">
            <div className="mobile-day-tabs">{days.map((day, index) => <button className={selectedDay === day.dayOfWeek ? 'active' : ''} onClick={() => setSelectedDay(day.dayOfWeek)} key={day.date}><span>{DAY_LABELS[index]}</span><strong>{formatShortDate(day.date)}</strong></button>)}</div>
            <div className="mobile-classes">{selected?.classes.length ? selected.classes.map((item) => <article className={`mobile-class ${item.color}`} key={item.id}><div><span>{item.startTime}</span><small>{item.endTime}</small></div><div><h2>{item.courseName} <em>{item.courseCode}</em></h2><p><MapPin size={14} />{item.room}<UserRound size={14} />{item.professor} 교수</p></div></article>) : <div className="state-message compact"><CalendarDays size={25} /><h2>이날은 수업이 없어요.</h2></div>}</div>
          </section>
        </>}
      </div>
    </AppShell>
  )
}

function formatWeekRange(start: string, end: string) {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  return startYear === endYear && startMonth === endMonth
    ? `${startMonth}월 ${startDay}일 - ${endDay}일`
    : `${startMonth}월 ${startDay}일 - ${endMonth}월 ${endDay}일`
}

function isToday(date: string) {
  const today = new Date()
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return date === localDate
}

function ScheduleSkeleton() {
  return <div className="week-grid">{Array.from({ length: 5 }, (_, index) => <div className="schedule-column-skeleton" key={index}><i /><span /><span /></div>)}</div>
}
