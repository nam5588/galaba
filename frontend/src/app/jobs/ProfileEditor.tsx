'use client'

import { useState } from 'react'
import { days, defaultProfile, type Day, type Shift, type StudentProfile } from './jobsData'
import { useStudentProfile } from './ProfileContext'
import { validateProfile } from './matching'
import styles from './jobs.module.css'

export default function ProfileEditor() {
  const { profile, saveProfile } = useStudentProfile()
  const [draft, setDraft] = useState(profile)
  const error = validateProfile(draft)
  function update(next: StudentProfile) {
    setDraft(next)
    if (validateProfile(next) === null) saveProfile(next)
  }
  function updateDay(day: Day, patch: Partial<Shift>) {
    update({ ...draft, availability: draft.availability.map((shift) => shift.day === day ? { ...shift, ...patch } : shift) })
  }
  return <section className={`panel ${styles.profileEditor}`} aria-labelledby="profile-title">
    <div className={styles.sectionTop}><div><h2 id="profile-title">내 근무 조건</h2><p>데모용 가상 학생 · 유효한 변경사항은 추천 결과에 바로 반영됩니다.</p></div><button className={styles.cancelButton} onClick={() => update(defaultProfile)}>프로필 초기화</button></div>
    <div className={styles.profileFields}>
      <label>체류자격<select value={draft.visaType} onChange={(event) => update({ ...draft, visaType: event.target.value as StudentProfile['visaType'] })}><option>D-2</option><option>D-4</option></select></label>
      <label>TOPIK<select value={draft.topikLevel ?? ''} onChange={(event) => update({ ...draft, topikLevel: event.target.value === '' ? null : Number(event.target.value) })}><option value="">미입력</option>{[0, 1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>{level === 0 ? '급수 없음 (0)' : `${level}급`}</option>)}</select></label>
    </div>
    <fieldset className={styles.availability}><legend>요일별 근무 가능시간</legend>{days.map((day) => {
      const shift = draft.availability.find((item) => item.day === day)
      return <div className={styles.dayRow} key={day}><label className={styles.dayToggle}><input type="checkbox" checked={!!shift} onChange={(event) => update({ ...draft, availability: event.target.checked ? [...draft.availability, { day, startTime: '18:00', endTime: '22:00' }] : draft.availability.filter((item) => item.day !== day) })} />{day}</label><input type="time" aria-label={`${day} 시작 시간`} disabled={!shift} value={shift?.startTime ?? '18:00'} onChange={(event) => updateDay(day, { startTime: event.target.value })} aria-invalid={!!shift && !!error} /><span>~</span><input type="time" aria-label={`${day} 종료 시간`} disabled={!shift} value={shift?.endTime ?? '22:00'} onChange={(event) => updateDay(day, { endTime: event.target.value })} aria-invalid={!!shift && !!error} /></div>
    })}</fieldset>
    <p role={error ? 'alert' : 'status'} className={error ? styles.inputError : styles.profileStatus}>{error ? `${error} 마지막 유효한 프로필로 추천 중입니다.` : '저장됨 · 목록과 상세에 같은 프로필이 적용됩니다. 새로고침하면 초기화됩니다.'}</p>
    <p className={styles.mapCaption}>체류자격으로 취업 허가를 판정하지 않습니다. TOPIK은 공고의 언어 조건만 비교합니다.</p>
  </section>
}
