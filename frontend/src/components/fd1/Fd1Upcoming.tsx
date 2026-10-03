'use client'

import { dDayLabel, shortDate, type Fd1TaskType } from '@/lib/fd1'
import type { Fd1State } from './useFd1'

/** 오른쪽 "다가오는 일정"에 들어가는 FD1 기한 줄. 기존 .upcoming-row 스타일을 그대로 쓴다. */
export function Fd1UpcomingRows({ fd1, onOpenTask }: { fd1: Fd1State; onOpenTask: (type: Fd1TaskType) => void }) {
  const { plan, guides, lang } = fd1
  if (!plan) return null
  return (
    <>
      {plan.tasks.map((task) => (
        <div
          className="upcoming-row"
          key={task.type}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={() => onOpenTask(task.type)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenTask(task.type) }}
        >
          <span className="upcoming-date">{shortDate(task.dueDate, lang)}</span>
          <i className={`upcoming-dot ${task.urgency}`} />
          <strong>{guides?.guides[task.type].title ?? task.type}</strong>
          <b className={task.urgency}>{dDayLabel(task.daysLeft)}</b>
        </div>
      ))}
    </>
  )
}
