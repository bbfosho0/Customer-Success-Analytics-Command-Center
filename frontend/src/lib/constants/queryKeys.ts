import type { AgentsQuery, CallsQuery, ChurnRiskQuery, MetricsQuery } from "../api/types";

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
  customerAnalytics: {
    all: ["customer-analytics"] as const,
    overview: () => [...queryKeys.customerAnalytics.all, "overview"] as const,
    churnRisk: (filters?: ChurnRiskQuery) => [...queryKeys.customerAnalytics.all, "churn-risk", filters ?? {}] as const,
    retention: () => [...queryKeys.customerAnalytics.all, "retention"] as const,
    ltv: () => [...queryKeys.customerAnalytics.all, "ltv"] as const,
    segments: () => [...queryKeys.customerAnalytics.all, "segments"] as const,
    health: () => [...queryKeys.customerAnalytics.all, "health"] as const,
    expansion: () => [...queryKeys.customerAnalytics.all, "expansion"] as const,
    supportImpact: () => [...queryKeys.customerAnalytics.all, "support-impact"] as const,
    biExports: () => [...queryKeys.customerAnalytics.all, "bi-exports"] as const,
    account: (accountId: string) => [...queryKeys.customerAnalytics.all, "account", accountId] as const,
  },
};
