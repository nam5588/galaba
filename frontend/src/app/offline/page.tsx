import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오프라인 | Dojang",
  description: "현재 오프라인 상태입니다.",
};

// Static offline fallback shown by the service worker when a navigation
// request fails and no cached version of the page is available.
export default function OfflinePage() {
  return (
    <main className="error-page">
      <div className="error-illustration">
        <span>⚡</span>
      </div>
      <span className="eyebrow">OFFLINE</span>
      <h1>오프라인 상태입니다</h1>
      <p>
        인터넷 연결을 확인한 뒤 다시 시도해 주세요.
        <br />
        연결이 복구되면 자동으로 이용할 수 있습니다.
      </p>
    </main>
  );
}
