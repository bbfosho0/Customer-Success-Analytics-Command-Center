# Salesforce CRM Analytics Dataset Mapping

This is readiness documentation for CRM Analytics-style modeling. It is not a live Salesforce integration.

| Local Dataset | Salesforce-Style Object | Notes |
| --- | --- | --- |
| `data/raw/accounts.csv` | Account | Customer profile, segment, region, owner, CSM |
| `data/raw/subscriptions.csv` | Contract or Subscription custom object | Plan tier, MRR, lifecycle status |
| `data/sample_calls.json` or `data/cleaned_calls.parquet` | Case | Support burden, escalations, resolution quality |
| `data/raw/opportunities.csv` | Opportunity | Renewal, upsell, cross-sell, winback pipeline |
| `data/raw/customer_success_touches.csv` | Task or Event | QBRs, check-ins, onboarding, risk reviews |
| `data/raw/invoices.csv` | Billing or revenue object | Payment status and failed-payment risk |
| `data/raw/product_usage.csv` | External product telemetry object | Adoption, active days, orders, feature use |

The generated `data/curated/customer_360.parquet` is the local equivalent of a CRM Analytics output dataset named `Customer_360`.
