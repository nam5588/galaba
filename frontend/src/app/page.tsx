'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowDown, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { ChatPanel, type ChatPanelHandle } from '@/components/chat/ChatPanel'
import { useChat } from '@/components/chat/useChat'
import { useFd1 } from '@/components/fd1/useFd1'
import { HomeOverview } from '@/components/home/HomeOverview'
import { IntroSplash } from '@/components/intro/IntroSplash'

export default function Page() {
  const chat = useChat()
  const fd1 = useFd1()
  const panelRef = useRef<ChatPanelHandle>(null)
  const chatSectionRef = useRef<HTMLElement>(null)

  const openChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => panelRef.current?.focus(), 350)
  }
  const ask = (q: string) => {
    openChat()
    void chat.ask(q)
  }

  return (
    <AppShell
      busy={chat.pending}
      onRecentChat={ask}
      onNewChat={() => {
        chat.reset()
        openChat()
      }}
      onAiNav={openChat}
    >
      <IntroSplash />
      <Suspense fallback={null}>
        <AutoAsk onAsk={ask} />
      </Suspense>
      <HomeOverview fd1={fd1} onAskChat={openChat} />
      <section ref={chatSectionRef} id="ai-chat" className="home-chat-section">
        <div className="home-chat-heading"><div><span><Sparkles size={18} /> DOJANG AI</span><h2>무엇이든 물어보세요</h2><p>비자, 학교생활, 수강신청까지. 필요한 답을 함께 찾아드릴게요.</p></div><ArrowDown size={21} /></div>
        <div className="home-chat-panel"><ChatPanel ref={panelRef} chat={chat} autoFocus={false} /></div>
      </section>
    </AppShell>
  )
}

/** /?q=질문 (다른 화면의 '이전 채팅', 예전 /chat?q= 포함)으로 들어오면 그 질문을 한 번 자동으로 보내고 주소에서 q를 지운다. */
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
    router.replace('/', { scroll: false })
  }, [q, onAsk, router])

  return null
}
