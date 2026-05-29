import type { components, operations } from "./generated/schema";

export type CallRecord = components["schemas"]["CallRecord"];
export type CallsResponse = components["schemas"]["PaginatedCallsResponse"];
export type CallDetailResponse = operations["get_call_api_calls__call_id__get"]["responses"][200]["content"]["application/json"];
export type CallsQuery = NonNullable<operations["list_calls_api_calls_get"]["parameters"]["query"]>;
export type AgentStats = components["schemas"]["AgentStats"];
export type MetricsResponse = components["schemas"]["MetricsResponse"];
export type ManifestInfo = components["schemas"]["ManifestInfo"];
export type ManifestResponse = operations["get_manifest_api_settings_manifest_get"]["responses"][200]["content"]["application/json"];
export type RefreshManifestResponse = operations["refresh_data_api_settings_refresh_post"]["responses"][200]["content"]["application/json"];
export type ApiValidationError = components["schemas"]["HTTPValidationError"];
export type CustomerAnalyticsOverview = components["schemas"]["CustomerAnalyticsOverview"];
export type ChurnRiskAccount = components["schemas"]["ChurnRiskAccount"];
export type RetentionCohortRow = components["schemas"]["RetentionCohortRow"];
export type LtvSegment = components["schemas"]["LtvSegment"];
export type SegmentPerformance = components["schemas"]["SegmentPerformance"];
export type CustomerHealthScore = components["schemas"]["CustomerHealthScore"];
export type ExpansionOpportunity = components["schemas"]["ExpansionOpportunity"];
export type SupportImpactRow = components["schemas"]["SupportImpactRow"];
export type BiExport = components["schemas"]["BiExport"];
export type CustomerAccountDetail = components["schemas"]["CustomerAccountDetail"];

export type AgentsQuery = {
  sort?: "total_calls" | "avg_resolution_seconds" | "resolved_rate";
  direction?: "asc" | "desc";
};

export type MetricsQuery = {
  region?: string;
  issue_type?: string;
  from?: string;
  to?: string;
};

export type ChurnRiskQuery = NonNullable<operations["get_churn_risk_api_customer_analytics_churn_risk_get"]["parameters"]["query"]>;
