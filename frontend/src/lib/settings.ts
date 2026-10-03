import { useMemo, useSyncExternalStore } from "react";

// 설정 화면(/settings) 값. DB 연결 전까지 이 브라우저의 localStorage에만 저장한다.
// lib/fd1.ts의 useStored와 같은 방식: 서버 렌더·첫 렌더는 기본값, 이후 브라우저 값 (hydration 불일치 없음).

export const SETTINGS_KEYS = {
  notify: "dojang.settings.notify",
  /** "on" | "off" — AI 답변의 구글 캘린더 추가 버튼 */
  calendar: "dojang.settings.calendar",
} as const;

const CHANGE_EVENT = "dojang-settings";

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // 저장이 막혀 있으면(사생활 모드 등) 새로고침 후 기본값으로 돌아간다
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function useRaw(key: string): string | null {
  return useSyncExternalStore(subscribe, () => readRaw(key), () => null);
}

// ---------- 알림 ----------

export const NOTIFY_DAYS = [30, 7, 1] as const;
export type NotifyDay = (typeof NOTIFY_DAYS)[number];
export const NOTIFY_CHANNELS = ["web", "kakao", "telegram"] as const;
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];

export interface NotifySettings {
  days: NotifyDay[];
  channel: NotifyChannel;
}

export const DEFAULT_NOTIFY: NotifySettings = { days: [...NOTIFY_DAYS], channel: "web" };

function parseNotify(raw: string | null): NotifySettings {
  if (!raw) return DEFAULT_NOTIFY;
  try {
    const value = JSON.parse(raw) as Partial<NotifySettings>;
    const days = Array.isArray(value.days) ? NOTIFY_DAYS.filter((d) => value.days?.includes(d)) : DEFAULT_NOTIFY.days;
    const channel = NOTIFY_CHANNELS.includes(value.channel as NotifyChannel) ? (value.channel as NotifyChannel) : "web";
    return { days, channel };
  } catch {
    return DEFAULT_NOTIFY;
  }
}

export function useNotifySettings(): [NotifySettings, (next: NotifySettings) => void] {
  const raw = useRaw(SETTINGS_KEYS.notify);
  const value = useMemo(() => parseNotify(raw), [raw]);
  return [value, (next) => writeRaw(SETTINGS_KEYS.notify, JSON.stringify(next))];
}

// ---------- 캘린더 연동 ----------

/** 기본은 켜짐. "off"로 저장된 경우에만 끈다 */
export function useCalendarActionsEnabled(): [boolean, (on: boolean) => void] {
  const on = useRaw(SETTINGS_KEYS.calendar) !== "off";
  return [on, (next) => writeRaw(SETTINGS_KEYS.calendar, next ? "on" : "off")];
}

// ---------- 초기화 ----------

/**
 * 설정 키와 함께 넘긴 키(FD1 내 정보 등)를 지운다.
 * 다른 저장소(lib/fd1.ts)의 구독자도 다시 읽도록 storage 이벤트를 같이 보낸다.
 */
export function clearLocalData(extraKeys: string[]) {
  for (const key of [...extraKeys, ...Object.values(SETTINGS_KEYS)]) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 막혀 있으면 지울 것도 없다
    }
  }
  window.dispatchEvent(new StorageEvent("storage"));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
