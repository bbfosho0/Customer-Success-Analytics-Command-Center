import { http, HttpResponse } from "msw";

import { getStaticAgents } from "../../lib/api/static-fixtures";
import type { AgentStats } from "../../lib/api/types";

const API_BASE = "http://localhost:8000";

function compare(a: AgentStats, b: AgentStats, field: "total_calls" | "avg_resolution_seconds" | "resolved_rate") {
  return Number(a[field]) - Number(b[field]);
}

export const agentHandlers = [
  http.get(`${API_BASE}/api/agents`, ({ request }) => {
    const search = new URL(request.url).searchParams;
    const sort = search.get("sort") as "total_calls" | "avg_resolution_seconds" | "resolved_rate" | null;
    const direction = search.get("direction") === "asc" ? "asc" : "desc";
    const rows = [...getStaticAgents()];

    if (sort) {
      rows.sort((a, b) => compare(a, b, sort) * (direction === "asc" ? 1 : -1));
    }

    return HttpResponse.json(rows);
  }),
];
