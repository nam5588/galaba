---
name: add-api-endpoint
description: galaba backend(Express)에 새 API를 추가하고 frontend 화면과 연결한다. "공지 API 만들어줘", "백엔드에 엔드포인트 추가", "화면에 실제 데이터 붙여줘" 같은 요청에 사용.
---

# API 추가하고 화면에 연결하기

## 구조
- 백엔드: `backend/src/index.ts`(Express 5, 포트 4100, `/api/*`). ESM(`"type": "module"`, NodeNext)이라 **상대 import에 `.js` 확장자를 붙인다** (`import { noticesRouter } from "./routes/notices.js"`).
- 프론트: `frontend/src/lib/api.ts`의 `api<T>(path)`가 `NEXT_PUBLIC_API_URL`(기본 `http://localhost:4100`)로 요청한다.
- CORS: 백엔드 `CORS_ORIGIN`(기본 `http://localhost:3000`)만 허용한다.

## 절차

1. **명세 먼저**: `galaba/CLAUDE.md`(레포 루트)의 "API 명세" 표에 메서드, 경로, 응답 형태를 한 줄로 추가한다. 응답 타입은 프론트 화면이 쓰는 필드 이름에 맞춘다 (예: 공지 카드는 `tag`, `tone`, `date`, `title`, `text`).
2. **타입**: 프론트/백 공용 타입이 필요하면 백엔드는 `backend/src/types.ts`, 프론트는 `frontend/src/lib/types.ts`에 같은 모양으로 둔다(공용 패키지는 아직 없음).
3. **라우터 작성**: `backend/src/routes/<이름>.ts`에 `express.Router()`로 만들고 `index.ts`에서 `app.use("/api/<이름>", <이름>Router)`로 연결한다. 처음에는 하드코딩한 예시 데이터를 돌려줘도 된다. 화면 연결을 먼저 확인하고 실제 데이터(크롤러, DB, LLM)로 바꾼다.
4. **비밀 값**: API 키는 `backend/.env`에만 넣고, 키 이름은 `backend/.env.example`에 추가한다. 프론트에서 LLM 키를 직접 쓰지 않는다(`NEXT_PUBLIC_*`은 브라우저에 그대로 노출된다).
5. **백엔드 확인**: 백엔드를 먼저 띄운다(`npm run dev:backend`, 포트 4100. 이미 떠 있으면 생략).
   ```bash
   npm --prefix backend run typecheck
   curl -s http://localhost:4100/api/<이름>
   ```
6. **화면 연결**: 화면의 하드코딩 배열을 `api<T>("/api/<이름>")` 호출로 바꾼다. 메인 화면(`src/app/page.tsx`)은 `'use client'`이므로 `useEffect`로 불러온다.
   - 기존 예시 데이터를 `useState`의 초기값으로 둬서, 백엔드가 꺼져 있어도 화면이 깨지지 않게 한다.
   - 로딩은 `useState(true)`로 시작하고, `setState`는 `.then/.catch/.finally` 안에서만 호출한다. effect 본문에서 `setState`를 바로 부르면 `react-hooks/set-state-in-effect` 린트 에러가 난다.
7. **확인 후 올리기**: `npm run dev`(프론트+백 동시 실행)로 화면에 데이터가 보이는지 확인하고 `ship-to-main` 스킬로 올린다.

## 데이터가 안 보일 때
- 브라우저 콘솔에 **CORS 에러**: 백엔드는 `CORS_ORIGIN` 하나만 허용한다(기본 `http://localhost:3000`). 3000이 사용 중이면 `next dev`가 3001 등으로 자동으로 옮겨가니, 터미널에 찍힌 프론트 주소를 확인하고 3000을 비우거나 `backend/.env`의 `CORS_ORIGIN`을 그 주소로 바꾼 뒤 백엔드를 재시작한다. `127.0.0.1`이 아니라 `localhost`로 접속한다.
- `fetch failed` / 연결 거부: 백엔드가 안 떠 있다. `curl http://localhost:4100/api/health`로 확인한다.
