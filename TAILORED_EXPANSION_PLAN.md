# Tailored Expansion Plan

This plan converts the general expansion direction from the architecture documents into an implementation-ready roadmap for the current repository state. It is intentionally sequenced so each phase leaves the app runnable, testable, and closer to the eventual AWS Serverless Support Analytics target without overbuilding ahead of the data contract.

> Note: the referenced `Expansion Plan.txt` attachment is not present in this working tree. This tailored plan is therefore grounded in the files that are present: `README.md`, `FrontArc.md`, `BackArc.md`, the current FastAPI/Next.js code, the ETL helpers, and the sample data under `data/`.

## 1. Current Codebase Reality Check

### Already in place

- **Repository shape matches the intended full-stack split.** Backend code lives under `backend/app`, frontend code lives under `frontend/src`, shared ETL helpers live under `support_analytics`, and local fixtures live under `data/`.
- **FastAPI router skeletons exist for the main domains.** Current routers cover health, calls, agents, metrics, settings, and auth.
- **Next.js App Router shell is present and visually rich.** Dashboard, calls, agents, metrics, settings, and call-detail pages are already scaffolded with local demo data.
- **Typed API intent exists but is not real yet.** The frontend has `apiFetch`, a `useCalls` hook, an `api:generate` npm script, and a placeholder generated schema file.
- **ETL and manifest modules are placeholders.** The data files include small JSON/CSV samples and a manifest, but no checked-in `data/cleaned_calls.parquet` artifact exists.
- **Tests are smoke-level only.** Root tests validate placeholder ETL/manifest behavior. Backend tests validate endpoint shape and OpenAPI title, not real analytics behavior.

### Main gaps to close first

1. Replace placeholder ETL with a deterministic local Parquet + manifest pipeline.
2. Make backend repositories read real artifacts with Polars and expose stable, validated response envelopes.
3. Align backend schemas with the real dataset and then regenerate the frontend OpenAPI types.
4. Migrate frontend pages from generated mock arrays to API-backed React Query data with static-demo-safe fallbacks.
5. Add contract, integration, and frontend tests around the real data path.
6. Only after the local data path is solid, introduce AWS-ready adapters for S3/Glue-style storage.

## 2. Guiding Principles

- **Contract first, UI second.** Do not build more UI state until backend schemas and generated frontend types are reliable.
- **Local-first must stay fast.** The app should run from local files with no AWS credentials or network dependency.
- **Static export must remain supported.** GitHub Pages cannot call a local FastAPI service, so API-backed UI needs an explicit static/mock fallback mode.
- **One canonical call schema.** ETL output, FastAPI models, OpenAPI types, React table rows, and chart transformers should agree on field names and units.
- **No AWS adapter before parity.** S3 support should wait until local Parquet filtering, pagination, metrics, and tests are proven.

## 3. Target End State

By the end of this plan, the repository should provide:

- A reproducible command that transforms `data/sample_calls.json` + `data/agents.csv` into `data/cleaned_calls.parquet` and `data/manifest.json`.
- FastAPI endpoints that read the Parquet/manifest artifacts instead of returning placeholders.
- OpenAPI-generated frontend types checked into `frontend/src/lib/api/generated/schema.ts`.
- React Query hooks for calls, call detail, agents, metrics, settings/manifest, auth, and refresh.
- Next.js pages that use API data in local development and deterministic mock/static fixtures during GitHub Pages export.
- Tests that verify ETL output, manifest integrity, API contracts, frontend transformations, and build/lint health.
- Storage interfaces that can later swap local filesystem reads for S3 reads without changing frontend routes or components.

## 4. Optimized Implementation Sequence

### Phase 0 — Baseline and guardrails

**Goal:** Make the existing baseline explicit so future changes are easy to review.

**Tasks**

