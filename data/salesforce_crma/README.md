# Salesforce CRM Analytics Export

This directory contains portfolio-safe, CRM Analytics-ready CSV datasets and field-level schema metadata generated from the repository's local customer analytics marts. It demonstrates how the modeled analytics layer can be prepared for Salesforce CRM Analytics; it is **not** a live production Salesforce integration, connector, synchronization job, or deployment package.

Regenerate the exports from the repository root after building the analytics marts:

```bash
python scripts/generate_customer_portfolio_sample.py --accounts 100
python scripts/generate_customer_analytics.py
python scripts/export_salesforce_crma.py
```

The checked-in portfolio contains 100 deterministic customer accounts. The
original 12 named accounts remain as recognizable anchors, while the generated
records add portfolio density across regions, segments, plans, risk bands,
customer-success ownership, and expansion pipeline.

The exporter reads available Parquet or CSV sources from `data/marts/`, with `data/curated/` available as a fallback, and writes Salesforce-style custom field names such as `Account_Id__c`, `Health_Score__c`, and `Current_MRR__c`. Every generated CSV has a matching JSON description in `schemas/` containing its source, dataset name, inferred field types, suggested CRM Analytics roles, and original columns.

## Exported datasets

| Dataset | What it represents | Suggested dashboard use |
| --- | --- | --- |
| `Customer_360.csv` | Account-grain customer profile combining subscription value, product adoption, support burden, billing signals, pipeline, health, risk, and recommended action. | Customer 360 overview, executive KPIs, account drilldowns, and action queues. |
| `Churn_Risk_Accounts.csv` | Prioritized accounts with elevated risk or material revenue exposure, including the assigned customer success manager. | Churn-risk worklist, at-risk ARR, risk drivers, ownership, and CSM interventions. |
| `Retention_Cohorts.csv` | Signup cohorts measured across elapsed customer months. | Cohort retention curves and period-over-period retention comparison. |
| `LTV_By_Segment.csv` | Estimated lifetime value and supporting assumptions by segment and plan tier. | LTV segmentation, plan comparison, and portfolio economics. |
| `Expansion_Opportunities.csv` | Active accounts ranked by health, current value, pipeline, close timing, expansion readiness, and customer success manager. | Expansion pipeline, ownership, whitespace prioritization, and account-level opportunity review. |
| `Support_Impact_On_Churn.csv` | Aggregated support demand, escalation, resolution, health, and churn outcomes. | Support-impact analysis and churn correlation by customer segment. |

## Upload to a CRM Analytics-enabled Developer Edition org

Salesforce navigation labels can vary by org release and permissions, but the standard dataset upload flow is:

1. Create or use a CRM Analytics-enabled Developer Edition org and confirm that your user has permission to access Analytics Studio and create datasets.
2. Open **Analytics Studio**, then use the data manager or dataset creation workflow to upload a CSV file from this directory.
3. Use the CSV filename without its extension as the dataset name, for example `Customer_360`.
4. Review the detected field types before creating the dataset. Use the matching file in `schemas/` as the intended field and role reference: identifiers and dimensions should not be summed, measures should remain numeric, and date fields should use the supplied ISO date values.
5. Place the dataset in the app used for the portfolio dashboard, run the upload, and verify row counts and representative field values.
6. Repeat for each dashboard domain you want to demonstrate. Join or augment datasets in a CRM Analytics recipe only when the dashboard design requires a shared grain; `Customer_360` already provides the primary account-level analytical view.
7. Build lenses and dashboards for Customer 360, churn risk, retention, LTV, expansion, and support impact using the mappings above. The examples under `salesforce/docs/bi/` provide a recipe plan, dashboard wireframe, dataset mapping, and SAQL starting points.

The versioned Salesforce DX metadata under `salesforce/` expects these exact dataset API names. When refreshing an existing Developer Edition demonstration, overwrite `Churn_Risk_Accounts` and `Expansion_Opportunities` before deploying dashboard metadata because their selectors now use `Customer_Success_Manager__c`.

For existing aliases, the repository includes a Salesforce CLI upload helper:

```bash
python salesforce/scripts/upload_salesforce_crma.py --target-org <org-alias>
```

This command uses the locally authenticated CLI session and does not store credentials or org-specific IDs.

The dashboard metadata presents the generated records as an **illustrative 2025 portfolio snapshot**. Current ARR is calculated from current MRR multiplied by 12, and at-risk ARR includes only Critical and At Risk accounts with current recurring revenue.

## Scope and limitations

These files intentionally stop at a deterministic export boundary. They do not authenticate to Salesforce, create Salesforce objects, invoke Salesforce APIs, configure a production dataflow, or keep an org synchronized. Production implementation would additionally require environment-specific authentication, governance, incremental loading, monitoring, data quality controls, access policies, and release management.
