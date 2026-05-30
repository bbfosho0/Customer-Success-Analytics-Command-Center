// Shared analytics data + types for the AWS Serverless Support Analytics demo dataset.
// Matches the stable analytics shapes from backend phases 0-2.

export type Region = "us-east-1" | "us-west-2" | "eu-west-1" | "eu-central-1" | "ap-southeast-1" | "ap-northeast-1";
export type IssueType =
  | "Lambda timeout"
  | "API Gateway 5xx"
  | "Cold start"
  | "IAM permission"
  | "DynamoDB throttle"
  | "S3 access"
  | "Step Functions"
  | "CloudWatch logs";
export type Status = "resolved" | "escalated" | "open" | "pending";

export interface Call {
  id: string;
  agent: string;
  agentId: string;
  region: Region;
  issueType: IssueType;
  durationSec: number;
  status: Status;
  startedAt: string; // ISO
  summary: string;
  customer: string;
  service: string;
}

export interface Agent {
  id: string;
  name: string;
  region: Region;
  geoRegion: string; // display region: NA, EMEA, APAC, LATAM
  specialty: string;
  csat: number; // percentage 0-100
  sla: number; // percentage 0-100
  calls: number; // recent call count
  aht: number; // average handle time in minutes
  focus: string;
  // kept for backward compat with call-detail and aggregations
  skill: number;
  totalCalls: number;
  avgDurationSec: number;
  resolutionRate: number;
  escalated: number;
}

export const REGIONS: Region[] = [
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
  "ap-northeast-1",
];

export const ISSUE_TYPES: IssueType[] = [
  "Lambda timeout",
  "API Gateway 5xx",
  "Cold start",
  "IAM permission",
  "DynamoDB throttle",
  "S3 access",
  "Step Functions",
  "CloudWatch logs",
];

export const STATUSES: Status[] = ["resolved", "escalated", "open", "pending"];

// Deterministic PRNG so the demo dataset is stable.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

export const AGENTS: Agent[] = [
  { id: "AG-1000", name: "Nova Carter",       region: "us-east-1",     geoRegion: "NA",   specialty: "Escalations", csat: 72, sla: 70, calls: 12, aht: 11.4, focus: "Escalation follow-up", skill: 3, totalCalls: 142, avgDurationSec: 684,  resolutionRate: 0.72, escalated: 39 },
  { id: "AG-1001", name: "Maya Chen",          region: "eu-west-1",     geoRegion: "EMEA", specialty: "Escalations", csat: 76, sla: 70, calls: 12, aht: 11.7, focus: "Escalation follow-up", skill: 4, totalCalls: 158, avgDurationSec: 702,  resolutionRate: 0.76, escalated: 37 },
  { id: "AG-1002", name: "Dante Ruiz",         region: "ap-southeast-1",geoRegion: "APAC", specialty: "Escalations", csat: 80, sla: 70, calls: 12, aht: 10.8, focus: "Escalation follow-up", skill: 4, totalCalls: 164, avgDurationSec: 648,  resolutionRate: 0.80, escalated: 32 },
  { id: "AG-1003", name: "Elena Popov",        region: "us-east-1",     geoRegion: "LATAM",specialty: "Escalations", csat: 84, sla: 70, calls: 11, aht: 12.3, focus: "Escalation follow-up", skill: 4, totalCalls: 131, avgDurationSec: 738,  resolutionRate: 0.84, escalated: 20 },
  { id: "AG-1004", name: "Kai Ndirangu",       region: "us-west-2",     geoRegion: "NA",   specialty: "Escalations", csat: 84, sla: 70, calls: 14, aht:  9.8, focus: "Escalation follow-up", skill: 5, totalCalls: 178, avgDurationSec: 588,  resolutionRate: 0.84, escalated: 28 },
  { id: "AG-1005", name: "Zara Iqbal",         region: "eu-central-1",  geoRegion: "EMEA", specialty: "Escalations", csat: 88, sla: 72, calls: 10, aht:  9.1, focus: "Escalation follow-up", skill: 5, totalCalls: 119, avgDurationSec: 546,  resolutionRate: 0.88, escalated: 14 },
  { id: "AG-1006", name: "Ravi Subramanian",   region: "ap-northeast-1",geoRegion: "APAC", specialty: "Escalations", csat: 91, sla: 75, calls:  9, aht:  8.6, focus: "Escalation follow-up", skill: 5, totalCalls: 108, avgDurationSec: 516,  resolutionRate: 0.91, escalated:  9 },
  { id: "AG-1007", name: "Sofia Alvarez",      region: "us-west-2",     geoRegion: "NA",   specialty: "Escalations", csat: 68, sla: 68, calls: 16, aht: 13.2, focus: "Escalation follow-up", skill: 3, totalCalls: 192, avgDurationSec: 792,  resolutionRate: 0.68, escalated: 61 },
];

const SUMMARIES = [
  "Customer hitting 30s timeout on POST handler during peak EU hours.",
  "5xx spike traced to misconfigured stage variables after deploy.",
  "Cold start latency increased after switching to ARM64 runtime.",
  "IAM role missing dynamodb:Query for staging table.",
  "Provisioned capacity insufficient during scheduled batch.",
  "Bucket policy denying GetObject for federated identity.",
  "State machine stuck in waiting state; activity worker offline.",
  "Log subscription filter exceeding throughput quota.",
];

const CUSTOMERS = [
  "Acme Robotics",
  "NovaPay",
  "Helios Health",
  "BluePort Logistics",
  "Quanta Media",
  "Northwind Cloud",
  "Vertex Bio",
  "Orbit Foods",
];

