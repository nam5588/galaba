'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Globe2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LANG_LABEL, routeOfTask, t, type Fd1Lang, type Fd1TaskType } from '@/lib/fd1'
import type { Fd1State } from './useFd1'
import styles from './fd1.module.css'

/** 상단 언어 선택 (FD1 화면·알림 문구에 적용) */
export function Fd1LangSelect({ fd1 }: { fd1: Fd1State }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Globe2 size={19} aria-hidden />
      <select className={styles.langSelect} value={fd1.lang} onChange={(e) => fd1.setLang(e.target.value as Fd1Lang)} aria-label="Language">
        {(Object.keys(LANG_LABEL) as Fd1Lang[]).map((lang) => <option key={lang} value={lang}>{LANG_LABEL[lang]}</option>)}
      </select>
    </label>
  )
}

/** 상단 알림 벨: 오늘의 FD1 알림 (POST /api/fd1/reminders). 읽음은 브라우저에 저장. */
export function Fd1Bell({ fd1, onOpenTask }: { fd1: Fd1State; onOpenTask: (type: Fd1TaskType) => void }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { lang, reminders, unreadCount } = fd1

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className={styles.bellWrap} ref={wrapRef}>
      <button
        type="button"
        className="icon-button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${t('notifications', lang)}${unreadCount ? ` (${unreadCount})` : ''}`}
        aria-expanded={open}
      >
        <Bell size={21} />
        {unreadCount > 0 && <span className={styles.bellDot}>{unreadCount}</span>}
      </button>
      {open && (
        <div className={styles.bellMenu} role="dialog" aria-label={t('notifications', lang)}>
          <div className={styles.bellHead}>
            <span>{t('notifications', lang)}</span>
            {unreadCount > 0 && <button type="button" className={styles.linkButton} onClick={fd1.markAllRead}>{t('markAllRead', lang)}</button>}
          </div>
          {reminders.length === 0 && <div className={styles.bellEmpty}>{t('noNotifications', lang)}</div>}
          {reminders.map((r) => (
            <button
              type="button"
              key={r.key}
              className={styles.bellItem}
              onClick={() => { setOpen(false); onOpenTask(r.taskType) }}
            >
              <strong>{!fd1.isRead(r.key) && <i className={styles.unreadDot} />}{r.title}</strong>
              <p>{r.body}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** 상단 오른쪽: 언어 선택 + 알림 벨. 알림을 누르면 해당 FD1 화면으로 간다. */
export function Fd1TopActions({ fd1 }: { fd1: Fd1State }) {
  const router = useRouter()
  return (
    <>
      <Fd1LangSelect fd1={fd1} />
      <Fd1Bell fd1={fd1} onOpenTask={(type) => router.push(routeOfTask(type))} />
    </>
  )
}
