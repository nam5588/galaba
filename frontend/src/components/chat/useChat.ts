'use client'

import { useRef, useState } from 'react'
import { sendChat, type ChatResponse, type ChatTurn } from '@/lib/chat'
import { useLang } from '@/lib/i18n'

/** 에러 말풍선 종류. 문구는 화면 언어로 그릴 때 정한다(CHAT_T의 errOffline/errTimeout/errServer) */
export type ChatErrorKind = 'offline' | 'timeout' | 'server'

export type UiMessage =
  | { id: string; role: 'user'; content: string }
  | { id: string; role: 'assistant'; content: string; data: ChatResponse }
  | { id: string; role: 'error'; error: ChatErrorKind; detail?: string; retry: string }

const REQUEST_TIMEOUT_MS = 90_000

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

function describeError(error: unknown): { error: ChatErrorKind; detail?: string } {
  const name = error instanceof Error || error instanceof DOMException ? error.name : ''
  if (name === 'TimeoutError') return { error: 'timeout' }
  if (error instanceof Error && /^API \d+/.test(error.message)) return { error: 'server', detail: error.message }
  return { error: 'offline' }
}

/** 채팅 상태(메시지, 전송 중, 재시도, 새 대화). 화면 배치와 분리해서 메인·다른 화면 어디서든 쓴다. */
export function useChat() {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [pending, setPending] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  // 화면 언어를 같이 보내 AI가 그 언어로 답하게 한다
  const lang = useLang()

  const ask = async (raw: string, base: UiMessage[] = messages) => {
    const text = raw.trim()
    if (!text || pending) return

    const next: UiMessage[] = [...base, { id: nextId(), role: 'user', content: text }]
    setMessages(next)
    setPending(true)

    const controller = new AbortController()
    requestRef.current = controller
    const timer = window.setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), REQUEST_TIMEOUT_MS)

    try {
      const data = await sendChat(toHistory(next), controller.signal, lang)
      if (requestRef.current !== controller) return // 그 사이 "새 대화"를 눌렀다
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: data.answer, data }])
    } catch (error) {
      if (requestRef.current !== controller) return
      setMessages((prev) => [...prev, { id: nextId(), role: 'error', ...describeError(error), retry: text }])
    } finally {
      window.clearTimeout(timer)
      if (requestRef.current === controller) {
        requestRef.current = null
        setPending(false)
      }
    }
  }

  const retry = (errorIndex: number) => {
    const failed = messages[errorIndex]
    if (failed?.role !== 'error') return
    // 실패한 질문(바로 앞 user 말풍선)과 에러 말풍선을 지우고 같은 질문을 다시 보낸다
    void ask(failed.retry, messages.slice(0, Math.max(0, errorIndex - 1)))
  }

  const reset = () => {
    requestRef.current?.abort()
    requestRef.current = null
    setMessages([])
    setPending(false)
  }

  return { messages, pending, ask, retry, reset }
}

export type ChatController = ReturnType<typeof useChat>
