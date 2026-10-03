import { days, type Job, type Review, type Shift, type StudentProfile } from './jobsData'

export type Check = { label: '시간' | '언어'; status: 'match' | 'mismatch' | 'unknown'; reason: string }
export type MatchResult = { status: 'matched' | 'mismatched' | 'unknown'; count: number; checks: Check[] }
export const matchLabels = { matched: '기본 조건 일치', mismatched: '조건 불일치', unknown: '정보 부족' }
const validTopik = (value: number | null) => value !== null && Number.isInteger(value) && value >= 0 && value <= 6
export function validShift(shift: Shift) {
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
  return days.includes(shift.day) && timePattern.test(shift.startTime) && timePattern.test(shift.endTime) && shift.startTime < shift.endTime
}
export function validateProfile(profile: StudentProfile): string | null {
  if (profile.topikLevel !== null && !validTopik(profile.topikLevel)) return 'TOPIK은 0~6 또는 미입력으로 선택해주세요.'
  if (!profile.availability.every(validShift)) return '종료 시간은 시작 시간보다 늦어야 합니다. 자정을 넘는 시간은 입력할 수 없습니다.'
  return null
}
function coversShift(shift: Shift, availability: Shift[]) {
  // 같은 요일의 연속·겹치는 가능 구간도 하나의 가용 시간으로 취급합니다.
  const ranges = availability.filter((item) => item.day === shift.day).toSorted((a, b) => a.startTime.localeCompare(b.startTime))
  let coveredUntil = shift.startTime
  for (const range of ranges) {
    if (range.startTime > coveredUntil) break
    if (range.endTime > coveredUntil) coveredUntil = range.endTime
    if (coveredUntil >= shift.endTime) return true
  }
  return false
}
export function matchJob(job: Job, profile: StudentProfile): MatchResult {
  let time: Check
  if (!job.shifts?.length || !job.shifts.every(validShift) || !profile.availability.every(validShift)) {
    time = { label: '시간', status: 'unknown', reason: '근무시간 정보가 누락되었거나 유효하지 않아 비교할 수 없습니다.' }
  } else {
    const conflicts = job.shifts.filter((shift) => !coversShift(shift, profile.availability))
    time = conflicts.length ? { label: '시간', status: 'mismatch', reason: profile.availability.length === 0 ? '근무 가능한 요일이 선택되지 않았습니다.' : `가능시간 밖의 근무: ${conflicts.map((shift) => `${shift.day} ${shift.startTime}–${shift.endTime}`).join(', ')}` } : { label: '시간', status: 'match', reason: '공고의 모든 근무 구간이 선택한 가능시간 안에 포함됩니다.' }
  }
  let language: Check
  if (!validTopik(job.requiredTopik)) language = { label: '언어', status: 'unknown', reason: '공고의 요구 TOPIK 정보가 없습니다.' }
  else if (job.requiredTopik === 0) language = { label: '언어', status: 'match', reason: '이 공고는 TOPIK 급수를 요구하지 않습니다.' }
  else if (!validTopik(profile.topikLevel)) language = { label: '언어', status: 'unknown', reason: '학생 TOPIK이 미입력되어 언어 조건을 비교할 수 없습니다.' }
  else {
    const matches = profile.topikLevel! >= job.requiredTopik!
    language = { label: '언어', status: matches ? 'match' : 'mismatch', reason: `내 TOPIK ${profile.topikLevel} · 요구 TOPIK ${job.requiredTopik} 이상${matches ? ' 충족' : ' 미충족'}` }
  }
  const checks = [time, language]
  const count = checks.filter((check) => check.status === 'match').length
  const status = checks.some((check) => check.status === 'unknown') ? 'unknown' : count === 2 ? 'matched' : 'mismatched'
  return { status, count, checks }
}
export function rankJobs(jobs: Job[], profile: StudentProfile) {
  return jobs.map((job) => ({ job, match: matchJob(job, profile) })).sort((a, b) =>
    Number(a.match.status === 'unknown') - Number(b.match.status === 'unknown') ||
    b.match.count - a.match.count || a.job.walkMinutes - b.job.walkMinutes || a.job.id - b.job.id)
}
export function summarizeReviews(reviews: Review[]) {
  return { count: reviews.length, average: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null }
}
