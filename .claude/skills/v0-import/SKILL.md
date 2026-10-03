---
name: v0-import
description: v0(v0.app)에서 받은 ZIP이나 코드를 galaba의 frontend/ Next.js 앱으로 옮긴다. "v0에서 만든 화면 넣어줘", "v0 zip 올려줘", "새 화면 v0로 만들었어" 같은 요청에 사용.
---

# v0 화면을 frontend/로 옮기기

v0 프로젝트와 팀 `frontend/`는 구조가 달라서 통째로 덮어쓰면 깨진다. **팀 구조를 기준으로 두고 화면 코드만 옮긴다.**

| 항목 | v0 ZIP | 팀 frontend/ (기준) |
|---|---|---|
| 패키지 매니저 | pnpm (`pnpm-lock.yaml`) | **npm** (`package-lock.json`) |
| 소스 위치 | `app/`, `components/`, `lib/` | **`src/app/`, `src/components/`, `src/lib/`** |
| 경로 별칭 | `@/*` → `./*` | `@/*` → `./src/*` (import 문은 그대로 동작) |
| next.config | `ignoreBuildErrors: true` | 쓰지 않음. 타입 에러는 고친다 |

## 절차

1. **ZIP 풀기**: 레포 밖에 푼다. `~/Downloads`를 최신순으로 보고 가장 최근 v0 ZIP을 고른다(첫 화면은 `해커톤/front/`에 풀려 있다).
2. **무엇이 쓰이는지 파악**: `app/page.tsx` 등 실제 화면 파일의 import를 따라가서, 실제로 쓰이는 파일과 패키지만 고른다. v0 기본 템플릿에 딸린 `components/ui/*`, `placeholder-*` 이미지는 쓰이지 않으면 옮기지 않는다.
3. **파일 복사**
   - 화면: v0는 항상 `app/page.tsx`(루트)에 화면을 만든다. 그런데 `frontend/src/app/page.tsx`는 이미 팀 메인 대시보드다. **새 화면은 새 경로 폴더에 넣는다** (예: AI 상담 화면 → `frontend/src/app/chat/page.tsx`). 사용자가 "메인 화면 교체"라고 분명히 말할 때만 `src/app/page.tsx`를 덮어쓴다. 경로 이름이 애매하면 사용자에게 묻는다.
   - 컴포넌트·유틸: `components/**` → `frontend/src/components/**`, `lib/**` → `frontend/src/lib/**`
     (`frontend/src/lib/api.ts`는 팀 API 클라이언트라 덮어쓰지 않는다)
   - 정적 파일: 코드나 metadata가 참조하는 `public/` 파일(아이콘, 이미지)을 `frontend/public/`으로 복사한다. 쓰이지 않는 `placeholder-*`는 빼고, 이미 있는 같은 이름 파일은 덮어쓰기 전에 확인한다.
   - 스타일: v0의 `globals.css`는 기존 `frontend/src/app/globals.css`와 **합친다**. `@import 'tw-animate-css'`, `@import 'shadcn/tailwind.css'`는 그 기능(애니메이션 유틸, `data-open:` 같은 variant)을 쓰는 컴포넌트를 옮길 때만 유지하고 패키지도 같이 설치한다.
   - `layout.tsx`: 루트 레이아웃은 하나뿐이다. 메인 화면을 교체할 때만 v0의 `metadata`와 `viewport`를 반영하고, 새 경로 화면이면 그 폴더의 `page.tsx`에 `export const metadata`(title 등)만 둔다. `@vercel/analytics`는 넣지 않는다.
4. **의존성 추가**: 실제로 import되는 패키지만 `npm --prefix frontend install <pkg>`로 추가한다 (예: `lucide-react`, shadcn 컴포넌트를 쓰면 `clsx tailwind-merge class-variance-authority @base-ui/react`). pnpm 파일은 복사하지 않는다.
5. **이미지 확인 (자주 깨짐)**: v0 코드 안의 `https://*.public.blob.vercel-storage.com/...` 이미지는 v0 미리보기 전용이라 ZIP 밖에서는 **404**가 나는 경우가 많다.
   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' -I "<이미지 URL>"
   ```
   404이면 원본 이미지 파일을 사용자에게 받아 `frontend/public/images/`에 넣고 `/images/<파일>` 경로로 바꾼다.
6. **검증**: 아래가 모두 통과해야 끝이다.
   ```bash
   npm --prefix frontend run typecheck
   npm --prefix frontend run lint      # error 0개 (warning은 허용)
   npm --prefix frontend run build
   ```
   그다음 `npm --prefix frontend run dev`로 띄워서 v0 미리보기(또는 원본 ZIP 폴더에서 `pnpm install` 후 `pnpm exec next dev -p 3005`로 띄운 것)와 같은 뷰포트에서 스크린샷을 비교한다. 원본은 3001이 아닌 포트로 띄운다(3000이 바쁠 때 `next dev`가 3001로 자동 이동한다).
7. **올리기**: `ship-to-main` 스킬 절차를 따른다.

## 주의
- `frontend/AGENTS.md`: 이 Next.js(16.x)는 학습 데이터와 다를 수 있다. Next API를 새로 쓸 때는 `frontend/node_modules/next/dist/docs/`를 먼저 확인한다.
- v0 화면은 Tailwind 유틸리티 대신 `globals.css`의 일반 CSS 클래스(`.app-shell`, `.panel` 등)를 많이 쓴다. 다른 화면과 클래스 이름이 겹치는지 확인한다.
- 화면에 들어간 데이터(공지, 시간표 등)는 하드코딩된 예시다. 백엔드 연결은 `add-api-endpoint` 스킬로 한다.
