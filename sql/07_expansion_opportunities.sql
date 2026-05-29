SELECT
  account_id,
  account_name,
  segment,
  region,
  plan_tier,
  current_mrr AS mrr,
  health_score,
  weighted_pipeline_amount,
  open_pipeline_amount,
  next_close_date,
  CASE
    WHEN health_score >= 80 AND weighted_pipeline_amount > 10000 THEN 'Expansion Ready'
    WHEN health_score >= 70 AND current_mrr > 3000 THEN 'Nurture'
    ELSE 'Not Ready'
  END AS expansion_readiness
FROM customer_360_source
WHERE current_mrr > 0
ORDER BY weighted_pipeline_amount DESC, health_score DESC
