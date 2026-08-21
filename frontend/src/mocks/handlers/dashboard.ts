import { http, HttpResponse } from "msw";

import { staticManifest } from "../../lib/api/static-fixtures";

const API_BASE = "http://localhost:8000";

export const dashboardHandlers = [
  http.get(`${API_BASE}/api/settings/manifest`, () =>
    HttpResponse.json({ data: staticManifest }),
  ),
  http.post(`${API_BASE}/api/settings/refresh`, () =>
    HttpResponse.json({ data: staticManifest }),
  ),
];
