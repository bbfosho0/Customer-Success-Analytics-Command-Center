# CRM Analytics Recipe Plan

## Input Datasets

Account joins to Subscription, Support Interactions, Product Usage, Invoices, Opportunities, and Customer Success Touches.

## Recipe Steps

1. Load Account as the grain of the recipe.
2. Join latest Subscription by `account_id`.
3. Aggregate Product Usage by `account_id` for active days, order volume, staff logins, features used, and last login.
4. Aggregate Invoices by `account_id` for paid rate, failed payments, amount invoiced, and last payment.
5. Aggregate Support Interactions by region or account when a Salesforce Case account key exists.
6. Aggregate Customer Success Touches by `account_id` for touch count, risk notes, positive notes, and last touch.
7. Aggregate Opportunities by `account_id` for open pipeline and probability-weighted pipeline.
8. Calculate health score components and risk bands.
9. Output `Customer_360`.

## Output Dataset

`Customer_360` powers churn risk, retention, LTV, support impact, expansion readiness, and executive KPI dashboards.
