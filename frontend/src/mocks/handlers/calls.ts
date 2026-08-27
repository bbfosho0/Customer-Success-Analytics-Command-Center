import { http, HttpResponse } from "msw";

import { getStaticCall, getStaticCalls } from "../../lib/api/static-fixtures";
import type { CallsQuery } from "../../lib/api/types";

const API_BASE = "http://localhost:8000";

function optional(search: URLSearchParams, key: string) {
  return search.get(key) || undefined;
}

function status(search: URLSearchParams): CallsQuery["status"] {
  const value = search.get("status");
  return value === "resolved" || value === "pending" || value === "escalated" ? value : undefined;
}

export const callHandlers = [
  http.get(`${API_BASE}/api/calls`, ({ request }) => {
    const search = new URL(request.url).searchParams;
    const query: CallsQuery = {
      page: Number(search.get("page") ?? 1),
      per_page: Number(search.get("per_page") ?? 50),
      region: optional(search, "region"),
      issue_type: optional(search, "issue_type"),
      status: status(search),
      agent_id: optional(search, "agent_id"),
      q: optional(search, "q"),
    };

    return HttpResponse.json(getStaticCalls(query));
  }),
  http.get(`${API_BASE}/api/calls/:callId`, ({ params }) => {
    const result = getStaticCall(String(params.callId));
    if (!result) {
      return HttpResponse.json({ detail: "Call not found" }, { status: 404 });
    }
    return HttpResponse.json(result);
  }),
];
