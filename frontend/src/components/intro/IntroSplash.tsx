'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './intro.module.css'

// 첫 화면: 1번 "시작할까요?" 문구만 → 클릭(또는 Enter·Space) → 2번 도장이 쾅 찍힘 → 메인으로 넘어간다.
// 찍히는 도장은 로고(public/images/intro-stamp.png), 애니메이션은 발표 자료(도장_발표.html) 표지와 같다.
// 처음 접속·새로고침 때만 나온다. 앱 안에서 메인으로 돌아올 때는 다시 나오지 않는다.
let introDone = false

// 클릭과 Enter가 같이 들어와도 한 번만 찍히게
function claimStamp() {
  if (introDone) return false
  introDone = true
  return true
}

type Phase = 'ready' | 'stamped' | 'leaving' | 'done'

const HOLD_MS = 1000 // 도장이 찍힌 뒤 머무는 시간
const FADE_MS = 550 // 메인으로 넘어가는 시간 (intro.module.css의 .leaving과 맞춤)

export function IntroSplash({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<Phase>(() => (introDone ? 'done' : 'ready'))

  const stamp = () => {
    if (claimStamp()) setPhase('stamped')
  }

  useEffect(() => {
    if (phase !== 'ready') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      if (claimStamp()) setPhase('stamped')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  useEffect(() => {
    if (phase === 'stamped') {
      const t = setTimeout(() => setPhase('leaving'), HOLD_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'leaving') {
      const t = setTimeout(() => {
        setPhase('done')
        onDone?.()
      }, FADE_MS)
      return () => clearTimeout(t)
    }
  }, [phase, onDone])

  if (phase === 'done') return null

  return (
    <div className={styles.overlay} data-phase={phase} onClick={stamp}>
      {/* 1번 화면: 문구만 */}
      <h1 className={styles.title}>시작할까요?</h1>
      {/* 2번 화면: 도장이 쾅 찍힘 */}
      <div className={styles.target} aria-hidden="true">
        <span className={styles.ripple} />
        <Image className={styles.seal} src="/images/intro-stamp.png" alt="" width={640} height={640} loading="eager" />
      </div>
    </div>
  )
}
