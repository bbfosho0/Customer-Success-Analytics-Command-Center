SELECT
  segment,
  plan_tier,
  count(*) AS customers,
  round(avg(support_calls), 2) AS avg_support_calls,
  round(avg(escalated_calls), 2) AS avg_escalated_calls,
  round(avg(support_resolution_rate), 2) AS avg_resolution_rate,
  round(avg(health_score), 2) AS avg_health_score,
  round(sum(CASE WHEN is_churned THEN 1 ELSE 0 END)::DOUBLE / nullif(count(*), 0), 4) AS churn_rate
FROM customer_360_source
GROUP BY segment, plan_tier
ORDER BY churn_rate DESC, avg_escalated_calls DESC
