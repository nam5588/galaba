'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { api } from '@/lib/api'
import type { AcademicsResponse } from '@/lib/types'

/** 오른쪽 '학업 현황' 축약 카드: /api/academics 실제 데이터 (전체는 /academics). */
export function AcademicsSummary() {
  const [data, setData] = useState<AcademicsResponse | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api<AcademicsResponse>('/api/academics')
      .then(setData)
      .catch(() => setError(true))
  }, [])

  return (
    <section className="panel academics-card-home">
      <div className="section-heading">
        <div className="heading-title"><GraduationCap size={22} /><h2>학업 현황</h2></div>
        {data && <span className="week-button">{data.profile.year}학년</span>}
      </div>
      {error && <p className="upcoming-empty">학업 정보를 불러오지 못했어요.</p>}
      {data && (
        <div className="academics-home-body">
          <div className="academics-home-progress">
            <div className="academics-home-progress-head">
              <span>졸업까지</span>
              <strong>{data.credits.remaining}학점</strong>
            </div>
            <div className="progress-track">
              <i style={{ width: `${data.credits.progress}%` }} />
            </div>
            <small>{data.credits.earned} / {data.credits.required}학점 · {data.credits.progress}%</small>
          </div>
          <div className={`academics-home-gpa ${data.gpa.status}`}>
            <span>평점</span>
            <strong>{data.gpa.value.toFixed(2)}</strong>
            <small>/ {data.gpa.scale.toFixed(1)}</small>
          </div>
        </div>
      )}
      {!data && !error && <p className="upcoming-empty">불러오는 중…</p>}
      <Link href="/academics" className="full-button">수강 &amp; 학업 보기 <ArrowRight size={17} /></Link>
    </section>
  )
}
