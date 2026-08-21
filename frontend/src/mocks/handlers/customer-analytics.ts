import { http, HttpResponse } from "msw";

import {
  staticBiExports,
  staticChurnRisk,
  staticCustomerHealth,
  staticCustomerOverview,
  staticExpansionOpportunities,
  staticLtv,
  staticRetention,
  staticSegments,
  staticSupportImpact,
} from "../../features/customer-analytics/static-data";

const API_BASE = "http://localhost:8000";
const CUSTOMER_ANALYTICS = `${API_BASE}/api/customer-analytics`;

export const customerAnalyticsHandlers = [
  http.get(`${CUSTOMER_ANALYTICS}/overview`, () => HttpResponse.json(staticCustomerOverview)),
  http.get(`${CUSTOMER_ANALYTICS}/churn-risk`, ({ request }) => {
    const search = new URL(request.url).searchParams;
    const minimumMrr = search.get("minimum_mrr");
    const rows = staticChurnRisk.filter((row) => {
      if (search.get("risk_level") && row.risk_level !== search.get("risk_level")) return false;
      if (search.get("segment") && row.segment !== search.get("segment")) return false;
      if (search.get("region") && row.region !== search.get("region")) return false;
      if (search.get("plan_tier") && row.plan_tier !== search.get("plan_tier")) return false;
      if (minimumMrr && row.mrr < Number(minimumMrr)) return false;
      return true;
    });
    return HttpResponse.json(rows);
  }),
  http.get(`${CUSTOMER_ANALYTICS}/retention-cohorts`, () => HttpResponse.json(staticRetention)),
  http.get(`${CUSTOMER_ANALYTICS}/ltv`, () => HttpResponse.json(staticLtv)),
  http.get(`${CUSTOMER_ANALYTICS}/segments`, () => HttpResponse.json(staticSegments)),
  http.get(`${CUSTOMER_ANALYTICS}/health`, () => HttpResponse.json(staticCustomerHealth)),
  http.get(`${CUSTOMER_ANALYTICS}/expansion-opportunities`, () => HttpResponse.json(staticExpansionOpportunities)),
  http.get(`${CUSTOMER_ANALYTICS}/support-impact`, () => HttpResponse.json(staticSupportImpact)),
  http.get(`${CUSTOMER_ANALYTICS}/bi-exports`, () => HttpResponse.json(staticBiExports)),
];
