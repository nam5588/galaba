import {
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

/** 오케스트레이터 도구 이름 -> 화면에 보이는 칩 (PRD 4장 "사용한 도구 표시") */
export const TOOL_META: Record<string, { label: string; icon: LucideIcon }> = {
  search_regulations: { label: '학칙 검색', icon: BookOpen },
  get_deadlines: { label: '기한 확인', icon: CalendarClock },
  get_notices: { label: '공지 확인', icon: Bell },
  get_timetable: { label: '시간표 확인', icon: CalendarDays },
  search_jobs: { label: '알바 검색', icon: Briefcase },
  create_calendar_event: { label: '캘린더 추가', icon: CalendarPlus },
  // 예전 백엔드 도구 이름 (응답이 섞여 와도 칩이 깨지지 않게)
  get_school_notices: { label: '공지 확인', icon: Bell },
  get_student_profile: { label: '내 정보 확인', icon: UserRound },
}

export function toolMeta(tool: string): { label: string; icon: LucideIcon } {
  return TOOL_META[tool] ?? { label: tool || '처리 과정', icon: Sparkles }
}

export const SOURCE_ICONS: Record<SourceKind, LucideIcon> = {
  regulation: BookOpen,
  notice: Bell,
  deadline: CalendarClock,
  timetable: CalendarDays,
  job: Briefcase,
  other: LinkIcon,
}
