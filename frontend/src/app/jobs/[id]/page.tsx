'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { ArrowLeft, Briefcase, CheckCircle2, MapPin, X } from 'lucide-react'
import { jobs, getWorkplace, formatShifts, formatTopik, type Job } from '../jobsData'
import { employerPosts } from '../jobDetails'
import { useStudentProfile } from '../ProfileContext'
import { matchJob } from '../matching'
import { EmploymentNotice, MatchChecks, ReviewSummary } from '../JobInfo'
import styles from '../jobs.module.css'

export default function JobDetailPage() {
  const params = useParams<{ id: string }>()
  const job = jobs.find((item) => String(item.id) === params.id)
  return job ? <JobDetail key={job.id} job={job} /> : <div className={`feature-page ${styles.page}`}><section className={`panel ${styles.empty}`}><h1>공고를 찾을 수 없습니다.</h1><Link className={styles.detailLink} href="/jobs">알바 목록으로 돌아가기</Link></section></div>
}
function JobDetail({ job }: { job: Job }) {
  const { profile } = useStudentProfile()
  const match = matchJob(job, profile)
  const workplace = getWorkplace(job)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const post = employerPosts[job.id]
  const mapQuery = post ? new URLSearchParams({ bbox: `${post.longitude - 0.007},${post.latitude - 0.004},${post.longitude + 0.007},${post.latitude + 0.004}`, layer: 'mapnik', marker: `${post.latitude},${post.longitude}` }).toString() : ''
  function openGuidance() { setAcknowledged(false); dialogRef.current?.showModal() }
  return <div className={`feature-page ${styles.page}`}>
    <Link className={styles.backLink} href="/jobs"><ArrowLeft size={16} />알바 목록으로</Link>
    <div className="page-heading"><div><span className="eyebrow">{job.category} · 데모용 가상 데이터</span><h1>{workplace.name}</h1><p>{job.title}</p></div><div className="page-heading-icon"><Briefcase size={30} /></div></div>
    <section className={`panel ${styles.detailSection} ${styles.topMap}`} aria-labelledby="map-title">
      <div className={styles.sectionTop}><h2 id="map-title"><MapPin size={20} />국민대학교 근처 위치</h2><span className={styles.category}>지도 시연</span></div>
      <p>{workplace.location} · 도보 {job.walkMinutes}분(가상 데이터)</p>
      <p className={styles.locationNotice}>표시된 지점은 예시이며 실제 사업장 위치가 아닙니다. 도보 시간은 지도에서 계산하지 않습니다.</p>
      {post ? <><iframe title={`${workplace.name} 예시 위치 지도`} className={styles.map} src={`https://www.openstreetmap.org/export/embed.html?${mapQuery}`} loading="lazy" referrerPolicy="no-referrer" /><a className={styles.mapLink} href={`https://www.openstreetmap.org/?mlat=${post.latitude}&mlon=${post.longitude}#map=16/${post.latitude}/${post.longitude}`} target="_blank" rel="noreferrer">큰 지도에서 예시 위치 보기 ↗</a><p className={styles.mapCaption}>지도가 표시되지 않으면 큰 지도 링크를 이용해주세요. © OpenStreetMap contributors</p></> : <p>위치 정보가 준비되지 않았습니다.</p>}
    </section>
    <p className={styles.demoNote}>공고·사업장·후기는 데모용 가상 데이터입니다. 지원 안내를 확인해도 지원서는 전송되지 않습니다.</p>
    <div className={styles.detailGrid}>
      <div className={styles.detailMain}>
        <section className={`panel ${styles.detailSection}`} aria-labelledby="employer-title">
          <div className={styles.sectionTop}><h2 id="employer-title">사업주 상세공고</h2><span className={styles.sampleLabel}>데모용 가상 데이터</span></div>
          {post?.images.length ? <div className={styles.gallery}>{post.images.map((photo) => <figure key={photo.src}><Image src={photo.src} alt={photo.alt} width={960} height={540} className={styles.storeImage} unoptimized /></figure>)}</div> : <p>등록된 매장 이미지가 없습니다.</p>}
          <p>{job.description}</p>
          {post && <><h3>담당 업무</h3><ul>{post.duties.map((item) => <li key={item}>{item}</li>)}</ul><h3>지원 자격 및 우대사항</h3><ul>{post.qualifications.map((item) => <li key={item}>{item}</li>)}</ul><h3>근무환경 및 혜택</h3><ul>{post.benefits.map((item) => <li key={item}>{item}</li>)}</ul><h3>채용 절차 예시</h3><p>{post.hiringProcess}</p><p>{post.contact}</p></>}
        </section>
        <section className={`panel ${styles.detailSection}`}><h2>사업장 후기</h2><ReviewSummary job={job} full /></section>
      </div>
      <aside className={styles.detailAside}>
        <section className={`panel ${styles.detailSection}`}><h2>근무 조건</h2><dl className={styles.facts}><div><dt>시급</dt><dd>{job.hourlyWage.toLocaleString('ko-KR')}원</dd></div><div><dt>근무시간</dt><dd>{formatShifts(job.shifts)}</dd></div><div><dt>한국어</dt><dd>{formatTopik(job.requiredTopik)}</dd></div></dl></section>
        <section className={`panel ${styles.detailSection}`}><h2>내 프로필과 비교</h2><p>{profile.visaType} · {profile.topikLevel === null ? 'TOPIK 미입력' : `TOPIK ${profile.topikLevel}`} · <Link href="/jobs">프로필 수정</Link></p><MatchChecks match={match} /><EmploymentNotice full /></section>
        <section className={`panel ${styles.detailSection}`}><h2>지원 전 확인하세요</h2><p>학교 담당부서의 절차와 실제 근무 조건을 먼저 확인해주세요.</p><button className={styles.applyButton} onClick={openGuidance}>지원 안내</button><p className={styles.mapCaption}>데모 · 지원서를 보내거나 접수하지 않습니다.</p><div aria-live="polite">{confirmed && <p className={styles.success}><CheckCircle2 size={18} />안내 확인 완료 · 실제 지원서는 전송되지 않았습니다.</p>}</div></section>
      </aside>
    </div>
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="guide-title" aria-describedby="guide-description">
      <div className={styles.sectionTop}><h2 id="guide-title">지원 전 확인 안내</h2><button className={styles.closeDialog} onClick={() => dialogRef.current?.close()} aria-label="지원 안내 닫기"><X size={21} /></button></div>
      <p id="guide-description"><strong>{workplace.name}</strong> · {job.title}</p><MatchChecks match={match} /><EmploymentNotice full />
      <p className={styles.mapCaption}>데모용 가상 데이터입니다. 확인 버튼을 눌러도 지원서 전송이나 취업 허가가 이루어지지 않습니다.</p>
      <label className={styles.confirmCheckbox}><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />추가 확인 사항과 실제 전송이 없는 데모임을 확인했습니다.</label>
      <div className={styles.dialogActions}><button className={styles.cancelButton} onClick={() => dialogRef.current?.close()}>취소</button><button className={styles.applyButton} disabled={!acknowledged} onClick={() => { if (!acknowledged) return; setConfirmed(true); dialogRef.current?.close() }}>안내 확인 완료</button></div>
    </dialog>
  </div>
}
