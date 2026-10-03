'use client'

import Link from 'next/link'
import { useRef, useState, type ReactNode } from 'react'
import { Bell, CalendarPlus, Check, Globe, Lock, Pencil, Settings, UserRound, type LucideIcon } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useFd1, type Fd1State } from '@/components/fd1/useFd1'
import { LANG_LABEL, STORAGE_KEYS, type Fd1Lang } from '@/lib/fd1'
import { tr, useLang } from '@/lib/i18n'
import { SHELL } from '@/lib/i18n/shell'
import { clearLocalData, NOTIFY_CHANNELS, NOTIFY_DAYS, useCalendarActionsEnabled, useNotifySettings, type NotifyChannel, type NotifyDay } from '@/lib/settings'
import styles from '@/components/settings/settings.module.css'

// 문구는 lib/i18n/shell.ts (SHELL). 언어 이름(LANG_LABEL)은 번역하지 않고 각 언어 그대로 보여준다
type ShellKey = keyof typeof SHELL
const CHANNEL_LABEL: Record<NotifyChannel, ShellKey> = { web: 'channelWeb', kakao: 'channelKakao', telegram: 'channelTelegram' }
const VISA_LABEL: Partial<Record<string, ShellKey>> = { 'D-2': 'visaD2', 'D-4': 'visaD4' }

/** 화면 언어로 SHELL 문구를 꺼내는 함수 */
function useT() {
  const lang = useLang()
  return (key: ShellKey, vars?: Record<string, string | number>) => tr(SHELL, key, lang, vars)
}

/** "2026-03-02" → "2026.03.02" */
const fmtDate = (date?: string) => (date ? date.replaceAll('-', '.') : '')

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  )
}

function SettingsContent() {
  const fd1 = useFd1()
  const L = useT()
  return (
    <div className="feature-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{L('setEyebrow')}</span>
          <h1>{L('navSettings')}</h1>
          <p>{L('setDesc')}</p>
        </div>
        <div className="page-heading-icon"><Settings size={30} /></div>
      </div>

      <div className={styles.grid}>
        <LanguageCard fd1={fd1} />
        <ProfileCard fd1={fd1} />
        <NotifyCard />
        <CalendarCard />
        <PrivacyCard />
      </div>

      <p className={styles.footer}>{L('setFooter')}</p>
    </div>
  )
}

