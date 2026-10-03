'use client'

import { useEffect, useState } from 'react'
import {
  fetchDemoProfile,
  fetchGuides,
  fetchPlan,
  fetchReminders,
  STORAGE_KEYS,
  useStored,
  type Fd1Guides,
  type Fd1Lang,
  type Fd1Plan,
  type Fd1Profile,
  type Fd1TaskType,
  type Fd1ReminderItem,
} from '@/lib/fd1'

type Loaded<T> = { key: string; data?: T; error?: boolean }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * key가 바뀔 때마다 load(key)를 부른다. 새 결과가 오기 전까지는 이전 데이터를 그대로 보여준다(깜빡임 방지).
 * setState는 .then/.catch 안에서만 부른다 (react-hooks/set-state-in-effect).
 */
function useLoad<T>(key: string | null, load: (key: string) => Promise<T>) {
  const [state, setState] = useState<Loaded<T> | null>(null)
  useEffect(() => {
    if (key === null) return
    let cancelled = false
    load(key)
      .then((data) => { if (!cancelled) setState({ key, data }) })
      .catch(() => { if (!cancelled) setState({ key, error: true }) })
    return () => { cancelled = true }
  }, [key, load])
  const fresh = key !== null && state?.key === key
  return { data: state?.data, loading: key !== null && !fresh, error: fresh && !!state?.error }
}

// load 함수는 컴포넌트 밖에 둬서 매 렌더 같은 함수가 되게 한다
const loadDemo = () => fetchDemoProfile()
const loadPlan = (key: string) => {
  const { profile, today } = JSON.parse(key) as { profile: Fd1Profile; today?: string }
  return fetchPlan(profile, today)
}
const loadGuides = (key: string) => fetchGuides(key as Fd1Lang)
const loadReminders = (key: string) => {
  const { profile, lang, today } = JSON.parse(key) as { profile: Fd1Profile; lang: Fd1Lang; today?: string }
  return fetchReminders(profile, lang, today).then((r) => r.items)
}

/** FD1 화면 상태: 언어, 내 프로필(없으면 데모 사용자), 일정, 안내, 알림, 읽음 처리 */
export function useFd1() {
  const [storedLang, setLang] = useStored<Fd1Lang>(STORAGE_KEYS.lang)
  const [storedProfile, setStoredProfile] = useStored<Fd1Profile>(STORAGE_KEYS.profile)
  const [readKeys, setReadKeys] = useStored<string[]>(STORAGE_KEYS.readReminders)
  const [demoToday, setDemoToday] = useStored<string>(STORAGE_KEYS.demoToday)
  const lang: Fd1Lang = storedLang ?? 'ko'
  const today = demoToday ?? undefined

  // ?today=2026-10-16 → 데모 날짜 설정, ?today= → 해제 (브라우저 저장소에 쓰는 것이라 React state가 아니다)
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('today')
    if (value === null) return
    setDemoToday(ISO_DATE.test(value) ? value : null)
  }, [setDemoToday])

  const demo = useLoad<Fd1Profile>(storedProfile ? null : 'demo', loadDemo)
  const profile = storedProfile ?? demo.data ?? null
  const profileKey = profile ? JSON.stringify({ profile, today }) : null

  const plan = useLoad<Fd1Plan>(profileKey, loadPlan)
  const guides = useLoad<Fd1Guides>(lang, loadGuides)
  const reminders = useLoad<Fd1ReminderItem[]>(profile ? JSON.stringify({ profile, lang, today }) : null, loadReminders)

  const read = new Set(readKeys ?? [])
  const items = reminders.data ?? []

  return {
    lang,
    setLang: (next: Fd1Lang) => setLang(next),
    profile,
    isDemo: !storedProfile,
    saveProfile: (next: Fd1Profile) => setStoredProfile(next),
    resetToDemo: () => setStoredProfile(null),
    /** 오늘 (데모 날짜가 있으면 그 날짜). 서버 계산 결과가 오기 전에는 데모 날짜 또는 undefined */
    today: plan.data?.today ?? today,
    demoToday,
    clearDemoToday: () => setDemoToday(null),
    /**
     * PRD 사용자 흐름 7: 완료 → 다음 주기 일정 자동 생성
     * - 외국인등록: 등록일·만료일 저장 → 건강보험·연장 일정이 생긴다
     * - 연장: 새 만료일 저장 → 다음 연장 일정
     * - 체류지 변경: 이사일 지움
     * - 건강보험: 가장 이른 미납 달을 납부 처리
     */
    completeTask: (type: Fd1TaskType, input: { arcIssuedDate?: string; stayExpiryDate?: string } = {}) => {
      if (!profile) return
      if (type === 'ARC_REGISTER' && input.arcIssuedDate) {
        setStoredProfile({ ...profile, arcIssuedDate: input.arcIssuedDate, ...(input.stayExpiryDate ? { stayExpiryDate: input.stayExpiryDate } : {}) })
      } else if (type === 'ARC_EXTEND' && input.stayExpiryDate) {
        setStoredProfile({ ...profile, stayExpiryDate: input.stayExpiryDate })
      } else if (type === 'ADDRESS_CHANGE') {
        setStoredProfile({ ...profile, moveDate: undefined })
      } else if (type === 'NHIS_PAY') {
        const month = plan.data?.insurance.months.find((m) => !m.paid)?.month
        if (month) setStoredProfile({ ...profile, paidMonths: [...new Set([...(profile.paidMonths ?? []), month])].sort() })
      }
    },
    /** FD1-6 "이사했어요": 오늘을 이사일로 저장 → 14일 마감 생성 */
    markMoved: (date: string) => {
      if (profile) setStoredProfile({ ...profile, moveDate: date })
    },
    togglePaid: (month: string) => {
      if (!profile) return
      const paid = new Set(profile.paidMonths ?? [])
      if (paid.has(month)) paid.delete(month)
      else paid.add(month)
      setStoredProfile({ ...profile, paidMonths: [...paid].sort() })
    },
    plan: plan.data,
    planLoading: plan.loading || demo.loading,
    planError: plan.error || demo.error,
    guides: guides.data,
    reminders: items,
    unreadCount: items.filter((r) => !read.has(r.key)).length,
    isRead: (key: string) => read.has(key),
    markAllRead: () => setReadKeys([...new Set([...(readKeys ?? []), ...items.map((r) => r.key)])]),
  }
}

export type Fd1State = ReturnType<typeof useFd1>
