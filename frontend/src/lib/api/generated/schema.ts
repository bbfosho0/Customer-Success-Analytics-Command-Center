export type CallRecord = {
  id: string;
  agent_id: string;
  agent_name?: string | null;
  customer_region: string;
  issue_type: string;
  duration_seconds: number;
  resolution_status: string;
  started_at?: string | null;
  skill_rating?: number | null;
};

export type CallsResponse = {
  data: CallRecord[];
  meta: {
    page: number;
    per_page: number;
    total: number;
  };
  links: {
    next?: string | null;
  };
};

export type AgentStats = {
  agent_id: string;
  name: string;
  region: string;
  skill_rating: number;
  avg_rating: number;
  total_calls: number;
  avg_resolution_seconds: number;
  resolved_rate: number;
  escalated_calls: number;
};

export type KpiMetric = {
  label: string;
  value: string;
  delta: number;
  trend: string;
};

export type BreakdownMetric = {
  label: string;
  value: number;
};

export type MetricsResponse = {
  kpis: KpiMetric[];
  issue_breakdown: BreakdownMetric[];
  region_breakdown: BreakdownMetric[];
};

export type ManifestInfo = {
  dataset: string;
  path: string;
  source: string;
  hash: string;
  row_count: number;
  generated_at: string;
  notes: string;
  size_bytes: number;
};
