# Demo Notes

Use this folder for maintained product walkthroughs and delivery notes that explain the shipped analytics surfaces.

Current assets:

- `customer-analytics-product-walkthrough.md`

Recommended route flow:

1. Open `/customer-analytics` and explain the Customer 360 KPIs.
2. Open `/customer-analytics/churn-risk` and show the Customer Success priority queue.
3. Open `/customer-analytics/retention` and explain cohort retention plus LTV.
4. Open the public Salesforce Experience site and verify the four LWC dashboard pages.
5. Show `data/bi_exports/` and `data/salesforce_crma/` to connect the UI surfaces to generated analytics artifacts.

Historical planning notes should not be kept here once the implemented product documentation covers the shipped behavior.

Keep implementation-source documentation out of this folder. Backend structure
belongs in `docs/architecture/`, while Salesforce metadata and deployment notes
belong in `salesforce/README.md` or `salesforce/docs/`.
