# Expansion Plan, Revised

## Executive Summary

This roadmap converts the current AWS Serverless Support Analytics project into a Customer Success Analytics Command Center.

The project should prove five job-relevant abilities:

1. Real ETL, raw data transformed into validated analytical artifacts.
2. SQL analytics, business questions answered through DuckDB SQL marts, not only frontend chart logic.
3. Customer lifecycle analytics, churn, retention, LTV, cohorts, segmentation, support impact, and customer health.
4. BI readiness, Tableau-ready exports plus Salesforce CRM Analytics-style mapping documentation.
5. Product-quality delivery, a polished Next.js dashboard, typed FastAPI contracts, static demo support, tests, and clean documentation.

The app should still remain local-first. A recruiter or interviewer should be able to run the project without AWS credentials, Salesforce credentials, or paid BI tools. The AWS-ready adapter remains optional and deferred until the local customer analytics story is complete and polished.

The key positioning shift is:

```text
From: AWS Serverless Support Analytics
To: Customer Success Analytics Command Center
```

Recommended subtitle:

```text
A Salesforce-aware customer analytics dashboard for support, retention, churn risk, customer lifetime value, customer health, and BI-ready reporting.
```

## Current Codebase Reality Check

### Already Completed or In Place

- The repository has a full-stack split with backend code under `backend/app`, frontend code under `frontend/src`, shared analytics helpers under `support_analytics`, and data fixtures under `data/`.
- The FastAPI backend has router structure for major app domains.
- The Next.js frontend has a visually rich dashboard shell.
- The local-first ETL path has been strengthened so the app can generate and consume local artifacts.
- The backend and frontend contract path has been improved through typed schemas and generated frontend types.
- The frontend has moved away from purely local mock arrays toward API-backed data access with static-demo fallback.
- Platform hardening has already been addressed earlier than originally planned.

### Remaining Strategic Gap

The current project proves support analytics and analytics app engineering. To become stronger for Customer Analytics, BI, CRM Analytics, and Customer Success roles, it must now prove account-level customer analytics.

Support analytics answers questions like:

```text
How many calls happened?
Which agents handled them?
Which issue types were common?
Which regions generated the most support volume?
How long did calls take?
```

Customer analytics answers higher-value business questions like:

```text
Which customers are most likely to churn?
How much MRR is at risk?
Which customer cohorts retain best?
Which segments produce the highest LTV?
Which accounts are expansion-ready?
How does support experience affect churn?
Which accounts should Customer Success prioritize first?
```

Phase 6 exists to add this missing layer.

## Guiding Principles

### 1. Local-first stays mandatory

The app must run without AWS, Salesforce, Tableau, or external credentials. All customer analytics outputs should be reproducible from local sample data.

### 2. Contract-first, UI second

Backend schemas, SQL mart outputs, API response envelopes, and generated frontend types should remain aligned. New UI should consume typed hooks, not hand-shaped local arrays.

### 3. SQL must be visible

The project should show actual SQL files for churn, retention, LTV, cohorts, segmentation, support impact, and customer health. SQL should not be hidden inside Python-only transformations.

### 4. BI readiness does not require fake integration

The project should not pretend to have live Salesforce or Tableau integration unless it actually does. Instead, it should produce clean CSV exports, Tableau documentation, and Salesforce CRM Analytics mapping docs.

### 5. Customer 360 is the central model

The main analytical object should become the account-level Customer 360 row. Support interactions are one signal inside that customer model.

### 6. AWS comes last

S3 and Glue-style storage adapters are useful, but they are not the next priority. The project first needs customer analytics clarity, BI exports, CRM Analytics documentation, screenshots, and recruiter-friendly explanation.

## Target End State

The finished expansion should include:

- A Customer 360 data model built from account, subscription, support, product usage, invoice, opportunity, and customer success touch data.
- Real ETL that validates raw files and generates curated Parquet outputs.
- DuckDB SQL marts for churn risk, retention cohorts, LTV, customer health, support impact, expansion opportunities, and segment performance.
- BI-ready CSV exports under `data/bi_exports/`.
- Salesforce CRM Analytics-style documentation under `bi/salesforce_crma/`.
- Tableau documentation and optional Tableau Public dashboard references under `bi/tableau/`.
- FastAPI endpoints that serve the generated customer analytics marts.
- Next.js customer analytics pages powered by API hooks or deterministic static-demo fallback.
- Tests for ETL, SQL outputs, backend responses, and frontend rendering behavior.
- A README that explains the project value in under 30 seconds.
- Resume bullets that clearly communicate ETL, SQL, BI, CRM Analytics readiness, and customer lifecycle analytics.

