import type {
  BiExport,
  ChurnRiskAccount,
  CustomerAnalyticsOverview,
  LtvSegment,
  RetentionCohortRow,
  SegmentPerformance,
} from "./types";

export const staticCustomerOverview: CustomerAnalyticsOverview = {
  kpis: [
    { label: "Active customers", value: "10", delta: null, trend: "flat" },
    { label: "Current MRR", value: "$68,400", delta: null, trend: "flat" },
    { label: "Churn rate", value: "16.7%", delta: null, trend: "flat" },
    { label: "Retention rate", value: "83.3%", delta: null, trend: "flat" },
    { label: "At-risk accounts", value: "4", delta: null, trend: "flat" },
    { label: "At-risk MRR", value: "$4,900", delta: null, trend: "flat" },
  ],
  health_distribution: [
    { risk_level: "Healthy", customers: 3, mrr: 37700 },
    { risk_level: "Watch", customers: 4, mrr: 25800 },
    { risk_level: "At Risk", customers: 3, mrr: 4900 },
    { risk_level: "Critical", customers: 2, mrr: 0 },
  ],
  top_churn_drivers: [
    { risk_level: "Low product adoption", customers: 4, mrr: 0 },
    { risk_level: "Payment failure", customers: 3, mrr: 0 },
    { risk_level: "Escalated support experience", customers: 2, mrr: 0 },
  ],
  recommended_actions: [
    "Prioritize Critical and At Risk accounts with failed payments or low active days.",
    "Advance expansion opportunities only when health score and adoption are strong.",
    "Use support escalation and CSM touch history as context for renewal planning.",
  ],
};

export const staticChurnRisk: ChurnRiskAccount[] = [
  {
    account_id: "acct_007",
    account_name: "Olive Branch Cafe",
    segment: "SMB",
    region: "Europe",
    plan_tier: "Starter",
    mrr: 0,
    health_score: 3.5,
    risk_level: "Critical",
    main_risk_driver: "Low product adoption",
    recommended_action: "Schedule CSM risk review and adoption plan",
    priority_rank: 1,
  },
  {
    account_id: "acct_006",
    account_name: "Metro Noodle House",
    segment: "Mid-Market",
    region: "Asia Pacific",
    plan_tier: "Pro",
    mrr: 3900,
    health_score: 36.4,
    risk_level: "Critical",
    main_risk_driver: "Payment failure",
    recommended_action: "Schedule CSM risk review and adoption plan",
    priority_rank: 2,
  },
  {
    account_id: "acct_003",
    account_name: "Green Fork Kitchen",
    segment: "SMB",
    region: "Europe",
    plan_tier: "Starter",
    mrr: 1200,
    health_score: 49.8,
    risk_level: "At Risk",
    main_risk_driver: "Payment failure",
    recommended_action: "Schedule CSM risk review and adoption plan",
    priority_rank: 3,
  },
];

export const staticRetention: RetentionCohortRow[] = [
  { cohort_month: "2023-06-01", month_number: 0, cohort_size: 1, retained_customers: 1, retention_rate: 1 },
  { cohort_month: "2023-06-01", month_number: 1, cohort_size: 1, retained_customers: 1, retention_rate: 1 },
  { cohort_month: "2023-07-01", month_number: 0, cohort_size: 1, retained_customers: 1, retention_rate: 1 },
  { cohort_month: "2023-11-01", month_number: 4, cohort_size: 1, retained_customers: 0, retention_rate: 0 },
  { cohort_month: "2024-02-01", month_number: 5, cohort_size: 1, retained_customers: 0, retention_rate: 0 },
  { cohort_month: "2024-04-01", month_number: 1, cohort_size: 1, retained_customers: 1, retention_rate: 1 },
];

export const staticLtv: LtvSegment[] = [
  { segment: "Enterprise", plan_tier: "Enterprise", customers: 3, average_mrr: 16300, assumed_monthly_churn_rate: 0.02, estimated_ltv: 611250 },
  { segment: "Mid-Market", plan_tier: "Pro", customers: 5, average_mrr: 4300, assumed_monthly_churn_rate: 0.2, estimated_ltv: 16125 },
  { segment: "SMB", plan_tier: "Starter", customers: 4, average_mrr: 1050, assumed_monthly_churn_rate: 0.25, estimated_ltv: 3150 },
];

export const staticSegments: SegmentPerformance[] = [
  { segment: "Enterprise", region: "North America", plan_tier: "Enterprise", customers: 3, current_mrr: 48900, avg_health_score: 84.2, avg_active_days: 26.3, avg_support_calls: 1.7, churn_rate: 0, weighted_pipeline_amount: 366300 },
  { segment: "Mid-Market", region: "North America", plan_tier: "Pro", customers: 3, current_mrr: 8900, avg_health_score: 70.2, avg_active_days: 19.8, avg_support_calls: 1.3, churn_rate: 0.33, weighted_pipeline_amount: 31420 },
  { segment: "SMB", region: "Europe", plan_tier: "Starter", customers: 3, current_mrr: 1200, avg_health_score: 37.9, avg_active_days: 8.2, avg_support_calls: 1, churn_rate: 0.33, weighted_pipeline_amount: 4200 },
];

export const staticBiExports: BiExport[] = [
  { name: "customer_360", path: "data/bi_exports/customer_360.csv", rows: 12, size_bytes: 3100 },
  { name: "churn_risk_accounts", path: "data/bi_exports/churn_risk_accounts.csv", rows: 12, size_bytes: 1700 },
  { name: "retention_cohorts", path: "data/bi_exports/retention_cohorts.csv", rows: 72, size_bytes: 2500 },
  { name: "ltv_by_segment", path: "data/bi_exports/ltv_by_segment.csv", rows: 3, size_bytes: 420 },
];
