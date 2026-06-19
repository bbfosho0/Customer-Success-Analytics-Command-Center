# Screenshot Inventory

This folder holds curated UI captures for the current routed product. Screenshots are refreshed only after validation passes so published evidence stays consistent with the live surfaces.

## Required filenames

- `dashboard.png` for the root dashboard view (`/`, also reachable as `/dashboard`)
- `metrics.png` for `/metrics`
- `calls.png` for `/calls`
- `call-detail.png` for `/calls/CALL_0001`
- `agents.png` for `/agents`
- `customer-analytics-overview.png` for `/customer-analytics`
- `churn-risk.png` for `/customer-analytics/churn-risk`
- `retention.png` for `/customer-analytics/retention`
- `ltv.png` for `/customer-analytics/ltv`
- `salesforce-experience-command-center.png` for the public Salesforce Experience command center
- `salesforce-experience-at-risk.png` for the public Salesforce Experience at-risk drilldown
- `salesforce-experience-expansion-pipeline.png` for the public Salesforce Experience expansion pipeline
- `salesforce-experience-retention-cohorts.png` for the public Salesforce Experience retention cohorts

## Current checked-in assets

- `dashboard.png`
- `metrics.png`
- `calls.png`
- `call-detail.png`
- `agents.png`
- `customer-analytics-overview.png`
- `churn-risk.png`
- `retention.png`
- `ltv.png`
- `readme-gallery.png`
- `retention-ltv.png` (legacy)
- `salesforce-experience-command-center.png`
- `salesforce-experience-at-risk.png`
- `salesforce-experience-expansion-pipeline.png`
- `salesforce-experience-retention-cohorts.png`

## Refresh rules

- Capture from the current `main` branch after validation passes.
- Use desktop viewport sizing consistently across the full set.
- Prefer static-demo mode or a stable local dataset so counts and labels remain deterministic.
- Prefer full-page screenshots from the deployed GitHub Pages demo when the route is public and stable.
- Replace legacy files such as `retention-ltv.png` once the new route-specific set is no longer needed.
