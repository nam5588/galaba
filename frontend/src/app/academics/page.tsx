'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Info,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { api } from '@/lib/api'
import type { AcademicStatus, AcademicsResponse } from '@/lib/types'

const STATUS_LABEL: Record<AcademicStatus, string> = {
  safe: '안전',
  warning: '주의',
  danger: '경고',
}

export default function AcademicsPage() {
  const [data, setData] = useState<AcademicsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await api<AcademicsResponse>('/api/academics')
      setError('')
      setData(res)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '학업 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  return (
    <AppShell>
      <div className="feature-page academics-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">나의 학업 현황</span>
            <h1>수강 &amp; 학업</h1>
            <p>졸업까지 남은 학점과 성적 상태, 유학생 수강 요건을 한곳에서 확인하세요.</p>
          </div>
          <div className="page-heading-icon"><GraduationCap size={30} /></div>
        </div>

        {error ? (
          <div className="state-message">
            <div><TriangleAlert size={27} /></div>
            <h2>학업 정보를 불러오지 못했어요</h2>
            <p>{error}</p>
            <button onClick={() => { setLoading(true); setError(''); void load() }}>다시 시도</button>
          </div>
        ) : loading || !data ? (
          <AcademicsSkeleton />
        ) : (
          <>
            <section className="feature-panel academics-summary">
              <div className="academics-profile">
                <strong>{data.profile.name}</strong>
                <span>{data.profile.university} · {data.profile.department}</span>
                <span>{data.profile.year}학년 · {data.profile.semester}</span>
                <small>{data.profile.status}</small>
              </div>

              <div className="academics-progress">
                <div className="academics-progress-head">
                  <span>졸업 진척도</span>
                  <strong>{data.credits.progress}%</strong>
                </div>
                <div className="progress-track" role="progressbar" aria-valuenow={data.credits.progress} aria-valuemin={0} aria-valuemax={100}>
                  <i style={{ width: `${data.credits.progress}%` }} />
                </div>
                <small>졸업까지 {data.credits.remaining}학점 남았어요.</small>
              </div>
            </section>

            <section className="academics-cards">
              <article className="academics-card">
                <div className="academics-card-icon"><BookOpenCheck size={22} /></div>
                <span>이수 학점</span>
                <strong>{data.credits.earned}</strong>
                <small>/ 필요 {data.credits.required}학점</small>
              </article>
              <article className="academics-card">
                <div className="academics-card-icon"><TrendingUp size={22} /></div>
                <span>남은 학점</span>
                <strong>{data.credits.remaining}</strong>
                <small>졸업까지</small>
              </article>
              <article className={`academics-card gpa ${data.gpa.status}`}>
                <div className="academics-card-icon"><GraduationCap size={22} /></div>
                <span>평점 (GPA)</span>
                <strong>{data.gpa.value.toFixed(2)}</strong>
                <small>/ {data.gpa.scale.toFixed(1)} 만점</small>
                <em className={`status-badge ${data.gpa.status}`}>{STATUS_LABEL[data.gpa.status]}</em>
              </article>
            </section>

            <section className="feature-panel academics-requirements">
              <h2>유학생 수강 요건</h2>
              <ul>
                {data.requirements.map((req) => (
                  <li key={req.id} className={`requirement ${req.status}`}>
                    <div className="requirement-icon">
                      {req.status === 'danger' ? <AlertTriangle size={18} /> : req.status === 'warning' ? <Info size={18} /> : <CheckCircle2 size={18} />}
                    </div>
                    <div>
                      <div className="requirement-head">
                        <strong>{req.title}</strong>
                        <em className={`status-badge ${req.status}`}>{STATUS_LABEL[req.status]}</em>
                      </div>
                      <p>{req.summary}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <p className="academics-disclaimer"><Info size={15} />{data.disclaimer}</p>
            <div className="academics-sources">
              {data.sources.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

function AcademicsSkeleton() {
  return (
    <div className="academics-skeleton">
      <div className="feature-panel skeleton-block" />
      <div className="academics-cards">
        {Array.from({ length: 3 }, (_, i) => <div className="academics-card skeleton-block" key={i} />)}
      </div>
      <div className="feature-panel skeleton-block tall" />
    </div>
  )
}