## Phase 0, Baseline and Guardrails

### Goal

Make the current baseline explicit before further expansion.

### Tasks

- Keep this revised expansion plan committed in the repository.
- Record the current passing checks.
- Confirm the project can run in local live mode.
- Confirm the project can build in static demo mode.
- Confirm generated artifacts are either checked in intentionally or regenerated by documented commands.

### Recommended Commands

```bash
python -m pytest tests backend/app/tests
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
```

### Exit Criteria

- The baseline is known.
- Current failures, if any, are documented.
- Future work can be reviewed as intentional changes rather than hidden cleanup.

## Phase 1, Canonical Local Dataset Contract

### Goal

Create one shared schema for the support/call analytics path so ETL, backend, OpenAPI types, frontend tables, and charts agree on field names and units.

### Primary Files

```text
support_analytics/etl.py
support_analytics/manifest.py
scripts/generate_parquet.py
backend/app/models/call.py
backend/app/schemas/calls.py
data/sample_calls.json
data/agents.csv
```

### Tasks

1. Define canonical call columns:
   - `id`
   - `agent_id`
   - `customer_region`
   - `issue_type`
   - `duration_seconds`
   - `resolution_status`
   - `started_at`

2. Define join-derived columns from agent metadata:
   - `agent_name`
   - `agent_region`
   - `skill_rating`

3. Add optional enrichments only where useful:
   - `channel`
   - `priority`
   - `sentiment`
   - `csat`
   - `first_response_minutes`
   - `closed_at`
   - `first_contact_resolution`

4. Implement deterministic local Parquet generation with Polars.

5. Generate a real manifest containing:
   - dataset name
   - artifact path
   - row count
   - generated timestamp
   - source file hashes or mtimes
   - artifact hash
   - warnings

6. Add tests for:
   - required columns
   - row count
   - join correctness
   - null handling
   - idempotent regeneration
   - manifest integrity

### Exit Criteria

```bash
python scripts/generate_parquet.py --input data/sample_calls.json --agents data/agents.csv --output data/cleaned_calls.parquet
python -m pytest tests
```

The commands produce a real artifact and tests pass against real ETL behavior.

## Phase 2, Real Backend Data Access and API Envelopes

### Goal

Make FastAPI read generated artifacts instead of returning hardcoded placeholder responses.

### Primary Files

```text
backend/app/core/config.py
backend/app/repositories/parquet_repo.py
backend/app/repositories/manifest_repo.py
backend/app/services/data_access.py
backend/app/services/calls.py
backend/app/services/agents.py
backend/app/services/metrics.py
backend/app/routers/*.py
backend/app/tests/*
```

### Tasks

1. Strengthen settings:
   - resolve paths relative to repository root
   - add `enable_refresh_endpoint`
   - add `cors_origins`
   - add `api_prefix`
   - add `static_demo_mode`
   - allow test overrides

2. Implement Parquet repository helpers:
   - `scan_calls()` returns a Polars `LazyFrame`
   - filtering happens before collection
   - pagination uses offset and limit
   - total count is calculated separately

3. Implement call endpoints:
   - `GET /api/calls`
   - `GET /api/calls/{call_id}`

4. Implement filters:
   - page
   - per_page
   - region
   - issue_type
   - resolution_status
   - date range
   - duration range
   - sort field
   - sort direction

5. Implement agent aggregations:
   - total calls
   - average duration
   - resolution rate
   - average skill rating
   - region

6. Implement metrics endpoint:
   - KPI cards
   - time series
   - issue breakdown
   - region performance
   - null deltas when history is insufficient

7. Implement settings endpoints:
   - real manifest endpoint
   - refresh endpoint disabled by default

8. Add consistent error envelopes.

### Exit Criteria

- Backend tests prove responses come from Parquet and manifest artifacts.
- OpenAPI includes final request and response schemas needed by frontend generation.

## Phase 3, OpenAPI Type Generation and Frontend Data Layer

### Goal

Make the frontend consume typed FastAPI contracts without breaking static export.

### Primary Files

```text
frontend/src/lib/api/client.ts
frontend/src/lib/api/hooks.ts
frontend/src/lib/api/generated/schema.ts
frontend/src/lib/constants/queryKeys.ts
frontend/src/lib/data/*.ts
frontend/src/providers/query-provider.tsx
frontend/src/lib/utils/env.ts
```

### Tasks

1. Regenerate frontend API types:

```bash
npm --prefix frontend run api:generate
```

2. Replace placeholder generated types with actual OpenAPI output.

3. Expand `apiFetch`:
   - accept query parameters
   - preserve typed error payloads
   - support abort signals from TanStack Query
   - use `NEXT_PUBLIC_API_BASE_URL` in live mode

