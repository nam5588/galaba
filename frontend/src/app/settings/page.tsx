'use client'

import Link from 'next/link'
import { useRef, useState, type ReactNode } from 'react'
import { Bell, CalendarPlus, Check, Globe, Lock, Pencil, Settings, UserRound, type LucideIcon } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useFd1, type Fd1State } from '@/components/fd1/useFd1'
import { LANG_LABEL, STORAGE_KEYS, type Fd1Lang } from '@/lib/fd1'
import { clearLocalData, NOTIFY_CHANNELS, NOTIFY_DAYS, useCalendarActionsEnabled, useNotifySettings, type NotifyChannel, type NotifyDay } from '@/lib/settings'
import styles from '@/components/settings/settings.module.css'

const CHANNEL_LABEL: Record<NotifyChannel, string> = { web: '웹 알림', kakao: '카카오톡', telegram: '텔레그램' }
const VISA_LABEL: Partial<Record<string, string>> = { 'D-2': 'D-2 · 유학', 'D-4': 'D-4 · 어학연수' }

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
  return (
    <div className="feature-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">내 계정 · 환경 설정</span>
          <h1>설정</h1>
          <p>언어, 알림, 캘린더 연동과 개인정보를 한곳에서 관리하세요.</p>
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

      <p className={styles.footer}>정확한 체류·학사 정보는 국제교류팀 또는 외국인종합안내센터(☎ 1345)에서 확인하세요.</p>
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
  return (
    <Card id="settings-lang" icon={Globe} title="언어">
      <fieldset className={styles.fieldset}>
        <legend className={styles.srOnly}>화면 언어 선택</legend>
        <div className={styles.options}>
          {langs.map((code) => (
            <label key={code} className={styles.option}>
              <input type="radio" name="settings-lang" value={code} checked={fd1.lang === code} onChange={() => fd1.setLang(code)} />
              <span lang={code}>{LANG_LABEL[code]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className={styles.note}>화면 안내와 알림 언어가 바뀌어요. AI 채팅은 질문한 언어로 답해요.</p>
    </Card>
  )
}

function ProfileCard({ fd1 }: { fd1: Fd1State }) {
  const profile = fd1.profile
  const rows: Array<[string, string]> = profile
    ? [
        ['비자 종류', VISA_LABEL[profile.visaType] ?? profile.visaType],
        ['입국일', fmtDate(profile.entryDate)],
        ['외국인등록증 발급일', fmtDate(profile.arcIssuedDate)],
        ['체류 만료일', fmtDate(profile.stayExpiryDate)],
      ]
    : []

  return (
    <Card id="settings-profile" icon={UserRound} title="내 정보" desc="체류·건강보험 일정 계산에 쓰는 정보예요.">
      {profile ? (
        <>
          <span className={fd1.isDemo ? `${styles.badge} ${styles.demo}` : styles.badge}>{fd1.isDemo ? '데모 사용자 정보' : '내가 입력한 정보'}</span>
          <dl className={styles.profile}>
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className={value ? undefined : styles.empty}>{value || '입력 안 함'}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className={styles.muted} role="status">{fd1.planError ? '정보를 불러오지 못했어요. 비자 & 체류 화면에서 직접 입력할 수 있어요.' : '내 정보를 불러오는 중이에요…'}</p>
      )}
      <Link className={styles.linkButton} href="/visa"><Pencil size={15} aria-hidden="true" />내 정보 수정</Link>
    </Card>
  )
}

function NotifyCard() {
  const [notify, setNotify] = useNotifySettings()

  const toggleDay = (day: NotifyDay, on: boolean) => {
    const days = NOTIFY_DAYS.filter((d) => (d === day ? on : notify.days.includes(d)))
    setNotify({ ...notify, days })
  }

  return (
    <Card id="settings-notify" icon={Bell} title="알림" desc="체류·보험 기한을 언제, 어디로 알려드릴지 골라요.">
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>언제 알려드릴까요?</legend>
        <div className={styles.options}>
          {NOTIFY_DAYS.map((day) => (
            <label key={day} className={styles.option}>
              <input type="checkbox" checked={notify.days.includes(day)} onChange={(event) => toggleDay(day, event.target.checked)} />
              <span>
                <i className={styles.check} aria-hidden="true"><Check size={11} strokeWidth={3.2} /></i>
                {day === 1 ? '하루 전' : `${day}일 전`} <small>D-{day}</small>
              </span>
            </label>
          ))}
        </div>
        {notify.days.length === 0 && <p className={styles.warnText} role="status">모든 알림이 꺼져 있어요. 기한을 놓치지 않게 하나 이상 켜 두세요.</p>}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>어디로 받을까요?</legend>
        <div className={styles.options}>
          {NOTIFY_CHANNELS.map((channel) => (
            <label key={channel} className={styles.option}>
              <input type="radio" name="settings-channel" value={channel} checked={notify.channel === channel} onChange={() => setNotify({ ...notify, channel })} />
              <span>{CHANNEL_LABEL[channel]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className={styles.note}>카카오톡·텔레그램 발송은 준비 중이에요 (시연용 설정)</p>
    </Card>
  )
}

function CalendarCard() {
  const [on, setOn] = useCalendarActionsEnabled()
  return (
    <Card id="settings-calendar" icon={CalendarPlus} title="캘린더 연동" desc="AI가 알려준 기한을 내 캘린더에 바로 넣어요.">
      <label className={styles.switchRow}>
        <span>
          <strong>AI 답변에 구글 캘린더 추가 버튼 보여주기</strong>
          <small>기한이 있는 답변 아래에 &lsquo;구글 캘린더에 추가&rsquo; 버튼이 붙어요.</small>
        </span>
        <input className={styles.switch} type="checkbox" role="switch" checked={on} onChange={(event) => setOn(event.target.checked)} />
      </label>
      <p className={styles.status} aria-live="polite">{on ? '켜짐 — 채팅 답변에 캘린더 버튼이 보여요.' : '꺼짐 — 채팅 답변에서 캘린더 버튼을 숨겨요.'}</p>
    </Card>
  )
}

function PrivacyCard() {
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

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
    <Card id="settings-privacy" icon={Lock} title="개인정보" wide>
      <p className={styles.privacy}>대화 내용은 서버에 저장하지 않아요. 내 정보와 설정은 이 브라우저에만 저장돼요.</p>
      {confirming ? (
        <div className={styles.confirm} role="group" aria-label="초기화 확인">
          <strong>정말 초기화할까요?</strong>
          <button type="button" className={styles.dangerButton} onClick={reset}>초기화</button>
          <button type="button" className={styles.ghostButton} onClick={close} autoFocus>취소</button>
        </div>
      ) : (
        <button ref={triggerRef} type="button" className={`${styles.ghostButton} ${styles.outlineDanger}`} onClick={() => { setDone(false); setConfirming(true) }}>
          이 브라우저의 내 정보·설정 초기화
        </button>
      )}
      <p className={styles.done} role="status">{done ? '초기화했어요. 언어·알림·캘린더는 기본값, 내 정보는 데모 사용자로 돌아갔어요.' : ''}</p>
    </Card>
  )
}
