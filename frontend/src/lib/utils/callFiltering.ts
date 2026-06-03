import type { MockCallRecord } from "../data/types";
import type { DemoFilterSelection, TimeRange } from "../state/demoFilters";

const rangeToMs: Record<TimeRange, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

export function filterCalls(records: MockCallRecord[], selection: DemoFilterSelection): MockCallRecord[] {
  if (!records.length) return [];

  const latestTimestamp = records.reduce((max, call) => Math.max(max, Date.parse(call.openedAt)), 0);
  const windowMs = rangeToMs[selection.window];
  if (!latestTimestamp) {
    return records.filter((call) => {
      if (selection.region !== "Global" && call.region !== selection.region) return false;
      if (selection.intent !== "All intents" && call.issue !== selection.intent) return false;
      return true;
    });
  }
  const windowStart = latestTimestamp - windowMs;

  return records.filter((call) => {
    const openedAt = Date.parse(call.openedAt);
    if (openedAt < windowStart) return false;
    if (selection.region !== "Global" && call.region !== selection.region) return false;
    if (selection.intent !== "All intents" && call.issue !== selection.intent) return false;
    return true;
  });
}

export function buildFilterSummary(selection: DemoFilterSelection) {
  return `${selection.window} • ${selection.region} • ${selection.intent}`;
}
