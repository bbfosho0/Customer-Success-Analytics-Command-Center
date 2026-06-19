# Project Capabilities

This project demonstrates an end-to-end customer success analytics delivery path:

- Local deterministic data generation for support interactions, customer accounts, subscriptions, usage, billing, opportunities, and customer-success signals.
- Polars validation and transformation for Customer 360, churn risk, retention cohorts, LTV, expansion readiness, and support impact.
- DuckDB marts and Parquet artifacts for reproducible analytical outputs.
- Typed FastAPI endpoints and generated frontend API contracts.
- A Figma-backed Next.js dashboard for the public web surface.
- CRM Analytics-ready CSV exports and Salesforce metadata for Wave dashboard assets.
- A Salesforce-native LWC dashboard app powered by Apex and packaged static-resource sample data.
- A public Experience Cloud LWR shell that exposes the four LWC dashboards through stable query-param routes.

The current runtime is intentionally sample-data-backed. Production integrations would replace local CSV/static-resource inputs with authenticated Salesforce or warehouse-backed data sources after field mappings, security, and refresh ownership are confirmed.