4. Add hooks:
   - `useCalls(filters)`
   - `useCall(callId)`
   - `useAgents(filters)`
   - `useMetrics(filters)`
   - `useManifest()`
   - `useRefreshManifest()`

5. Add centralized static-demo fallback:
   - live local mode calls FastAPI
   - static GitHub Pages mode uses deterministic fixtures
   - the switch lives in `env.ts`, not inside page components

### Exit Criteria

- `frontend/src/lib/api/generated/schema.ts` is generated from FastAPI.
- React Query hooks are the normal data access path.
- Static export works without a running backend.

## Phase 4, Page-by-Page Frontend Migration

### Goal

Move existing pages from mock arrays to typed hooks in the least risky order.

### Migration Order

1. Settings page
2. Calls page
3. Call detail page
4. Agents page
5. Dashboard page
6. Metrics page

### Rules For Each Page

- Show loading, error, empty, and success states.
- Do not reshape API data directly inside page components.
- Keep filters serializable.
- Keep query keys stable.
- Add component or transformer tests for non-trivial mappings.
- Keep mock data only as explicit static-demo fallback or test fixture data.

### Exit Criteria

- No live-mode page imports local call datasets directly.
- API DTOs are transformed through a mapping layer.
- Static demo mode remains functional.

## Phase 5, Quality, Security, and Operations Hardening

### Goal

Make the local-first system robust enough for demos, future deployment, and confident interview discussion.

### Tasks

- Add CORS middleware restricted to configured origins.
- Replace fake token behavior with signed local JWTs or clearly document that auth is disabled in local mode.
- Add request IDs.
- Add structured backend logs.
- Add response caching for manifest or Parquet scans where useful.
- Validate bad filter combinations and return friendly 422 responses.
- Add CI checks for Python tests, backend OpenAPI contract tests, frontend lint, frontend test, frontend build, and generated-schema drift detection.
- Add README troubleshooting for missing Parquet files, Node/Python version mismatches, and static export mode.

### Exit Criteria

- A fresh clone can run ETL, backend, frontend, and tests with documented commands.
- Generated OpenAPI types cannot drift from backend schemas unnoticed.
- Local live mode and static demo mode are both documented.

## Phase 6, Customer Analytics and BI Expansion

### Goal

Expand the project from support operations analytics into customer lifecycle analytics.

This phase adds Customer 360 modeling, SQL marts, BI exports, Salesforce CRM Analytics documentation, and customer analytics dashboard pages.

### Why This Phase Matters

This is the most important job-facing phase.

Phase 1 through Phase 5 prove that the app is engineered well. Phase 6 proves that the app is relevant to Customer Analytics, BI, Customer Success, Salesforce-adjacent analytics, and analytics engineering roles.

### Non-Goals

Do not build live Salesforce integration.

Do not add OAuth for Salesforce.

Do not build production AWS deployment.

Do not replace the existing support analytics pages.

Do not start the S3 adapter yet.

### 6.1 Data Model Expansion

Add account-level datasets:

```text
data/raw/
  accounts.csv
  subscriptions.csv
  product_usage.csv
  invoices.csv
  opportunities.csv
  customer_success_touches.csv
```

The existing support/calls dataset remains and becomes the support signal inside Customer 360.

### Dataset Purpose

| Dataset | Purpose |
| --- | --- |
| `accounts.csv` | Customer profile data, restaurant type, region, segment, owner, CSM |
| `subscriptions.csv` | Plan tier, MRR, start date, cancellation date, active/churned status |
| `product_usage.csv` | Product adoption, order volume, active days, login behavior |
| `invoices.csv` | Revenue, payment status, failed payments, billing issues |
| `opportunities.csv` | Salesforce-style upsell, renewal, and expansion pipeline |
| `customer_success_touches.csv` | QBRs, check-ins, onboarding activity, risk notes, outcomes |
| existing support data | Support burden, CSAT, SLA misses, escalations, resolution quality |

### Minimum Fields

#### `accounts.csv`

```text
account_id
account_name
restaurant_type
region
segment
signup_date
account_owner
customer_success_manager
```

#### `subscriptions.csv`

```text
subscription_id
account_id
plan_tier
mrr
start_date
end_date
status
```

Allowed status values:

```text
active
churned
paused
trial
```

#### `product_usage.csv`

```text
usage_id
account_id
usage_month
active_days
orders_processed
staff_logins
features_used_count
last_login_date
```

#### `invoices.csv`

```text
invoice_id
account_id
invoice_month
amount
paid
payment_failed
payment_date
```

#### `opportunities.csv`

