'use client'

// 전체 화면 언어. 값은 FD1(무하마드)의 언어 선택과 같은 저장소(localStorage)를 쓴다 → 위쪽 언어 선택·설정 화면과 항상 같다.
// 사용: const lang = useLang(); tr(DICT, 'key', lang)
import { STORAGE_KEYS, useStored, type Fd1Lang } from '@/lib/fd1'

export type Lang = Fd1Lang
export const LANGS: Lang[] = ['ko', 'en', 'uz', 'ru']

export function useLang(): Lang {
  const [lang] = useStored<Lang>(STORAGE_KEYS.lang)
  return lang ?? 'ko'
}

export type Dict = Record<string, Record<Lang, string>>

/** dict[key][lang]. {name} 자리는 vars로 채운다. 번역이 비어 있으면 한국어로 */
export function tr<D extends Dict>(dict: D, key: keyof D, lang: Lang, vars?: Record<string, string | number>): string {
  let text = dict[key][lang] || dict[key].ko
  for (const [k, v] of Object.entries(vars ?? {})) text = text.replace(`{${k}}`, String(v))
  return text
}
