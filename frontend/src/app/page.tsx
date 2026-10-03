'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { ChatPanel, type ChatPanelHandle } from '@/components/chat/ChatPanel'
import { useChat } from '@/components/chat/useChat'
import { Fd1UpcomingRows } from '@/components/fd1/Fd1Upcoming'
import { useFd1 } from '@/components/fd1/useFd1'
import { WeekSchedule } from '@/components/home/WeekSchedule'
import { IntroSplash } from '@/components/intro/IntroSplash'
import { routeOfTask } from '@/lib/fd1'

// 메인 = 왼쪽 메뉴(공용 AppShell, 고정) + 가운데 AI 채팅(이 영역만 스크롤) + 오른쪽 시간표·다가오는 일정(고정)
export default function Page() {
  const chat = useChat()
  const fd1 = useFd1()
  const router = useRouter()
  const panelRef = useRef<ChatPanelHandle>(null)

  const ask = (q: string) => void chat.ask(q)

  return (
    <AppShell
      fixed
      showSearch={false}
      busy={chat.pending}
      onRecentChat={ask}
      onNewChat={() => {
        chat.reset()
        panelRef.current?.focus()
      }}
      onAiNav={() => panelRef.current?.focus()}
    >
      {/* 첫 화면: 도장을 찍으면 메인으로. 끝나면 바로 질문할 수 있게 채팅 입력창에 커서 */}
      <IntroSplash onDone={() => panelRef.current?.focus()} />
      <Suspense fallback={null}>
        <AutoAsk onAsk={ask} />
      </Suspense>
      <div className="dashboard-grid">
        <section className="main-column">
          <ChatPanel ref={panelRef} chat={chat} />
        </section>
        <aside className="right-column">
          {/* 시간표: 요리(FD2) /api/schedule */}
          <WeekSchedule />
          {/* 다가오는 일정: 무하마드(FD1) 기한 계산. 채팅 get_deadlines와 같은 데모 사용자 */}
          <section className="panel upcoming-panel">
            <div className="section-heading">
              <div className="heading-title"><CalendarDays size={21} strokeWidth={2.5} /><h2>다가오는 일정</h2></div>
              <button className="text-action" onClick={() => ask('이번 주에 내가 챙겨야 할 거 정리해줘')}>AI로 정리<ChevronRight size={16} /></button>
            </div>
            <div className="upcoming-list">
              <Fd1UpcomingRows fd1={fd1} onOpenTask={(type) => router.push(routeOfTask(type))} />
            </div>
          </section>
        </aside>
      </div>
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
