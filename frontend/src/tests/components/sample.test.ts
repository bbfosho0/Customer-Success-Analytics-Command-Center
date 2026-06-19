import { afterEach, describe, expect, it } from "vitest";
import { getStaticCall, getStaticCalls, getStaticMetrics, staticCalls, staticManifest } from "../../lib/api/static-fixtures";
import { isStaticDemoMode } from "../../lib/utils/env";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("static demo data contract", () => {
  it("serves deterministic paginated call data", () => {
    const response = getStaticCalls({ page: 1, per_page: 5 });

    expect(response.data).toHaveLength(5);
    expect(response.meta.total).toBe(staticCalls.length);
    expect(response.links.next).toBe("/api/calls?page=2&per_page=5");
    expect(staticManifest.row_count).toBe(staticCalls.length);
  });

  it("keeps filters and detail lookup aligned with API behavior", () => {
    const resolved = getStaticCalls({ status: "resolved", per_page: 100 });

    expect(resolved.data.length).toBeGreaterThan(0);
    expect(resolved.data.every((call) => call.resolution_status.toLowerCase() === "resolved")).toBe(true);
    expect(getStaticCall(resolved.data[0].id)?.data.id).toBe(resolved.data[0].id);
  });

  it("exposes dashboard-ready metrics from the same static dataset", () => {
    const metrics = getStaticMetrics();

    expect(metrics.kpis.map((kpi) => kpi.label)).toEqual(["Total interactions", "Avg handle time", "Resolution rate", "Escalations"]);
    expect(metrics.issue_breakdown.length).toBeGreaterThan(0);
    expect(metrics.region_breakdown.length).toBeGreaterThan(0);
  });

  it("enables static demo mode for GitHub Pages builds", () => {
    process.env.GITHUB_PAGES = "true";

    expect(isStaticDemoMode()).toBe(true);
  });
});
