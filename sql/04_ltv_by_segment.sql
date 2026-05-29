WITH segment_stats AS (
  SELECT
    segment,
    plan_tier,
    count(*) AS customers,
    avg(mrr) AS average_mrr,
    sum(CASE WHEN status = 'churned' THEN 1 ELSE 0 END)::DOUBLE / nullif(count(*), 0) AS monthly_churn_rate
  FROM customer_360_source
  GROUP BY segment, plan_tier
)
SELECT
  segment,
  plan_tier,
  customers,
  round(average_mrr, 2) AS average_mrr,
  round(greatest(monthly_churn_rate, 0.02), 4) AS assumed_monthly_churn_rate,
  round((average_mrr * 0.75) / greatest(monthly_churn_rate, 0.02), 2) AS estimated_ltv
FROM segment_stats
ORDER BY estimated_ltv DESC
