import {
  staticBiExports,
  staticChurnRisk,
  staticCustomerOverview,
  staticLtv,
  staticRetention,
  staticSegments,
} from "../../features/customer-analytics/static-data";
import { getStaticAgents, getStaticCalls, getStaticMetrics, staticManifest } from "../../lib/api/static-fixtures";

const rawRedesignCalls = getStaticCalls({ page: 1, per_page: 200 }).data;
const rawRedesignMetrics = getStaticMetrics();

export const redesignCalls = rawRedesignCalls.map((call) => ({
  ...call,
  id: call.id ?? "UNKNOWN_CALL",
  agent_id: call.agent_id ?? "unknown-agent",
  agent_name: call.agent_name ?? "Unassigned agent",
  customer_region: call.customer_region ?? "Unknown region",
  issue_type: call.issue_type ?? "Unclassified issue",
  duration_seconds: call.duration_seconds ?? 0,
  resolution_status: call.resolution_status ?? "unknown",
  started_at: call.started_at ?? "",
  skill_rating: call.skill_rating ?? 0,
}));

export const redesignAgents = getStaticAgents().map((agent) => ({
  ...agent,
  agent_id: agent.agent_id ?? "unknown-agent",
  name: agent.name ?? "Unassigned agent",
  region: agent.region ?? "Unknown region",
  skill_rating: agent.skill_rating ?? 0,
  avg_rating: agent.avg_rating ?? 0,
  resolved_rate: agent.resolved_rate ?? 0,
  avg_resolution_seconds: agent.avg_resolution_seconds ?? 0,
  escalated_calls: agent.escalated_calls ?? 0,
  total_calls: agent.total_calls ?? 0,
}));

export const redesignMetrics = {
  ...rawRedesignMetrics,
  kpis: rawRedesignMetrics.kpis.map((kpi) => ({
    ...kpi,
    label: kpi.label ?? "Metric",
    value: kpi.value ?? "0",
    delta: kpi.delta ?? 0,
  })),
  issue_breakdown: rawRedesignMetrics.issue_breakdown.map((row) => ({
    ...row,
    label: row.label ?? "Unclassified issue",
    value: row.value ?? 0,
  })),
  region_breakdown: rawRedesignMetrics.region_breakdown.map((row) => ({
    ...row,
    label: row.label ?? "Unknown region",
    value: row.value ?? 0,
  })),
};

export const redesignCallDetail = redesignCalls.find((call) => call.id === "CALL_0001") ?? redesignCalls[0];
export const redesignManifest = {
  ...staticManifest,
  dataset: staticManifest.dataset ?? "support-analytics",
  path: staticManifest.path ?? "",
  source: staticManifest.source ?? "deterministic frontend fixture",
  hash: staticManifest.hash ?? "unknown",
  row_count: staticManifest.row_count ?? 0,
  generated_at: staticManifest.generated_at ?? "2026-06-03T08:00:00.000Z",
  notes: staticManifest.notes ?? "",
  size_bytes: staticManifest.size_bytes ?? 0,
};

export const redesignCustomer = {
  overview: {
    ...staticCustomerOverview,
    health_distribution: staticCustomerOverview.health_distribution.map((row) => ({
      ...row,
      risk_level: row.risk_level ?? "Unknown",
      customers: row.customers ?? 0,
      mrr: row.mrr ?? 0,
    })),
    recommended_actions: staticCustomerOverview.recommended_actions.filter((value): value is string => Boolean(value)),
  },
  churn: staticChurnRisk.map((row) => ({
    ...row,
    account_id: row.account_id ?? "unknown-account",
    account_name: row.account_name ?? "Unnamed account",
    segment: row.segment ?? "Unsegmented",
    region: row.region ?? "Unknown region",
    plan_tier: row.plan_tier ?? "Unknown plan",
    mrr: row.mrr ?? 0,
    health_score: row.health_score ?? 0,
    risk_level: row.risk_level ?? "Watch",
    main_risk_driver: row.main_risk_driver ?? "No dominant risk driver",
    recommended_action: row.recommended_action ?? "Review account context",
    customer_success_manager: row.customer_success_manager ?? "Unassigned CSM",
    priority_rank: row.priority_rank ?? 999,
  })),
  retention: staticRetention.map((row) => ({
    ...row,
    cohort_month: row.cohort_month ?? "Unknown cohort",
    month_number: row.month_number ?? 0,
    cohort_size: row.cohort_size ?? 0,
    retained_customers: row.retained_customers ?? 0,
    retention_rate: row.retention_rate ?? 0,
  })),
  ltv: staticLtv.map((row) => ({
    ...row,
    segment: row.segment ?? "Unsegmented",
    plan_tier: row.plan_tier ?? "Unknown plan",
    customers: row.customers ?? 0,
    average_mrr: row.average_mrr ?? 0,
    assumed_monthly_churn_rate: row.assumed_monthly_churn_rate ?? 0,
    estimated_ltv: row.estimated_ltv ?? 0,
  })),
  segments: staticSegments.map((row) => ({
    ...row,
    segment: row.segment ?? "Unsegmented",
    region: row.region ?? "Unknown region",
    plan_tier: row.plan_tier ?? "Unknown plan",
    customers: row.customers ?? 0,
    current_mrr: row.current_mrr ?? 0,
    avg_health_score: row.avg_health_score ?? 0,
    avg_active_days: row.avg_active_days ?? 0,
    avg_support_calls: row.avg_support_calls ?? 0,
    churn_rate: row.churn_rate ?? 0,
    weighted_pipeline_amount: row.weighted_pipeline_amount ?? 0,
  })),
  exports: staticBiExports.map((row) => ({
    ...row,
    name: row.name ?? "unnamed_export",
    path: row.path ?? "",
    rows: row.rows ?? 0,
    size_bytes: row.size_bytes ?? 0,
  })),
};

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 100_000 ? "compact" : "standard",
  }).format(value);
}

export function titleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
