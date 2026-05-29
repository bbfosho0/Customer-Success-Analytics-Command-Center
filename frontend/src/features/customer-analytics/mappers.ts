import type { ChurnRiskAccount, CustomerAnalyticsOverview, LtvSegment, RetentionCohortRow, SegmentPerformance } from "./types";

export function overviewKpis(data: CustomerAnalyticsOverview | undefined) {
  return data?.kpis ?? [];
}

export function atRiskAccounts(rows: ChurnRiskAccount[] | undefined) {
  return [...(rows ?? [])].sort((a, b) => a.priority_rank - b.priority_rank);
}

export function retentionMonths(rows: RetentionCohortRow[] | undefined) {
  return [...new Set((rows ?? []).map((row) => row.month_number))].sort((a, b) => a - b);
}

export function retentionCohorts(rows: RetentionCohortRow[] | undefined) {
  return [...new Set((rows ?? []).map((row) => row.cohort_month))].sort();
}

export function ltvLeaders(rows: LtvSegment[] | undefined) {
  return [...(rows ?? [])].sort((a, b) => b.estimated_ltv - a.estimated_ltv);
}

export function segmentLeaders(rows: SegmentPerformance[] | undefined) {
  return [...(rows ?? [])].sort((a, b) => b.current_mrr - a.current_mrr);
}
