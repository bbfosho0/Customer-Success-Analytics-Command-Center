# Interview Talking Points

- The app is local-first so recruiters can run it without AWS, Salesforce, Tableau, or paid BI tools.
- Polars handles validation and Customer 360 transformations; DuckDB keeps business analytics visible in SQL files.
- Parquet is used for durable analytical artifacts, while CSV exports make the marts easy to load into BI tools.
- Customer 360 is modeled at account grain and joins subscriptions, product usage, invoices, opportunities, customer success touches, and support signals.
- Health score blends product usage, payment health, support experience, and Customer Success engagement.
- Churn risk is a banded output from health score, failed payments, and low active-day signals.
- Retention cohorts are built from signup and subscription lifecycle dates.
- LTV uses average MRR, a 75 percent gross-margin assumption, and monthly churn-rate assumptions.
- In production, Salesforce objects would replace local CSVs and AWS/S3 storage would be added after the local analytics story is complete.
