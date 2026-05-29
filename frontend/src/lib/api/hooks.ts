import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "./client";
import type { AgentStats, CallsResponse, ManifestInfo, MetricsResponse } from "./generated/schema";

export type CallsQuery = {
  page?: number;
  perPage?: number;
  region?: string;
  issueType?: string;
  status?: string;
  agentId?: string;
  q?: string;
};

function buildQuery(params: CallsQuery = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.perPage) search.set("per_page", String(params.perPage));
  if (params.region) search.set("region", params.region);
  if (params.issueType) search.set("issue_type", params.issueType);
  if (params.status) search.set("status", params.status);
  if (params.agentId) search.set("agent_id", params.agentId);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function useCalls(params: CallsQuery = {}) {
  return useQuery({
    queryKey: ["calls", params],
    queryFn: () => apiFetch<CallsResponse>(`/api/calls${buildQuery(params)}`),
    staleTime: 30_000,
  });
}

export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: () => apiFetch<MetricsResponse>("/api/metrics"),
    staleTime: 30_000,
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => apiFetch<AgentStats[]>("/api/agents"),
    staleTime: 60_000,
  });
}

export function useManifest() {
  return useQuery({
    queryKey: ["settings", "manifest"],
    queryFn: async () => {
      const response = await apiFetch<{ data: ManifestInfo }>("/api/settings/manifest");
      return response.data;
    },
    staleTime: 60_000,
  });
}

export function useRefreshData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ data: ManifestInfo }>("/api/settings/refresh", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["settings", "manifest"] });
    },
  });
}
