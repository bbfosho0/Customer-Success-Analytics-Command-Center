import { http, HttpResponse } from "msw";

import { getStaticMetrics } from "../../lib/api/static-fixtures";

const API_BASE = "http://localhost:8000";

export const metricHandlers = [
  http.get(`${API_BASE}/api/metrics`, () => HttpResponse.json(getStaticMetrics())),
];
