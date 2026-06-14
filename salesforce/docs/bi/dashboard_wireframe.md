# CRM Analytics Dashboard Wireframe

The versioned dashboards use a 48-column, 1600px desktop canvas and a 12-column mobile layout. Pages use a light `#F7F8FA` canvas, white cards, a compact `#0F172A` header, and teal, blue, amber, and red accents. Every page states that the data is an illustrative 2025 portfolio snapshot.

## Command Center

### Executive Overview

Five KPIs show current ARR, customers, average health score, at-risk ARR, and open expansion pipeline. Two charts summarize current MRR by risk band and customer health distribution. A compact grain table provides the prioritized risk queue and links to the at-risk drilldown.

### Health & Risk

Four risk KPIs cover accounts requiring attention, critical accounts, at-risk ARR, and average queue health. Charts compare current revenue by risk band and primary risk driver. The account table is priority-ranked and includes customer success manager ownership.

### Retention & LTV

The page combines a cohort heatmap, a retention trend, and estimated lifetime value from `LTV_By_Segment`.

### Expansion

Open and weighted pipeline, ready accounts, and average health lead the page. Readiness and close-date charts precede an account queue with CSM ownership.

### Support Impact

Churn-rate and health comparisons sit beside a concise segment table. A visible caveat explains that the sample contains no linked support calls and must not be interpreted causally.

### Metric Guide

Eight compact cards define ARR/MRR, health, retention, LTV, pipeline, support, filters, and portfolio scope.

## Drilldowns

- **At-Risk Account Dashboard:** four KPIs, current revenue by risk band, revenue by primary risk driver, and a priority-ranked `Churn_Risk_Accounts` table.
- **Expansion Pipeline Dashboard:** four KPIs, readiness and close-date charts, and an `Expansion_Opportunities` queue.
- **Retention Cohort Dashboard:** cohort heatmap, retention trend, LTV by segment, and a compact cohort table.

All drilldowns preserve back and reset navigation and stack their content for mobile.
