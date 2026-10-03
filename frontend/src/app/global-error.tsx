'use client'

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <html lang="ko"><body><main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif', color: '#0e2d61', background: '#f7faff', textAlign: 'center', padding: 24 }}><div><title>오류 | DOJANG</title><div style={{ fontSize: 54 }}>⚠️</div><h1>앱을 표시하는 중 문제가 발생했어요</h1><p style={{ color: '#657795' }}>잠시 후 다시 시도해주세요.</p><button onClick={() => retry()} style={{ marginTop: 16, border: 0, borderRadius: 10, padding: '13px 22px', color: 'white', background: '#3189ed', fontWeight: 700, cursor: 'pointer' }}>다시 시도</button></div></main></body></html>
}
