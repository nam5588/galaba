# DOJANG

DOJANG is a web application for international students at Kookmin University. It brings visa and stay deadlines, national health insurance, academic progress, class schedules, campus notices, and part-time job examples into one interface. An AI assistant can answer questions using those features and a searchable collection of university and public regulations.

This repository is an MVP and demonstration project. It does not connect to a university student account, immigration system, health insurer, or real job board. See [Data and limitations](#data-and-limitations) before using its output for an important decision.

## What the application includes

| Area | What it does |
| --- | --- |
| Home dashboard | Summarizes student services, upcoming tasks, notices, and status; the AI chat is further down the page. |
| AI assistant | Answers in Korean, English, Uzbek, or Russian; can use regulations, deadlines, notices, timetable, academics, and job tools. Responses include available sources and may offer a Google Calendar link for a deadline. |
| Visa and stay | Calculates registration, stay extension, and address-change tasks from a D-2 or D-4 profile, with checklists and due dates. |
| Health insurance | Shows calculated enrollment and payment information and allows the user to mark demo months as paid. |
| Academics and timetable | Shows demo credits, GPA, graduation progress, requirements, and a weekly class schedule. |
| Campus notices | Retrieves notices from the Kookmin University website and provides search and category filters. |
| Part-time jobs | Shows fictional example postings, profile-based matching, and example workplace reviews. |
| Settings and installability | Stores language and selected preferences in the browser; provides a web app manifest and a limited offline fallback. |

## Technology

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, CSS modules, and Lucide icons.
- Backend: Express 5 and TypeScript, with JSON APIs under `/api`.
- AI: Anthropic-compatible tool calling through a configurable gateway. A limited, rule-based offline response is used when no AI credential is configured or the model call fails.
- Regulation search: a local BM25 index built from text files, including Korean character bigrams. It does not require an embedding service.
- Tests: Node's test runner for backend logic and Playwright for the visa and insurance demonstration flows.

## Repository layout

```text
.
├── backend/
│   ├── data/                 # Demo profile, regulation source texts, and generated index
│   ├── scripts/              # Regulation index generation
│   └── src/                  # Express routes, calculations, crawler, and chat tools
├── frontend/
│   ├── public/               # Icons, images, and service worker
│   ├── e2e/                  # Playwright scenarios
│   └── src/                  # Next.js pages, components, and browser-side API clients
├── docs/                     # Product requirements for the main feature areas
├── package.json              # Commands for both applications
└── vercel.json               # Frontend, backend, and /api routing configuration
```

## Run locally

Requirements: Node.js 20.19 or newer and npm. Run commands from this repository's root directory.

```bash
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Express API runs at [http://localhost:4100](http://localhost:4100); `GET /api/health` is available to check it. `npm run dev` starts both processes. To start only one, use `npm run dev:frontend` or `npm run dev:backend`.

The example configuration works without an AI credential. To enable model responses, set `LLM_AUTH_TOKEN` in `backend/.env` for the configured Anthropic-compatible gateway. `LLM_BASE_URL`, `CHAT_MODEL`, and `CHAT_EFFORT` can be adjusted there. The backend also accepts `ANTHROPIC_API_KEY` if using the Anthropic API directly. Keep all credentials in the backend environment; do not put them in `NEXT_PUBLIC_*` variables.

`NEXT_PUBLIC_API_URL` in `frontend/.env.local` defaults to `http://localhost:4100`. If you change the frontend port or origin, update `CORS_ORIGIN` in `backend/.env` accordingly. In a same-origin production deployment, omit `NEXT_PUBLIC_API_URL` so the frontend calls `/api` directly.

## Main API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API health check. |
| `GET` | `/api/notices?category=&limit=` | Campus notices; live retrieval with cache and sample fallback. |
| `GET` | `/api/schedule?week=YYYY-MM-DD` | Demo timetable for a week. |
| `GET` | `/api/academics` | Calculated academic summary for the demo student. |
| `GET` | `/api/fd1/demo-profile` | Default visa and insurance profile. |
| `POST` | `/api/fd1/plan` | Tasks and insurance schedule calculated from a student profile. |
| `GET` | `/api/fd1/guides?lang=ko` | Localized task explanations and checklists. |
| `POST` | `/api/fd1/reminders` | Localized reminders calculated from a profile and date. |
| `POST` | `/api/chat` | Chat response with tool steps, available sources, and optional calendar actions. |

The route implementations are in [`backend/src/routes`](backend/src/routes). For visa and insurance requests, the profile fields and response types are defined in [`backend/src/fd1`](backend/src/fd1) and [`frontend/src/lib/fd1.ts`](frontend/src/lib/fd1.ts).

## How the assistant works

The chat orchestrator selects from a registered set of tools: regulation search, deadlines, notices, timetable, academics, example jobs, and calendar-link creation. The regulation index is generated from [`backend/data/regulations`](backend/data/regulations) and committed as [`backend/data/regulations.json`](backend/data/regulations.json). To rebuild it after changing a source text:

```bash
npm --prefix backend run build:rag
```

Calendar actions generate a link that opens a prefilled Google Calendar event. The application does not write directly to a user's calendar.

## Verification

```bash
npm run check                         # Backend typecheck and tests; frontend typecheck
npm --prefix frontend run lint       # Frontend ESLint
npm run build                         # Production builds for both applications
npm run e2e                           # Playwright browser scenarios
```

For the browser scenarios, install the Playwright Chromium browser once if it is not already available:

```bash
cd frontend
npx playwright install chromium
```

The end-to-end configuration starts the development servers when needed and uses ports 3000 and 4100.

## Data and limitations

- Visa and insurance calculations use the browser's saved profile or a bundled demo profile. They are guidance for the demonstration, not an official eligibility or payment determination.
- D-4 calculations are marked as unverified by the current planning logic. Check the applicable rules with an official source.
- Academic records, the timetable, job postings, workplaces, and reviews are demo data. Job matching does not determine whether a student is legally permitted to work.
- Notices are fetched from the university website. If retrieval fails, the API can return cached or sample notices; the response's `source` field identifies `live`, `cache`, or `sample` data.
- Profile edits, paid-month checks, read reminders, language, and settings are stored in browser `localStorage`. There is no account synchronization or database-backed user profile. Chat messages are held in the current page session.
- The notification settings do not send KakaoTalk, Telegram, email, or push messages. The current reminder experience is in the application.
- Without a working model credential, chat uses a limited Korean-language fallback. The full multilingual assistant requires the configured AI service.
- The service worker caches selected pages and static assets for a limited offline experience. API requests and live AI responses still require connectivity.
- Confirm immigration, insurance, employment, and academic requirements with the relevant official office or source before acting on them.

## Deployment

[`vercel.json`](vercel.json) defines separate frontend and backend services and rewrites `/api/*` to the backend. Set backend credentials as deployment environment variables, and use a same-origin API path for the frontend. Review the configured model, gateway access, CORS origin, and notice-crawler connectivity in the target environment before release.

## Further documentation

The [`docs`](docs) directory contains the product requirements for visa and insurance workflows, AI chat orchestration, academics, timetable, and notices. These documents describe the intended product behavior; the source code and the limitations above describe the current implementation.
