import { delay, http, HttpResponse } from "msw";

import {
  staticBiExports,
  staticChurnRisk,
  staticCustomerOverview,
  staticLtv,
  staticRetention,
  staticSegments,
} from "../../features/customer-analytics/static-data";
import { getStaticAgents, getStaticCall, getStaticCalls, getStaticMetrics } from "../../lib/api/static-fixtures";

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

const fullCallsResponse = getStaticCalls({ page: 1, per_page: 200 });
const allCalls = fullCallsResponse.data;

function callsResponse(rows: typeof allCalls) {
  return {
    ...fullCallsResponse,
    data: rows,
    meta: { ...fullCallsResponse.meta, total: rows.length },
    links: { ...fullCallsResponse.links, next: null },
  };
}

function emptyCallsResponse() {
  return callsResponse([]);
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

const sparseCalls = allCalls.slice(0, 2);
const escalatedCalls = allCalls.filter((call) => call.resolution_status.toLowerCase() === "escalated");
const dashboardHighRiskCalls = (escalatedCalls.length ? escalatedCalls : allCalls).slice(0, 12);
const longContentCalls = allCalls.slice(0, 8).map((call, index) =>
  index === 0
    ? {
        ...call,
        agent_name: "Alexandra Montgomery-Worthington, Enterprise Escalation Specialist",
        customer_region: "North America — Enterprise Strategic Accounts and Regulated Industries",
        issue_type: "Multi-region identity synchronization failure affecting mission-critical production workloads",
      }
    : call,
);

const sparseMetrics = {
  ...getStaticMetrics(),
  issue_breakdown: getStaticMetrics().issue_breakdown.slice(0, 1),
  region_breakdown: getStaticMetrics().region_breakdown.slice(0, 1),
};

const highRiskMetrics = {
  ...getStaticMetrics(),
  kpis: getStaticMetrics().kpis.map((kpi) => {
    if (kpi.label === "Resolution rate") return { ...kpi, value: "41.2%", delta: -38.4 };
    if (kpi.label === "Escalations") return { ...kpi, value: "37", delta: 128.7 };
    if (kpi.label === "Avg handle time") return { ...kpi, value: "48.7m", delta: 96.2 };
    return kpi;
  }),
};

const highRiskAgents = getStaticAgents().map((agent, index) => ({
  ...agent,
  avg_rating: Number((2.1 + (index % 3) * 0.2).toFixed(1)),
  resolved_rate: 32 + (index % 4) * 4,
  avg_resolution_seconds: 2800 + index * 170,
  escalated_calls: Math.max(agent.escalated_calls, Math.round(agent.total_calls * 0.45)),
}));

const mixedPerformanceAgents = getStaticAgents().map((agent, index) =>
  index % 2 === 0
    ? { ...agent, avg_rating: 4.9, resolved_rate: 97, avg_resolution_seconds: 280, escalated_calls: 0 }
    : {
        ...agent,
        avg_rating: 2.2,
        resolved_rate: 38,
        avg_resolution_seconds: 3200,
        escalated_calls: Math.max(agent.escalated_calls, Math.round(agent.total_calls * 0.5)),
      },
);

const zeroHeavyCalls = allCalls.slice(0, 18).map((call, index) => ({
  ...call,
  duration_seconds: index % 3 === 0 ? 0 : call.duration_seconds,
  skill_rating: index % 4 === 0 ? 0 : call.skill_rating,
}));

const extremeNumericCalls = allCalls.slice(0, 18).map((call, index) => ({
  ...call,
  duration_seconds: index === 0 ? 9_876_543 : call.duration_seconds * 125,
  skill_rating: index === 0 ? 999_999.99 : call.skill_rating,
}));

const baseCallDetail = getStaticCall("CALL_0001");
const longContentCallDetail = baseCallDetail
  ? {
      ...baseCallDetail,
      data: {
        ...baseCallDetail.data,
        agent_name: "Alexandra Montgomery-Worthington, Enterprise Escalation Specialist",
        customer_region: "North America — Enterprise Strategic Accounts and Regulated Industries",
        issue_type:
          "Multi-region identity synchronization failure affecting mission-critical production workloads with unusually verbose escalation context",
      },
    }
  : null;

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

const noRiskOverview = {
  ...staticCustomerOverview,
  kpis: staticCustomerOverview.kpis.map((kpi) => {
    if (kpi.label === "Churn rate") return { ...kpi, value: "0.0%", delta: 0, trend: "flat" as const };
    if (kpi.label === "At-risk accounts") return { ...kpi, value: "0", delta: 0, trend: "flat" as const };
    if (kpi.label === "At-risk MRR") return { ...kpi, value: "$0", delta: 0, trend: "flat" as const };
    return kpi;
  }),
  health_distribution: [{ risk_level: "Healthy", customers: 12, mrr: 146000 }],
  top_churn_drivers: [],
};

const sparseCustomerOverview = {
  ...staticCustomerOverview,
  kpis: staticCustomerOverview.kpis.slice(0, 2),
  health_distribution: staticCustomerOverview.health_distribution.slice(0, 1),
  top_churn_drivers: staticCustomerOverview.top_churn_drivers.slice(0, 1),
  recommended_actions: staticCustomerOverview.recommended_actions.slice(0, 1),
};

export const visualStates = {
  dashboard: {
    loading: [loadingGet("/api/calls"), loadingGet("/api/metrics"), loadingGet("/api/agents")],
    sparse: [
      http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(callsResponse(sparseCalls))),
      http.get(`${API_BASE}/api/metrics`, () => HttpResponse.json(sparseMetrics)),
      http.get(`${API_BASE}/api/agents`, () => HttpResponse.json(getStaticAgents().slice(0, 1))),
    ],
    highRisk: [
      http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(callsResponse(dashboardHighRiskCalls))),
      http.get(`${API_BASE}/api/metrics`, () => HttpResponse.json(highRiskMetrics)),
      http.get(`${API_BASE}/api/agents`, () => HttpResponse.json(highRiskAgents)),
    ],
    empty: [
      http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(emptyCallsResponse())),
      http.get(`${API_BASE}/api/metrics`, () => HttpResponse.json(emptyMetricsResponse())),
      http.get(`${API_BASE}/api/agents`, () => HttpResponse.json([])),
    ],
    error: [errorGet("/api/calls"), errorGet("/api/metrics"), errorGet("/api/agents")],
  },
  calls: {
    loading: [loadingGet("/api/calls")],
    longContent: [http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(callsResponse(longContentCalls)))],
    empty: [http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(emptyCallsResponse()))],
    error: [errorGet("/api/calls")],
  },
  callDetail: {
    loading: [loadingGet("/api/calls/:callId")],
    longContent: [
      http.get(`${API_BASE}/api/calls/:callId`, () =>
        longContentCallDetail
          ? HttpResponse.json(longContentCallDetail)
          : HttpResponse.json({ detail: "Call not found" }, { status: 404 }),
      ),
    ],
    notFound: [errorGet("/api/calls/:callId", 404)],
    error: [errorGet("/api/calls/:callId")],
  },
  agents: {
    loading: [loadingGet("/api/agents")],
    mixedPerformance: [http.get(`${API_BASE}/api/agents`, () => HttpResponse.json(mixedPerformanceAgents))],
    empty: [http.get(`${API_BASE}/api/agents`, () => HttpResponse.json([]))],
    error: [errorGet("/api/agents")],
  },
  metrics: {
    loading: [loadingGet("/api/calls")],
    sparse: [http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(callsResponse(sparseCalls)))],
    zeroHeavy: [http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(callsResponse(zeroHeavyCalls)))],
    extremeNumeric: [http.get(`${API_BASE}/api/calls`, () => HttpResponse.json(callsResponse(extremeNumericCalls)))],
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
    sparse: [
      http.get(`${API_BASE}/api/customer-analytics/overview`, () => HttpResponse.json(sparseCustomerOverview)),
      http.get(`${API_BASE}/api/customer-analytics/churn-risk`, () => HttpResponse.json(staticChurnRisk.slice(0, 1))),
      http.get(`${API_BASE}/api/customer-analytics/retention-cohorts`, () => HttpResponse.json(staticRetention.slice(0, 1))),
      http.get(`${API_BASE}/api/customer-analytics/ltv`, () => HttpResponse.json(staticLtv.slice(0, 1))),
      http.get(`${API_BASE}/api/customer-analytics/segments`, () => HttpResponse.json(staticSegments.slice(0, 1))),
      http.get(`${API_BASE}/api/customer-analytics/health`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/expansion-opportunities`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/support-impact`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/customer-analytics/bi-exports`, () => HttpResponse.json(staticBiExports.slice(0, 1))),
    ],
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
    noRisk: [
      http.get(`${API_BASE}/api/customer-analytics/overview`, () => HttpResponse.json(noRiskOverview)),
      http.get(`${API_BASE}/api/customer-analytics/churn-risk`, () => HttpResponse.json([])),
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
