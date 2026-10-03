'use client'

import Link from 'next/link'
import { ArrowLeft, Home, MapPinned } from 'lucide-react'
import { tr, useLang } from '@/lib/i18n'
import { SHELL } from '@/lib/i18n/shell'

// 화면 언어(상단 언어 선택과 같은 값)를 읽으려고 클라이언트 컴포넌트로 둔다
export default function NotFound() {
  const lang = useLang()
  const L = (key: keyof typeof SHELL) => tr(SHELL, key, lang)
  return <main className="error-page"><div className="error-illustration"><MapPinned size={46} /><span>404</span></div><span className="eyebrow">{L('nfEyebrow')}</span><h1>{L('nfTitle')}</h1><p>{L('nfLine1')}<br />{L('nfLine2')}</p><div className="error-actions"><Link className="primary-button" href="/"><Home size={18} />{L('goHome')}</Link><Link className="secondary-button" href="/notices"><ArrowLeft size={18} />{L('seeNotices')}</Link></div></main>
}
