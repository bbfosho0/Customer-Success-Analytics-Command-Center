WITH ranked AS (
  SELECT
    account_id,
    account_name,
    segment,
    region,
    plan_tier,
    current_mrr AS mrr,
    health_score,
    risk_level,
    main_risk_driver,
    recommended_action,
    customer_success_manager,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE WHEN current_mrr > 0 THEN 0 ELSE 1 END,
        health_score ASC,
        current_mrr DESC
    ) AS priority_rank
  FROM customer_360_source
  WHERE risk_level IN ('Critical', 'At Risk', 'Watch') OR current_mrr >= 10000
)
SELECT * FROM ranked
ORDER BY priority_rank
