'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ArrowUp, Globe2, ListChecks, LoaderCircle, Paperclip, RotateCcw, Sparkles } from 'lucide-react'
import { AssistantMessage, ErrorMessage, PendingMessage, UserMessage } from './ChatMessages'
import styles from './chat.module.css'
import panel from './panel.module.css'
import type { ChatController } from './useChat'

/** PRD 3장 시연 질문. 첫 번째(시나리오 5)가 시연의 주인공이다. */
const HERO_QUESTION = '이번 주에 내가 챙겨야 할 거 정리해줘'
const SUGGESTIONS = [
  '내 비자 언제까지야? 연장하려면 뭐 해야 돼?',
  '오늘 수업 뭐 있고, 휴강 공지 있어?',
  'Can I work at a convenience store on weekends?',
  '휴학하면 어떻게 돼?',
]

export interface ChatPanelHandle {
  focus: () => void
}

/** 메인 가운데(1번 영역) LLM 채팅창: 빈 화면 → 대화 스레드, 아래에 질문 입력. 이 영역만 스크롤된다. */
export const ChatPanel = forwardRef<ChatPanelHandle, { chat: ChatController }>(function ChatPanel({ chat }, ref) {
  const { messages, pending, ask, retry, reset } = chat
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), [])

  // 메인에 들어오면 바로 질문할 수 있게 입력칸에 커서 (마우스 쓰는 PC에서만. 모바일은 키보드가 튀어나와서 제외)
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus()
  }, [])

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

  const submitDraft = () => {
    if (pending || !draft.trim()) return
    void ask(draft)
    setDraft('')
    if (inputRef.current) inputRef.current.style.height = ''
  }

  const hasMessages = messages.length > 0

  return (
    <section className={panel.panel} aria-label="Dojang AI 채팅">
      {hasMessages && (
        <div className={panel.panelBar}>
          <span>
            <Sparkles size={15} /> Dojang AI 상담
          </span>
          <button type="button" className={styles.ghostButton} onClick={() => { reset(); inputRef.current?.focus() }}>
            <RotateCcw size={14} />
            <span>새 대화</span>
          </button>
        </div>
      )}

      <div ref={scrollerRef} className={panel.scroller}>
        {hasMessages ? (
          <div ref={threadRef} className={`${styles.thread} ${panel.thread}`} aria-live="polite">
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
          <div className={panel.empty}>
            <h1 className={panel.emptyTitle}>귀찮은걸 물어보세요</h1>
            <p className={panel.emptyLead}>비자·보험 기한, 수업과 휴강, 알바, 학칙까지. 필요한 걸 찾아 출처와 함께 알려드려요.</p>
            <div className={panel.suggestions}>
              <button type="button" className={`${panel.suggestion} ${panel.suggestionHero}`} onClick={() => void ask(HERO_QUESTION)}>
                <ListChecks size={15} />
                {HERO_QUESTION}
              </button>
              {SUGGESTIONS.map((q) => (
                <button key={q} type="button" className={panel.suggestion} onClick={() => void ask(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        className={`ask-card ${panel.composer}`}
        onSubmit={(e) => {
          e.preventDefault()
          submitDraft()
        }}
      >
        <div className="ask-heading">
          <Sparkles size={20} />
          <strong>궁금한 걸 물어보세요!</strong>
          <span>DOJANG AI가 학교 생활, 비자, 수강신청, 생활 정보 등 무엇이든 도와드립니다.</span>
        </div>
        <div className={`ask-input ${panel.inputRow}`}>
          <Paperclip size={20} aria-hidden="true" />
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            aria-label="Dojang에게 질문하기"
            placeholder="예) 비자 연장에 필요한 서류가 무엇인가요? (English OK)"
            onChange={(e) => {
              setDraft(e.target.value)
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.shiftKey) return
              if (e.nativeEvent.isComposing || e.keyCode === 229) return // 한글 조합 중 Enter 무시
              e.preventDefault()
              submitDraft()
            }}
          />
          <button type="button" tabIndex={-1} aria-hidden="true">
            <Globe2 size={17} />웹 검색
          </button>
          <button type="submit" className="send-button" disabled={pending || !draft.trim()} aria-label={pending ? '답변을 기다리는 중' : '질문 보내기'}>
            {pending ? <LoaderCircle size={20} className={styles.spin} /> : <ArrowUp size={21} strokeWidth={2.6} />}
          </button>
        </div>
      </form>
    </section>
  )
})