```text
opportunity_id
account_id
opportunity_type
stage
amount
close_date
probability
```

Example opportunity types:

```text
renewal
upsell
cross_sell
winback
```

#### `customer_success_touches.csv`

```text
touch_id
account_id
touch_type
touch_date
outcome
notes_category
```

Example touch types:

```text
onboarding
check_in
qbr
risk_review
renewal_call
training
```

### 6.2 Customer 360 Transformation

Add:

```text
scripts/generate_customer_analytics.py
```

This script reads raw customer datasets, validates them, cleans them, joins them, and generates curated outputs.

### Curated Outputs

```text
data/curated/
  accounts.parquet
  subscriptions.parquet
  product_usage.parquet
  invoices.parquet
  opportunities.parquet
  customer_success_touches.parquet
  customer_360.parquet
```

### Transformation Requirements

The script must:

- Validate required columns.
- Parse all date fields.
- Standardize region names.
- Standardize segment names.
- Standardize plan tiers.
- Join accounts to subscriptions.
- Join accounts to product usage summaries.
- Join accounts to invoice summaries.
- Join accounts to support summaries.
- Join accounts to customer success touch summaries.
- Calculate active or churned status.
- Calculate support burden.
- Calculate product engagement.
- Calculate payment health.
- Calculate customer success engagement.
- Calculate customer health score.
- Write curated Parquet files.
- Write BI-ready CSV exports.
- Write a customer analytics manifest.

### Manifest

Create:

```text
data/customer_analytics_manifest.json
```

Suggested structure:

```json
{
  "dataset_name": "customer_analytics",
  "generated_at": "2026-05-29T00:00:00Z",
  "source_files": [],
  "curated_outputs": [],
  "mart_outputs": [],
  "bi_exports": [],
  "row_counts": {},
  "hashes": {},
  "warnings": []
}
```

### 6.3 SQL Analytics Layer

Add:

```text
sql/
  00_create_customer_views.sql
  01_customer_360.sql
  02_churn_risk_accounts.sql
  03_retention_cohorts.sql
  04_ltv_by_segment.sql
  05_customer_health_score.sql
  06_support_impact_on_churn.sql
  07_expansion_opportunities.sql
  08_segment_performance.sql
```

Use DuckDB to execute SQL locally against curated Parquet files.

### SQL Concepts To Demonstrate

- joins
- CTEs
- aggregations
- date truncation
- cohort logic
- window functions
- case statements
- account-level rollups
- revenue-level metrics
- segmentation logic

### 6.4 SQL Mart Outputs

Generate:

```text
data/marts/
  customer_360.parquet
  churn_risk_accounts.parquet
  retention_cohorts.parquet
  ltv_by_segment.parquet
  customer_health_scores.parquet
  support_impact_on_churn.parquet
  expansion_opportunities.parquet
  segment_performance.parquet
```

### Business Purpose Of Each Mart

| Mart | Business Question |
| --- | --- |
| `customer_360.parquet` | What is the full account-level view of each customer? |
| `churn_risk_accounts.parquet` | Which accounts are most likely to churn? |
| `retention_cohorts.parquet` | How well do customer cohorts retain over time? |
| `ltv_by_segment.parquet` | Which segments produce the highest lifetime value? |
| `customer_health_scores.parquet` | Which customers are healthy, watchlisted, at risk, or critical? |
| `support_impact_on_churn.parquet` | How do support burden and CSAT relate to churn? |
| `expansion_opportunities.parquet` | Which accounts are expansion-ready? |
| `segment_performance.parquet` | Which plan, region, or restaurant segments perform best? |

### 6.5 Metric Definitions

#### Churn Rate

```text
churn_rate = churned_customers / customers_active_at_period_start
```

#### Retention Rate

```text
retention_rate = customers_active_at_period_end / customers_active_at_period_start
```

#### Customer Lifetime Value

Simple model:

```text
ltv = average_mrr / monthly_churn_rate
```

Preferred model:

```text
ltv = average_mrr * gross_margin / monthly_churn_rate
```

If gross margin is not in the dataset, document an assumption:

```text
gross_margin = 0.75
```

#### At-Risk MRR

```text
at_risk_mrr = sum(mrr for accounts where risk_level in ('At Risk', 'Critical'))
```

#### Customer Health Score

Weighted model:

```text
health_score =
  product_usage_score * 0.35
+ payment_health_score * 0.20
+ support_experience_score * 0.25
+ customer_success_engagement_score * 0.20
```

Health bands:

```text
80-100 = Healthy
60-79 = Watch
40-59 = At Risk
0-39 = Critical
```

#### Churn Risk Level

Suggested bands:

