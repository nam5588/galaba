import {
  GraduationCap,
  Bell,
  BookOpen,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Link as LinkIcon,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { SourceKind } from '@/lib/chat'
import { tr, type Lang } from '@/lib/i18n'
import { TOOL_T } from '@/lib/i18n/chat'

type ToolKey = keyof typeof TOOL_T

/** 오케스트레이터 도구 이름 -> 화면에 보이는 칩 (PRD 4장 "사용한 도구 표시"). 이름은 TOOL_T에서 화면 언어로 */
export const TOOL_META: Record<string, { label: ToolKey; icon: LucideIcon }> = {
  search_regulations: { label: 'search_regulations', icon: BookOpen },
  get_deadlines: { label: 'get_deadlines', icon: CalendarClock },
  get_notices: { label: 'get_notices', icon: Bell },
  get_timetable: { label: 'get_timetable', icon: CalendarDays },
  get_academics: { label: 'get_academics', icon: GraduationCap },
  search_jobs: { label: 'search_jobs', icon: Briefcase },
  create_calendar_event: { label: 'create_calendar_event', icon: CalendarPlus },
  // 예전 백엔드 도구 이름 (응답이 섞여 와도 칩이 깨지지 않게)
  get_school_notices: { label: 'get_notices', icon: Bell },
  get_student_profile: { label: 'get_student_profile', icon: UserRound },
}

export function toolMeta(tool: string, lang: Lang = 'ko'): { label: string; icon: LucideIcon } {
  const meta = TOOL_META[tool]
  if (meta) return { label: tr(TOOL_T, meta.label, lang), icon: meta.icon }
  return { label: tool || tr(TOOL_T, 'process', lang), icon: Sparkles }
}

export const SOURCE_ICONS: Record<SourceKind, LucideIcon> = {
  regulation: BookOpen,
  notice: Bell,
  deadline: CalendarClock,
  timetable: CalendarDays,
  job: Briefcase,
  other: LinkIcon,
}