function Card({ id, icon: Icon, title, desc, wide = false, children }: { id: string; icon: LucideIcon; title: string; desc?: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className={wide ? `${styles.card} ${styles.wide}` : styles.card} aria-labelledby={id}>
      <header className={styles.cardHead}>
        <span className={styles.cardIcon} aria-hidden="true"><Icon size={18} /></span>
        <div>
          <h2 id={id}>{title}</h2>
          {desc && <p>{desc}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

function LanguageCard({ fd1 }: { fd1: Fd1State }) {
  // 다른 언어가 LANG_LABEL에 추가되면 여기에도 자동으로 나온다
  const langs = Object.keys(LANG_LABEL) as Fd1Lang[]
  const L = useT()
  return (
    <Card id="settings-lang" icon={Globe} title={L('langTitle')}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.srOnly}>{L('langLegend')}</legend>
        <div className={styles.options}>
          {langs.map((code) => (
            <label key={code} className={styles.option}>
              <input type="radio" name="settings-lang" value={code} checked={fd1.lang === code} onChange={() => fd1.setLang(code)} />
              <span lang={code}>{LANG_LABEL[code]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className={styles.note}>{L('langNote')}</p>
    </Card>
  )
}

function ProfileCard({ fd1 }: { fd1: Fd1State }) {
  const profile = fd1.profile
  const L = useT()
  const visaKey = profile ? VISA_LABEL[profile.visaType] : undefined
  const rows: Array<[string, string]> = profile
    ? [
        [L('visaType'), visaKey ? L(visaKey) : profile.visaType],
        [L('entryDate'), fmtDate(profile.entryDate)],
        [L('arcIssuedDate'), fmtDate(profile.arcIssuedDate)],
        [L('stayExpiryDate'), fmtDate(profile.stayExpiryDate)],
      ]
    : []

  return (
    <Card id="settings-profile" icon={UserRound} title={L('profileTitle')} desc={L('profileDesc')}>
      {profile ? (
        <>
          <span className={fd1.isDemo ? `${styles.badge} ${styles.demo}` : styles.badge}>{fd1.isDemo ? L('demoBadge') : L('myBadge')}</span>
          <dl className={styles.profile}>
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className={value ? undefined : styles.empty}>{value || L('notEntered')}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className={styles.muted} role="status">{fd1.planError ? L('profileError') : L('profileLoading')}</p>
      )}
      <Link className={styles.linkButton} href="/visa"><Pencil size={15} aria-hidden="true" />{L('editProfile')}</Link>
    </Card>
  )
}

function NotifyCard() {
  const [notify, setNotify] = useNotifySettings()
  const L = useT()

  const toggleDay = (day: NotifyDay, on: boolean) => {
    const days = NOTIFY_DAYS.filter((d) => (d === day ? on : notify.days.includes(d)))
    setNotify({ ...notify, days })
  }

  return (
    <Card id="settings-notify" icon={Bell} title={L('notifyTitle')} desc={L('notifyDesc')}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{L('notifyWhen')}</legend>
        <div className={styles.options}>
          {NOTIFY_DAYS.map((day) => (
            <label key={day} className={styles.option}>
              <input type="checkbox" checked={notify.days.includes(day)} onChange={(event) => toggleDay(day, event.target.checked)} />
              <span>
                <i className={styles.check} aria-hidden="true"><Check size={11} strokeWidth={3.2} /></i>
                {day === 1 ? L('dayBefore') : L('daysBefore', { n: day })} <small>D-{day}</small>
              </span>
            </label>
          ))}
        </div>
        {notify.days.length === 0 && <p className={styles.warnText} role="status">{L('notifyAllOff')}</p>}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{L('notifyWhere')}</legend>
        <div className={styles.options}>
          {NOTIFY_CHANNELS.map((channel) => (
            <label key={channel} className={styles.option}>
              <input type="radio" name="settings-channel" value={channel} checked={notify.channel === channel} onChange={() => setNotify({ ...notify, channel })} />
              <span>{L(CHANNEL_LABEL[channel])}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className={styles.note}>{L('notifyNote')}</p>
    </Card>
  )
}

function CalendarCard() {
  const [on, setOn] = useCalendarActionsEnabled()
  const L = useT()
  return (
    <Card id="settings-calendar" icon={CalendarPlus} title={L('calTitle')} desc={L('calDesc')}>
      <label className={styles.switchRow}>
        <span>
          <strong>{L('calSwitch')}</strong>
          <small>{L('calSwitchHint')}</small>
        </span>
        <input className={styles.switch} type="checkbox" role="switch" checked={on} onChange={(event) => setOn(event.target.checked)} />
      </label>
      <p className={styles.status} aria-live="polite">{on ? L('calOn') : L('calOff')}</p>
    </Card>
  )
}

function PrivacyCard() {
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const L = useT()

  const close = () => {
    setConfirming(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const reset = () => {
    clearLocalData(Object.values(STORAGE_KEYS))
    setDone(true)
    close()
  }

  return (
    <Card id="settings-privacy" icon={Lock} title={L('privacyTitle')} wide>
      <p className={styles.privacy}>{L('privacyText')}</p>
      {confirming ? (
        <div className={styles.confirm} role="group" aria-label={L('resetConfirmAria')}>
          <strong>{L('resetConfirmQ')}</strong>
          <button type="button" className={styles.dangerButton} onClick={reset}>{L('resetButton')}</button>
          <button type="button" className={styles.ghostButton} onClick={close} autoFocus>{L('cancel')}</button>
        </div>
      ) : (
        <button ref={triggerRef} type="button" className={`${styles.ghostButton} ${styles.outlineDanger}`} onClick={() => { setDone(false); setConfirming(true) }}>
          {L('resetTrigger')}
        </button>
      )}
      <p className={styles.done} role="status">{done ? L('resetDone') : ''}</p>
    </Card>
  )
}
