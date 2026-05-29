# Tableau-Ready Customer Analytics Exports

This folder documents the BI export layer for the Customer Success Analytics Command Center. The project does not claim a live Tableau integration; it generates clean CSV files that can be uploaded into Tableau Public, Tableau Desktop, Power BI, Looker Studio, or Salesforce CRM Analytics.

## Regenerate Exports

```bash
python scripts/generate_customer_analytics.py
```

The command writes BI-ready CSVs under `data/bi_exports/` from the same DuckDB SQL marts that power the FastAPI customer analytics endpoints.

## CSV Files

- `customer_360.csv`: account-level Customer 360 view.
- `churn_risk_accounts.csv`: prioritized churn-risk queue.
- `retention_cohorts.csv`: signup-month retention rows for heatmaps.
- `ltv_by_segment.csv`: estimated lifetime value by segment and plan.
- `customer_health_scores.csv`: health score components and risk bands.
- `support_impact_on_churn.csv`: support burden and churn relationships.
- `expansion_opportunities.csv`: expansion readiness and weighted pipeline.
- `segment_performance.csv`: MRR, churn, health, usage, and support by segment.

## Recommended Dashboard Tabs

1. Executive Overview: active customers, MRR, churn rate, retention rate, at-risk MRR.
2. Churn Risk: prioritized accounts by health score, MRR, driver, and recommended action.
3. Retention Cohorts: cohort-month heatmap by month number.
4. Customer Health: distribution across Healthy, Watch, At Risk, and Critical.
5. Revenue and LTV: estimated LTV by segment and plan tier.
6. Segment Performance: MRR, churn, usage, health, and weighted pipeline by region and plan.
7. Support Drivers: support calls, escalations, resolution rate, and churn.

## Assumptions

- LTV uses `gross_margin = 0.75`.
- Small-sample churn is floored at 2 percent in the LTV mart to avoid infinite LTV.
- Customer health is calculated in the ETL from product usage, payment health, support experience, and Customer Success engagement.
- Screenshots in this repo are local dashboard screenshots unless a future `tableau_public_url.txt` is added.
