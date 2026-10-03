# galaba — UniMate (유학생 행정비서)

국민대 해커톤 팀 프로젝트. 주제는 "귀찮음을 대신해주는 서비스"이고, 외국인 유학생이 놓치기 쉬운 학교·체류 행정(공지, 비자, 건강보험, 수강 요건, 일정)을 한곳에서 챙겨주고 **최소 한 가지는 대신 처리해주는** 것이 목표다.

## 구조
```
galaba/
├── package.json        # 루트: 프론트+백 동시 실행 스크립트 (concurrently)
├── frontend/           # Next.js 16.3 + React 19.2 + Tailwind 4, React Compiler 사용, 포트 3000
│   └── src/app/        # 메인 대시보드: page.tsx(v0로 만든 화면), globals.css
└── backend/            # Express 5 + TypeScript(ESM, NodeNext), 포트 4100, /api/*
    └── src/index.ts
```

## 명령어 (루트에서)
| 명령 | 하는 일 |
|---|---|
| `npm run install:all` | 루트·백·프론트 의존성 설치 (처음 한 번, 의존성 바뀔 때) |
| `npm run dev` | 백엔드(4100)와 프론트(3000)를 같이 실행 |
| `npm run dev:frontend` / `npm run dev:backend` | 한쪽만 실행 |
| `npm run check` | 백엔드 타입체크+테스트, 프론트 타입체크 (push 전 필수) |
| `npm --prefix frontend run lint` | 프론트 ESLint |
| `npm run e2e` | FD1 데모 흐름 E2E (Playwright, 서버가 없으면 띄운다. 처음 한 번 `npx --prefix frontend playwright install chromium`) |
| `npm run build` | 백엔드 tsc + 프론트 next build |

패키지 매니저는 **npm**만 쓴다(pnpm/yarn lock 파일을 만들지 않는다).

## Git 규칙
- **PR 없이 main에 직접 push한다.** 작업 시작 전에 `git pull --rebase --autostash origin main`.
- 올릴 때 순서: 검증(`npm run check`) → 커밋 → `git pull --rebase origin main` → 다시 검증 → push. force push 금지.
- `.env*`는 커밋하지 않는다(`.env.example`만 커밋). 레포가 **public**이라 키가 올라가면 바로 유출된다.
- 자세한 절차: `ship-to-main` 스킬.

## 환경 변수
| 위치 | 키 | 기본값 |
|---|---|---|
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:4100` |
| `backend/.env` | `PORT`, `CORS_ORIGIN` | `4100`, `http://localhost:3000` |

## API 명세
새 API를 만들면 이 표에 먼저 추가한다(`add-api-endpoint` 스킬).

| 메서드 | 경로 | 응답 | 상태 |
|---|---|---|---|
| GET | `/api/health` | `{ status: "ok", timestamp }` | 구현됨 |
| GET | `/api/notices?category=&limit=` | `{ source, fetchedAt, items: Notice[] }` (Notice: id, category, tag, tone, title, date, text, url, dept, pinned) | 구현됨 |
| GET | `/api/schedule?week=` | `{ weekStart, days: ScheduleDay[] }` | 구현됨 |
| POST | `/api/fd1/plan` | body `{ visaType: "D-2"\|"D-4", entryDate, arcIssuedDate?, stayExpiryDate?, moveDate?, paidMonths?: "YYYY-MM"[], today? }` → `{ today, profile, tasks: Fd1Task[], insurance: Fd1Insurance, rulesVerified }` (Fd1Task: type, dueDate, openDate?, daysLeft, status, urgency) | 구현됨 |
| GET | `/api/fd1/guides?lang=ko\|en\|uz\|ru` | `{ lang, guides: Record<Fd1TaskType, { title, summary, checklist[], links[] }>, disclaimer, sources }` | 구현됨 |
| POST | `/api/fd1/reminders` | body: `/api/fd1/plan`과 같은 profile + `lang?` → `{ today, lang, items: { key, taskType, milestone, dueDate, daysLeft, month?, title, body }[] }` (사이트 알림 벨) | 구현됨 |
| GET | `/api/fd1/demo-profile` | `Fd1Profile` (data/demo-user.json 기준, 채팅 get_deadlines와 같은 사용자) | 구현됨 |
| POST | `/api/chat` `{ messages: [{role, content}] }` | `{ answer, toolsUsed: string[], sources: [{title, url?, kind, text?}], steps: [{tool, label}], actions: [{type:"calendar", title, date, url}], mode: "claude"\|"offline" }` (PRD 5장 + 화면용 필드) | 구현됨 |

## 프론트엔드 메모
- `frontend/AGENTS.md`: Next 16은 학습 데이터와 다를 수 있으니, Next API를 새로 쓸 때는 `frontend/node_modules/next/dist/docs/`를 먼저 확인한다.
- `LayoutProps` 같은 전역 타입은 `next typegen`이 만든다. 그래서 프론트 `typecheck` 스크립트는 `next typegen && tsc --noEmit`이다.
- 메인 화면은 v0에서 가져왔고, Tailwind 유틸리티 대신 `globals.css`의 일반 CSS 클래스로 스타일링되어 있다. 화면 속 데이터는 아직 하드코딩된 예시다.
- **이미지 2개 필요**: `frontend/public/images/logo.png`(사이드바 로고), `frontend/public/images/hero-bg.png`(상단 배너 배경). v0 서버 링크가 깨져서 파일을 따로 넣어야 한다. 없으면 로고 자리에 대체 텍스트가 보인다.
- v0에서 새 화면을 가져올 때: `v0-import` 스킬.
- `next build`의 "multiple lockfiles / workspace root" 경고는 루트와 frontend에 lock 파일이 따로 있어서 생긴다. 빌드에는 영향이 없다.