- Add a root developer checklist to `README.md` or keep this plan linked from it.
- Run the current checks and record the baseline:
  - `python -m pytest tests backend/app/tests`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run test`
  - `npm --prefix frontend run build`
- Decide whether generated artifacts are committed:
  - Commit `data/manifest.json` because it is small and used by demos.
  - Commit `data/cleaned_calls.parquet` only if the project wants a zero-setup demo; otherwise regenerate it in setup and CI.

**Exit criteria**

- This tailored plan is committed and linked.
- Current failures, if any, are documented as baseline issues rather than hidden.

### Phase 1 — Canonical local dataset contract

**Goal:** Establish one schema shared by ETL, backend, and frontend.

**Primary files**

- `support_analytics/etl.py`
- `support_analytics/manifest.py`
- `scripts/generate_parquet.py`
- `backend/app/models/call.py`
- `backend/app/schemas/calls.py`
- `data/sample_calls.json`
- `data/agents.csv`

**Tasks**

1. Define the canonical call columns:
   - Required now: `id`, `agent_id`, `customer_region`, `issue_type`, `duration_seconds`, `resolution_status`, `started_at`.
   - Join-derived now: `agent_name`, `agent_region`, `skill_rating` from `agents.csv`.
   - Optional near-term enrichments: `channel`, `priority`, `sentiment`, `csat`, `first_response_minutes`, `closed_at`, `first_contact_resolution`.
2. Implement `build_local_parquet` with Polars:
   - Read JSON calls.
   - Read CSV agents.
   - Validate required columns.
   - Cast stable dtypes.
   - Join agent metadata.
   - Write Parquet.
3. Generate a real manifest with:
   - Dataset name.
   - Artifact path.
   - Hash of the Parquet file.
   - Row count.
   - Generated timestamp.
   - Source file hashes or mtimes.
4. Update `load_manifest` to read the actual JSON file and validate required keys.
5. Expand root ETL tests to assert row count, expected columns, hash presence, and idempotent regeneration.

**Exit criteria**

- `python scripts/generate_parquet.py --input data/sample_calls.json --agents data/agents.csv --output data/cleaned_calls.parquet` produces a real artifact.
- `python -m pytest tests` passes against real ETL behavior.

### Phase 2 — Real backend data access and API envelopes

**Goal:** Replace backend placeholder responses with real local artifact reads while preserving router URLs.

**Primary files**

- `backend/app/core/config.py`
- `backend/app/repositories/parquet_repo.py`
- `backend/app/repositories/manifest_repo.py`
- `backend/app/services/data_access.py`
- `backend/app/services/calls.py`
- `backend/app/services/agents.py`
- `backend/app/services/metrics.py`
- `backend/app/routers/*.py`
- `backend/app/tests/*`

**Tasks**

1. Strengthen settings:
   - Resolve paths relative to the repository root when running locally.
   - Add `enable_refresh_endpoint`, `cors_origins`, `api_prefix`, and `static_demo_mode` as typed settings.
   - Add startup validation for missing manifest/parquet in local mode, but keep tests able to override paths.
2. Implement Parquet repository helpers:
   - `scan_calls()` returns a Polars `LazyFrame`.
   - Filtering happens before collection.
   - Pagination uses offset/limit and a separate total count.
3. Implement call endpoints:
   - `GET /api/calls` supports page, per_page, region, issue_type, resolution_status, date range, duration range, sort field, and sort direction.
   - `GET /api/calls/{call_id}` returns a single enriched record or 404.
4. Implement agent endpoints:
   - Aggregate total calls, average duration, resolution rate, average skill rating, and region.
   - Support sorting by total calls, average duration, or resolution rate.
5. Implement metrics endpoint:
   - Return KPI cards, time series, issue breakdown, and region performance in one dashboard-friendly envelope.
   - Include comparison metadata only when enough historical data exists; otherwise return `null` deltas rather than fabricated values.
6. Implement settings endpoints:
   - `GET /api/settings/manifest` returns the real manifest.
   - Keep `POST /api/settings/refresh` disabled by default and gated by config.
7. Add consistent error envelopes through FastAPI exception handlers.
8. Add integration and contract tests for each endpoint and edge cases.

**Exit criteria**

- Backend tests prove that API responses come from the generated Parquet/manifest, not hardcoded dummy rows.
- OpenAPI includes the final request/response schemas needed by the frontend.

### Phase 3 — OpenAPI type generation and frontend data layer

**Goal:** Make the frontend consume typed API contracts without breaking static export.

**Primary files**

- `frontend/src/lib/api/client.ts`
- `frontend/src/lib/api/hooks.ts`
- `frontend/src/lib/api/generated/schema.ts`
- `frontend/src/lib/constants/queryKeys.ts`
- `frontend/src/lib/data/*.ts`
- `frontend/src/providers/query-provider.tsx`
- `frontend/src/lib/utils/env.ts`

**Tasks**

1. Regenerate OpenAPI types from the running backend:
   - `npm --prefix frontend run api:generate`
2. Replace placeholder generated types with actual `openapi-typescript` output.
3. Expand `apiFetch`:
   - Accept query parameters.
   - Preserve typed error payloads.
   - Support abort signals from TanStack Query.
   - Use `NEXT_PUBLIC_API_BASE_URL` in live mode.
4. Add query hooks:
   - `useCalls(filters)`
   - `useCall(callId)`
   - `useAgents(filters)`
   - `useMetrics(filters)`
   - `useManifest()`
   - `useRefreshManifest()` mutation, gated by settings.
5. Introduce static-demo fallback:
   - In GitHub Pages/static export mode, hooks use deterministic local fixtures.
   - In local live mode, hooks call FastAPI.
   - Keep this switch centralized in `env.ts`, not scattered across pages.
6. Keep frontend-local transformers, but make their inputs API DTOs rather than bespoke mock records.

**Exit criteria**

- `frontend/src/lib/api/generated/schema.ts` is generated from FastAPI.
- React Query hooks are the only normal data access path for API-backed pages.
- Static export still works without a running backend.

### Phase 4 — Page-by-page frontend migration

**Goal:** Move pages from local mock arrays to typed hooks in the least risky order.

**Migration order**

1. **Settings page:** easiest because manifest data is small and directly maps to the backend.
2. **Calls page:** replace mock table rows with `useCalls(filters)` and server pagination.
3. **Call detail page:** replace static paths/details with `useCall(callId)` in live mode and generated static params in export mode.
4. **Agents page:** replace local leaderboard data with `useAgents` aggregations.
5. **Dashboard page:** replace chart data with `useMetrics`, preserving existing visual components.
6. **Metrics page:** converge with dashboard metric shapes or make it the drill-down page for detailed metric series.

**Rules for each page**

- Show loading, error, empty, and success states.
- Do not duplicate API DTO reshaping inside page components; use `frontend/src/lib/viz/transformers.ts` or data mappers.
- Keep filters serializable so they can map to backend query params and React Query keys.
- Add component/transform tests for every non-trivial mapping.

**Exit criteria**

- No page imports `callsDataset` for live-mode data.
- Mock data remains only as explicit static-demo fallback/test fixtures.

### Phase 5 — Quality, security, and operations hardening

**Goal:** Make the local-first system robust enough for real demos and future deployment.

**Tasks**

- Add CORS middleware restricted to configured origins.
- Replace fake token strings with signed local JWTs or clearly document auth as disabled in local mode.
- Add request IDs and structured logs for every backend request.
- Add response caching for manifest and Parquet scans where it improves local performance.
- Add validation for bad filter combinations and friendly 422 responses.
- Add CI steps for Python tests, backend OpenAPI contract test, frontend lint/test/build, and generated-schema drift detection.
- Add README troubleshooting for missing Parquet files, Node/Python version mismatches, and static export mode.

**Exit criteria**

- A fresh clone can run the ETL, backend, frontend, and tests with the documented commands.
- Generated OpenAPI types cannot drift from backend schemas unnoticed.

### Phase 6 — AWS-ready storage adapter

**Goal:** Introduce cloud storage without disrupting local development or frontend contracts.

**Prerequisite:** Do not start this phase until Phases 1–5 are green.

**Tasks**

- Define a storage protocol/interface in `backend/app/services/data_access.py`:
  - `LocalArtifactStore`
  - `S3ArtifactStore`
- Keep service code dependent on the interface, not boto3/s3fs directly.
- Add settings for S3 bucket, prefix, region, and optional Glue database/table names.
- Support S3 reads behind `DATA_SOURCE=s3`.
- Add tests with mocked S3 responses; do not require live AWS credentials in CI.
- Document the AWS migration path separately from local demo setup.

**Exit criteria**

- Local mode remains the default and requires no AWS credentials.
- S3 mode can read equivalent Parquet/manifest objects through the same API contracts.

## 5. Concrete Backlog by Workstream

### Data/ETL backlog

| Priority | Work item | Files |
| --- | --- | --- |
| P0 | Implement real Polars transformation and Parquet write | `support_analytics/etl.py`, `scripts/generate_parquet.py` |
| P0 | Implement real manifest loading/writing and checksum validation | `support_analytics/manifest.py`, `data/manifest.json` |
| P1 | Add richer sample rows to support filters/charts meaningfully | `data/sample_calls.json`, `data/agents.csv` |
| P1 | Add ETL tests for schema, joins, null handling, and idempotence | `tests/test_etl.py`, `tests/test_manifest.py` |

### Backend backlog

| Priority | Work item | Files |
| --- | --- | --- |
| P0 | Replace hardcoded calls service with repository-backed filtering | `backend/app/repositories/parquet_repo.py`, `backend/app/services/calls.py` |
| P0 | Add call-detail endpoint and tests | `backend/app/routers/calls.py`, `backend/app/tests/integration/test_calls.py` |
| P0 | Return real manifest metadata | `backend/app/routers/settings.py`, `backend/app/repositories/manifest_repo.py` |
| P1 | Implement agents and metrics aggregations | `backend/app/services/agents.py`, `backend/app/services/metrics.py` |
| P1 | Add error envelope and CORS middleware | `backend/app/main.py`, `backend/app/core/config.py` |
| P2 | Add refresh endpoint behind config/auth | `backend/app/services/refresh.py`, `backend/app/routers/settings.py` |

### Frontend backlog

| Priority | Work item | Files |
| --- | --- | --- |
| P0 | Generate real OpenAPI schema types | `frontend/src/lib/api/generated/schema.ts` |
| P0 | Expand API client/hooks and query keys | `frontend/src/lib/api/client.ts`, `frontend/src/lib/api/hooks.ts`, `frontend/src/lib/constants/queryKeys.ts` |
| P0 | Add static-demo fallback mode | `frontend/src/lib/utils/env.ts`, `frontend/src/lib/data/*.ts` |
| P1 | Migrate settings and calls pages | `frontend/src/app/settings/page.tsx`, `frontend/src/app/calls/page.tsx` |
| P1 | Migrate agents, dashboard, and metrics pages | `frontend/src/app/agents/page.tsx`, `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/metrics/page.tsx` |
| P2 | Add loading/error/empty-state coverage and tests | `frontend/src/components/feedback/*`, `frontend/src/tests/*` |

## 6. Recommended Near-Term Sprint Plan

### Sprint 1: Real local artifacts

- Implement ETL and manifest generation.
- Add ETL tests.
- Update setup docs.
- Outcome: the repo has a trustworthy local data artifact.

### Sprint 2: Backend reads real data

- Implement Polars repository reads.
- Implement `/api/calls`, `/api/calls/{call_id}`, `/api/settings/manifest`.
- Add integration tests.
- Outcome: FastAPI becomes the source of truth for calls and diagnostics.

### Sprint 3: Frontend typed data path

- Regenerate OpenAPI types.
- Implement API hooks and static fallback.
- Migrate settings and calls pages.
- Outcome: one live page and one diagnostics page prove the frontend/backend contract.

### Sprint 4: Analytics parity

- Implement agents and metrics aggregations.
- Migrate dashboard, agents, and metrics pages.
- Add transformer tests.
- Outcome: the demo visuals are driven by real local analytics.

### Sprint 5: Hardening and AWS adapter design

- Add auth clarity, CORS, structured logs, CI checks, and schema drift detection.
- Introduce storage interface and mocked S3 tests only after local parity.
- Outcome: the system is ready for cloud storage without frontend churn.

## 7. Accuracy Risks and Mitigations

- **Risk: The sample dataset is too small for meaningful analytics.** Mitigation: expand fixtures before building complex charts, and return `null` deltas when comparisons are statistically invalid.
- **Risk: Frontend mock fields do not match backend fields.** Mitigation: define a mapping layer and migrate components to API DTO-derived view models.
- **Risk: Static export breaks when pages expect live API calls.** Mitigation: centralize static-demo fallback behavior in the API/data layer.
- **Risk: Parquet artifact drift goes unnoticed.** Mitigation: include manifest checksums and tests that regenerate artifacts from source fixtures.
- **Risk: AWS concerns pollute local development.** Mitigation: keep storage behind a protocol and default all settings to local mode.

## 8. Definition of Done for the Expansion

The expansion should be considered complete when these commands pass from a fresh clone after dependency installation:

```bash
python scripts/generate_parquet.py --input data/sample_calls.json --agents data/agents.csv --output data/cleaned_calls.parquet
python -m pytest tests backend/app/tests
uvicorn backend.app.main:app --port 8000
npm --prefix frontend run api:generate
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
```

Additionally:

- Local development at `http://localhost:3000/dashboard` uses FastAPI data when `NEXT_PUBLIC_API_BASE_URL` points to `http://localhost:8000`.
- GitHub Pages/static export uses deterministic static fixtures and does not require a live backend.
- API responses are documented by OpenAPI and consumed through generated TypeScript types.
- The README clearly explains local mode, static demo mode, and the future AWS storage mode.
