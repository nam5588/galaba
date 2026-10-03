'use client'

import { useState, type FormEvent } from 'react'
import { ExternalLink, FileText, Pencil, ShieldCheck } from 'lucide-react'
import { dDayLabel, shortDate, t, won, type Fd1Lang, type Fd1Profile, type Fd1Task, type VisaType } from '@/lib/fd1'
import type { Fd1State } from './useFd1'
import styles from './fd1.module.css'

export type Fd1Section = 'visa' | 'insurance'

/** 가운데 영역: 비자 & 체류 / 건강보험 (FD1-1~6) */
export function Fd1Panel({ fd1, section, hideTitle = false }: { fd1: Fd1State; section: Fd1Section; hideTitle?: boolean }) {
  const { lang, plan, guides, profile } = fd1
  const [editing, setEditing] = useState(false)
  const isVisa = section === 'visa'

  const tasks = (plan?.tasks ?? []).filter((task) => (isVisa ? task.type !== 'NHIS_PAY' : task.type === 'NHIS_PAY'))

  return (
    <section className={styles.panel} aria-label={t(isVisa ? 'visaStay' : 'insurance', lang)}>
      <div className={styles.header}>
        {hideTitle ? <span /> : <h2>{isVisa ? <FileText size={22} /> : <ShieldCheck size={22} />}{t(isVisa ? 'visaStay' : 'insurance', lang)}</h2>}
        {profile && !editing && (
          <button type="button" className={styles.ghostButton} onClick={() => setEditing(true)}>
            <Pencil size={14} />{t('editInfo', lang)}
          </button>
        )}
      </div>

      {editing && profile ? (
        <ProfileForm
          lang={lang}
          initial={profile}
          onCancel={() => setEditing(false)}
          onSave={(next) => { fd1.saveProfile(next); setEditing(false) }}
        />
      ) : (
        fd1.isDemo && <p className={styles.note}>{t('demoNote', lang)}</p>
      )}
      {!fd1.isDemo && !editing && (
        <p className={styles.note}>
          <button type="button" className={styles.linkButton} onClick={fd1.resetToDemo}>{t('useDemo', lang)}</button>
        </p>
      )}

      {fd1.planError && <p className={styles.warn}>{t('loadError', lang)}</p>}
      {!plan && !fd1.planError && <p className={styles.note}>{t('loading', lang)}</p>}
      {plan && !plan.rulesVerified && <p className={styles.note}>{t('rulesUnverified', lang)}</p>}

      {plan && (isVisa ? (
        <>
          <ProfileSummary lang={lang} profile={plan.profile} />
          <div className={styles.tasks}>
            {tasks.length === 0 && <p className={styles.note}>{t('noTasks', lang)}</p>}
            {tasks.map((task) => <TaskCard key={task.type} task={task} lang={lang} fd1={fd1} />)}
          </div>
        </>
      ) : (
        <Insurance fd1={fd1} />
      ))}

      {guides && (
        <div className={styles.footer}>
          {guides.disclaimer}{' '}
          {guides.sources.map((s, i) => (
            <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>
          ))}
        </div>
      )}
    </section>
  )
}

function ProfileSummary({ lang, profile }: { lang: Fd1Lang; profile: Fd1Profile }) {
  return (
    <div className={styles.summary}>
      <span>{t('visaType', lang)} <b>{profile.visaType}</b></span>
      <span>{t('entryDate', lang)} <b>{profile.entryDate}</b></span>
      {profile.arcIssuedDate && <span>{t('arcIssuedDate', lang)} <b>{profile.arcIssuedDate}</b></span>}
      {profile.stayExpiryDate && <span>{t('stayExpiryDate', lang)} <b>{profile.stayExpiryDate}</b></span>}
    </div>
  )
}

