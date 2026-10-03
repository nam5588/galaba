import type { Job } from './jobsData'
import { getWorkplaceReviews } from './jobsData'
import { matchLabels, summarizeReviews, type MatchResult } from './matching'
import styles from './jobs.module.css'

export const officialGuide = 'https://cdn.studyinkorea.go.kr/cmm/work/aboutForeignerEmploymentSystem.do'
export const employmentChecks = [
  '시간제취업 허가와 본인의 체류 조건',
  '실제 업무·근무처가 허용 범위에 해당하는지',
  '계약서의 급여·근무시간·휴게시간',
]
export function MatchChecks({ match }: { match: MatchResult }) {
  return <section className={styles.conditions} aria-label="시간·언어 조건 비교">
    <div className={styles.conditionHeading}><strong>시간·언어 {match.count}/2 일치</strong><span className={`${styles.badge} ${match.status === 'matched' ? styles.eligible : match.status === 'unknown' ? styles.reviewRequired : styles.mismatch}`}>{matchLabels[match.status]}</span></div>
    <ul>{match.checks.map((check) => <li key={check.label}><span className={check.status === 'match' ? styles.pass : styles.check}>{check.status === 'match' ? '✓ 일치' : check.status === 'mismatch' ? '✕ 불일치' : '? 정보 부족'}</span><span><strong>{check.label}</strong> · {check.reason}</span></li>)}</ul>
  </section>
}
export function EmploymentNotice({ full = false }: { full?: boolean }) {
  return <section className={styles.employmentNotice} aria-label="취업 관련 추가 확인">
    <strong>취업 관련 추가 확인 필요</strong>
    {full ? <><ul>{employmentChecks.map((item) => <li key={item}>{item}</li>)}</ul><p>국민대학교 유학생 담당부서에 신청 절차와 개별 조건을 확인해주세요. 공고 조건 일치는 취업 허가를 의미하지 않습니다.</p><a href={officialGuide} target="_blank" rel="noreferrer">Study in Korea 공식 취업 안내 ↗</a><small>안내 확인일: 2026.10.03 · 법정 허용시간과 허가 여부는 자동 계산하지 않습니다.</small></> : <p>취업 허가·근무처·계약 조건은 별도로 확인해주세요.</p>}
  </section>
}
export function ReviewSummary({ job, full = false }: { job: Job; full?: boolean }) {
  const reviews = getWorkplaceReviews(job.workplaceId)
  const summary = summarizeReviews(reviews)
  const shownReviews = full ? reviews : reviews.slice(0, 1)
  return <section className={styles.review} aria-label="사업장 외국인 리뷰">
    <div><strong>외국인 리뷰</strong>{summary.average !== null && <span>★ {summary.average.toFixed(1)} <small>({summary.count}건)</small></span>}</div>
    <p className={styles.sampleLabel}>데모용 가상 데이터</p>
    {summary.count === 0 ? <p>아직 리뷰가 없습니다.</p> : shownReviews.map((review) => <article key={review.id} className={full ? styles.fullReview : undefined}>
      <div><strong>{review.alias}</strong>{full && <small>{review.createdAt} · {review.rating}/5점</small>}</div>
      <blockquote>“{review.text}”</blockquote>
      <div className={styles.reviewTags}>{review.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    </article>)}
  </section>
}
