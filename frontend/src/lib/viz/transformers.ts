import type { CallRecord } from "../api/types";

export function toVolumeSeries(records: CallRecord[]) {
  return records.map((record) => ({
    x: record.id,
    y: record.duration_seconds,
  }));
}
