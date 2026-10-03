'use client'

import { FileText, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { t } from '@/lib/fd1'
import { Fd1Panel, type Fd1Section } from './Fd1Panel'
import { useFd1 } from './useFd1'

/** /visa, /insurance 화면 (공지·시간표 화면과 같은 AppShell + page-heading 구성) */
export function Fd1Page({ section }: { section: Fd1Section }) {
  const fd1 = useFd1()
  const isVisa = section === 'visa'
  const Icon = isVisa ? FileText : ShieldCheck
  return (
    <AppShell>
      <div className="feature-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">{t('eyebrow', fd1.lang)}</span>
            <h1>{t(isVisa ? 'visaStay' : 'insurance', fd1.lang)}</h1>
            <p>{t(isVisa ? 'visaStayDesc' : 'insuranceDesc', fd1.lang)}</p>
          </div>
          <div className="page-heading-icon"><Icon size={30} /></div>
        </div>
        <Fd1Panel fd1={fd1} section={section} hideTitle />
      </div>
    </AppShell>
  )
}
