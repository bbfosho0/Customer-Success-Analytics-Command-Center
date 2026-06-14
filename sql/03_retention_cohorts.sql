WITH customer_periods AS (
  SELECT
    a.account_id,
    date_trunc('month', a.signup_date)::DATE AS cohort_month,
    s.start_date,
    coalesce(s.end_date, DATE '2025-04-30') AS observed_end_date,
    s.status
  FROM accounts a
  JOIN subscriptions s USING (account_id)
),
periods AS (
  SELECT 0 AS month_number UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
),
cohort_activity AS (
  SELECT
    c.cohort_month,
    p.month_number,
    count(*) AS cohort_size,
    sum(CASE WHEN date_diff('month', c.start_date, c.observed_end_date) >= p.month_number AND c.status <> 'churned' THEN 1 ELSE 0 END) AS retained_customers
  FROM customer_periods c
  CROSS JOIN periods p
  GROUP BY 1, 2
)
SELECT
  cohort_month,
  concat(
    cast(year(cohort_month) AS VARCHAR),
    ' Q',
    cast(quarter(cohort_month) AS VARCHAR)
  ) AS cohort_quarter,
  month_number,
  concat('Month ', lpad(cast(month_number AS VARCHAR), 2, '0')) AS month_since_acquisition,
  cohort_size,
  retained_customers,
  round(retained_customers::DOUBLE / nullif(cohort_size, 0), 4) AS retention_rate
FROM cohort_activity
ORDER BY cohort_month, month_number