```text
Critical = health_score < 40 or payment_failed = true and active_days < 5
At Risk = health_score between 40 and 59
Watch = health_score between 60 and 79
Healthy = health_score >= 80
```

### 6.6 BI Exports

Generate:

```text
data/bi_exports/
  customer_360.csv
  churn_risk_accounts.csv
  retention_cohorts.csv
  ltv_by_segment.csv
  customer_health_scores.csv
  support_impact_on_churn.csv
  expansion_opportunities.csv
  segment_performance.csv
```

The exports should come from the same SQL mart pipeline. They should be clean enough to load into Tableau, Salesforce CRM Analytics, Looker Studio, Power BI, or another BI platform.

### 6.7 Tableau Layer

Add:

```text
bi/tableau/
  README.md
  screenshots/
```

If a Tableau Public dashboard is created, add:

```text
bi/tableau/tableau_public_url.txt
```

If Tableau is not created yet, use local dashboard screenshots and label them honestly as local dashboard screenshots, not Tableau screenshots.

### Recommended Tableau Tabs

1. Executive Overview
2. Churn Risk
3. Retention Cohorts
4. Customer Health
5. Revenue and LTV
6. Segment Performance
7. Support Drivers

### Tableau README Should Explain

- Which CSV exports power the dashboard.
- What each tab answers.
- Which metrics are included.
- How to regenerate exports.
- Which files to upload into Tableau Public.
- What assumptions are used for LTV and health scoring.

### 6.8 Salesforce CRM Analytics Documentation

Add:

```text
bi/salesforce_crma/
  dataset_mapping.md
  recipe_plan.md
  dashboard_wireframe.md
  saql_examples.md
```

This is a CRM Analytics readiness layer, not a fake live Salesforce integration.

### Dataset Mapping

| Local Dataset | Salesforce-Style Object |
| --- | --- |
| `accounts.csv` | Account |
| `subscriptions.csv` | Contract or Subscription custom object |
| support or calls data | Case |
| `opportunities.csv` | Opportunity |
| `customer_success_touches.csv` | Task or Event |
| `invoices.csv` | Billing or revenue object |
| `product_usage.csv` | External product telemetry object |

### Recipe Plan

```text
Account
  joined to Subscription
  joined to Support Interactions
  joined to Product Usage
  joined to Invoices
  joined to Opportunities
  joined to Customer Success Touches
  output Customer_360
```

### Dashboard Wireframe Sections

```text
Executive KPIs
Customer Health Distribution
Churn Risk Queue
Retention Cohort Heatmap
LTV by Segment
Support Impact on Churn
Expansion Opportunities
Recommended Actions
```

### SAQL Examples

Include simple examples for:

- grouping customers by risk level
- calculating total at-risk MRR
- filtering accounts by segment
- sorting churn-risk accounts by health score

### 6.9 Backend API Expansion

Add:

```text
backend/app/routers/customer_analytics.py
backend/app/services/customer_analytics.py
backend/app/schemas/customer_analytics.py
```

### Endpoints

```text
GET /api/customer-analytics/overview
GET /api/customer-analytics/churn-risk
GET /api/customer-analytics/retention-cohorts
GET /api/customer-analytics/ltv
GET /api/customer-analytics/segments
GET /api/customer-analytics/health
GET /api/customer-analytics/expansion-opportunities
GET /api/customer-analytics/support-impact
GET /api/customer-analytics/bi-exports
GET /api/customer-analytics/accounts/{account_id}
```

### Response Types

Create schemas such as:

```text
CustomerAnalyticsOverview
CustomerHealthScore
ChurnRiskAccount
RetentionCohortRow
LtvSegment
SegmentPerformance
ExpansionOpportunity
SupportImpactRow
BiExport
CustomerAccountDetail
```

### Backend Rules

- Read from generated Parquet marts or CSV exports.
- Do not calculate core metrics only in frontend code.
- Keep response envelopes consistent with the rest of the app.
- Return empty arrays and null deltas when the sample dataset is too small.
- Do not fabricate comparison percentages when history is insufficient.

### 6.10 Frontend Pages

Add:

```text
/customer-analytics
/customer-analytics/churn-risk
/customer-analytics/retention
/customer-analytics/ltv
/customer-analytics/segments
/customer-analytics/accounts/[accountId]
```

If time is limited, implement only:

```text
/customer-analytics
/customer-analytics/churn-risk
/customer-analytics/retention
```

### Customer Analytics Overview Page

Show:

- active customers
- MRR
- churn rate
- retention rate
- average LTV
- at-risk accounts
- at-risk MRR
- customer health distribution
- top churn drivers
- recommended actions

### Churn Risk Page

Show table columns:

```text
Account
Segment
Region
Plan Tier
MRR
Health Score
Risk Level
Main Risk Driver
Recommended Action
```

Filters:

```text
risk_level
segment
region
plan_tier
minimum_mrr
```

### Retention and LTV Page

Show:

- retention cohort heatmap
- LTV by segment
- churn by plan tier
- retention by signup month
- expansion-ready accounts summary

### Optional Segment Page

Show:

- churn by segment
- LTV by segment
- CSAT by segment
- support burden by segment
- product usage by segment

### Optional Account Detail Page

Show:

- Customer 360 profile
- subscription history
- support history
- product usage trend
- invoices
- opportunities
- CSM touches
- health score explanation

### 6.11 Frontend Components

Add:

```text
frontend/src/features/customer-analytics/
  components/
    CustomerKpiGrid.tsx
    CustomerHealthDistribution.tsx
    ChurnRiskTable.tsx
    RetentionCohortHeatmap.tsx
    LtvBySegmentChart.tsx
    SegmentPerformanceChart.tsx
    ExpansionOpportunitiesTable.tsx
    RecommendedActionsPanel.tsx
    BiExportsPanel.tsx

  hooks/
    useCustomerAnalyticsOverview.ts
    useChurnRiskAccounts.ts
    useRetentionCohorts.ts
    useLtvBySegment.ts
    useSegmentPerformance.ts
    useCustomerHealth.ts
    useBiExports.ts

  types.ts
  mappers.ts
```

### Frontend Rules

- Hooks should use generated OpenAPI types where possible.
- Page components should not directly reshape raw API data.
- Mapping should live in `mappers.ts`.
- Static demo fallback should remain centralized.
- Charts should handle empty data safely.

### 6.12 Tests

Add tests for:

#### ETL and SQL

- raw customer data loads successfully
- required columns are validated
- Customer 360 output has one row per account
- health score stays between 0 and 100
- churn risk bands are assigned
- retention cohorts are generated
- LTV values are non-negative
- BI export files are written
- manifest contains customer analytics outputs

#### Backend

- overview endpoint returns KPI values
- churn-risk endpoint returns sorted risk accounts
- retention endpoint returns cohort rows
- LTV endpoint returns segment rows
- BI exports endpoint lists expected files
- account detail endpoint returns 404 for unknown accounts

#### Frontend

- customer overview renders loading, error, empty, and success states
- churn risk table renders account rows
- retention heatmap handles empty cohort cells
- LTV chart handles zero or null values
- static demo fallback works without a live backend

### 6.13 Build Order

1. Add raw customer datasets.
2. Build Customer 360 transformation.
3. Add DuckDB SQL marts.
4. Add BI exports.
5. Add backend endpoints.
6. Add customer analytics frontend routes.
7. Add Tableau and Salesforce CRM Analytics docs.
8. Update README and resume bullets.

### 6.14 Exit Criteria

Phase 6 is complete when:

- `scripts/generate_customer_analytics.py` generates curated customer datasets.
- DuckDB SQL files generate customer analytics marts.
- BI-ready CSV exports exist under `data/bi_exports/`.
- Backend customer analytics endpoints return data from generated marts.
- Frontend pages display customer analytics from API-backed hooks or static-demo fallback.
- Salesforce CRM Analytics documentation exists under `bi/salesforce_crma/`.
- Tableau documentation exists under `bi/tableau/`.
- Tests verify the customer analytics data path.
- README explains the Customer Success Analytics Command Center positioning.

### 6.15 Recommended Commits

```text
feat(data): add customer 360 raw datasets
feat(etl): generate customer analytics curated datasets
feat(sql): add DuckDB customer analytics marts
feat(bi): export Tableau-ready customer analytics datasets
feat(api): expose customer analytics endpoints
feat(ui): add customer analytics dashboard pages
docs(crma): add Salesforce CRM Analytics mapping and recipe plan
docs(readme): document customer analytics expansion
```

## Phase 7, Demo, README, and Resume Polish

### Goal

Make the completed project easy for recruiters, hiring managers, and interviewers to understand in under 30 seconds.

This phase turns the technical work from Phase 1 through Phase 6 into a clear portfolio story.

### Tasks

1. Update the README hero section:
   - use the Customer Success Analytics Command Center framing
   - explain churn risk, retention cohorts, LTV, customer health, segmentation, support impact, and expansion opportunities
   - mention the stack clearly

2. Add a Business Questions Answered section.

3. Add a Data Pipeline section.

4. Add a BI and Salesforce CRM Analytics Readiness section.

5. Add screenshots:
   - dashboard overview
   - churn risk page
   - retention cohorts page
   - LTV or segment performance page
   - BI exports or CRM Analytics mapping section

