# Customer Analytics Product Walkthrough

## Web Application

The Next.js surface provides routed customer-success analytics pages:

- `/customer-analytics` summarizes Customer 360 health, revenue, risk, expansion, and BI export readiness.
- `/customer-analytics/churn-risk` ranks at-risk accounts by health, churn signals, and recommended action.
- `/customer-analytics/retention` shows cohort retention movement and account-segment context.
- `/customer-analytics/ltv` explains lifetime-value assumptions by segment.

The public GitHub Pages build runs in static demo mode so the web app remains deterministic without a live FastAPI backend.

## Salesforce Application

The Salesforce app is a separate LWC implementation with four pages:

- `Command Center`
- `At-Risk Drilldown`
- `Expansion Pipeline`
- `Retention Cohorts`

Those pages use `CustomerSuccessDashboardController`, which reads `CustomerSuccessDashboardSampleData` from a packaged static resource generated from `data/salesforce_crma/*.csv`.

## Data Lineage

1. Local source files under `data/raw/` and `data/sample_calls.json` feed the generation scripts.
2. `scripts/generate_customer_analytics.py` creates curated Parquet artifacts, marts, BI exports, and the customer analytics manifest.
3. `scripts/export_salesforce_crma.py` writes Salesforce CRM Analytics-ready CSV exports.
4. `salesforce/scripts/build_dashboard_sample_resources.py` packages the Salesforce LWC sample payload.
5. The public Experience Cloud site renders the same LWC pages through stable `?page=` routes.

## Verification

Use these checks before refreshing public evidence:

```powershell
python -m pytest tests backend/app/tests salesforce/tests
npm --prefix frontend run test
GITHUB_PAGES=true npm --prefix frontend run build
npm --prefix salesforce run verify:experience
```