function makeCalls(count: number): Call[] {
  const out: Call[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const agent = AGENTS[Math.floor(rand() * AGENTS.length)];
    const issue = pick(ISSUE_TYPES);
    const status = rand() < 0.7 ? "resolved" : rand() < 0.6 ? "escalated" : rand() < 0.5 ? "open" : "pending";
    const minutesAgo = Math.floor(rand() * 60 * 24 * 30); // 30 days
    out.push({
      id: `CALL-${(100000 + i).toString(36).toUpperCase()}`,
      agent: agent.name,
      agentId: agent.id,
      region: agent.region,
      issueType: issue,
      durationSec: 90 + Math.floor(rand() * 1500),
      status: status as Status,
      startedAt: new Date(now - minutesAgo * 60_000).toISOString(),
      summary: pick(SUMMARIES),
      customer: pick(CUSTOMERS),
      service: issue.includes("Lambda")
        ? "AWS Lambda"
        : issue.includes("API")
          ? "API Gateway"
          : issue.includes("Dynamo")
            ? "DynamoDB"
            : issue.includes("S3")
              ? "S3"
              : issue.includes("Step")
                ? "Step Functions"
                : "CloudWatch",
    });
  }
  return out;
}

export const CALLS: Call[] = makeCalls(284);

// Pre-computed aggregations.
export function buildVolumeSeries(calls: Call[]) {
  const days = 14;
  const buckets: { date: string; calls: number; resolved: number; escalated: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const inDay = calls.filter((c) => {
      const t = new Date(c.startedAt).getTime();
      return t >= d.getTime() && t < next.getTime();
    });
    buckets.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      calls: inDay.length,
      resolved: inDay.filter((c) => c.status === "resolved").length,
      escalated: inDay.filter((c) => c.status === "escalated").length,
    });
  }
  return buckets;
}

export function buildIssueBreakdown(calls: Call[]) {
  return ISSUE_TYPES.map((t) => ({
    issue: t,
    count: calls.filter((c) => c.issueType === t).length,
  })).sort((a, b) => b.count - a.count);
}

export function buildRegionPerformance(calls: Call[]) {
  return REGIONS.map((r) => {
    const sub = calls.filter((c) => c.region === r);
    const resolved = sub.filter((c) => c.status === "resolved").length;
    const escalated = sub.filter((c) => c.status === "escalated").length;
    const avg = sub.length ? Math.round(sub.reduce((a, c) => a + c.durationSec, 0) / sub.length) : 0;
    return {
      region: r,
      total: sub.length,
      resolvedRate: sub.length ? resolved / sub.length : 0,
      escalated,
      avgDurationSec: avg,
    };
  });
}

export const MANIFEST = {
  datasetName: "support-calls-2026q2",
  path: "s3://aws-support-analytics-demo/datasets/support-calls-2026q2.parquet",
  hash: "sha256:7e3b9a8c1f24a0b3d8c2e6a5f0b7c91d4e3a2b8c6d1f9e4a7b0c5d2e1f8a9b3c",
  rowCount: CALLS.length,
  generatedAt: "2026-05-28T14:22:11Z",
  sizeBytes: 4_812_336,
  columns: [
    { name: "call_id", type: "string" },
    { name: "agent_id", type: "string" },
    { name: "agent_name", type: "string" },
    { name: "region", type: "string" },
    { name: "issue_type", type: "string" },
    { name: "duration_sec", type: "int32" },
    { name: "status", type: "string" },
    { name: "started_at", type: "timestamp" },
    { name: "customer", type: "string" },
    { name: "service", type: "string" },
    { name: "summary", type: "string" },
  ],
};

export const INSIGHTS = [
  {
    severity: "warn" as const,
    title: "Cold start regressions in eu-west-1",
    body: "Median cold start up 18% week-over-week after ARM64 migration on 2 fleets.",
  },
  {
    severity: "info" as const,
    title: "Escalation rate trending down",
    body: "Escalations dropped 6.2% vs prior 14-day window. Driven by Lambda timeout playbook.",
  },
  {
    severity: "critical" as const,
    title: "DynamoDB throttles concentrated in ap-northeast-1",
    body: "11 calls in last 48h reference the same provisioned capacity ceiling.",
  },
];

export function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function getCallSignals(call: Call) {
  const n = call.id.charCodeAt(5) * 7919 + call.id.charCodeAt(6) * 6271 + call.durationSec;
  const r0 = ((n * 1664525 + 1013904223) & 0x7fffffff);
  const r1 = ((n * 22695477 + 1) & 0x7fffffff);
  const r2 = ((n * 214013 + 2531011) & 0x7fffffff);
  const r3 = ((n * 1103515245 + 12345) & 0x7fffffff);
  const csat = 1 + (r0 % 5);
  const sentiments = ["positive", "neutral", "negative"] as const;
  const sentiment = sentiments[r1 % 3];
  const fcr = r2 % 10 > 3;
  const slaBreach = call.status === "escalated" || r3 % 10 < 2;
  const firstResponseSec = 30 + (r0 % 270);
  const priorities = ["P1", "P2", "P3", "P4"] as const;
  const priority = call.status === "escalated" ? "P1" : priorities[1 + (r1 % 3)];
  return { csat, sentiment, fcr, slaBreach, firstResponseSec, priority };
}

export function getSlaCompliance(calls: Call[]) {
  if (!calls.length) return 0;
  const ok = calls.filter((c) => !getCallSignals(c).slaBreach).length;
  return (ok / calls.length) * 100;
}

export function getAvgCsat(calls: Call[]) {
  if (!calls.length) return 0;
  return calls.reduce((s, c) => s + getCallSignals(c).csat, 0) / calls.length;
}

export function getFcrRate(calls: Call[]) {
  if (!calls.length) return 0;
  return (calls.filter((c) => getCallSignals(c).fcr).length / calls.length) * 100;
}

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
