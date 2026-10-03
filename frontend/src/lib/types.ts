export type NoticeCategory = '학사' | '장학' | '행정' | '공모행사'
export type NoticeTone = 'red' | 'blue' | 'green'
export type ScheduleColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple'

export interface Notice {
  id: number
  category: string
  tag: string
  tone: NoticeTone
  title: string
  date: string
  text: string
  url: string
  dept: string
  pinned: boolean
}

export interface NoticesResponse {
  source: 'live' | 'cache' | 'sample'
  fetchedAt: string
  items: Notice[]
}

export interface ScheduleClass {
  id: number
  dayOfWeek: number
  startTime: string
  endTime: string
  courseCode: string
  courseName: string
  professor: string
  room: string
  color: ScheduleColor
}

export interface ScheduleDay {
  dayOfWeek: number
  date: string
  classes: ScheduleClass[]
}

export interface ScheduleResponse {
  weekStart: string
  days: ScheduleDay[]
}

// 수강 & 학업 (docs/prd-academics.md)
export type AcademicStatus = 'safe' | 'warning' | 'danger'

export interface AcademicsProfile {
  name: string
  university: string
  department: string
  year: number
  semester: string
  status: string
}

export interface AcademicsCredits {
  earned: number
  required: number
  remaining: number
  progress: number
}

export interface AcademicsGpa {
  value: number
  scale: number
  status: AcademicStatus
  warningBelow: number
}

export interface AcademicRequirement {
  id: string
  title: string
  summary: string
  status: AcademicStatus
}

export interface AcademicsResponse {
  profile: AcademicsProfile
  credits: AcademicsCredits
  gpa: AcademicsGpa
  requirements: AcademicRequirement[]
  disclaimer: string
  sources: { label: string; url: string }[]
}
