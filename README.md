# Customer Success Analytics Command Center

_A Salesforce-aware customer analytics dashboard for support, retention, churn risk, customer lifetime value, customer health, segmentation, support impact, expansion opportunities, and BI-ready reporting._

Customer Success Analytics Command Center is a full-stack analytics platform that models Customer 360 data across accounts, subscriptions, product usage, support interactions, invoices, opportunities, and customer success touches. It uses Polars and DuckDB to generate curated Parquet datasets, SQL marts, and BI-ready CSV exports, then exposes the analytics through FastAPI and a polished Next.js dashboard.

## 🚀 Live Demo (Static Export)

- **URL**: [bbfosho0.github.io/aws-serverless-support-analytics](https://bbfosho0.github.io/aws-serverless-support-analytics/)
- **What you see**: The fully prerendered Next.js dashboards, including the Customer 360 overview, churn-risk queue, retention/LTV view, support dashboard, and call explorer, served straight from the `gh-pages` branch with the correct `basePath`/`assetPrefix` applied.
- **Tech**: `next.config.mjs` uses `output: "export"`, `trailingSlash: true`, `GITHUB_PAGES=true` (from `.env.production`) and a `.nojekyll` marker so the `_next` assets are untouched by GitHub.

> Architectural details originate from [FrontArc.md](FrontArc.md) (Next.js blueprint) and [BackArc.md](BackArc.md) (FastAPI blueprint). This README focuses on day-to-day development aligned with those plans.

> The current implementation roadmap is captured in [EXPANSION_PLAN.MD](EXPANSION_PLAN.MD), which translates the blueprints into a sequenced, codebase-specific expansion plan.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Business Questions Answered](#business-questions-answered)
- [Data Pipeline](#data-pipeline)
- [BI and Salesforce CRM Analytics Readiness](#bi-and-salesforce-crm-analytics-readiness)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Usage & API Examples](#usage--api-examples)
- [Development Workflow](#development-workflow)
- [Static Demo Deployment](#static-demo-deployment)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Technology Stack

| Layer | Tooling |
| --- | --- |
| **Frontend** | Next.js App Router, React 18, TypeScript, Tailwind CSS, TanStack Query, Zustand, generated OpenAPI types |
| **Backend** | FastAPI, Pydantic v2, Uvicorn, Polars for Parquet reads, JWT local auth, request IDs, structlog, pytest |
| **Data & ETL** | Polars ETL, DuckDB SQL marts, Parquet artifacts, JSON manifests, Tableau-ready CSV exports |
| **Infrastructure Targets** | Local filesystem today; future-ready for AWS S3 data lake, AWS Glue crawlers, Fargate/App Runner deployment, OpenAPI-driven client generation via `openapi-typescript` |
| **Tooling & DX** | npm (pnpm optional), uv/poetry (or pip), Prettier + ESLint, Husky, Thunder Client, VS Code Tailwind/TS/Ruff extensions |

## Business Questions Answered

- Which customers are most likely to churn?
- How much MRR is currently at risk?
- Which customer cohorts retain best?
- Which customer segments have the highest LTV?
- Which accounts are expansion-ready?
- Which regions or plan tiers show weak retention?
- How does support experience affect churn risk?
- Which accounts should Customer Success prioritize first?

## Data Pipeline

```text
data/raw/*.csv + support calls
  -> scripts/generate_customer_analytics.py
  -> data/curated/*.parquet
  -> sql/*.sql DuckDB marts
  -> data/marts/*.parquet
  -> data/bi_exports/*.csv
  -> FastAPI customer analytics endpoints
  -> Next.js Customer 360 pages
```

Core commands:

```powershell
python scripts/generate_parquet.py --input data/sample_calls.json --agents data/agents.csv --output data/cleaned_calls.parquet
python scripts/generate_customer_analytics.py
python -m pytest tests backend/app/tests
python -m scripts.export_openapi
npm --prefix frontend run api:generate:local
npm --prefix frontend run test
npm --prefix frontend run build
```

## BI and Salesforce CRM Analytics Readiness

- BI exports live in `data/bi_exports/` and are generated from the same SQL marts as the API.
- Tableau guidance lives in [bi/tableau/README.md](bi/tableau/README.md).
- Salesforce CRM Analytics readiness docs live in [bi/salesforce_crma/](bi/salesforce_crma/).
- Resume bullets are in [docs/resume-bullets.md](docs/resume-bullets.md).
- Interview talking points are in [docs/interview-talking-points.md](docs/interview-talking-points.md).

This is intentionally not a fake live Salesforce or Tableau integration. It is a local-first analytics engineering and BI-readiness demo with documented mappings and clean exports.

## Screenshots

The screenshots below are local dashboard screenshots captured from the static export, not Tableau screenshots.

![Customer analytics overview](docs/screenshots/customer-analytics-overview.png)

![Churn risk queue](docs/screenshots/churn-risk.png)

![Retention and LTV](docs/screenshots/retention-ltv.png)

## Architecture

The FastAPI + Next.js pairing mirrors the eventual AWS lakehouse by piping raw data through ETL helpers, typed repositories, and generated clients.

```text
+----------------------+       +-------------------------------+       +-----------------------------+       +---------------------------+
| data/raw CSV & JSON  | ----> | Polars ETL + DuckDB SQL marts | ----> | Parquet + BI CSV artifacts  | ----> | FastAPI routers (support  |
| (local or future S3) |       | support + customer analytics  |       | manifests + mart outputs    |       | and customer analytics)   |
+----------------------+       +-------------------------------+       +-----------------------------+       +---------------------------+
        |                                  |                                   |                                    |
        | future AWS S3 + Glue catalog     | repository + service layer        | Pydantic schemas + OpenAPI         | TanStack Query hooks +
        v                                  v                                   v                                    v
  AWS lakehouse bucket           IO adapters + business logic       Typed envelopes & contracts           Next.js dashboards (App Router)
```

1. **Data flow** – `scripts/generate_parquet.py` builds support-call artifacts, while `scripts/generate_customer_analytics.py` builds Customer 360 curated datasets, DuckDB marts, BI CSV exports, and a customer analytics manifest.
2. **Backend services** – Services read generated artifacts via Polars, keep business metrics out of frontend-only code, and expose OpenAPI metadata.
3. **Frontend consumption** – `openapi-typescript` generates clients consumed by TanStack Query hooks, while Tailwind + shadcn/ui render the dashboards described in `FrontArc.md`.
4. **AWS readiness** – Pointing `DATA_SOURCE` at S3 swaps the storage layer without touching the React code because the contracts and query hooks stay identical.

## Getting Started

### TL;DR bootstrap (PowerShell)

```powershell
git clone https://github.com/bbfosho0/aws-serverless-support-analytics.git
cd aws-serverless-support-analytics
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt -r backend/requirements.txt
python scripts/generate_parquet.py --input data/sample_calls.json --agents data/agents.csv --output data/cleaned_calls.parquet
python scripts/generate_customer_analytics.py
uvicorn backend.app.main:app --reload --port 8000   # run from repo root
cd frontend
npm install
npm run dev -- --port=3000
```

Once both servers are running, visit `http://localhost:3000/customer-analytics`, `http://localhost:3000/customer-analytics/churn-risk`, `http://localhost:3000/customer-analytics/retention`, and `http://localhost:8000/api/healthz`.

### 1. Prerequisites

- Node.js 20+ with `npm` (feel free to substitute another package manager if you already have one configured)
- Python 3.14 in this checkout, or another supported Python version with compatible wheels for Polars, PyArrow, DuckDB, and Pydantic
- [`uv`](https://github.com/astral-sh/uv) for painless virtualenv + dependency management (alternatively use `python -m venv` + `pip`)
- Git, VS Code, and the Parquet dependencies already pinned in `requirements.txt`

### 2. Clone & bootstrap

```powershell
cd C:\Users\Yoshi\Documents\GitHub
git clone https://github.com/bbfosho0/aws-serverless-support-analytics.git
cd aws-serverless-support-analytics
```

### 3. Install Python dependencies with pip

```powershell
# Windows (PowerShell)
py -3.11 -m venv .venv   # use "python -m venv .venv" if your default Python is already 3.11
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt          # shared ETL + test deps
pip install -r backend/requirements.txt   # FastAPI-specific deps
```

```bash
# macOS / Linux
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

### 4. Generate local ETL artifacts

```powershell
python scripts/generate_parquet.py --input data/sample_calls.json --agents data/agents.csv --output data/cleaned_calls.parquet
python scripts/generate_customer_analytics.py
```

The first command builds support analytics artifacts. The second validates Customer 360 raw CSVs, writes curated Parquet outputs, runs DuckDB SQL marts, writes BI-ready CSV exports, and updates `data/customer_analytics_manifest.json`.

### 5. Configure environment variables

Create `.env` (backend) and `.env.local` (frontend) using the snippets below:

```ini
# backend/.env
APP_ENV=local
DATA_SOURCE=local
PARQUET_PATH=data/cleaned_calls.parquet
MANIFEST_PATH=data/manifest.json
SECRET_KEY=dev-secret
ENABLE_REFRESH_ENDPOINT=true
CORS_ORIGINS=http://localhost:3000
```

```ini
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_TIME_RANGE=30d
```

The frontend also ships with `frontend/.env.production`, which only sets `GITHUB_PAGES=true`. Next.js loads that file during `npm run build` so `next.config.mjs` can flip `basePath`/`assetPrefix` for GitHub Pages without you having to touch `.env.local`. Keep `.env.local` pointed at your FastAPI backend for day-to-day work; when you need the static demo to call the baked-in `/mock-api` responses, override the `NEXT_PUBLIC_*` variables inline:

```powershell
# PowerShell
$env:NEXT_PUBLIC_API_BASE_URL="/mock-api"
$env:NEXT_PUBLIC_SITE_BASE="/aws-serverless-support-analytics"
npm run build
```

These overrides take precedence over `.env.local` for that shell session only, so your dev defaults stay intact.

### 6. Start the FastAPI backend

```powershell
.\.venv\Scripts\Activate.ps1
uvicorn backend.app.main:app --reload --port 8000   # run from the repo root so support_analytics stays on PYTHONPATH
```

Keep this terminal rooted at the repository top level; importing `support_analytics` will fail if you `cd backend` first.

Verify the simulation from a second PowerShell window:

```powershell
Invoke-RestMethod -Uri http://localhost:8000/api/healthz
```

### 7. Start the Next.js frontend

```powershell
cd frontend
npm install
npm run dev -- --port=3000
```

Navigate to `http://localhost:3000/dashboard` to see local dashboards backed by the simulated AWS pipeline.

### 8. (Optional) Regenerate typed API clients

```powershell
cd frontend
npm run api:generate   # runs openapi-typescript against http://localhost:8000/openapi.json
npm run lint
npm run test
```

Run this after any FastAPI schema change so the React hooks stay in sync.

## Project Structure

```text
aws-serverless-support-analytics/
├── FrontArc.md                 # Frontend architecture blueprint (authoritative UI guide)
├── BackArc.md                  # Backend architecture blueprint (authoritative API guide)
├── data/                       # Local-first raw, curated, mart, BI export, and manifest artifacts
├── sql/                        # DuckDB customer analytics marts
├── bi/                         # Tableau and Salesforce CRM Analytics readiness docs
├── scripts/
│   ├── generate_parquet.py     # Support-call ETL
│   └── generate_customer_analytics.py # Customer 360, SQL marts, BI exports
├── support_analytics/          # Python ETL helper package (descriptive stubs today)
├── backend/
│   ├── requirements.txt        # FastAPI dependency pinning
│   └── app/
│       ├── main.py             # FastAPI app wiring all routers
│       ├── core/               # Settings + security helpers
│       ├── models/, schemas/   # Pydantic contracts
│       ├── services/, repos/   # Business logic + IO stubs
│       ├── routers/            # Agents, calls, customer analytics, metrics, settings, auth
│       └── tests/              # unit / integration / contract placeholders
├── frontend/
│   ├── package.json            # Next.js + Tailwind + TanStack Query setup
│   ├── src/app/                # App Router routes (customer analytics, dashboard, calls, agents, settings)
│   ├── src/components/         # Layout, charts, tables, filters, feedback, ui stubs
│   ├── src/features/           # Feature modules per blueprint section
│   ├── src/lib/                # api/, state/, viz/, utils/, constants/
│   ├── src/providers/          # Theme/Query/Auth providers
│   ├── src/styles/             # globals.css, themes.css, typography.css
│   └── src/tests/              # Vitest + Playwright placeholders
├── visualization/              # Legacy Streamlit artifacts (reference for data viz requirements)
├── tests/                      # Pytest suites for ETL helpers (support_analytics/*)
└── README.md
```

(See [FrontArc.md](FrontArc.md) and [BackArc.md](BackArc.md) for deeper per-directory notes.)

## Key Features

- **Local AWS simulation** – Parquet + manifest files emulate S3/Glue outputs; switching to real AWS storage later is a config-only change.
- **Customer 360 model** – Account-level curated data joins subscriptions, product usage, invoices, opportunities, customer success touches, and support signals.
- **SQL analytics marts** – DuckDB SQL files produce churn risk, retention cohorts, LTV, customer health, support impact, expansion, and segment performance marts.
- **BI-ready exports** – CSV files under `data/bi_exports/` are documented for Tableau-style workflows and CRM Analytics-ready mapping.
- **Typed FastAPI layer** – Routers for calls, agents, metrics, settings, health, and auth stub share Pydantic models across services.
- **Customer analytics API** – `/api/customer-analytics/*` endpoints serve generated marts for overview, churn risk, retention, LTV, segments, health, support impact, expansion, BI exports, and account detail.
- **Next.js dashboards** – App Router layouts, KPI cards, charts (Nivo/Recharts), and TanStack Table explorer deliver modern UX.
- **Employer-facing narrative layer** – Revamped hero, shared mock filters, KPI runways, dual actual/forecast visuals, and severity-aware insights ensure the `/dashboard` route feels like a polished on-site demo even when running locally.
- **Extensible design system** – Tailwind tokens, shadcn/ui primitives, and Radix-driven accessibility guidelines.
- **Query-driven data layer** – TanStack Query hooks encapsulate caching, streaming, and optimistic updates tied to generated OpenAPI clients.
- **Operational insights** – Settings page surfaces manifest details, manual refresh button, and ETL health checks.
- **AWS-ready workflow** – Config toggles for `DATA_SOURCE=s3`, optional Redis cache, and OpenTelemetry hooks keep the stack cloud-ready.

## Operations & Security Hardening

- **CORS** is restricted through `CORS_ORIGINS` (comma-separated, default `http://localhost:3000`). Wildcard origins are only accepted in `APP_ENV=local` or `APP_ENV=test`.
- **Local auth** issues signed HS256 JWTs from `/api/auth/sign-in`; set `SECRET_KEY` to a non-default value before sharing any demo environment.
- **Request tracing** adds or propagates `X-Request-ID` on every backend response and writes one structured JSON access log per request.
- **Caching** keeps local demos responsive by caching Parquet/sample rows and manifest reads in-process; `/api/settings/refresh` clears both caches after ETL refresh.
- **Friendly validation** returns a correlated `422` envelope when bad query params are supplied, including range errors such as `min_duration_seconds > max_duration_seconds`.
- **Schema drift control** is enforced in CI by exporting `openapi.json`, regenerating `frontend/src/lib/api/generated/schema.ts`, and failing if the generated file changes.

## Dashboard Experience (Employer Demo)

The November 2025 refresh turned the `/dashboard` route into a scripted story recruiters can walk through without touching AWS:

- **Narrative hero** – `DashboardHero` now mixes a glassmorphism panel, CTA buttons, and a custom SVG SLA dial so you can talk through backlog, refresh cadence, and service targets in one glance.
- **Unified filter dock** – `GlobalFilters` now shares a single window/region/intent store with the Calls page, slices the mock Parquet data in real time, and exposes clear "showing X of Y" badges so demo operators always know what the UI represents.
- **Dual KPI runways** – KPIs are split into stability vs efficiency tracks. Each `KpiCard` includes category badges, goal chips, and sparkline gradients generated from the richer mock data.
- **Actual vs forecast coverage** – `VolumeArea` renders actual interaction volumes with forecast overlays, per-channel callouts, and supporting stats so you can narrate mitigations around upcoming surges.
- **Intent and region intelligence** – `CategoryBreakdown` adds trend badges + progress tiles and `RegionGrid` surfaces CSAT/SLA/queue progress bars per geo for an ops-grade view.
- **Insight stream + transcripts** – Severity-colored `InsightBoard` cards provide talking points while the revamped `CallsTable` adds summary pills, channel badges, SLA indicators, and CSV export affordances.
- **Briefing controls (placeholder)** – The "Export snapshot" and "Schedule briefing" buttons in the top-right header are intentional UI stubs that currently do not trigger any workflows; they illustrate the handoff experience that would eventually export KPIs or book a stakeholder review.

These upgrades all run locally against `data/sample_calls.json` → `data/cleaned_calls.parquet`, keeping the portfolio-friendly visuals tightly coupled with the simulated Glue outputs.

## Usage & API Examples

### 1. Regenerate ETL artifacts & refresh manifest (PowerShell)

```powershell
python scripts/generate_parquet.py --input data/sample_calls.json --agents data/agents.csv --output data/cleaned_calls.parquet
Invoke-RestMethod -Uri http://localhost:8000/api/settings/refresh -Method Post -Headers @{ Authorization = "Bearer <admin-jwt>" }
```

### 2. Start backend + frontend together (PowerShell)

```powershell
Start-Job { .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000 }
Start-Job { cd frontend; npm run dev -- --port=3000 }
```

### 3. Generate OpenAPI clients for the frontend

```powershell
# Ensure the FastAPI server is running locally (see Getting Started step 6)
cd frontend
npm run api:generate      # regenerates src/lib/api/generated against http://localhost:8000/openapi.json
```

### 4. REST API reference (local simulation)

| Endpoint | Method | Description | Sample |
| --- | --- | --- | --- |
| `/api/calls` | GET | Paginated, filterable call records from Parquet | `Invoke-RestMethod -Uri 'http://localhost:8000/api/calls?page=1&per_page=50&region=NA'` |
| `/api/calls/{id}` | GET | Detailed call payload (timeline, notes, derived metrics) | `Invoke-RestMethod -Uri 'http://localhost:8000/api/calls/12345'` |
| `/api/agents` | GET | Agent leaderboard aggregations | `Invoke-RestMethod -Uri 'http://localhost:8000/api/agents?sort=rating'` |
| `/api/metrics` | GET | KPI snapshots + time-series arrays | `Invoke-RestMethod -Uri 'http://localhost:8000/api/metrics?range=30d'` |
| `/api/customer-analytics/overview` | GET | Customer 360 executive KPIs and health distribution | `Invoke-RestMethod -Uri 'http://localhost:8000/api/customer-analytics/overview'` |
| `/api/customer-analytics/churn-risk` | GET | Prioritized churn-risk queue | `Invoke-RestMethod -Uri 'http://localhost:8000/api/customer-analytics/churn-risk?risk_level=Critical'` |
| `/api/customer-analytics/retention-cohorts` | GET | Retention cohort rows for heatmaps | `Invoke-RestMethod -Uri 'http://localhost:8000/api/customer-analytics/retention-cohorts'` |
| `/api/customer-analytics/ltv` | GET | LTV estimates by segment and plan | `Invoke-RestMethod -Uri 'http://localhost:8000/api/customer-analytics/ltv'` |
| `/api/settings/manifest` | GET | Manifest diagnostics (hash, updated_at, file size) | `Invoke-RestMethod -Uri 'http://localhost:8000/api/settings/manifest'` |
| `/api/auth/sign-in` | POST | Auth stub issuing JWTs for local dev | `Invoke-RestMethod -Uri 'http://localhost:8000/api/auth/sign-in' -Method Post -Headers @{ 'Content-Type' = 'application/json' } -Body '{"username":"admin","password":"dev"}'` |

Common backend environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_ENV` | `local` | Controls local/test production safety checks. |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed browser origins. |
| `SECRET_KEY` | `dev-secret` | HS256 signing key for local JWTs; change for shared demos. |
| `PARQUET_PATH` | `data/cleaned_calls.parquet` | Generated call artifact path. |
| `MANIFEST_PATH` | `data/manifest.json` | Generated manifest path. |
| `ENABLE_REFRESH_ENDPOINT` | `true` | Gates `/api/settings/refresh`. |

**Sample `/api/calls` response**

```json
{
  "data": [
    {
      "id": "call_123",
      "agent_id": "a-17",
      "customer_region": "NA",
      "issue_type": "Billing",
      "duration_seconds": 612,
      "resolution_status": "Resolved",
      "started_at": "2024-11-10T14:32:00Z",
      "ended_at": "2024-11-10T14:42:12Z",
      "derived": {
        "duration_label": "10m 12s",
        "first_response_sla_met": true
      }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 1845
  },
  "links": {
    "next": "/api/calls?page=2&per_page=50"
  }
}
```

**Sample `/api/settings/manifest` response**

```json
{
  "data": {
    "path": "data/cleaned_calls.parquet",
    "hash": "0x4f8e...",
    "size_bytes": 4183721,
    "updated_at": "2024-11-10T15:00:01Z"
  }
}
```

### 5. Frontend TanStack Query usage example

```ts
// src/lib/api/hooks.ts
import { useQuery } from '@tanstack/react-query';
import { client } from './client';
import { CallsService } from '../generated';

export function useCalls(filters: CallsFilters) {
  return useQuery({
    queryKey: ['calls', filters],
    queryFn: async () => {
      const api = new CallsService(client);
      return api.getCalls(filters);
    },
    staleTime: 30_000,
  });
}
```

Then inside `src/app/calls/page.tsx`:

```tsx
const { data, isLoading } = useCalls(currentFilters);
```

This pattern ensures the UI always reflects the latest FastAPI schema, with build-time type safety provided by the generated client.

## Development Workflow

1. **Sync ETL data** – run `scripts/generate_parquet.py` whenever sample data changes.
2. **Backend first** – modify FastAPI router/service/model, run `uvicorn` + `pytest`, regenerate `openapi.json`.
3. **Update clients** – `npm run api:generate` to refresh TypeScript clients, then run `npm run lint` and `npm run test` to catch mismatches.
4. **Frontend work** – implement features under `src/features/*`, keeping layout + component patterns from [FrontArc.md](FrontArc.md).
5. **Concurrent dev** – use two terminals or `docker-compose.dev.yml` to run FastAPI and Next.js simultaneously.
6. **Branching** – follow feature branches off `local-first-approach` (or `main`), enforce PR checklists: lint, tests, OpenAPI regen proof.
7. **Release prep** – tag once both stack halves are green; include manifest hash + ETL timestamp in release notes for traceability.

## Static Demo Deployment

The GitHub Pages demo is generated from the same Next.js project—no manual HTML editing required.

1. **Build locally for Pages**

```powershell
cd frontend
# keep .env.local pointing at FastAPI for dev; override for the static export run
$env:NEXT_PUBLIC_API_BASE_URL="/mock-api"
$env:NEXT_PUBLIC_SITE_BASE="/aws-serverless-support-analytics"
npm run build   # .env.production already sets GITHUB_PAGES=true
```

The export lands in `frontend/out/` with the repo-aware `basePath`/`assetPrefix`, pre-rendered call detail routes, and unoptimized images.

> If you forget to override the variables and build with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`, the static bundle still publishes, but the live GitHub Pages site will try to call your local FastAPI server and every fetch will fail with CORS/ENOTFOUND errors. Just rebuild with the `/mock-api` overrides and rerun the publish script to fix it.

1. **Publish to `gh-pages`**

```powershell
python scripts/publish_gh_pages.py --message "Refresh static export"
```

The helper script adds a temporary worktree, copies `frontend/out`, writes `.nojekyll`, commits, pushes, and removes the worktree. Pass `--skip-push` if you want to inspect the commit before pushing.

1. **GitHub Pages settings** – In GitHub → _Settings_ → _Pages_, choose **Deploy from a branch** and point it at `gh-pages` / root.

1. **Result** – Pages serves everything under `<https://<username>.github.io/aws-serverless-support-analytics/>`, `_next` assets remain intact because of `.nojekyll`, and repeating the build + script combo refreshes the static demo whenever `main` changes.

## Coding Standards

- **Frontend**
  - TypeScript strict mode, React Server Components where possible, `use client` only when necessary.
  - Tailwind classes ordered via Prettier plugin; design tokens defined in `tailwind.config.ts` and `themes.css`.
  - Hooks must live in `src/lib/api/hooks.ts` or feature-specific hook files; query keys centralized in `src/lib/constants/queryKeys.ts`.
  - UI state managed via Zustand slices; avoid prop drilling for core layout concerns.
- **Backend**
  - Pydantic models live in `app/models`, request/response schemas in `app/schemas`, routers thin, services contain business logic, repositories handle IO.
  - Enforce `ConfigDict(extra='forbid')` to reject unknown payload fields; prefer Polars lazy queries for heavy filtering.
  - Logging is structured; every endpoint returns the standard `{ data, meta, links }` envelope or `{ error: { ... } }` on failure.
  - Run `ruff check`, `ruff format`, and `mypy` before committing.

## Testing

- **Backend** – Pytest suites across unit (services, repositories), integration (FastAPI TestClient), contract tests (OpenAPI diff), and optional performance smoke tests (<250 ms P95 for `/api/calls`).
- **Frontend** – Vitest + React Testing Library for components, Playwright E2E covering dashboard flows, Storybook visual regression (Chromatic) for KPI cards/charts.
- **Shared contracts** – CI verifies that `openapi.json` was regenerated when schema changes occur and that `src/lib/api/generated` is current.

Recommended local check sequence from a fresh clone:

```powershell
python scripts/generate_parquet.py --input data/sample_calls.json --agents data/agents.csv --output data/cleaned_calls.parquet
python -m pytest tests backend/app/tests
python scripts/export_openapi.py --output openapi.json
cd frontend
npm ci
npm run api:check
npm run lint
npm run test
npm run build
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `data/cleaned_calls.parquet` is missing | Run `python scripts/generate_parquet.py --input data/sample_calls.json --agents data/agents.csv --output data/cleaned_calls.parquet`; the API can fall back to `data/sample_calls.json`, but generated artifacts are required for parity checks. |
| Frontend fetches fail with CORS errors | Confirm backend `CORS_ORIGINS` includes the exact frontend origin, usually `http://localhost:3000`, then restart Uvicorn. |
| `/api/auth/sign-in` works but protected requests fail | Ensure the client sends `Authorization: Bearer <access_token>` and that `SECRET_KEY` has not changed since the token was issued. |
| `npm run api:check` changes `schema.ts` | Backend OpenAPI changed; inspect the generated diff and commit `frontend/src/lib/api/generated/schema.ts` with the backend change. |
| Node or Python version errors | Use Node 20+ and Python 3.11; reinstall with `npm ci` and `pip install -r requirements.txt -r backend/requirements.txt` after switching runtimes. |
| GitHub Pages/static export tries to call localhost | Build with static demo mode enabled (`GITHUB_PAGES=true` or `NEXT_PUBLIC_DATA_MODE=static`) so hooks use deterministic local fixtures instead of FastAPI. |

## Contributing

1. File an issue or start a discussion describing the feature/fix and reference the relevant blueprint sections.
1. Create a branch (`feature/<short-desc>`), run ETL + backend + frontend locally, and keep OpenAPI + generated clients in sync.
1. Update documentation if your change alters architecture layers, endpoints, or UI flows.
1. Submit a PR with:

    - `ruff`, `mypy`, `pytest` results (backend)
    - `npm run lint`, `npm run test`, `npm run test:e2e` (frontend, as applicable)
    - Evidence that `openapi.json` + generated clients were regenerated (commit diff)

1. Address review feedback promptly; keep commits focused.

## License

TBD – add license text or SPDX identifier when finalized.
