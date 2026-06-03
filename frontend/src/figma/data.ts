import type { CallRecord } from "../lib/api/types";
import { toUiCallRecords } from "../lib/viz/transformers";

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

export interface FigmaCall {
  id: string;
  agent: string;
  agentId: string;
  region: string;
  issueType: string;
  durationSec: number;
  status: Status;
  startedAt: string;
  summary: string;
  customer: string;
  service: string;
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

function hashString(value: string) {
  return Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function normalizeStatus(status: string): Status {
  const lowered = status.toLowerCase();
  if (lowered === "resolved" || lowered === "pending" || lowered === "escalated" || lowered === "open") return lowered as Status;
  return "pending";
}

function serviceFromIssue(issue: string) {
  if (issue.includes("Lambda")) return "AWS Lambda";
  if (issue.includes("API")) return "API Gateway";
  if (issue.includes("Dynamo")) return "DynamoDB";
  if (issue.includes("S3")) return "S3";
  if (issue.includes("Step")) return "Step Functions";
  return "CloudWatch";
}

export function toFigmaCalls(records: CallRecord[]): FigmaCall[] {
  const uiCalls = toUiCallRecords(records);
  return uiCalls.map((call, index) => {
    const raw = records[index];
    const seed = hashString(call.id);
    return {
      id: call.id,
      agent: call.agent,
      agentId: raw?.agent_id ?? call.agent,
      region: call.region,
      issueType: call.issue,
      durationSec: call.durationSeconds,
      status: normalizeStatus(call.status),
      startedAt: call.openedAt,
      summary: SUMMARIES[seed % SUMMARIES.length],
      customer: CUSTOMERS[seed % CUSTOMERS.length],
      service: serviceFromIssue(call.issue),
    };
  });
}

export function buildVolumeSeries(calls: FigmaCall[]) {
  const buckets = new Map<string, { date: string; calls: number; resolved: number; escalated: number; durationSec: number; avgDurationSec: number }>();

  calls.forEach((call) => {
    const started = new Date(call.startedAt);
    if (!Number.isFinite(started.getTime())) return;

    const dayKey = started.toISOString().slice(0, 10);
    const existing = buckets.get(dayKey) ?? {
      date: started.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      calls: 0,
      resolved: 0,
      escalated: 0,
      durationSec: 0,
      avgDurationSec: 0,
    };

    existing.calls += 1;
    existing.durationSec += call.durationSec;
    existing.avgDurationSec = Math.round(existing.durationSec / existing.calls);
    if (call.status === "resolved") existing.resolved += 1;
    if (call.status === "escalated") existing.escalated += 1;
    buckets.set(dayKey, existing);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
}

export function buildIssueBreakdown(calls: FigmaCall[]) {
  const counts = new Map<string, number>();
  calls.forEach((call) => {
    const issue = call.issueType || "Unassigned";
    counts.set(issue, (counts.get(issue) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count || a.issue.localeCompare(b.issue));
}

export function buildRegionPerformance(calls: FigmaCall[]) {
  return REGIONS.map((r) => {
    const sub = calls.filter((c) => c.region === r);
    const resolved = sub.filter((c) => c.status === "resolved").length;
    const escalated = sub.filter((c) => c.status === "escalated").length;
    const avg = sub.length ? Math.round(sub.reduce((a, c) => a + c.durationSec, 0) / sub.length) : 0;
    return {
      region: r,
      total: sub.length,
      resolved,
      resolvedRate: sub.length ? resolved / sub.length : 0,
      escalated,
      avgDurationSec: avg,
    };
  });
}

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

export function getCallSignals(call: FigmaCall) {
  const n = call.id.charCodeAt(0) * 7919 + call.id.charCodeAt(call.id.length - 1) * 6271 + call.durationSec;
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

export function getSlaCompliance(calls: FigmaCall[]) {
  if (!calls.length) return 0;
  const ok = calls.filter((c) => !getCallSignals(c).slaBreach).length;
  return (ok / calls.length) * 100;
}

export function getAvgCsat(calls: FigmaCall[]) {
  if (!calls.length) return 0;
  return calls.reduce((s, c) => s + getCallSignals(c).csat, 0) / calls.length;
}

export function getFcrRate(calls: FigmaCall[]) {
  if (!calls.length) return 0;
  return (calls.filter((c) => getCallSignals(c).fcr).length / calls.length) * 100;
}
