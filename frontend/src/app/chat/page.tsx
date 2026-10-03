import { redirect } from 'next/navigation'

// AI 채팅은 메인 화면 가운데로 옮겼다. 예전 주소(/chat, /chat?q=…)는 메인으로 보낸다.
export default async function ChatRedirect({ searchParams }: PageProps<'/chat'>) {
  const { q } = await searchParams
  redirect(typeof q === 'string' && q.trim() ? `/?q=${encodeURIComponent(q)}` : '/')
}
