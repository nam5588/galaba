import Link from 'next/link'
import { ArrowLeft, Home, MapPinned } from 'lucide-react'

export default function NotFound() {
  return <main className="error-page"><div className="error-illustration"><MapPinned size={46} /><span>404</span></div><span className="eyebrow">길을 잘못 들었어요</span><h1>페이지를 찾을 수 없어요</h1><p>요청한 주소가 변경되었거나 삭제되었을 수 있어요.<br />주소를 다시 확인하거나 홈으로 돌아가세요.</p><div className="error-actions"><Link className="primary-button" href="/"><Home size={18} />홈으로 가기</Link><Link className="secondary-button" href="/notices"><ArrowLeft size={18} />학교 공지 보기</Link></div></main>
}
