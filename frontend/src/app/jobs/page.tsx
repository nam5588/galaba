'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Briefcase, Clock3, MapPin, Search } from 'lucide-react'
import { jobs, getWorkplace, formatShifts, formatTopik, type Job } from './jobsData'
import { employerPosts } from './jobDetails'
import { rankJobs, type MatchResult } from './matching'
import { useStudentProfile } from './ProfileContext'
import ProfileEditor from './ProfileEditor'
import { MatchChecks, EmploymentNotice, ReviewSummary } from './JobInfo'
import styles from './jobs.module.css'

const categories = ['전체', '카페', '편의점', '음식점']
export default function JobsPage() {
  const { profile } = useStudentProfile()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('전체')
  const [onlyMatched, setOnlyMatched] = useState(false)
  const filtered = rankJobs(jobs, profile).filter(({ job, match }) =>
    (category === '전체' || job.category === category) &&
    (!onlyMatched || match.status === 'matched') &&
    `${getWorkplace(job).name} ${job.title} ${job.category}`.toLocaleLowerCase('ko-KR').includes(query.trim().toLocaleLowerCase('ko-KR')))
  function resetFilters() { setQuery(''); setCategory('전체'); setOnlyMatched(false) }
  return <div className={`feature-page ${styles.page}`}>
    <div className="page-heading"><div><span className="eyebrow">유학생 생활 정보</span><h1>알바 찾기</h1><p>국민대 주변 공고의 시간·언어 조건과 후기를 함께 확인하세요.</p></div><div className="page-heading-icon"><Briefcase size={30} /></div></div>
    <p className={styles.demoNote}>모든 공고·사업장·후기: 데모용 가상 데이터 · 도보 시간은 지도 계산값이 아닌 예시입니다.</p>
    <ProfileEditor />
    <div className={styles.columns}>
      <section className={styles.results} aria-label="알바 목록">
        <div className={`feature-panel ${styles.filters}`}>
          <label className="feature-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="공고 제목이나 사업장 이름을 검색하세요" aria-label="알바 공고 검색" /></label>
          <div className={styles.filterRow}><div className={`filter-chips ${styles.filterChips}`} aria-label="업종 필터">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><label className={styles.checkbox}><input type="checkbox" checked={onlyMatched} onChange={(event) => setOnlyMatched(event.target.checked)} />기본 조건 일치만</label></div>
        </div>
        <div className={styles.resultsHeading}><h2 aria-live="polite">추천 공고 <span>{filtered.length}</span></h2><span className={styles.sort}>일치 수 ↓ · 도보 시간 ↑ · 정보 부족 마지막</span></div>
        <div className={styles.cards}>{filtered.map(({ job, match }) => <JobCard key={job.id} job={job} match={match} />)}</div>
        {filtered.length === 0 && <div className={`panel ${styles.empty}`}><Search size={30} /><h3>조건에 맞는 공고가 없어요</h3><p>검색어나 업종 필터를 바꿔보세요.</p><button className={styles.detailLink} onClick={resetFilters}>필터 초기화</button></div>}
      </section>
      <aside className={styles.guide}><section className="panel"><h2>추천 기준</h2><p>공고의 모든 근무 구간과 TOPIK 요구 수준을 비교합니다. 같은 일치 수라면 가까운 공고부터, 정보가 부족한 공고는 마지막에 보여드려요.</p></section><section className="panel"><EmploymentNotice full /></section><section className="panel"><h2>프로필 체험</h2><p>TOPIK을 낮추거나 주말 가능시간을 추가하면 결과가 바뀝니다. 새로고침하면 초기 프로필로 돌아갑니다.</p></section></aside>
    </div>
  </div>
}
function JobCard({ job, match }: { job: Job; match: MatchResult }) {
  const workplace = getWorkplace(job)
  const photo = employerPosts[job.id]?.images[0]
  return <article className={`panel ${styles.card}`} aria-labelledby={`job-${job.id}`}>
    <div className={styles.cardTop}><span className={styles.category}>{job.category}</span><span className={styles.sampleLabel}>데모용 가상 데이터</span></div>
    {photo && <Link href={`/jobs/${job.id}`} className={styles.cardImage} aria-label={`${workplace.name} 공고 보기`}><Image src={photo.src} alt={photo.alt} width={960} height={540} unoptimized /></Link>}
    <h3 id={`job-${job.id}`}><Link href={`/jobs/${job.id}`}>{workplace.name}</Link></h3><p className={styles.description}>{job.title}</p>
    <div className={styles.meta}><span><MapPin size={15} />학교에서 도보 {job.walkMinutes}분 · 예시</span><span><Clock3 size={15} />{formatShifts(job.shifts)}</span></div>
    <p className={styles.pay}>시급 <strong>{job.hourlyWage.toLocaleString('ko-KR')}</strong>원</p><p className={styles.description}>{formatTopik(job.requiredTopik)}</p>
    <MatchChecks match={match} /><EmploymentNotice /><ReviewSummary job={job} />
    <Link className={styles.detailLink} href={`/jobs/${job.id}`} aria-label={`${workplace.name} 상세보기`}>상세보기<ArrowRight size={17} /></Link>
  </article>
}
