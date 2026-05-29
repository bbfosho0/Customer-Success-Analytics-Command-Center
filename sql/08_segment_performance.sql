SELECT
  segment,
  region,
  plan_tier,
  count(*) AS customers,
  round(sum(current_mrr), 2) AS current_mrr,
  round(avg(health_score), 2) AS avg_health_score,
  round(avg(avg_active_days), 2) AS avg_active_days,
  round(avg(support_calls), 2) AS avg_support_calls,
  round(sum(CASE WHEN is_churned THEN 1 ELSE 0 END)::DOUBLE / nullif(count(*), 0), 4) AS churn_rate,
  round(sum(weighted_pipeline_amount), 2) AS weighted_pipeline_amount
FROM customer_360_source
GROUP BY segment, region, plan_tier
ORDER BY current_mrr DESC
