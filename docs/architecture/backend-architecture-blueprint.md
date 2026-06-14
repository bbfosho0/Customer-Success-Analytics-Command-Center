# Backend Architecture Blueprint (2025 Refresh)

A comprehensive FastAPI + Pydantic blueprint that complements `FrontArc.md` and powers the local-first support analytics experience. The backend exposes clean APIs over the existing ETL artifacts today and is ready to point at AWS-hosted storage/services later without re-architecting the frontend.

---

## 1. Why This Stack Fits the Frontend

1. **FastAPI** – High-performance async framework with first-class OpenAPI generation, making it trivial to produce the typed clients the Next.js frontend consumes.
2. **Pydantic models** – Shared schema source of truth for ETL outputs, request payloads, and response contracts. Enforces validation before data ever reaches the UI.
3. **Auth stub (JWT/session)** – Mirrors the frontend's auth expectations while remaining simple for local-first iteration. Easily replaceable with Cognito/Auth0/etc. later.
4. **Typed client pipeline** – `openapi-typescript` consumes the FastAPI spec so React Query hooks stay strongly typed end-to-end, eliminating many integration bugs.
5. **Local-first design** – Reads the same `data/cleaned_calls.parquet` and `data/manifest.json` produced by the Python ETL, keeping the feedback loop tight while the frontend rework progresses.
6. **Future AWS alignment** – Folder structure and dependencies already match the roadmap (Glue/S3). Swapping the data services layer from "local files" to "S3 + Glue catalog" requires minimal surface changes.

---

## 2. High-Level Backend Architecture

```text
backend/
├── pyproject.toml / requirements.txt
├── app/
│   ├── main.py                 # FastAPI() init, middleware, routers
│   ├── core/
│   │   ├── config.py           # Settings via Pydantic BaseSettings
│   │   └── security.py         # Auth helpers, password hashing, JWT utils
│   ├── models/                 # Pydantic domain models (call, agent, metrics)
│   ├── schemas/                # Request/response schemas per router
│   ├── services/
│   │   ├── data_access.py      # Loading Parquet/manifest (local) or S3 (future)
│   │   ├── metrics.py          # KPI/time-series aggregations
│   │   ├── agents.py           # Agent leaderboard calculations
│   │   ├── calls.py            # Filtering, pagination, enrichment
│   │   └── refresh.py          # ETL trigger hooks (future)
│   ├── repositories/
│   │   ├── parquet_repo.py     # Pandas/Polars interface for Parquet reads
│   │   └── manifest_repo.py    # Manifest hash + metadata helpers
│   ├── routers/
│   │   ├── calls.py            # /api/calls endpoints
│   │   ├── agents.py           # /api/agents endpoints
│   │   ├── metrics.py          # /api/metrics endpoints
│   │   ├── settings.py         # /api/settings + manifest diagnostics
│   │   ├── auth.py             # /api/auth stub endpoints
│   │   └── health.py           # /healthz, /readyz
│   ├── dependencies/
│   │   ├── filters.py          # Parse/validate query params into objects
│   │   ├── pagination.py       # Common pagination dependency
│   │   └── auth.py             # get_current_user, optional auth override
│   ├── db/
│   │   └── cache.py            # Optional Redis/LRU cache for metrics
│   ├── utils/
│   │   ├── time.py             # UTC helpers, window calculations
│   │   ├── validation.py       # Reusable validators
│   │   └── logging.py          # Structured logging config
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── contract/
└── scripts/
    ├── dev.sh                  # Activates venv, runs uvicorn
    ├── refresh_data.py         # (Optional) CLI to rerun ETL
    └── seed_auth.py            # Seed users/roles for stub auth
```

This mirrors the FastAPI folder guidance (`app/main.py`, `models/`, `schemas/`, `routers/`, `dependencies/`, `services/`, `tests/`).

---

## 3. Data Sources & Pipelines

### 3.1 Local Mode (default)

