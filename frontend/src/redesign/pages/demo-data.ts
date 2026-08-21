import {
  staticBiExports,
  staticChurnRisk,
  staticCustomerOverview,
  staticLtv,
  staticRetention,
  staticSegments,
} from "../../features/customer-analytics/static-data";
import { getStaticAgents, getStaticCalls, getStaticMetrics, staticManifest } from "../../lib/api/static-fixtures";

const rawRedesignCalls = getStaticCalls({ page: 1, per_page: 200 }).data;

export const redesignCalls = rawRedesignCalls.map((call) => ({
  ...call,
  agent_name: call.agent_name ?? "Unassigned agent",
  customer_region: call.customer_region ?? "Unknown region",
  issue_type: call.issue_type ?? "Unclassified issue",
  resolution_status: call.resolution_status ?? "unknown",
  started_at: call.started_at ?? "",
}));

export const redesignAgents = getStaticAgents();
export const redesignMetrics = getStaticMetrics();
export const redesignCallDetail = redesignCalls.find((call) => call.id === "CALL_0001") ?? redesignCalls[0];
export const redesignManifest = staticManifest;

export const redesignCustomer = {
  overview: staticCustomerOverview,
  churn: staticChurnRisk,
  retention: staticRetention,
  ltv: staticLtv,
  segments: staticSegments,
  exports: staticBiExports,
};

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 100_000 ? "compact" : "standard",
  }).format(value);
}

export function titleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
