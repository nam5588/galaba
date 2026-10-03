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
  type Fd1ReminderItem,
} from '@/lib/fd1'

type Loaded<T> = { key: string; data?: T; error?: boolean }

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
const loadPlan = (key: string) => fetchPlan(JSON.parse(key) as Fd1Profile)
const loadGuides = (key: string) => fetchGuides(key as Fd1Lang)
const loadReminders = (key: string) => {
  const { profile, lang } = JSON.parse(key) as { profile: Fd1Profile; lang: Fd1Lang }
  return fetchReminders(profile, lang).then((r) => r.items)
}

/** FD1 화면 상태: 언어, 내 프로필(없으면 데모 사용자), 일정, 안내, 알림, 읽음 처리 */
export function useFd1() {
  const [storedLang, setLang] = useStored<Fd1Lang>(STORAGE_KEYS.lang)
  const [storedProfile, setStoredProfile] = useStored<Fd1Profile>(STORAGE_KEYS.profile)
  const [readKeys, setReadKeys] = useStored<string[]>(STORAGE_KEYS.readReminders)
  const lang: Fd1Lang = storedLang ?? 'ko'

  const demo = useLoad<Fd1Profile>(storedProfile ? null : 'demo', loadDemo)
  const profile = storedProfile ?? demo.data ?? null
  const profileKey = profile ? JSON.stringify(profile) : null

  const plan = useLoad<Fd1Plan>(profileKey, loadPlan)
  const guides = useLoad<Fd1Guides>(lang, loadGuides)
  const reminders = useLoad<Fd1ReminderItem[]>(profile ? JSON.stringify({ profile, lang }) : null, loadReminders)

  const read = new Set(readKeys ?? [])
  const items = reminders.data ?? []

  return {
    lang,
    setLang: (next: Fd1Lang) => setLang(next),
    profile,
    isDemo: !storedProfile,
    saveProfile: (next: Fd1Profile) => setStoredProfile(next),
    resetToDemo: () => setStoredProfile(null),
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
