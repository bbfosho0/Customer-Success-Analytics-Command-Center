import { agentsPerformance } from "../data/agents-data";
import { callsDataset } from "../data/calls-data";
import { normalizeCallId } from "../data/identity";
import type { AgentStats, CallRecord, CallsQuery, CallsResponse, ManifestInfo, MetricsResponse } from "./types";

const STATIC_MANIFEST_GENERATED_AT = "2025-10-15T04:00:00.000Z";

function normalizeStatus(status: string | null | undefined) {
  return status?.toLowerCase();
}

function toApiCall(record: (typeof callsDataset)[number], index: number): CallRecord {
  return {
    id: normalizeCallId(record.id),
    agent_id: `agent_${String((index % agentsPerformance.length) + 1).padStart(3, "0")}`,
    agent_name: record.agent,
    customer_region: record.region,
    issue_type: record.issue,
    duration_seconds: record.durationSeconds,
    resolution_status: record.status,
    started_at: record.openedAt,
    skill_rating: 4 + ((index % 10) / 10),
  };
}

export const staticCalls: CallRecord[] = callsDataset.map(toApiCall);

export const staticManifest: ManifestInfo = {
  dataset: "static-demo-support-calls",
  path: "frontend/src/lib/data/calls-data.ts",
  source: "deterministic frontend fixture",
  hash: "static-demo-fixture-v1",
  row_count: staticCalls.length,
  generated_at: STATIC_MANIFEST_GENERATED_AT,
  notes: "Static demo mode uses checked-in deterministic fixtures instead of a live FastAPI backend.",
  size_bytes: 0,
};

function textMatches(record: CallRecord, query: string) {
  const needle = query.toLowerCase();
  return [record.id, record.agent_id, record.agent_name, record.customer_region, record.issue_type, record.resolution_status]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

export function getStaticCalls(filters: CallsQuery = {}): CallsResponse {
  const page = filters.page ?? 1;
  const perPage = filters.per_page ?? 50;
  let rows = [...staticCalls];

  if (filters.region) {
    rows = rows.filter((row) => row.customer_region.toLowerCase() === filters.region?.toLowerCase());
  }
  if (filters.issue_type) {
    rows = rows.filter((row) => row.issue_type.toLowerCase() === filters.issue_type?.toLowerCase());
  }
  if (filters.status) {
    rows = rows.filter((row) => normalizeStatus(row.resolution_status) === normalizeStatus(filters.status));
  }
  if (filters.agent_id) {
    rows = rows.filter((row) => row.agent_id.toLowerCase() === filters.agent_id?.toLowerCase());
  }
  if (filters.q) {
    rows = rows.filter((row) => textMatches(row, filters.q ?? ""));
  }

  rows.sort((a, b) => String(b.started_at ?? "").localeCompare(String(a.started_at ?? "")));
  const start = (page - 1) * perPage;
  const data = rows.slice(start, start + perPage);
  const next = page * perPage < rows.length ? `/api/calls?page=${page + 1}&per_page=${perPage}` : null;

  return {
    data,
    meta: {
      page,
      per_page: perPage,
      total: rows.length,
    },
    links: {
      next,
    },
  };
}

export function getStaticCall(callId: string) {
  const record = staticCalls.find((call) => normalizeCallId(call.id) === normalizeCallId(callId));
  return record ? { data: record } : null;
}

export function getStaticAgents(): AgentStats[] {
  return agentsPerformance.map((agent, index) => {
    const agentId = `agent_${String(index + 1).padStart(3, "0")}`;
    const calls = staticCalls.filter((call) => call.agent_id === agentId);
    const totalCalls = calls.length;
    const resolvedCalls = calls.filter((call) => normalizeStatus(call.resolution_status) === "resolved").length;
    const escalatedCalls = calls.filter((call) => normalizeStatus(call.resolution_status) === "escalated").length;
    const totalDuration = calls.reduce((sum, call) => sum + call.duration_seconds, 0);

    return {
      agent_id: agentId,
      name: agent.name,
      region: agent.region,
      skill_rating: Number((4 + ((index % 10) / 10)).toFixed(1)),
      avg_rating: Number((agent.csat / 20).toFixed(1)),
      total_calls: totalCalls,
      avg_resolution_seconds: totalCalls ? Math.round(totalDuration / totalCalls) : 0,
      resolved_rate: totalCalls ? Number(((resolvedCalls / totalCalls) * 100).toFixed(1)) : 0,
      escalated_calls: escalatedCalls,
    };
  });
}

function breakdown(rows: CallRecord[], key: "issue_type" | "customer_region") {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const label = row[key] || (key === "customer_region" ? "Unknown region" : "Unassigned");
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({ label, value }));
}

export function getStaticMetrics(): MetricsResponse {
  const totalCalls = staticCalls.length;
  const sampleSize = Math.max(totalCalls, 1);
  const resolvedCalls = staticCalls.filter((call) => normalizeStatus(call.resolution_status) === "resolved").length;
  const escalatedCalls = staticCalls.filter((call) => normalizeStatus(call.resolution_status) === "escalated").length;
  const totalDuration = staticCalls.reduce((sum, call) => sum + call.duration_seconds, 0);

  return {
    kpis: [
      { label: "Total interactions", value: totalCalls.toLocaleString(), delta: 0, trend: "flat" },
      { label: "Avg handle time", value: `${Number((totalDuration / sampleSize / 60).toFixed(1))}m`, delta: 0, trend: "flat" },
      { label: "Resolution rate", value: `${Number(((resolvedCalls / sampleSize) * 100).toFixed(1))}%`, delta: 0, trend: "flat" },
      { label: "Escalations", value: escalatedCalls.toLocaleString(), delta: 0, trend: "flat" },
    ],
    issue_breakdown: breakdown(staticCalls, "issue_type"),
    region_breakdown: breakdown(staticCalls, "customer_region"),
  };
}
