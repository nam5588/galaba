'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RefreshCw, TriangleAlert } from 'lucide-react'

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return <main className="error-page"><div className="error-illustration danger"><TriangleAlert size={46} /></div><span className="eyebrow">일시적인 문제</span><h1>예기치 못한 오류가 발생했어요</h1><p>잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.</p>{error.digest && <small className="error-code">오류 코드: {error.digest}</small>}<div className="error-actions"><button className="primary-button" onClick={() => retry()}><RefreshCw size={18} />다시 시도</button><Link className="secondary-button" href="/"><Home size={18} />홈으로 가기</Link></div></main>
}
