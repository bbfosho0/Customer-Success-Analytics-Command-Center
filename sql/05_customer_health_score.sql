SELECT
  account_id,
  account_name,
  segment,
  region,
  plan_tier,
  current_mrr AS mrr,
  product_usage_score,
  payment_health_score,
  support_experience_score,
  customer_success_engagement_score,
  health_score,
  risk_level,
  main_risk_driver
FROM customer_360_source
ORDER BY health_score ASC, current_mrr DESC