6. Add recruiter-friendly setup commands.

7. Add a Demo Modes section:
   - local live mode uses FastAPI
   - static GitHub Pages mode uses deterministic fallback fixtures
   - BI export mode uses generated CSV files

8. Update resume bullets.

9. Add interview talking points.

### README Business Questions Answered

The project should clearly answer:

- Which customers are most likely to churn?
- How much MRR is currently at risk?
- Which customer cohorts retain best?
- Which customer segments have the highest LTV?
- Which accounts are expansion-ready?
- Which regions or plan tiers show weak retention?
- How does support experience affect churn risk?
- Which accounts should Customer Success prioritize first?

### Suggested README Project Description

```text
Customer Success Analytics Command Center is a full-stack analytics platform that models Customer 360 data across accounts, subscriptions, product usage, support interactions, invoices, opportunities, and customer success touches. It uses Polars and DuckDB to generate curated Parquet datasets, SQL marts, and BI-ready CSV exports, then exposes the analytics through FastAPI and a polished Next.js dashboard.
```

### Suggested Resume Bullets

```text
Customer Success Analytics Command Center | Next.js, TypeScript, FastAPI, Polars, DuckDB, SQL, Parquet, Tableau-ready CSV exports
- Built a Salesforce-aware customer analytics dashboard modeling accounts, subscriptions, support interactions, product usage, invoices, opportunities, and customer success touches.
- Implemented ETL pipelines with Polars to validate raw data, generate curated Parquet datasets, and produce manifest-based data quality diagnostics.
- Wrote DuckDB SQL marts for churn risk, retention cohorts, customer lifetime value, customer health scoring, segmentation, support impact, and expansion opportunities.
- Created executive dashboards showing MRR, churn rate, retention, LTV, customer health, at-risk MRR, cohort retention, and segment performance.
- Exported BI-ready datasets for Tableau-style workflows and documented Salesforce CRM Analytics dataset mapping, recipe design, and dashboard wireframes.
```

### Interview Talking Points

- Why the app is local-first.
- Why DuckDB was used for SQL marts.
- Why Parquet was used for analytics artifacts.
- How Customer 360 is modeled.
- How customer health score is calculated.
- How churn risk is calculated.
- How retention cohorts are calculated.
- How LTV is calculated.
- How the dashboard maps to Customer Success workflows.
- What would change in a real production Salesforce or AWS environment.

### Exit Criteria

- README explains the project value in under 30 seconds.
- Screenshots show customer analytics, not only support analytics.
- Resume bullets reflect the completed Customer Success Analytics Command Center.
- The project has a clear recruiter-facing demo path.
- Salesforce CRM Analytics documentation is linked and clearly labeled as readiness documentation.
- AWS adapter remains deferred until the local customer analytics story is complete and polished.

## Phase 8, Optional AWS-Ready Storage Adapter

### Goal

Introduce cloud storage without disrupting local development or frontend contracts.

### Prerequisite

Do not start this phase until Phase 6 customer analytics work and Phase 7 demo polish are complete.

### Tasks

1. Define a storage protocol in:

```text
backend/app/services/data_access.py
```

2. Add implementations:

```text
LocalArtifactStore
S3ArtifactStore
```

3. Keep service code dependent on the storage interface, not boto3 or s3fs directly.

4. Add settings:
   - S3 bucket
   - prefix
   - region
   - optional Glue database
   - optional Glue table
   - `DATA_SOURCE=local|s3`

5. Support S3 reads behind `DATA_SOURCE=s3`.

6. Add mocked S3 tests.

7. Document AWS migration separately from local demo setup.

### Exit Criteria

- Local mode remains the default.
- Local mode requires no AWS credentials.
- S3 mode can read equivalent Parquet and manifest objects through the same API contracts.
- Frontend routes and components do not change when switching storage mode.

## Do Not Do Yet

Do not prioritize live Salesforce integration, OAuth, production AWS deployment, Redis caching, complex auth, or deeper cloud infrastructure until Phase 6 and Phase 7 are complete.

The next portfolio signal is not more infrastructure. The next signal is customer analytics clarity:

- SQL marts
- BI exports
- CRM-style customer modeling
- churn
- retention
- LTV
- cohorts
- segmentation
- customer health
- recruiter-friendly demo presentation

AWS storage work belongs in Phase 8 as an optional adapter after the local-first analytics product is complete and polished.

## Concrete Backlog By Workstream

### Data and ETL

