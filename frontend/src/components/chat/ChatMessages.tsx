'use client'

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { BookMarked, Bot, CalendarPlus, Check, ChevronDown, CloudOff, ExternalLink, RotateCcw, WifiOff, Workflow, type LucideIcon } from 'lucide-react'
import { formatShortDate, type ChatAction, type ChatResponse, type ChatSource, type ChatStep } from '@/lib/chat'
import { tr, useLang, type Lang } from '@/lib/i18n'
import { CHAT_T } from '@/lib/i18n/chat'
import { useCalendarActionsEnabled } from '@/lib/settings'
import { ChatMarkdown } from './ChatMarkdown'
import { SOURCE_ICONS, toolMeta } from './tools'
import styles from './chat.module.css'
import type { ChatErrorKind } from './useChat'

type Key = keyof typeof CHAT_T
/** 화면 언어로 CHAT_T 문구 꺼내기 */
function useT() {
  const lang = useLang()
  return { lang, t: (key: Key, vars?: Record<string, string | number>) => tr(CHAT_T, key, lang, vars) }
}

const stagger = (i: number) => ({ '--i': i }) as CSSProperties

function BotRow({ meta, pending = false, children }: { meta?: ReactNode; pending?: boolean; children: ReactNode }) {
  return (
    <div className={styles.botRow}>
      <div className={pending ? `${styles.botAvatar} ${styles.botAvatarPulse}` : styles.botAvatar} aria-hidden="true">
        <Bot size={19} />
      </div>
      <div className={styles.botBody}>
        <div className={styles.botMeta}>
          <span>Dojang</span>
          {meta}
        </div>
        {children}
      </div>
    </div>
  )
}

export function UserMessage({ text }: { text: string }) {
  return (
    <div className={styles.userRow}>
      <div className={styles.userBubble}>{text}</div>
    </div>
  )
}

export function AssistantMessage({ data }: { data: ChatResponse }) {
  // 설정 > 캘린더 연동을 끄면 '구글 캘린더에 추가' 버튼을 숨긴다
  const [calendarOn] = useCalendarActionsEnabled()
  const { t } = useT()
  const offline = data.mode === 'offline' ? (
    <span className={styles.offlineBadge} title={t('offlineTitle')}>
      <CloudOff size={12} />
      {t('offlineBadge')}
    </span>
  ) : null

  return (
    <BotRow meta={offline}>
      <div className={styles.botCard}>
        {(data.toolsUsed.length > 0 || data.steps.length > 0) && <ToolsBar tools={data.toolsUsed} steps={data.steps} />}
        {data.answer.trim() ? <ChatMarkdown text={data.answer} /> : <p className={styles.mutedText}>{t('emptyAnswer')}</p>}
        {data.sources.length > 0 && <SourcesPanel sources={data.sources} />}
        {calendarOn && data.actions.length > 0 && <ActionsPanel actions={data.actions} />}
      </div>
    </BotRow>
  )
}

