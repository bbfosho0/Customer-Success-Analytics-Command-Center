import type { MockCallRecord } from "./types";
import { AGENT_ROSTER_SIZE, buildAgentName, formatCallId } from "./identity";

const agents = Array.from({ length: AGENT_ROSTER_SIZE }, (_, index) => buildAgentName(index));

const regions = ["NA", "EMEA", "APAC", "LATAM", "ANZ"];
const channels: MockCallRecord["channel"][] = ["voice", "chat", "email", "sms"];
const issues = [
  "Billing",
  "Outage",
  "Refund",
  "Upgrade",
  "Security",
  "Compliance",
  "Integrations",
  "Voice Quality",
];
const priorities: MockCallRecord["priority"][] = ["low", "normal", "high", "urgent"];
const sentiments: MockCallRecord["sentiment"][] = ["positive", "neutral", "negative"];
const statuses: MockCallRecord["status"][] = ["resolved", "pending", "escalated"];

const baseDate = Date.UTC(2025, 9, 15, 4, 0, 0);

function isoFromIndex(idx: number) {
  return new Date(baseDate + idx * 37 * 60 * 1000).toISOString();
}

export const callsDataset: MockCallRecord[] = Array.from({ length: 180 }, (_, index) => {
  const openedAt = isoFromIndex(index);
  const duration = 240 + ((index * 17) % 840);
  const priority = priorities[index % priorities.length];
  const status = statuses[index % statuses.length];
  const firstResponseMinutes = 3 + ((index * 5) % 28);
  const closedAt = new Date(new Date(openedAt).getTime() + duration * 1000).toISOString();

  return {
    id: formatCallId(index),
    caseId: `CASE-${2025 + Math.floor(index / 90)}-${(9000 + index).toString()}`,
    agent: agents[index % agents.length],
    region: regions[index % regions.length],
    channel: channels[index % channels.length],
    issue: issues[index % issues.length],
    priority,
    sentiment: sentiments[(index * 3) % sentiments.length],
    status,
    durationSeconds: duration,
    csat: 74 + ((index * 7) % 23),
    npsDelta: ((index % 7) - 2) * 3,
    openedAt,
    closedAt,
    firstResponseMinutes,
    firstContactResolution: status === "resolved" && firstResponseMinutes < 12,
  };
});

export const highlightedCalls = callsDataset.slice(0, 12);
export const longRunningCalls = callsDataset.filter((call) => call.durationSeconds > 900).slice(0, 8);