| Priority | Work Item | Files |
| --- | --- | --- |
| P0 | Add Customer 360 raw datasets | `data/raw/*.csv` |
| P0 | Implement Customer 360 transformation | `scripts/generate_customer_analytics.py` |
| P0 | Generate curated Parquet outputs | `data/curated/*.parquet` |
| P0 | Generate customer analytics manifest | `data/customer_analytics_manifest.json` |
| P1 | Add data quality checks | `support_analytics/*.py` |
| P1 | Add ETL tests | `tests/test_customer_analytics_etl.py` |

### SQL and BI

| Priority | Work Item | Files |
| --- | --- | --- |
| P0 | Add DuckDB SQL marts | `sql/*.sql` |
| P0 | Generate Parquet marts | `data/marts/*.parquet` |
| P0 | Generate BI exports | `data/bi_exports/*.csv` |
| P1 | Add Tableau docs | `bi/tableau/README.md` |
| P1 | Add Salesforce CRM Analytics docs | `bi/salesforce_crma/*.md` |

### Backend

| Priority | Work Item | Files |
| --- | --- | --- |
| P0 | Add customer analytics schemas | `backend/app/schemas/customer_analytics.py` |
| P0 | Add customer analytics service | `backend/app/services/customer_analytics.py` |
| P0 | Add customer analytics router | `backend/app/routers/customer_analytics.py` |
| P1 | Add endpoint tests | `backend/app/tests/*customer_analytics*` |
| P1 | Regenerate OpenAPI schema | backend OpenAPI output |

### Frontend

| Priority | Work Item | Files |
| --- | --- | --- |
| P0 | Add customer analytics hooks | `frontend/src/features/customer-analytics/hooks/` |
| P0 | Add customer overview page | `frontend/src/app/customer-analytics/page.tsx` |
| P0 | Add churn risk page | `frontend/src/app/customer-analytics/churn-risk/page.tsx` |
| P1 | Add retention/LTV page | `frontend/src/app/customer-analytics/retention/page.tsx` |
| P1 | Add charts and tables | `frontend/src/features/customer-analytics/components/` |
| P2 | Add optional segment and account detail pages | frontend routes |

### Documentation

| Priority | Work Item | Files |
| --- | --- | --- |
| P0 | Update README hero and project framing | `README.md` |
| P0 | Add Business Questions Answered section | `README.md` |
| P0 | Add pipeline explanation | `README.md` |
| P0 | Add screenshots | `docs/screenshots/` or README assets |
| P1 | Add resume bullets | `README.md` or `docs/resume-bullets.md` |
| P1 | Add interview talking points | `docs/interview-talking-points.md` |

## Recommended Sprint Plan From This Point

### Sprint 6, Customer Analytics and BI Expansion

- Add Customer 360 datasets.
- Add Customer 360 transformation.
- Add DuckDB SQL marts.
- Add churn, retention, LTV, cohort, segment, support impact, and health score outputs.
- Generate BI-ready CSV exports.
- Add Salesforce CRM Analytics mapping docs.
- Add customer analytics frontend pages.

### Sprint 7, Demo and Portfolio Polish

- Update README.
- Add screenshots.
- Add Business Questions Answered section.
- Add demo mode explanation.
- Update resume bullets.
- Add interview talking points.

### Sprint 8, Optional AWS Adapter

- Add LocalArtifactStore and S3ArtifactStore.
- Keep local mode default.
- Add mocked S3 tests.
- Document AWS migration path.

## Definition Of Done

The expansion is complete when these commands pass from a fresh clone after dependency installation:

```bash
python scripts/generate_parquet.py --input data/sample_calls.json --agents data/agents.csv --output data/cleaned_calls.parquet
python scripts/generate_customer_analytics.py
python -m pytest tests backend/app/tests
uvicorn backend.app.main:app --port 8000
npm --prefix frontend run api:generate
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
```

Additionally:

- Local development at `http://localhost:3000/dashboard` uses FastAPI data when `NEXT_PUBLIC_API_BASE_URL` points to `http://localhost:8000`.
- Static export uses deterministic fallback fixtures and does not require a live backend.
- Customer analytics pages show churn, retention, LTV, segmentation, customer health, support impact, and expansion metrics.
- BI exports exist and are documented.
- Salesforce CRM Analytics mapping is documented without pretending to be a live integration.
- README explains the project value quickly.
- Resume bullets are updated.

## Final Positioning

The final project should be described as:

```text
A Salesforce-aware Customer Success Analytics Command Center that uses Polars ETL, DuckDB SQL marts, Parquet artifacts, BI-ready CSV exports, FastAPI, and Next.js to analyze churn, retention, LTV, segmentation, customer health, support impact, and expansion opportunities.
```

This makes the project relevant to four role types:

- junior software developer
- analytics engineer
- BI analyst
- customer analytics analyst
