import { describe, expect, it } from "vitest";

import type { CallRecord, MetricsResponse } from "../../lib/api/types";
import { buildCallsQueryFromSelection, buildDashboardKpisFromMetrics, toUiCallRecord } from "../../lib/viz/transformers";

const call: CallRecord = {
  id: "CALL_0123",
  agent_id: "agent_001",
  agent_name: "Nova Carter",
  customer_region: "eu-west-1",
  issue_type: "Lambda timeout",
  duration_seconds: 600,
  resolution_status: "resolved",
  started_at: "2025-10-15T04:00:00.000Z",
  skill_rating: 4.5,
};

const metrics: MetricsResponse = {
  kpis: [
    { label: "Total interactions", value: "42", delta: 0, trend: "flat" },
    { label: "Avg handle time", value: "10m", delta: -2, trend: "down" },
  ],
  issue_breakdown: [{ label: "Lambda timeout", value: 20 }],
  region_breakdown: [{ label: "eu-west-1", value: 12 }],
};

describe("API DTO transformers", () => {
  it("maps canonical call DTOs to table-ready call records", () => {
    const result = toUiCallRecord(call);

    expect(result.id).toBe("CALL_0123");
    expect(result.caseId).toBe("CASE-CALL-0123");
    expect(result.agent).toBe("Nova Carter");
    expect(result.region).toBe("eu-west-1");
    expect(result.issue).toBe("Lambda timeout");
    expect(result.status).toBe("resolved");
    expect(result.durationSeconds).toBe(600);
  });

  it("keeps shared filters serializable for API query keys and request params", () => {
    const result = buildCallsQueryFromSelection({ window: "7d", region: "eu-west-1", intent: "Lambda timeout" }, 2, 25);

    expect(result).toEqual({ page: 2, per_page: 25, region: "eu-west-1", issue_type: "Lambda timeout" });
  });

  it("converts API metrics into existing KPI card props", () => {
    const result = buildDashboardKpisFromMetrics(metrics);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ label: "Total interactions", value: "42", category: "stability" });
    expect(result[1]).toMatchObject({ label: "Avg handle time", trend: "down", category: "efficiency" });
    expect(result[0].sparkline.length).toBeGreaterThan(0);
  });
});
