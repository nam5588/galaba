'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Home,
  IdCard,
  ListChecks,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  RotateCcw,
  Sparkles,
  SquarePen,
  X,
  type LucideIcon,
} from 'lucide-react'
import { AssistantMessage, ErrorMessage, PendingMessage, UserMessage } from '@/components/chat/ChatMessages'
import styles from '@/components/chat/chat.module.css'
import { toolMeta } from '@/components/chat/tools'
import { sendChat, type ChatResponse, type ChatTurn } from '@/lib/chat'

type UiMessage =
  | { id: string; role: 'user'; content: string }
  | { id: string; role: 'assistant'; content: string; data: ChatResponse }
  | { id: string; role: 'error'; content: string; retry: string }

interface Suggestion {
  icon: LucideIcon
  topic: string
  /** 사이드바 '자주 묻는 질문'에 보이는 짧은 이름 */
  short: string
  question: string
  /** 이 질문에 오케스트레이터가 부를 도구 (PRD 3장) */
  tools: string[]
}

/** PRD 3장 시나리오. 첫 번째(시나리오 5)가 시연의 주인공이다. */
const HERO: Suggestion = {
  icon: ListChecks,
  topic: '이번 주 할 일 · 한 번에 정리',
  short: '이번 주 챙길 것',
  question: '이번 주에 내가 챙겨야 할 거 정리해줘',
  tools: ['get_deadlines', 'get_timetable', 'get_notices'],
}

const SUGGESTIONS: Suggestion[] = [
  { icon: IdCard, topic: '비자 · 체류', short: '비자 만료 · 연장', question: '내 비자 언제까지야? 연장하려면 뭐 해야 돼?', tools: ['get_deadlines'] },
  { icon: CalendarDays, topic: '수업 · 휴강', short: '오늘 수업 · 휴강', question: '오늘 수업 뭐 있고, 휴강 공지 있어?', tools: ['get_timetable', 'get_notices'] },
  { icon: Briefcase, topic: '알바 · English', short: '주말 알바 (English)', question: 'Can I work at a convenience store on weekends?', tools: ['search_jobs', 'search_regulations'] },
  { icon: BookOpen, topic: '휴학 · 학칙', short: '휴학하면?', question: '휴학하면 어떻게 돼?', tools: ['search_regulations'] },
]

const ALL_QUESTIONS = [HERO, ...SUGGESTIONS]

/** 빈 화면에 보여주는 '골라 쓰는 도구' */
const CAPABILITIES = ['get_deadlines', 'get_timetable', 'get_notices', 'search_jobs', 'search_regulations'].map(toolMeta)

const REQUEST_TIMEOUT_MS = 90_000
const OFFLINE_MESSAGE = '서버에 연결할 수 없어요. 백엔드(npm run dev:backend)가 켜져 있는지 확인해주세요.'

let messageSeq = 0
const nextId = () => `m${++messageSeq}`

/** 실패한 질문과 에러 말풍선은 빼고, 백엔드에 보낼 텍스트 대화 기록만 남긴다. */
function toHistory(messages: UiMessage[]): ChatTurn[] {
  return messages.flatMap((m, i): ChatTurn[] => {
    if (m.role === 'error') return []
    if (m.role === 'user' && messages[i + 1]?.role === 'error') return []
    return [{ role: m.role, content: m.content }]
  })
}

function describeError(error: unknown) {
  const name = error instanceof Error || error instanceof DOMException ? error.name : ''
  if (name === 'TimeoutError') return '답변이 너무 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.'
  if (error instanceof Error && /^API \d+/.test(error.message)) {
    return `답변을 만드는 중 서버에서 문제가 생겼어요 (${error.message}). 잠시 후 다시 시도해주세요.`
  }
  return OFFLINE_MESSAGE
}