- FD1(체류·건강보험): `/visa`, `/insurance` 화면은 `components/fd1/`, 데이터·문구(ko/en/uz/ru)는 `lib/fd1.ts`. 상단 언어 선택·알림 벨(`Fd1TopActions`)은 홈과 `AppShell`에 들어 있다. DB 연결 전까지 내 정보·납부 체크·읽은 알림은 localStorage(`fd1.*`)에 저장하고, 없으면 데모 사용자(`/api/fd1/demo-profile`)를 보여준다. 언어 선택은 아직 FD1 부분에만 적용된다. 데모 발표 때는 `?today=2026-10-16`처럼 날짜를 고정할 수 있다(`?today=`로 해제, 화면에 배너 표시).
- 설정(`/settings`, `app/settings/page.tsx`): 언어(=FD1 언어와 같은 값)·알림 시점/채널(저장만, 발송은 미구현)·AI 답변의 구글 캘린더 버튼 표시·초기화. 값은 `lib/settings.ts`가 localStorage `dojang.settings.*`에 저장한다.

## 백엔드 메모
- FD1(체류·건강보험 일정, `docs/PRD-FD1.md`): 계산은 `src/fd1/plan.ts`(순수 함수), 규정 숫자는 `src/fd1/config.ts`에서만 바꾼다. 날짜는 한국 시간 기준 `"YYYY-MM-DD"` 문자열. 화면 문구는 서버가 보내지 않고, 안내·체크리스트 다국어 문구는 `src/fd1/guides.ts`에 있다.
- 테스트: `npm --prefix backend test` (node:test + tsx, `src/**/*.test.ts`). `npm run check`에 포함된다.
- **AI 채팅(메인, 김희경)**: 설계는 `docs/PRD-ai-chat-orchestration.md`. `backend/src/chat/orchestrator.ts`가 LLM tool use 루프(도구 호출 최대 5회)로 `backend/src/tools/index.ts`에 등록된 도구를 골라 부른다. LLM은 학교 AI 게이트웨이(`LLM_BASE_URL`=https://ai.cs.kookmin.ac.kr, Claude 호환, 모델 `CHAT_MODEL`=claude-opus-5. Opus 5.5는 게이트웨이에 없음). 키(`LLM_AUTH_TOKEN`)가 없거나 호출이 실패하면(잔액 부족 포함) 도구 결과만으로 답하는 오프라인 모드(`mode: "offline"`). ⚠️ `ANTHROPIC_*` 이름은 Claude Code 환경변수와 충돌하니 백엔드에서는 `LLM_*`만 쓴다.
- **도구 계약(FD 담당 필독)**: `backend/src/tools/types.ts`의 `ToolDef`를 `backend/src/tools/<도구이름>.ts`에서 export → `tools/index.ts`의 import를 그 파일로 교체. 지금은 `tools/examples.ts`의 예시 데이터(get_deadlines·get_timetable·search_jobs)와 실제 공지 API를 감싼 get_notices가 등록돼 있다. 실패 시 throw 대신 `{ error }`, 항목마다 `url`. 데모 사용자는 `backend/data/demo-user.json`(FD1).
- **규정 RAG**: 원본 `backend/data/regulations/*.txt`(파일명 = 문서명) → `npm --prefix backend run build:rag` → `backend/data/regulations.json`(커밋). 문서는 학칙, 출입국관리법(유학생 관련 7개 조), 국민건강보험법 제109조(외국인 특례), 하이코리아 체류민원 매뉴얼 유학(D-2) 정리본. 조 단위(900자 넘으면 항 단위) 청킹, 조 번호가 없는 안내문은 `■ 제목` 줄 단위. 맨 위 `# 출처: <url>` 줄이 출처 링크가 된다(`#` 줄은 색인 안 함). BM25(한글 2-gram), 점수 8 미만은 버림. HWP 변환: `pip install pyhwp six` 후 `hwp5txt 파일.hwp > 파일.txt`(배포용 HWP의 표 내용은 hwp5txt가 빼먹으니 표가 중요하면 직접 추출). 부칙은 색인에서 뺀다.
- ESM이라 상대 import에 `.js` 확장자를 붙인다.
- 백엔드는 **TypeScript 7**(프론트는 5.9)이다. `baseUrl` 같은 옛 tsconfig 옵션은 제거되어 에러가 나니 `paths`를 쓴다.
- CORS는 `CORS_ORIGIN` 한 곳만 허용한다. 프론트가 3000이 아닌 포트로 뜨면 브라우저에서 CORS 에러가 난다(`add-api-endpoint` 스킬의 "데이터가 안 보일 때").
- LLM API 키 등 비밀 값은 백엔드에서만 쓴다(`NEXT_PUBLIC_*`에 넣지 않는다).

## Claude Code 설정 (`.claude/`)
| 파일 | 역할 |
|---|---|
| `skills/v0-import/` | v0 ZIP을 frontend로 옮기는 절차 |
| `skills/ship-to-main/` | 검증 → 커밋 → main push 절차 |
| `skills/add-api-endpoint/` | 백엔드 API 추가 + 화면 연결 절차 |
| `hooks/guard-git.mjs` | (PreToolUse) force push·`--mirror`·main 삭제 차단, `.env` 커밋/푸시 차단, push 전 "커밋 안 된 변경 없음 + `npm run check` 통과" 확인 |
| `hooks/session-start.mjs` | (SessionStart) origin/main 대비 뒤처짐·미커밋 변경 알림 |
| `settings.json` | 위 훅 등록. 개인 설정은 `settings.local.json`(커밋 안 됨) |
| `launch.json` | Claude 데스크톱 미리보기용 dev 서버 설정 |
