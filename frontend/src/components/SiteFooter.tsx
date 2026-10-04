'use client'

import Link from 'next/link'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import { tr, useLang } from '@/lib/i18n'
import { SHELL } from '@/lib/i18n/shell'
import styles from './site-footer.module.css'

const FOOTER = {
  tagline: {
    ko: '한국 생활의 다음 단계를, 더 쉽게.',
    en: 'Make your next step in Korea easier.',
    uz: 'Koreyadagi keyingi qadamingizni osonlashtiring.',
    ru: 'Сделайте следующий шаг в Корее проще.',
  },
  essentials: { ko: '체류와 생활', en: 'Living in Korea', uz: 'Koreyada hayot', ru: 'Жизнь в Корее' },
  campus: { ko: '학교생활', en: 'Campus life', uz: 'Universitet hayoti', ru: 'Учёба и кампус' },
  help: { ko: '도움받기', en: 'Get help', uz: 'Yordam', ru: 'Помощь' },
  askAi: { ko: 'AI에게 질문하기', en: 'Ask the AI assistant', uz: 'AI yordamchidan so‘rash', ru: 'Спросить ИИ' },
  description: {
    ko: '비자부터 수업, 보험, 일자리까지 필요한 정보를 한곳에서 찾아보세요.',
    en: 'Find guidance on visas, classes, insurance, and jobs in one place.',
    uz: 'Viza, darslar, sug‘urta va ish haqidagi ma’lumotlarni bir joyda toping.',
    ru: 'Информация о визе, учёбе, страховке и работе в одном месте.',
  },
  quickStart: { ko: '무엇부터 확인할까요?', en: 'Where should you start?', uz: 'Nimadan boshlash kerak?', ru: 'С чего начать?' },
} as const

export function SiteFooter() {
  const lang = useLang()
  const t = (key: keyof typeof FOOTER) => tr(FOOTER, key, lang)
  const s = (key: keyof typeof SHELL) => tr(SHELL, key, lang)

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.main}>
          <div className={styles.brand}>
            <Link href="/" className={styles.brandLink} aria-label="DOJANG home">
              <span className={styles.mark} aria-hidden="true">D</span>
              <span><strong>DOJANG</strong><small>International Student Admin Assistant</small></span>
            </Link>
            <p>{t('tagline')}</p>
            <span className={styles.brandDescription}>{t('description')}</span>
          </div>

          <nav className={styles.group} aria-label={t('essentials')}>
            <h2>{t('essentials')}</h2>
            <Link href="/visa">{s('navVisa')}</Link>
            <Link href="/insurance">{s('navInsurance')}</Link>
            <Link href="/jobs">{s('navJobs')}</Link>
          </nav>

          <nav className={styles.group} aria-label={t('campus')}>
            <h2>{t('campus')}</h2>
            <Link href="/academics">{s('navAcademics')}</Link>
            <Link href="/schedule">{s('navSchedule')}</Link>
            <Link href="/notices">{s('navNotices')}</Link>
          </nav>

          <nav className={styles.group} aria-label={t('help')}>
            <h2>{t('help')}</h2>
            <Link href="/#ai-chat">{t('askAi')}</Link>
            <Link href="/settings">{s('navSettings')}</Link>
            <Link href="/">{s('goHome')}</Link>
          </nav>
        </div>

        <div className={styles.cta}>
          <div className={styles.ctaIcon}><MessageCircle size={21} /></div>
          <div><strong>{t('quickStart')}</strong><span>{t('description')}</span></div>
          <Link href="/#ai-chat">{t('askAi')} <ArrowUpRight size={17} /></Link>
        </div>

        <div className={styles.bottom}>
          <span>© DOJANG</span>
          <p>{s('setFooter')}</p>
        </div>
      </div>
    </footer>
  )
}