export default function ChatPage() {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [pending, setPending] = useState(false)
  const [draft, setDraft] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<AbortController | null>(null)

  const lastRole = messages.at(-1)?.role

  // 새 메시지가 생기면 스크롤: 기다리는 중엔 맨 아래, 답이 오면 "내 질문 + 답의 첫 부분"이 보이게
  useEffect(() => {
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (pending || lastRole === 'user') {
      endRef.current?.scrollIntoView({ behavior, block: 'end' })
    } else if (lastRole) {
      const rows = threadRef.current?.querySelectorAll<HTMLElement>('[data-message]')
      const question = rows && (rows[rows.length - 2] ?? rows[rows.length - 1])
      question?.scrollIntoView({ behavior, block: 'start' })
    }
  }, [messages.length, lastRole, pending])

  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus()
  }, [])

  const ask = async (raw: string, base: UiMessage[] = messages) => {
    const text = raw.trim()
    if (!text || pending) return

    const next: UiMessage[] = [...base, { id: nextId(), role: 'user', content: text }]
    setMessages(next)
    setPending(true)
    setMobileNavOpen(false)

    const controller = new AbortController()
    requestRef.current = controller
    const timer = window.setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), REQUEST_TIMEOUT_MS)

    try {
      const data = await sendChat(toHistory(next), controller.signal)
      if (requestRef.current !== controller) return // 그 사이 "새 대화"를 눌렀다
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: data.answer, data }])
    } catch (error) {
      if (requestRef.current !== controller) return
      setMessages((prev) => [...prev, { id: nextId(), role: 'error', content: describeError(error), retry: text }])
    } finally {
      window.clearTimeout(timer)
      if (requestRef.current === controller) {
        requestRef.current = null
        setPending(false)
      }
    }
  }

  const submitDraft = () => {
    if (pending || !draft.trim()) return
    void ask(draft)
    setDraft('')
    if (inputRef.current) inputRef.current.style.height = ''
  }

  const retry = (errorIndex: number) => {
    const failed = messages[errorIndex]
    if (failed?.role !== 'error') return
    // 실패한 질문(바로 앞 user 말풍선)과 에러 말풍선을 지우고 같은 질문을 다시 보낸다
    void ask(failed.retry, messages.slice(0, Math.max(0, errorIndex - 1)))
  }

  const startNewChat = () => {
    requestRef.current?.abort()
    requestRef.current = null
    setMessages([])
    setPending(false)
    setDraft('')
    setMobileNavOpen(false)
    scrollerRef.current?.scrollTo({ top: 0 })
    inputRef.current?.focus()
  }

  const hasMessages = messages.length > 0

  return (
    <main className={`app-shell ${styles.shell}`}>
      <Suspense fallback={null}>
        <AutoAsk onAsk={(q) => void ask(q)} />
      </Suspense>

      <aside className={`sidebar ${styles.sidebar}${mobileNavOpen ? ' mobile-open' : ''}`}>
        <div className="brand-row">
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>
              <GraduationCap size={20} />
            </span>
            <span>
              <strong>Dojang</strong>
              <small>국민대 유학생 행정비서</small>
            </span>
          </Link>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="메뉴 닫기">
            <X size={20} />
          </button>
        </div>
        <nav className="main-nav" aria-label="주요 메뉴">
          <Link href="/" className="nav-item">
            <Home size={20} />
            <span>홈</span>
          </Link>
          <button className="nav-item active" aria-current="page" onClick={() => setMobileNavOpen(false)}>
            <MessageCircle size={20} />
            <span>AI 상담하기</span>
          </button>
          <button className="nav-item" onClick={startNewChat}>
            <SquarePen size={20} />
            <span>새 대화</span>
          </button>
        </nav>
        <div className="chat-list">
          <div className="chat-heading">
            <span>자주 묻는 질문</span>
          </div>
          {ALL_QUESTIONS.map(({ icon: Icon, short, question }) => (
            <button className="chat-item" key={question} onClick={() => void ask(question)} disabled={pending} title={question}>
              <Icon size={17} />
              <span>{short}</span>
              <small>
                <ChevronRight size={14} />
              </small>
            </button>
          ))}
        </div>
        <div className="ai-help">
          <div className="bot-icon">
            <BookOpen size={18} />
          </div>
          <div>
            <strong>근거와 함께 답해요</strong>
            <span>
              학칙 조항·공지 링크를
              <br />
              출처로 함께 보여드려요.
            </span>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={`topbar ${styles.topbar}`}>
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="메뉴 열기">
            <MoreHorizontal size={24} />
          </button>
          <div className={styles.titleBlock}>
            <span className={styles.titleIcon}>
              <Sparkles size={19} />
            </span>
            <div>
              <h1>AI 상담하기</h1>
              <p>체류·학교·알바, 필요한 도구를 골라 근거와 함께 답해요</p>
            </div>
          </div>
          <div className={styles.topActions}>
            {hasMessages && (
              <button type="button" className={styles.ghostButton} onClick={startNewChat}>
                <RotateCcw size={15} />
                <span>새 대화</span>
              </button>
            )}
            <Link href="/" className={styles.ghostButton}>
              <ArrowLeft size={15} />
              <span>홈</span>
            </Link>
            <div className="profile">
              <div className="avatar">김</div>
              <div>
                <strong>무하마드</strong>
                <small>컴퓨터공학과 · 3학년</small>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        <div ref={scrollerRef} className={styles.scroller}>
          {hasMessages ? (
            <div ref={threadRef} className={styles.thread} aria-live="polite">
              {messages.map((m, i) => (
                <div key={m.id} data-message={m.role} className={styles.message}>
                  {m.role === 'user' && <UserMessage text={m.content} />}
                  {m.role === 'assistant' && <AssistantMessage data={m.data} />}
                  {m.role === 'error' && <ErrorMessage text={m.content} onRetry={i === messages.length - 1 && !pending ? () => retry(i) : undefined} />}
                </div>
              ))}
              {pending && (
                <div className={styles.message}>
                  <PendingMessage />
                </div>
              )}
              <div ref={endRef} className={styles.threadEnd} />
            </div>
          ) : (
            <EmptyState onPick={(q) => void ask(q)} />
          )}
        </div>

        <div className={styles.composerWrap}>
          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault()
              submitDraft()
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              aria-label="Dojang에게 질문하기"
              placeholder="무엇이든 물어보세요 (English OK)"
              onChange={(e) => {
                setDraft(e.target.value)
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || e.shiftKey) return
                if (e.nativeEvent.isComposing || e.keyCode === 229) return // 한글 조합 중 Enter 무시
                e.preventDefault()
                submitDraft()
              }}
            />
            <button type="submit" className={styles.sendButton} disabled={pending || !draft.trim()} aria-label={pending ? '답변을 기다리는 중' : '질문 보내기'}>
              {pending ? <LoaderCircle size={20} className={styles.spin} /> : <ArrowUp size={21} strokeWidth={2.6} />}
            </button>
          </form>
          <p className={styles.composerHint}>Enter 보내기 · Shift+Enter 줄바꿈 · 중요한 결정 전에는 학사지원팀·국제교류팀에 한 번 더 확인하세요.</p>
        </div>
      </div>

      {mobileNavOpen && <button className={styles.scrim} aria-label="메뉴 닫기" onClick={() => setMobileNavOpen(false)} />}
    </main>
  )
}

