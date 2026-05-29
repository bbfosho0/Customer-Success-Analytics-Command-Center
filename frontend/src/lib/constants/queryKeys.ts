import type { AgentsQuery, CallsQuery, MetricsQuery } from "../api/types";

export const queryKeys = {
  calls: {
    all: ["calls"] as const,
    list: (filters?: CallsQuery) => [...queryKeys.calls.all, filters ?? {}] as const,
    detail: (callId: string) => [...queryKeys.calls.all, "detail", callId] as const,
  },
  agents: {
    all: ["agents"] as const,
    list: (filters?: AgentsQuery) => [...queryKeys.agents.all, filters ?? {}] as const,
  },
  metrics: {
    all: ["metrics"] as const,
    summary: (filters?: MetricsQuery) => [...queryKeys.metrics.all, filters ?? {}] as const,
  },
  settings: {
    all: ["settings"] as const,
    manifest: () => [...queryKeys.settings.all, "manifest"] as const,
  },
};
