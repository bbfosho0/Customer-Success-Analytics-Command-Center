import { delay, http, HttpResponse } from "msw";

import {
  staticBiExports,
  staticChurnRisk,
  staticCustomerOverview,
  staticLtv,
  staticRetention,
  staticSegments,
} from "../../features/customer-analytics/static-data";
import { getStaticAgents, getStaticCalls, getStaticMetrics } from "../../lib/api/static-fixtures";

const API_BASE = "http://localhost:8000";

function loadingGet(path: string) {
  return http.get(`${API_BASE}${path}`, async () => {
    await delay("infinite");
    return HttpResponse.json({ detail: "unreachable" });
  });
}

function errorGet(path: string, status = 500) {
  return http.get(`${API_BASE}${path}`, () =>
    HttpResponse.json({ detail: "Storybook forced API failure" }, { status }),
  );
}

function emptyCallsResponse() {
  const response = getStaticCalls({ page: 1, per_page: 200 });
  return {
    ...response,
    data: [],
    meta: { ...response.meta, total: 0 },
    links: { ...response.links, next: null },
  };
}

function emptyMetricsResponse() {
  const response = getStaticMetrics();
  return {
    ...response,
    kpis: response.kpis.map((kpi) => ({ ...kpi, value: "0", delta: 0, trend: "flat" as const })),
    issue_breakdown: [],
    region_breakdown: [],
  };
}

const customerPaths = [
  "/api/customer-analytics/overview",
  "/api/customer-analytics/churn-risk",
  "/api/customer-analytics/retention-cohorts",
  "/api/customer-analytics/ltv",
  "/api/customer-analytics/segments",
  "/api/customer-analytics/health",
  "/api/customer-analytics/expansion-opportunities",
  "/api/customer-analytics/support-impact",
  "/api/customer-analytics/bi-exports",
];

const emptyCustomerOverview = {
  ...staticCustomerOverview,
  kpis: staticCustomerOverview.kpis.map((kpi) => ({ ...kpi, value: "0", delta: null, trend: "flat" as const })),
  health_distribution: [],
  top_churn_drivers: [],
  recommended_actions: [],
};

const highRiskOverview = {
  ...staticCustomerOverview,
  kpis: staticCustomerOverview.kpis.map((kpi) => {
    if (kpi.label === "Churn rate") return { ...kpi, value: "75.0%" };
    if (kpi.label === "At-risk accounts") return { ...kpi, value: "9" };
    if (kpi.label === "At-risk MRR") return { ...kpi, value: "$54,900" };
    return kpi;
  }),
  health_distribution: [
    { risk_level: "Healthy", customers: 1, mrr: 12000 },
    { risk_level: "Watch", customers: 2, mrr: 1500 },
    { risk_level: "At Risk", customers: 4, mrr: 18500 },
    { risk_level: "Critical", customers: 5, mrr: 36400 },
  ],
};

export const visualStates = {
  dashboard: {
    loading: [loadingGet("/api/calls"), loadingGet("/api/metrics"), loadingGet("/api/agents")],
    empty: [
      http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(emptyCallsResponse())),
      http.get(`${API_BASE}/api/metrics`, () => HttpResponse.json(emptyMetricsResponse())),
      http.get(`${API_BASE}/api/agents`, () => HttpResponse.json([])),
    ],
    error: [errorGet("/api/calls"), errorGet("/api/metrics"), errorGet("/api/agents")],
  },
  calls: {
    loading: [loadingGet("/api/calls")],
    empty: [http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(emptyCallsResponse()))],
    error: [errorGet("/api/calls")],
  },
  callDetail: {
    loading: [loadingGet("/api/calls/:callId")],
    notFound: [errorGet("/api/calls/:callId", 404)],
  },
  agents: {
    loading: [loadingGet("/api/agents")],
    empty: [http.get(`${API_BASE}/api/agents`, () => HttpResponse.json([]))],
    error: [errorGet("/api/agents")],
  },
  metrics: {
    loading: [loadingGet("/api/calls")],
    empty: [http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(emptyCallsResponse()))],
    error: [errorGet("/api/calls")],
  },
  settings: {
    loading: [loadingGet("/api/settings/manifest")],
    error: [errorGet("/api/settings/manifest")],
  },
  customerAnalytics: {
    loading: customerPaths.map(loadingGet),
    error: customerPaths.map((path) => errorGet(path)),
    empty: [
      http.get(`${API_BASE}/api/customer-analytics/overview`, () => HttpResponse.json(emptyCustomerOverview)),
      http.get(`${API_BASE}/api/customer-analytics/churn-risk`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/retention-cohorts`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/ltv`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/segments`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/health`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/expansion-opportunities`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/support-impact`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/bi-exports`, () => HttpResponse.json([])),
    ],
    highRisk: [
      http.get(`${API_BASE}/api/customer-analytics/overview`, () => HttpResponse.json(highRiskOverview)),
      http.get(`${API_BASE}/api/customer-analytics/churn-risk`, () => HttpResponse.json(staticChurnRisk)),
      http.get(`${API_BASE}/api/customer-analytics/retention-cohorts`, () => HttpResponse.json(staticRetention)),
      http.get(`${API_BASE}/api/customer-analytics/ltv`, () => HttpResponse.json(staticLtv)),
      http.get(`${API_BASE}/api/customer-analytics/segments`, () => HttpResponse.json(staticSegments)),
      http.get(`${API_BASE}/api/customer-analytics/health`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/expansion-opportunities`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/support-impact`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/bi-exports`, () => HttpResponse.json(staticBiExports)),
    ],
  },
  reference: {
    agents: getStaticAgents(),
  },
};