- `support_analytics.etl` produces `data/cleaned_calls.parquet` and `data/manifest.json`.
- `repositories/parquet_repo.py` uses Polars (fast) or Pandas to read the Parquet file, enforcing column dtypes defined in `models/records.py`.
- `manifest_repo.py` exposes `get_manifest()` so the API can respond with file hash, size, and timestamp (used by the frontend's manual refresh controls).
- `services/data_access.py` centralizes the read path. Swapping to S3 is a single config change once remote storage is ready.

### 3.2 Future AWS Mode

- `config.py` exposes `DATA_SOURCE` env ("local" | "s3").
- When set to `s3`, repositories use `s3fs` + boto3 to fetch Parquet and manifest from the bucket path defined in config.
- Glue crawler/job details live in `config.py` so metrics services know the available partitions.

---

## 4. Pydantic Models & Schemas

### 4.1 Domain Models (`app/models`)

- `CallRecord`: canonical representation of a cleaned call row (mirrors ETL contract). Includes validators for timestamps, duration > 0, rating 1–5.
- `AgentStats`: aggregated metrics for an agent (avg rating, total calls, avg resolution time, percent resolved).
- `MetricPoint`: timestamp/value pair plus optional comparison delta.
- `ManifestInfo`: file path, size, hash, updated_at.
- `User` / `Session`: simple models representing authenticated context during local dev.

### 4.2 Schemas (`app/schemas`)

- Request schemas: `CallFilters`, `AgentsFilters`, `MetricsRequest`, `PaginationParams`, `AuthCredentials`.
- Response schemas: `PaginatedCallsResponse`, `AgentLeaderboardResponse`, `MetricsResponse`, `SettingsResponse`, `AuthTokenResponse`, `HealthResponse`.
- `CallFilters` uses constrained types (e.g., `conlist[str, max_items=10]`, `condecimal(gt=0)`), date ranges validated via custom validators.
- All schemas inherit from `BaseModel`, include `model_config = ConfigDict(extra='forbid')` to reject unknown fields.

---

## 5. API Surface

| Route | Method | Description | Frontend Consumer |
| --- | --- | --- | --- |
| `/api/healthz` | GET | Liveness check | Next.js middleware, monitoring |
| `/api/readyz` | GET | Readiness (ensures manifest + parquet accessible) | DevOps |
| `/api/auth/sign-in` | POST | Accepts `AuthCredentials`, returns JWT + user info | Next.js auth stub |
| `/api/auth/me` | GET | Returns current user context | Protected layouts |
| `/api/calls` | GET | Paginated, filterable calls dataset | Calls table (TanStack Table / AG Grid) |
| `/api/calls/{call_id}` | GET | Detail payload for drawers/modals | Call detail view |
| `/api/agents` | GET | Aggregated agent metrics | Agents page charts + table |
| `/api/metrics` | GET | KPI cards, time-series trendlines, issue breakdowns | Dashboard widgets |
| `/api/settings/manifest` | GET | Manifest hash/mtime | Frontend cache diagnostics |
| `/api/settings/refresh` | POST | (Optional) Trigger ETL rerun / reload manifest | Settings page actions |
| `/api/filters/options` | GET | Precomputed select options (regions, issue types, ratings) | Filter components |

All responses follow JSON:API-like shapes with `data`, `meta`, and `links` sections when pagination applies. Errors follow a consistent envelope `{ "error": { "code": "...", "message": "...", "details": [...] } }`.

---

## 6. Services & Business Logic

1. **Calls service**
   - Accepts `CallFilters` + `PaginationParams`.
   - Pushes filtering to Polars lazy queries for performance.
   - Returns normalized DTOs with derived fields (duration label, formatted start/end) so the frontend logic stays lean.

2. **Agents service**
   - Computes aggregations grouped by `agent_id` and `region`.
   - Supports sorting by KPI (rating, resolution time) and percentile bucketing for leaderboard badges.

3. **Metrics service**
   - Generates KPI snapshots (total calls, avg duration, CSAT) and time-series arrays.
   - Provides comparison vs previous period for delta arrows used in `KpiCard`.
   - Includes categorical breakdowns compatible with Nivo stacked bar/pie charts.

4. **Settings service**
   - Reads manifest metadata and surfaces file stats.
   - Optionally shells out to `python scripts/generate_parquet.py` when `ENABLE_REFRESH=true` (gated to admin users).

5. **Auth service (stub)**
   - Simple in-memory user store seeded via `.env` or `seed_auth.py`.
   - Issues JWTs signed with `SECRET_KEY`; tokens include `role` claim consumed by frontend route guards.

---

## 7. Dependencies & DI

- Use FastAPI dependency injection to parse filters, pagination, and auth context.
- `get_filters` dependency converts query params into `CallFilters`, raising HTTP 422 when invalid.
- `get_query_client` ensures services run within a shared Polars/LazyFrame context if caching is enabled.
- `get_current_user` pulls user info from JWT (or returns a mock admin when auth disabled via config).

---

## 8. Configuration & Environments

- `.env` variables managed via `python-dotenv` and `BaseSettings`:
  - `APP_ENV` (local, staging, prod)
  - `DATA_SOURCE` (local, s3)
  - `PARQUET_PATH`, `MANIFEST_PATH` (local filesystem)
  - `S3_BUCKET`, `S3_PREFIX`
  - `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`
  - `ENABLE_REFRESH_ENDPOINT`
  - `LOG_LEVEL`
- `config.py` exposes typed getters (e.g., `settings.parquet_path`).
- Use `settings.verify()` on startup to ensure required files exist in local mode.

---

## 9. Logging, Monitoring, Error Handling

- Structured logging via `structlog` or standard `logging` with JSON formatter.
- Include correlation IDs (request ID) so frontend errors map to backend log entries.
- Global exception handlers:
  - `HTTPException` (pass-through)
  - `ValidationError` → 422 with detail list
  - `FileNotFoundError` → 503 when Parquet/manifest missing
- Metrics export (future): instrument with OpenTelemetry or Prometheus FastAPI instrumentation for latency, request counts, ETL refresh timings.

---

## 10. Tooling & Developer Experience

- Package management: `uv` or `poetry` (preferred) to align with modern workflows; fallback `pip` supported.
- Scripts:
  - `make dev` / `scripts/dev.sh`: source `.venv`, run `uvicorn app.main:app --reload`.
  - `make fmt`: `ruff format` + `black` (if desired) + `isort`.
  - `make lint`: `ruff check` + `mypy` for type safety.
  - `make test`: run unit + integration tests via `pytest`.
  - `make openapi`: saves `openapi.json` → consumed by frontend `pnpm api:generate`.
- VS Code recommended extensions: Python, Ruff, Pylance, FastAPI, YAML, Thunder Client (mirrors frontend list for parity).

---

## 11. Testing Strategy

1. **Unit tests (`app/tests/unit`)** – cover services (metrics math, filter logic), repositories (Parquet reading), utilities (time/validation).
2. **Integration tests (`app/tests/integration`)** – spin up TestClient, load sample datasets from `tests/fixtures/`, validate API responses against snapshots.
3. **Contract tests** – ensure `openapi.json` matches expected schema; fail CI if spec changes without regenerating the frontend clients.
4. **Performance smoke tests** – benchmark heavy endpoints with large datasets to keep P95 latency < 250ms locally.
5. **Security tests** – verify auth stub enforces basic role permissions (e.g., ETL refresh only for admin role).

---

## 12. Frontend Integration Points

- **Typed Clients**: `pnpm api:generate` pulls `http://localhost:8000/openapi.json`. Frontend hooks (see `FrontArc.md` section 6) depend on stable endpoint paths and schema names defined here.
- **Manifest Endpoint**: the frontend settings page uses `/api/settings/manifest` for diagnostics and manual refresh actions.
- **Filter Options**: to keep the UI snappy, expose `/api/filters/options` so the frontend doesn't have to parse the entire dataset to build dropdown lists.
- **Error Envelope**: ensure the error structure includes `code` so React Query can branch on deterministic error types (e.g., `DATA_STALE`, `MANIFEST_MISSING`).
- **CORS & Cookies**: enable CORS for `http://localhost:3000` and configure JWT cookies as `HttpOnly` (with `secure=False` in local dev). This mirrors how Next.js middleware expects to check sessions.

---

## 13. Local Development Workflow

1. `python -m venv .venv && .venv/Scripts/Activate.ps1` (Windows) or equivalent shell command.
2. `pip install -r requirements.txt` (backend-specific requirements file).
3. Run the ETL once: `python scripts/generate_parquet.py` (already part of the repo root).
4. Start FastAPI: `uvicorn app.main:app --reload`.
5. Start Next.js (`pnpm dev`); configure `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.
6. Use Thunder Client or `curl` to verify `/api/healthz`, `/api/calls`.
7. Keep `make openapi` + `pnpm api:generate` in lockstep whenever schema changes occur.

---

## 14. Deployment & Future Infra Hooks

- Containerize with a multi-stage Dockerfile (base Python image + slim runtime). Expose port 8000.
- Add `docker-compose.dev.yml` that runs FastAPI, Next.js, and optional Redis cache for metrics.
- For AWS: plan to deploy FastAPI on Fargate or App Runner. Environment variables configure S3 bucket paths.
- Observability: integrate CloudWatch or OpenTelemetry exporters to keep parity with frontend metrics dashboards.

---

## 15. Roadmap & Phase Plan

1. **Phase 0 – Scaffolding**
   - Create FastAPI project structure, config, logging, health endpoints.
   - Implement repositories reading local Parquet/manifest.

2. **Phase 1 – Core APIs**
   - Build `/api/calls`, `/api/metrics`, `/api/agents` with real data + validation.
   - Wire query dependencies and ensure OpenAPI spec stable.

3. **Phase 2 – Auth & Settings**
   - Add stub JWT auth, `/api/settings/*`, and optional ETL refresh endpoint.
   - Harden error envelopes + logging.

4. **Phase 3 – Testing & Tooling**
   - Expand pytest coverage, add contract tests, integrate Ruff/mypy.
   - Automate OpenAPI export + TS client regeneration in CI.

5. **Phase 4 – AWS-ready Enhancements**
   - Abstract data access to S3, add caching, integrate tracing/metrics, containerize for deployment.

---

Use this `BackArc.md` blueprint alongside `FrontArc.md` to keep backend and frontend development tightly aligned. Every endpoint, schema, and workflow here directly supports the UX flows described in the frontend architecture, ensuring both halves of the rework land as a cohesive, modern system.
