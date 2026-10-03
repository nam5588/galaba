'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RefreshCw, TriangleAlert } from 'lucide-react'
import { tr, useLang } from '@/lib/i18n'
import { SHELL } from '@/lib/i18n/shell'

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const lang = useLang()
  const L = (key: keyof typeof SHELL, vars?: Record<string, string>) => tr(SHELL, key, lang, vars)
  useEffect(() => { console.error(error) }, [error])
  return <main className="error-page"><div className="error-illustration danger"><TriangleAlert size={46} /></div><span className="eyebrow">{L('errEyebrow')}</span><h1>{L('errTitle')}</h1><p>{L('errBody')}</p>{error.digest && <small className="error-code">{L('errCode', { code: error.digest })}</small>}<div className="error-actions"><button className="primary-button" onClick={() => retry()}><RefreshCw size={18} />{L('retry')}</button><Link className="secondary-button" href="/"><Home size={18} />{L('goHome')}</Link></div></main>
}
