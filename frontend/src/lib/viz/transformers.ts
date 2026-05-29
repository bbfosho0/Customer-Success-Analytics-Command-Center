import type { AgentStats, CallRecord, CallsQuery, MetricsResponse } from "../api/types";
import type { DemoFilterSelection } from "../state/demoFilters";
import type {
  AgentPerformance,
  DashboardKpi,
  IssueBreakdownEntry,
  MockCallRecord,
  RegionPerformanceEntry,
  SettingsDiagnostic,
  VolumePoint,
} from "../data/types";
import type { ManifestInfo } from "../api/types";

const channels: MockCallRecord["channel"][] = ["voice", "chat", "email", "sms"];
const priorities: MockCallRecord["priority"][] = ["low", "normal", "high", "urgent"];
const sentiments: MockCallRecord["sentiment"][] = ["positive", "neutral", "negative"];

function hashString(value: string) {
  return Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function normalizeStatus(status: string): MockCallRecord["status"] {
  const lowered = status.toLowerCase();
  if (lowered === "resolved" || lowered === "pending" || lowered === "escalated") return lowered;
  return "pending";
}

function buildSparkline(seed: number, length = 12): number[] {
  return Array.from({ length }, (_, index) => {
    const base = seed + index * 0.6;
    const wave = Math.sin((index + seed) / 2.5) * 3;
    return Number((base + wave).toFixed(1));
  });
}

function trendFromApi(value: number) {
  if (value > 0) return "up" as const;
  if (value < 0) return "down" as const;
  return "flat" as const;
}

export function buildCallsQueryFromSelection(selection: DemoFilterSelection, page = 1, perPage = 50): CallsQuery {
  return {
    page,
    per_page: perPage,
    region: selection.region === "Global" ? undefined : selection.region,
    issue_type: selection.intent === "All intents" ? undefined : selection.intent,
  };
}

export function toUiCallRecord(record: CallRecord): MockCallRecord {
  const seed = hashString(record.id);
  const openedAt = record.started_at ?? new Date(0).toISOString();
  const closedAt = new Date(Date.parse(openedAt) + record.duration_seconds * 1000).toISOString();
  const status = normalizeStatus(record.resolution_status);
  const firstResponseMinutes = 3 + (seed % 28);

  return {
    id: record.id,
    caseId: record.id.toUpperCase().startsWith("CASE-") ? record.id : `CASE-${record.id.replace(/[^a-z0-9]/gi, "-").toUpperCase()}`,
    agent: record.agent_name ?? record.agent_id,
    region: record.customer_region,
    channel: channels[seed % channels.length],
    issue: record.issue_type,
    priority: priorities[seed % priorities.length],
    sentiment: sentiments[seed % sentiments.length],
    status,
    durationSeconds: record.duration_seconds,
    csat: Math.min(99, Math.max(55, Math.round((record.skill_rating ?? 4) * 18 + (seed % 9)))),
    npsDelta: ((seed % 7) - 2) * 3,
    openedAt,
    closedAt,
    firstResponseMinutes,
    firstContactResolution: status === "resolved" && firstResponseMinutes < 12,
  };
}

export function toUiCallRecords(records: CallRecord[]): MockCallRecord[] {
  return records.map(toUiCallRecord);
}

export function toVolumeSeries(records: CallRecord[]) {
  return records.map((record) => ({
    x: record.id,
    y: record.duration_seconds,
  }));
}

export function buildVolumeSeriesFromCalls(records: CallRecord[]): VolumePoint[] {
  const calls = toUiCallRecords(records);
  if (!calls.length) {
    const fallbackDate = new Date().toISOString().slice(0, 10);
    return [
      { date: fallbackDate, voice: 0, chat: 0, email: 0, total: 0, forecast: 0 },
      { date: fallbackDate, voice: 0, chat: 0, email: 0, total: 0, forecast: 5 },
    ];
  }

  const seriesMap = new Map<string, VolumePoint>();
  calls.forEach((call) => {
    const dateKey = call.openedAt.slice(0, 10);
    const existing = seriesMap.get(dateKey) ?? { date: dateKey, voice: 0, chat: 0, email: 0, total: 0, forecast: 0 };
    const next = { ...existing, total: existing.total + 1 };
    if (call.channel === "voice") next.voice += 1;
    if (call.channel === "chat") next.chat += 1;
    if (call.channel === "email") next.email += 1;
    seriesMap.set(dateKey, next);
  });

  return Array.from(seriesMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((point, index, arr) => ({
      ...point,
      forecast: Math.max(0, Math.round(point.total + Math.sin(index / 2.2) * 6 + index - arr.length / 2 + 5)),
    }));
}

export function buildDashboardKpisFromMetrics(metrics: MetricsResponse): DashboardKpi[] {
  const categories: DashboardKpi["category"][] = ["stability", "efficiency", "stability", "efficiency"];
  const descriptors = ["Dataset interactions", "Backend aggregate", "Cases closed", "Critical transfers"];
  const goals = ["+5%", "≤ 12m", "≥ 90%", "< 8%"];

  return metrics.kpis.map((kpi, index) => ({
    label: kpi.label,
    value: kpi.value,
    delta: kpi.delta,
    trend: trendFromApi(kpi.delta),
    descriptor: descriptors[index] ?? "Current window",
    category: categories[index] ?? "stability",
    sparkline: buildSparkline(20 + index * 12 + Math.abs(kpi.delta)),
    goal: goals[index],
  }));
}

export function buildIssueBreakdownFromMetrics(metrics: MetricsResponse): IssueBreakdownEntry[] {
  const total = Math.max(1, metrics.issue_breakdown.reduce((sum, item) => sum + item.value, 0));
  return metrics.issue_breakdown.slice(0, 6).map((item, index) => ({
    issue: item.label,
    count: item.value,
    percentage: Number(((item.value / total) * 100).toFixed(1)),
    trend: (index % 3) * 1.5 - 1,
  }));
}

export function buildRegionPerformanceFromMetrics(metrics: MetricsResponse): RegionPerformanceEntry[] {
  return metrics.region_breakdown.map((item, index) => ({
    region: item.label,
    volume: item.value,
    csat: Number(Math.min(97, 84 + index * 1.7).toFixed(1)),
    sla: Number(Math.min(98, 90 + index * 1.2).toFixed(1)),
    escalations: Math.round(item.value * 0.12),
  }));
}

export function buildManifestDiagnostics(manifest?: ManifestInfo): SettingsDiagnostic[] {
  if (!manifest) return [];
  return [
    { label: "Manifest hash", value: manifest.hash.slice(0, 14), hint: manifest.dataset },
    { label: "Parquet size", value: `${(manifest.size_bytes / 1024).toFixed(1)} KB`, hint: `${manifest.row_count.toLocaleString()} rows` },
    { label: "Last refresh", value: manifest.generated_at.replace("T", " ").replace(/\.\d+Z$/, " UTC"), hint: manifest.notes },
    { label: "Data source", value: manifest.source, hint: manifest.path },
  ];
}

export function buildAgentPerformanceRows(agents: AgentStats[]): AgentPerformance[] {
  return agents.map((agent) => ({
    id: agent.agent_id,
    name: agent.name,
    region: agent.region,
    role: agent.resolved_rate >= 80 ? "Resolution lead" : agent.escalated_calls > 0 ? "Escalations" : "Core",
    callsHandled: agent.total_calls,
    avgHandleTime: Number((agent.avg_resolution_seconds / 60).toFixed(1)),
    csat: Number((agent.avg_rating * 20).toFixed(1)),
    sla: Number(Math.min(99, Math.max(70, agent.resolved_rate + 8)).toFixed(1)),
    scheduleAdherence: Number(Math.min(99, Math.max(70, agent.skill_rating * 20)).toFixed(1)),
    sentimentLift: Number(Math.max(0, agent.resolved_rate / 25).toFixed(1)),
    focusAreas: [agent.region, agent.escalated_calls ? "Escalation follow-up" : "Quality coaching"],
  }));
}
