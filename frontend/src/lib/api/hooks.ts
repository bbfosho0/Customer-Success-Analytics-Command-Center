import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../constants/queryKeys";
import { isRefreshManifestEnabled, isStaticDemoMode } from "../utils/env";
import { apiFetch } from "./client";
import {
  getStaticAgents,
  getStaticCall,
  getStaticCalls,
  getStaticMetrics,
  staticManifest,
} from "./static-fixtures";
import type {
  AgentStats,
  AgentsQuery,
  ApiValidationError,
  CallDetailResponse,
  CallsQuery,
  CallsResponse,
  ManifestInfo,
  ManifestResponse,
  MetricsQuery,
  MetricsResponse,
  RefreshManifestResponse,
} from "./types";

export type { AgentsQuery, CallsQuery, MetricsQuery } from "./types";

function staticAsync<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

export function useCalls(filters: CallsQuery = {}) {
  const staticMode = isStaticDemoMode();
  return useQuery<CallsResponse>({
    queryKey: queryKeys.calls.list(filters),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      staticMode
        ? staticAsync(getStaticCalls(filters))
        : apiFetch<CallsResponse, ApiValidationError>("/api/calls", { query: filters, signal }),
    staleTime: staticMode ? Infinity : 30_000,
  });
}

export function useCall(callId: string | undefined) {
  const staticMode = isStaticDemoMode();
  return useQuery<CallDetailResponse>({
    queryKey: queryKeys.calls.detail(callId ?? ""),
    enabled: Boolean(callId),
    queryFn: ({ signal }: { signal: AbortSignal }) => {
      if (!callId) throw new Error("A call ID is required");
      if (staticMode) {
        const record = getStaticCall(callId);
        if (!record) throw new Error(`Call not found: ${callId}`);
        return staticAsync(record);
      }
      return apiFetch<CallDetailResponse, ApiValidationError>(`/api/calls/${encodeURIComponent(callId)}`, { signal });
    },
    staleTime: staticMode ? Infinity : 30_000,
  });
}

export function useMetrics(filters: MetricsQuery = {}) {
  const staticMode = isStaticDemoMode();
  return useQuery<MetricsResponse>({
    queryKey: queryKeys.metrics.summary(filters),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      staticMode
        ? staticAsync(getStaticMetrics())
        : apiFetch<MetricsResponse, ApiValidationError>("/api/metrics", { query: filters, signal }),
    staleTime: staticMode ? Infinity : 30_000,
  });
}

export function useAgents(filters: AgentsQuery = {}) {
  const staticMode = isStaticDemoMode();
  return useQuery<AgentStats[]>({
    queryKey: queryKeys.agents.list(filters),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      staticMode
        ? staticAsync(getStaticAgents())
        : apiFetch<AgentStats[], ApiValidationError>("/api/agents", { query: filters, signal }),
    staleTime: staticMode ? Infinity : 60_000,
  });
}

export function useManifest() {
  const staticMode = isStaticDemoMode();
  return useQuery<ManifestInfo>({
    queryKey: queryKeys.settings.manifest(),
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      if (staticMode) return staticManifest;
      const response = await apiFetch<ManifestResponse, ApiValidationError>("/api/settings/manifest", { signal });
      return response.data;
    },
    staleTime: staticMode ? Infinity : 60_000,
  });
}

export function useRefreshManifest() {
  const queryClient = useQueryClient();
  const enabled = isRefreshManifestEnabled();

  return useMutation<ManifestInfo, Error>({
    mutationFn: async () => {
      if (!enabled) {
        throw new Error("Manifest refresh is disabled in this frontend environment.");
      }
      const response = await apiFetch<RefreshManifestResponse, ApiValidationError>("/api/settings/refresh", { method: "POST" });
      return response.data as ManifestInfo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.manifest() });
    },
  });
}

export const useRefreshData = useRefreshManifest;