/** 답 위의 "사용한 도구" 칩 줄. 누르면 도구별 호출 내역(steps)을 펼친다. */
function ToolsBar({ tools, steps }: { tools: string[]; steps: ChatStep[] }) {
  const [open, setOpen] = useState(false)
  const detailId = useId()
  const { lang, t } = useT()

  // 이름이 달라도 같은 칩(예: get_notices · get_school_notices)이면 한 번만
  const chips = tools.map((tool) => toolMeta(tool, lang)).filter((chip, i, all) => all.findIndex((c) => c.label === chip.label) === i)
  if (chips.length === 0) chips.push(toolMeta('', lang))

  const row = (
    <>
      <span className={styles.toolsLabel}>
        <Workflow size={13} aria-hidden="true" />
        {t('toolsUsed')}
      </span>
      <span className={styles.toolChips}>
        {chips.map(({ label, icon: Icon }, i) => (
          <span key={label} className={styles.toolChip} style={stagger(i)}>
            <Icon size={13} strokeWidth={2.3} aria-hidden="true" />
            {label}
          </span>
        ))}
      </span>
    </>
  )

  if (steps.length === 0) return <div className={styles.toolsBar}><div className={styles.toolsRow}>{row}</div></div>

  return (
    <div className={styles.toolsBar}>
      <button type="button" className={`${styles.toolsRow} ${styles.toolsToggle}`} aria-expanded={open} aria-controls={detailId} onClick={() => setOpen((v) => !v)}>
        {row}
        <span className={styles.toolsMore}>
          {open ? t('collapse') : t('showSteps', { n: steps.length })}
          <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
        </span>
      </button>
      {open && (
        <ol id={detailId} className={styles.steps}>
          {steps.map((step, i) => {
            const Icon = toolMeta(step.tool).icon
            return (
              <li key={`${step.tool}-${i}`} className={styles.step} style={stagger(i)}>
                <span className={styles.stepIcon}>
                  <Icon size={13} strokeWidth={2.3} aria-hidden="true" />
                </span>
                <span className={styles.stepText}>
                  {/* FD 도구에 label이 없으면 백엔드가 도구 이름을 그대로 보낸다 -> 화면 언어 이름으로 */}
                  <span className={styles.stepLabel}>{stepLabel(step, lang)}</span>
                  {step.tool && <code className={styles.stepTool}>{step.tool}</code>}
                </span>
                <Check size={14} className={styles.stepCheck} aria-label={t('done')} />
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

/** 단계 이름: 한국어 화면이면 백엔드 label 그대로, 다른 언어면 도구 이름을 번역하고 ':' 뒤 검색어만 붙인다 */
function stepLabel(step: ChatStep, lang: Lang) {
  const hasLabel = step.label && step.label !== step.tool
  if (lang === 'ko' && hasLabel) return step.label
  const name = toolMeta(step.tool, lang).label
  const detail = hasLabel ? step.label.split(/:\s*/).slice(1).join(': ').trim() : ''
  return detail ? `${name}: ${detail}` : name
}

/** 조항처럼 원문(text)이 있으면 펼쳐 보고, 링크만 있으면 새 탭으로 연다. */
const isExpandable = (s: ChatSource) => Boolean(s.text) && (s.kind === 'regulation' || !s.url)

function SourcesPanel({ sources }: { sources: ChatSource[] }) {
  // 학칙 조항을 먼저, 그다음 공지·공고 링크 (같은 종류 안에서는 받은 순서 그대로)
  const ordered = [...sources.filter((s) => s.kind === 'regulation'), ...sources.filter((s) => s.kind !== 'regulation')]
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const excerptId = useId()
  const excerptRef = useRef<HTMLQuoteElement>(null)
  const { t } = useT()
  const open = openIndex === null ? undefined : ordered[openIndex]

  // 답변 맨 아래 칩을 눌러도 펼친 원문이 화면 밖에 숨지 않게
  useEffect(() => {
    if (openIndex === null) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    excerptRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [openIndex])

  const hasExcerpts = ordered.some(isExpandable)
  const hasLinks = ordered.some((s) => s.url && !isExpandable(s))
  const hint = [hasExcerpts && t('hintExcerpt'), hasLinks && t('hintLinks')].filter(Boolean).join(' · ')

  return (
    <section className={styles.section} aria-label={t('sources')}>
      <div className={styles.sectionTitle}>
        <BookMarked size={15} />
        <span>{t('sources')}</span>
        <span className={styles.countPill}>{ordered.length}</span>
        {hint && <small>{hint}</small>}
      </div>
      <div className={styles.chips}>
        {ordered.map((source, i) => {
          const Icon: LucideIcon = SOURCE_ICONS[source.kind]
          const key = `${source.id}-${i}`

          if (isExpandable(source)) {
            return (
              <button
                key={key}
                type="button"
                className={styles.chip}
                aria-expanded={openIndex === i}
                aria-controls={excerptId}
                title={source.title}
                onClick={() => setOpenIndex((cur) => (cur === i ? null : i))}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{source.title}</span>
                <ChevronDown size={13} className={styles.chipChevron} aria-hidden="true" />
              </button>
            )
          }

          if (source.url) {
            return (
              <a key={key} className={`${styles.chip} ${styles.chipLink}`} href={source.url} target="_blank" rel="noopener noreferrer" title={t('openNewTab', { title: source.title })}>
                <Icon size={14} aria-hidden="true" />
                <span>{source.title}</span>
                <ExternalLink size={12} className={styles.chipExternal} aria-hidden="true" />
              </a>
            )
          }

          return (
            <span key={key} className={`${styles.chip} ${styles.chipStatic}`} title={source.title}>
              <Icon size={14} aria-hidden="true" />
              <span>{source.title}</span>
            </span>
          )
        })}
      </div>
      {open && (
        <blockquote ref={excerptRef} id={excerptId} className={styles.excerpt}>
          <div className={styles.excerptHead}>
            <strong>{open.title}</strong>
          </div>
          <p>{open.text || t('noExcerpt')}</p>
          {open.url && (
            <a className={styles.excerptLink} href={open.url} target="_blank" rel="noopener noreferrer">
              {t('viewOriginal')}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </blockquote>
      )}
    </section>
  )
}

function ActionsPanel({ actions }: { actions: ChatAction[] }) {
  const { t } = useT()
  return (
    <section className={styles.section}>
      <div className={styles.sectionTitle}>
        <CalendarPlus size={15} />
        <span>{t('quickActions')}</span>
      </div>
      <div className={styles.actions}>
        {actions.map((action, i) => (
          <a key={`${action.url}-${i}`} className={styles.actionButton} href={action.url} target="_blank" rel="noopener noreferrer">
            <CalendarPlus size={18} />
            <span className={styles.actionText}>
              <strong>{t('addCalendar')}{action.date && ` · ${formatShortDate(action.date)}`}</strong>
              {action.title && <small>{action.title}</small>}
            </span>
            <ExternalLink size={14} className={styles.actionExternal} />
          </a>
        ))}
      </div>
    </section>
  )
}

const PENDING_HINTS: { tool: string; text: Key }[] = [
  { tool: 'search_regulations', text: 'hintRegs' },
  { tool: 'get_deadlines', text: 'hintDeadlines' },
  { tool: 'get_notices', text: 'hintNotices' },
  { tool: 'get_timetable', text: 'hintTimetable' },
  { tool: 'search_jobs', text: 'hintJobs' },
]

export function PendingMessage() {
  const [hint, setHint] = useState(0)
  const { t } = useT()

  useEffect(() => {
    const timer = window.setInterval(() => setHint((h) => (h + 1) % PENDING_HINTS.length), 1600)
    return () => window.clearInterval(timer)
  }, [])

  const { tool, text } = PENDING_HINTS[hint]
  const Icon = toolMeta(tool).icon

  return (
    <BotRow pending>
      <div className={`${styles.botCard} ${styles.pendingCard}`}>
        <div className={styles.pendingTitle}>{t('pendingTitle')}</div>
        <p key={hint} className={styles.pendingHint} aria-hidden="true">
          <Icon size={13} strokeWidth={2.3} />
          {t(text)}
        </p>
        <div className={styles.skeleton} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </BotRow>
  )
}

const ERROR_KEY: Record<ChatErrorKind, Key> = { offline: 'errOffline', timeout: 'errTimeout', server: 'errServer' }

export function ErrorMessage({ kind, detail, onRetry }: { kind: ChatErrorKind; detail?: string; onRetry?: () => void }) {
  const { t } = useT()
  const text = t(ERROR_KEY[kind], { detail: detail ?? '' })
  return (
    <BotRow>
      <div className={`${styles.botCard} ${styles.errorCard}`} role="alert">
        <div className={styles.errorBody}>
          <WifiOff size={18} />
          <p>{text}</p>
        </div>
        {onRetry && (
          <button type="button" className={styles.retryButton} onClick={onRetry}>
            <RotateCcw size={14} />
            {t('retry')}
          </button>
        )}
      </div>
    </BotRow>
  )
}
