// 이신애(JOB)의 frontend/src/app/jobs/jobsData.ts 복사본. 채팅 search_jobs가 화면과 같은 공고를 쓰기 위해 둔다.
// Vercel에서 backend는 frontend 파일을 import할 수 없다. 공고를 바꾸면 두 파일을 같이 고칠 것.
export const days = ['월', '화', '수', '목', '금', '토', '일'] as const
export type Day = typeof days[number]
export type Shift = { day: Day; startTime: string; endTime: string }
export type StudentProfile = {
  id: string
  visaType: 'D-2' | 'D-4'
  topikLevel: number | null
  availability: Shift[]
}
export type Job = {
  id: number
  workplaceId: string
  title: string
  category: '카페' | '편의점' | '음식점'
  description: string
  hourlyWage: number
  walkMinutes: number
  shifts: Shift[] | null
  requiredTopik: number | null
}
export type Workplace = { id: string; name: string; location: string }
export const reviewTags = ['급여 지급', '계약 준수', '근무시간', '외국인 친화도'] as const
export type Review = {
  id: string
  workplaceId: string
  alias: string
  rating: number
  tags: (typeof reviewTags[number])[]
  text: string
  createdAt: string
}
export const defaultProfile: StudentProfile = {
  id: 'demo-student', visaType: 'D-2', topikLevel: 4,
  availability: ['월', '수', '금'].map((day) => ({ day: day as Day, startTime: '18:00', endTime: '22:00' })),
}
export const workplaces: Workplace[] = [
  { id: 'coffee', name: 'Campus Coffee', location: '국민대학교 주변 · 예시 위치' },
  { id: 'mart', name: 'Campus Mart', location: '국민대학교 주변 · 예시 위치' },
  { id: 'kitchen', name: 'Korean Kitchen', location: '국민대학교 주변 · 예시 위치' },
  { id: 'study', name: 'Book & Study Cafe', location: '국민대학교 주변 · 예시 위치' },
  { id: 'deli', name: 'Campus Deli', location: '국민대학교 주변 · 예시 위치' },
]
// 모든 공고·사업장·후기는 데모용 가상 데이터입니다. 취업 허가 판정에 사용하지 않습니다.
export const jobs: Job[] = [
  { id: 1, workplaceId: 'coffee', title: '평일 저녁 카페 스태프', category: '카페', hourlyWage: 11000, walkMinutes: 6, requiredTopik: 3,
    description: '주문 접수, 음료 제조 보조, 매장 정리를 함께 할 아르바이트생을 모집합니다.',
    shifts: ['월', '수', '금'].map((day) => ({ day: day as Day, startTime: '18:00', endTime: '22:00' })) },
  { id: 2, workplaceId: 'mart', title: '주말 편의점 스태프', category: '편의점', hourlyWage: 10500, walkMinutes: 4, requiredTopik: 2,
    description: '계산, 진열, 매장 정리를 담당할 주말 아르바이트생을 모집합니다.',
    shifts: [{ day: '토', startTime: '14:00', endTime: '20:00' }, { day: '일', startTime: '14:00', endTime: '20:00' }] },
  { id: 3, workplaceId: 'kitchen', title: '한식당 홀 서비스', category: '음식점', hourlyWage: 12000, walkMinutes: 8, requiredTopik: 5,
    description: '한국어 주문 응대, 홀 서빙, 테이블 정리를 담당합니다.',
    shifts: [{ day: '화', startTime: '17:00', endTime: '22:00' }, { day: '목', startTime: '17:00', endTime: '22:00' }] },
  { id: 4, workplaceId: 'study', title: '스터디카페 저녁 관리', category: '카페', hourlyWage: 10800, walkMinutes: 10, requiredTopik: 0,
    description: '좌석 관리와 간단한 매장 정리를 담당합니다. TOPIK 급수 요구는 없습니다.',
    shifts: [{ day: '금', startTime: '19:00', endTime: '22:00' }] },
  { id: 5, workplaceId: 'deli', title: '저녁 매장 서비스', category: '음식점', hourlyWage: 12500, walkMinutes: 5, requiredTopik: null,
    description: '주문 안내와 포장 보조 업무입니다. 요구 한국어 수준은 사업장 확인이 필요합니다.',
    shifts: [{ day: '월', startTime: '18:00', endTime: '22:00' }] },
]
export const reviews: Review[] = [
  { id: 'r1', workplaceId: 'coffee', alias: 'Anna', rating: 5, tags: ['외국인 친화도'], text: '업무 설명을 천천히 해주셔서 적응하기 편했어요.', createdAt: '2026.09.21' },
  { id: 'r2', workplaceId: 'coffee', alias: 'John', rating: 4, tags: ['급여 지급', '계약 준수', '근무시간'], text: '급여일이 정확했고 약속한 근무시간을 지켰어요.', createdAt: '2026.08.14' },
  { id: 'r3', workplaceId: 'mart', alias: 'Minh', rating: 4, tags: ['외국인 친화도', '근무시간'], text: '동료들이 계산 업무를 친절하게 알려줬어요.', createdAt: '2026.09.02' },
  { id: 'r4', workplaceId: 'kitchen', alias: 'Alex', rating: 4, tags: ['급여 지급', '계약 준수'], text: '바쁜 시간에는 소통이 어려웠지만 급여는 약속한 날에 받았어요.', createdAt: '2026.08.28' },
]
export function getWorkplace(job: Job) { return workplaces.find((item) => item.id === job.workplaceId)! }
export function getWorkplaceReviews(workplaceId: string) { return reviews.filter((review) => review.workplaceId === workplaceId) }
export function formatShifts(shifts: Shift[] | null) {
  return shifts?.length ? shifts.map((shift) => `${shift.day} ${shift.startTime}–${shift.endTime}`).join(' · ') : '근무시간 미확인'
}
export function formatTopik(level: number | null) { return level === null ? '요구 TOPIK 미확인' : level === 0 ? 'TOPIK 요구 없음' : `TOPIK ${level} 이상` }
