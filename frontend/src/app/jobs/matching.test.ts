import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultProfile, jobs, reviews, type Job, type StudentProfile } from './jobsData'
import { matchJob, rankJobs, summarizeReviews, validateProfile } from './matching'

const coffee = jobs[0]
const profile = (patch: Partial<StudentProfile>): StudentProfile => ({ ...defaultProfile, ...patch })
const job = (patch: Partial<Job>): Job => ({ ...coffee, ...patch })
test('시간·언어 모두 일치하고 비자 종류는 결과를 바꾸지 않는다', () => {
  assert.equal(matchJob(coffee, defaultProfile).status, 'matched')
  assert.equal(matchJob(coffee, defaultProfile).count, 2)
  assert.deepEqual(matchJob(coffee, profile({ visaType: 'D-4' })), matchJob(coffee, defaultProfile))
})
test('언어 불일치와 시간 불일치의 사유를 분리한다', () => {
  const low = matchJob(coffee, profile({ topikLevel: 2 }))
  assert.equal(low.status, 'mismatched'); assert.equal(low.count, 1)
  assert.equal(low.checks[1].status, 'mismatch')
  const weekend = matchJob(jobs[1], defaultProfile)
  assert.equal(weekend.checks[0].status, 'mismatch')
  assert.equal(weekend.checks[1].status, 'match')
})
test('학생 TOPIK 미입력·공고 TOPIK 미확인은 정보 부족이 우선한다', () => {
  assert.equal(matchJob(coffee, profile({ topikLevel: null })).status, 'unknown')
  const result = matchJob(job({ requiredTopik: null }), profile({ availability: [] }))
  assert.equal(result.status, 'unknown'); assert.equal(result.checks[0].status, 'mismatch')
  assert.equal(matchJob(job({ shifts: null }), defaultProfile).status, 'unknown')
})
test('요구 TOPIK 0은 학생 미입력이어도 일치하며 급수 없음 0은 결측값이 아니다', () => {
  assert.equal(matchJob(job({ requiredTopik: 0 }), profile({ topikLevel: null })).status, 'matched')
  assert.equal(matchJob(coffee, profile({ topikLevel: 0 })).checks[1].status, 'mismatch')
})
test('가능한 요일이 없으면 시간 불일치', () => {
  assert.equal(matchJob(coffee, profile({ availability: [] })).checks[0].status, 'mismatch')
})
test('일부 구간만 겹치거나 하루라도 누락되면 시간 불일치', () => {
  assert.equal(matchJob(coffee, profile({ availability: [{ day: '월', startTime: '18:00', endTime: '22:00' }] })).checks[0].status, 'mismatch')
  const partial = profile({ availability: defaultProfile.availability.map((shift) => ({ ...shift, endTime: '21:59' })) })
  assert.equal(matchJob(coffee, partial).checks[0].status, 'mismatch')
})
test('연속 구간은 합쳐 비교하지만 사이에 공백이 있으면 불일치', () => {
  const monday = job({ shifts: [{ day: '월', startTime: '18:00', endTime: '22:00' }] })
  const ranges = [{ day: '월' as const, startTime: '18:00', endTime: '20:00' }, { day: '월' as const, startTime: '20:00', endTime: '22:00' }]
  assert.equal(matchJob(monday, profile({ availability: ranges })).checks[0].status, 'match')
  assert.equal(matchJob(monday, profile({ availability: [ranges[0], { ...ranges[1], startTime: '20:01' }] })).checks[0].status, 'mismatch')
})
test('같은 시간·역전·누락 시간 입력을 거부한다', () => {
  for (const endTime of ['18:00', '17:59', '01:00', '']) {
    assert.notEqual(validateProfile(profile({ availability: [{ day: '월', startTime: '18:00', endTime }] })), null)
  }
  assert.equal(validateProfile(profile({ availability: [] })), null)
})
test('추천 순서는 일치 수 내림차순·거리 오름차순·정보 부족 마지막', () => {
  assert.deepEqual(rankJobs(jobs, defaultProfile).map(({ job }) => job.id), [1, 4, 2, 3, 5])
  const closer = job({ id: 99, walkMinutes: 2 })
  assert.deepEqual(rankJobs([coffee, closer], defaultProfile).map(({ job }) => job.id), [99, 1])
  const unknown = job({ id: 100, shifts: null, walkMinutes: 1 })
  assert.equal(rankJobs([unknown, jobs[2]], defaultProfile).at(-1)?.job.id, 100)
})
test('프로필을 주말로 바꾸면 추천 순서가 갱신된다', () => {
  const weekend = profile({ availability: jobs[1].shifts! })
  assert.equal(rankJobs(jobs, weekend)[0].job.id, 2)
})
test('리뷰는 사업장 ID로 연결하며 산술 평균·개수를 계산한다', () => {
  const coffeeReviews = reviews.filter((review) => review.workplaceId === coffee.workplaceId)
  assert.deepEqual(summarizeReviews(coffeeReviews), { count: 2, average: 4.5 })
  assert.deepEqual(summarizeReviews([]), { count: 0, average: null })
  assert.equal(summarizeReviews(coffeeReviews.slice(0, 1)).average, 5)
})
test('데모 공고는 5개이며 야간을 넘는 구간 없이 사업장·리뷰 기준을 충족한다', () => {
  assert.equal(jobs.length, 5)
  assert.ok(jobs.every((job) => job.shifts?.every((shift) => shift.startTime < shift.endTime)))
  assert.ok(jobs.some((job) => !reviews.some((review) => review.workplaceId === job.workplaceId)))
  assert.ok(reviews.every((review) => review.rating >= 1 && review.rating <= 5))
})
