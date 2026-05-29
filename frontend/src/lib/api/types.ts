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
