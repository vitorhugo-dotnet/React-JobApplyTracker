# Applywell — Job Apply Tracker Frontend

[Backend — Spring Boot](https://github.com/vitorhugo-java/SpringBoot-JobApplyTracker/)

Frontend for the Job Apply Tracker: manage job applications, follow-ups,
interview stages, and metrics. Rebuilt in **TypeScript + React + Tailwind CSS**
following a monochrome "Notion + Vercel" design system (clean, typography-forward,
1px borders, 4px radius, no decorative color).

Issues and discussions are centralized in the
[backend repo](https://github.com/vitorhugo-java/SpringBoot-JobApplyTracker/).

## Stack

- React 19 + TypeScript (strict)
- Vite 7
- React Router 7
- Tailwind CSS 3 (custom `mono` palette, Inter + JetBrains Mono)
- Zustand (auth + gamification state, persisted)
- Axios (typed client with bearer auth + single-flight token refresh)
- React Hook Form (form state & validation)
- Playwright (E2E tests against a mocked API)

## Design System

The UI implements the Applywell wireframe handoff (`claude.ai/design`):

- **Palette:** `#000 → #fff` only, exposed as Tailwind `mono-{0,1,2,5,9,c,e5,f5,w}`
- **Type:** Inter (UI) + JetBrains Mono (numbers, hints, eyebrows)
- **Components:** square-ish controls, hover `bg-mono-f5`, selected `bg-black text-white`
- **Status badges:** backend statuses map to six monochrome "families"
  (draft → sent → replied → interview → offer → rejected) in `src/lib/statuses.ts`

## Screens

- **Auth** — Login, Register, Forgot Password
- **Dashboard** — metric cards, achievement badges, To Send Later / Overdue
  follow-up panels, and a Standard ↔ Gamified variant toggle
- **Applications** — Active/Archived tabs, search + status + sort filters,
  Table / Board / Mobile views, server-side pagination, create/edit form with
  unsaved-changes banner, archive & delete confirmations
- **Metrics** — conversion funnel, applications-by-status bars, weekly-volume
  line chart, pipeline averages (pure CSS/SVG, monochrome)
- **Exports** — manual CSV/XLSX download with status, organization, date-range
  and archive filters plus a column picker; recurring exports to Google Drive
  (daily / weekly / monthly with timezone), run-now, and the execution history
- **Developer Tools** — API info, JSON/CSV export, environment panel
- **Account Settings** — profile, change password, passkeys, Google Drive
  status, danger zone

## Project Structure

```text
src/
  api/          # Typed HTTP modules (auth, applications, dashboard, exports, gamification, resumes)
  components/
    applications/  # Table / Board / Cards views
    dashboard/     # MetricCard, AchievementCard, ListPanel
    metrics/       # Monochrome chart primitives
    layout/        # Sidebar, Topbar, AppLayout, ProtectedRoute, navigation
    ui/            # Button, StatusBadge, Field, Segmented, Panel, Dialog, Pager, icons…
  hooks/        # useAsync, useDebouncedValue
  lib/          # api (axios), statuses, format, download, utils
  pages/        # Screens grouped by domain
  store/        # Zustand stores (auth, gamification)
  types/        # Domain types mirroring the OpenAPI contract
  App.tsx       # Route tree + boot-time session restore
  main.tsx      # Entry point
tests/
  support/      # Mock API (stateful) + fixtures + seed data
  *.spec.ts     # E2E specs
```

## Authentication

- Token + user persisted in `applywell-auth` (localStorage) via Zustand persist.
- Axios request interceptor attaches `Authorization: Bearer <token>`.
- On `401/403`, a single-flight refresh retries the original request; a definitive
  failure clears the session and `ProtectedRoute` redirects to `/login`.

## Prerequisites

- Node.js 20+
- npm 10+
- Backend at `http://localhost:8080` (default)

## Environment

- `VITE_API_BASE_URL` (or `VITE_API_URL`): API base; `/api/v1` is appended if absent
- `VITE_BASE_PATH`: deploy base path (default `/`)
- `API_TARGET`: dev proxy target for `/api` (default `http://localhost:8080`)

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_BASE_PATH=/
API_TARGET=http://localhost:8080
```

## Running Locally

```bash
npm install
npm run dev          # http://localhost:5173
```

## Scripts

```bash
npm run dev              # Dev server
npm run build            # tsc + production build
npm run preview          # Preview the build
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npm run test:e2e         # Playwright E2E (mocked API, no backend needed)
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:report  # Open the HTML report
```

## E2E Tests

Tests live in `tests/` and run against a **stateful in-memory mock** of the
backend (`tests/support/mockApi.ts`) — no live API required. Mutations (create,
archive, delete) are reflected within a test run, and an authenticated session is
seeded into localStorage before navigation.

```bash
npm run test:e2e
```

## Integration

This frontend consumes the Spring Boot API under `/api/v1`. The expected backend
lives in the sibling repo:
[SpringBoot-JobApplyTracker](https://github.com/vitorhugo-java/SpringBoot-JobApplyTracker/).