function EmptyState({ onPick }: { onPick: (question: string) => void }) {
  const HeroIcon = HERO.icon
  return (
    <div className={styles.empty}>
      <div className={styles.emptyAvatar} aria-hidden="true">
        <Sparkles size={28} />
      </div>
      <p className={styles.emptyEyebrow}>Dojang AI 상담</p>
      <h2 className={styles.emptyTitle}>무하마드님, 무엇이든 물어보세요</h2>
      <p className={styles.emptyLead}>
        비자 기한, 오늘 수업과 휴강 공지, 알바 조건, 학칙까지
        <br className={styles.desktopBreak} /> 질문에 맞는 도구를 골라 한 번에 모으고 <strong>출처와 함께</strong> 알려드려요.
      </p>

      <div className={styles.suggestions}>
        <button type="button" className={`${styles.suggestion} ${styles.suggestionHero}`} onClick={() => onPick(HERO.question)}>
          <span className={styles.suggestionIcon}>
            <HeroIcon size={22} />
          </span>
          <span className={styles.suggestionText}>
            <small>
              <span className={styles.heroBadge}>추천</span>
              {HERO.topic}
            </small>
            <strong>{HERO.question}</strong>
            <span className={styles.heroTools}>
              {HERO.tools.map((tool) => {
                const { label, icon: Icon } = toolMeta(tool)
                return (
                  <span key={tool} className={styles.heroTool}>
                    <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                    {label}
                  </span>
                )
              })}
            </span>
          </span>
          <ArrowUp size={18} className={styles.suggestionArrow} />
        </button>

        {SUGGESTIONS.map(({ icon: Icon, topic, question }) => (
          <button key={question} type="button" className={styles.suggestion} onClick={() => onPick(question)}>
            <span className={styles.suggestionIcon}>
              <Icon size={19} />
            </span>
            <span className={styles.suggestionText}>
              <small>{topic}</small>
              <strong>{question}</strong>
            </span>
            <ArrowUp size={16} className={styles.suggestionArrow} />
          </button>
        ))}
      </div>

      <div className={styles.capabilities} aria-label="Dojang이 골라 쓰는 도구">
        <span className={styles.capabilitiesLabel}>Dojang이 질문에 맞게 골라 쓰는 도구</span>
        <div className={styles.capabilityFlow}>
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <span key={label} className={styles.capabilityPill}>
              <Icon size={14} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** /chat?q=질문 으로 들어오면 그 질문을 한 번 자동으로 보내고 주소에서 q를 지운다. */
function AutoAsk({ onAsk }: { onAsk: (question: string) => void }) {
  const q = useSearchParams().get('q')?.trim() || null
  const router = useRouter()
  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (!q) {
      handled.current = null
      return
    }
    if (handled.current === q) return
    handled.current = q
    onAsk(q)
    router.replace('/chat', { scroll: false })
  }, [q, onAsk, router])

  return null
}