function TaskCard({ task, lang, fd1 }: { task: Fd1Task; lang: Fd1Lang; fd1: Fd1State }) {
  const guide = fd1.guides?.guides[task.type]
  const meta = task.status === 'OVERDUE'
    ? `${t('overdue', lang)} · ${task.dueDate}`
    : task.status === 'UPCOMING' && task.openDate
      ? `${shortDate(task.openDate, lang)} ${t('opensOn', lang)} · ${task.dueDate}`
      : task.dueDate
  return (
    <article className={`${styles.task} ${styles[task.urgency]}`}>
      <div className={styles.taskTop}>
        <strong>{guide?.title ?? task.type}</strong>
        <span className={styles.badge}>{dDayLabel(task.daysLeft)}</span>
      </div>
      <p className={styles.taskMeta}>{meta}</p>
      {guide && (
        <>
          <p className={styles.taskSummary}>{guide.summary}</p>
          <ul className={styles.checklist} aria-label={t('checklist', lang)}>
            {guide.checklist.map((item) => <li key={item.id}>{item.text}</li>)}
          </ul>
          <div className={styles.links}>
            {guide.links.map((link) => (
              <a key={link.url} href={link.url} target={link.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                {link.label}<ExternalLink size={12} />
              </a>
            ))}
          </div>
        </>
      )}
    </article>
  )
}

function Insurance({ fd1 }: { fd1: Fd1State }) {
  const { lang, plan } = fd1
  if (!plan) return null
  const ins = plan.insurance
  const nhis = plan.tasks.find((task) => task.type === 'NHIS_PAY')
  if (!ins.enrolled) return <p className={styles.note}>{t('notEnrolled', lang)}</p>

  return (
    <>
      {ins.benefitRestricted && <p className={styles.warn}>{t('benefitRestricted', lang)}</p>}
      <div className={styles.stats}>
        <div className={styles.stat}><span>{t('insurance', lang)}</span><b>{t('monthsEnrolled', lang, { n: ins.monthsEnrolled })}</b></div>
        <div className={styles.stat}><span>{t('paidTotal', lang)}</span><b>{won(ins.paidTotal, lang)}</b></div>
        <div className={`${styles.stat} ${ins.unpaidMonths > 0 ? styles.alert : ''}`}><span>{t('unpaidLabel', lang)}</span><b>{t('unpaid', lang, { n: ins.unpaidMonths })}</b></div>
        <div className={styles.stat}><span>{t('nextDue', lang)}</span><b>{ins.nextDueDate ? `${shortDate(ins.nextDueDate, lang)}${nhis ? ` · ${dDayLabel(nhis.daysLeft)}` : ''}` : '-'}</b></div>
      </div>
      {nhis && <div className={styles.tasks} style={{ marginBottom: 16 }}><TaskCard task={nhis} lang={lang} fd1={fd1} /></div>}
      <div className={styles.months}>
        {[...ins.months].reverse().map((m) => (
          <div key={m.month} className={`${styles.month} ${m.paid ? styles.isPaid : m.overdue ? styles.isOverdue : ''}`}>
            <div className={styles.monthTop}><span>{m.month}</span><span>{won(m.amount, lang)}</span></div>
            <small>{t('nextDue', lang)}: {shortDate(m.dueDate, lang)}</small>
            <button type="button" className={styles.payButton} onClick={() => fd1.togglePaid(m.month)} aria-pressed={m.paid}>
              {m.paid ? `✓ ${t('paid', lang)}` : t('markPaid', lang)}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

/** 온보딩 / 정보 수정. 건강보험 납부 체크(paidMonths)는 그대로 유지한다. */
function ProfileForm({ lang, initial, onSave, onCancel }: {
  lang: Fd1Lang
  initial: Fd1Profile
  onSave: (profile: Fd1Profile) => void
  onCancel: () => void
}) {
  const [visaType, setVisaType] = useState<VisaType>(initial.visaType)
  const [entryDate, setEntryDate] = useState(initial.entryDate)
  const [hasArc, setHasArc] = useState(Boolean(initial.arcIssuedDate))
  const [arcIssuedDate, setArcIssuedDate] = useState(initial.arcIssuedDate ?? '')
  const [stayExpiryDate, setStayExpiryDate] = useState(initial.stayExpiryDate ?? '')
  const [moveDate, setMoveDate] = useState(initial.moveDate ?? '')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!entryDate) return setError(t('entryDate', lang))
    if (hasArc && arcIssuedDate && arcIssuedDate < entryDate) return setError(`${t('arcIssuedDate', lang)} ≥ ${t('entryDate', lang)}`)
    if (hasArc && stayExpiryDate && stayExpiryDate <= entryDate) return setError(`${t('stayExpiryDate', lang)} > ${t('entryDate', lang)}`)
    if (moveDate && moveDate < entryDate) return setError(`${t('moveDate', lang)} ≥ ${t('entryDate', lang)}`)
    onSave({
      visaType,
      entryDate,
      ...(hasArc && arcIssuedDate ? { arcIssuedDate } : {}),
      ...(hasArc && stayExpiryDate ? { stayExpiryDate } : {}),
      ...(moveDate ? { moveDate } : {}),
      paidMonths: initial.paidMonths ?? [],
    })
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>{t('visaType', lang)}
        <select value={visaType} onChange={(e) => setVisaType(e.target.value as VisaType)}>
          <option value="D-2">D-2</option>
          <option value="D-4">D-4</option>
        </select>
      </label>
      <label className={styles.field}>{t('entryDate', lang)}
        <input type="date" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
      </label>
      <label className={styles.check}>
        <input type="checkbox" checked={hasArc} onChange={(e) => setHasArc(e.target.checked)} />{t('hasArc', lang)}
      </label>
      <label className={styles.field}>{t('moveDate', lang)}
        <input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
      </label>
      {hasArc && (
        <>
          <label className={styles.field}>{t('arcIssuedDate', lang)}
            <input type="date" value={arcIssuedDate} onChange={(e) => setArcIssuedDate(e.target.value)} />
          </label>
          <label className={styles.field}>{t('stayExpiryDate', lang)}
            <input type="date" value={stayExpiryDate} onChange={(e) => setStayExpiryDate(e.target.value)} />
          </label>
        </>
      )}
      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryButton}>{t('save', lang)}</button>
        <button type="button" className={styles.ghostButton} onClick={onCancel}>{t('cancel', lang)}</button>
        {error && <span className={styles.formError}>{error}</span>}
      </div>
    </form>
  )
}
