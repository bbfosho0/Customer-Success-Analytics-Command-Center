SELECT
  account_id,
  account_name,
  restaurant_type,
  region,
  segment,
  plan_tier,
  status,
  current_mrr,
  mrr,
  avg_active_days,
  orders_processed,
  support_calls,
  escalated_calls,
  failed_payments,
  open_pipeline_amount,
  weighted_pipeline_amount,
  health_score,
  risk_level,
  main_risk_driver,
  recommended_action,
  customer_success_manager
FROM customer_360_source
ORDER BY current_mrr DESC, health_score ASC
