# SAQL Examples

These examples show the CRM Analytics-style questions the local SQL marts already answer.

## Customers by Risk Level

```text
q = load "Customer_360";
q = group q by 'risk_level';
q = foreach q generate 'risk_level' as 'Risk Level', count() as 'Customers';
```

## Total At-Risk MRR

```text
q = load "Customer_360";
q = filter q by 'risk_level' in ["At Risk", "Critical"];
q = group q by all;
q = foreach q generate sum('current_mrr') as 'At Risk MRR';
```

## Filter Accounts by Segment

```text
q = load "Customer_360";
q = filter q by 'segment' == "Mid-Market";
q = foreach q generate 'account_name', 'plan_tier', 'current_mrr', 'health_score', 'risk_level';
```

## Sort Churn-Risk Accounts

```text
q = load "Customer_360";
q = filter q by 'risk_level' in ["Critical", "At Risk", "Watch"];
q = order q by 'health_score' asc, 'current_mrr' desc;
q = limit q 25;
```
