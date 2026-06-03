import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ISSUE_TYPES, REGIONS, STATUSES, type IssueType, type Region, type Status } from "./data";
import { Chip } from "./primitives";
import { timeRangeOptions, useDemoFilters, type TimeRange } from "../lib/state/demoFilters";

export interface FilterState {
  search: string;
  region: Region | "all";
  issueType: IssueType | "all";
  status: Status | "all";
  dateRange: TimeRange;
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  region: "all",
  issueType: "all",
  status: "all",
  dateRange: "7d",
};

export function useFigmaFilters() {
  const { selection, setWindow, setRegion, setIntent } = useDemoFilters((state) => ({
    selection: state.selection,
    setWindow: state.setWindow,
    setRegion: state.setRegion,
    setIntent: state.setIntent,
  }));
  const [local, setLocal] = useState<Pick<FilterState, "search" | "status">>({
    search: DEFAULT_FILTERS.search,
    status: DEFAULT_FILTERS.status,
  });

  const filters = useMemo<FilterState>(() => ({
    search: local.search,
    region: selection.region === "Global" ? "all" : selection.region,
    issueType: selection.intent === "All intents" ? "all" : selection.intent,
    status: local.status,
    dateRange: selection.window,
  }), [local, selection]);

  const setFilters = (next: FilterState) => {
    setLocal({ search: next.search, status: next.status });
    setWindow(next.dateRange);
    setRegion(next.region === "all" ? "Global" : next.region);
    setIntent(next.issueType === "all" ? "All intents" : next.issueType);
  };

  return { filters, selection, setFilters };
}

export function GlobalFilters({
  value,
  onChange,
  count,
  total,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  count: number;
  total: number;
}) {
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) => onChange({ ...value, [k]: v });
  const reset = () => onChange(DEFAULT_FILTERS);
  const dirty = JSON.stringify(value) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 p-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={value.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Search call id, customer, agent…"
            className="h-8 w-full rounded-md border border-border bg-input-background pl-7 pr-2 text-xs outline-none focus:border-foreground/30"
          />
        </div>
        <Select label="Region" value={value.region} onChange={(v) => set("region", v as any)} options={["all", ...REGIONS]} />
        <Select label="Issue" value={value.issueType} onChange={(v) => set("issueType", v as any)} options={["all", ...ISSUE_TYPES]} />
        <Select label="Status" value={value.status} onChange={(v) => set("status", v as any)} options={["all", ...STATUSES]} />
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
          {timeRangeOptions.map((r) => (
            <button
              key={r}
              onClick={() => set("dateRange", r)}
              className={
                "rounded px-2 py-1 text-xs " +
                (value.dateRange === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
              }
            >
              {r}
            </button>
          ))}
        </div>
        {dirty && (
          <button onClick={reset} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
        <div className="ml-auto text-xs text-muted-foreground tabular-nums">
          {count.toLocaleString()} <span className="text-muted-foreground/60">/ {total.toLocaleString()}</span>
        </div>
      </div>
      {(value.region !== "all" || value.issueType !== "all" || value.status !== "all") && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-2.5 py-2">
          {value.region !== "all" && (
            <Chip active onClick={() => set("region", "all")}>
              Region: {value.region} <X className="h-3 w-3" />
            </Chip>
          )}
          {value.issueType !== "all" && (
            <Chip active onClick={() => set("issueType", "all")}>
              Issue: {value.issueType} <X className="h-3 w-3" />
            </Chip>
          )}
          {value.status !== "all" && (
            <Chip active onClick={() => set("status", "all")}>
              Status: {value.status} <X className="h-3 w-3" />
            </Chip>
          )}
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 h-8 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ colorScheme: "inherit" }}
        className="bg-transparent text-foreground outline-none [&>option]:bg-popover [&>option]:text-popover-foreground"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? "All" : o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function applyFilters<T extends { region: string; issueType: string; status: string; startedAt: string; agent?: string; customer?: string; id?: string }>(
  rows: T[],
  f: FilterState,
): T[] {
  const cutoffMs = { "24h": 1, "3d": 3, "7d": 7, "30d": 30, "90d": 90 }[f.dateRange] * 24 * 60 * 60 * 1000;
  const anchor = rows.reduce((max, row) => {
    const ts = new Date(row.startedAt).getTime();
    return Number.isFinite(ts) ? Math.max(max, ts) : max;
  }, 0);
  if (!anchor) return rows.filter((r) => {
    if (f.region !== "all" && r.region !== f.region) return false;
    if (f.issueType !== "all" && r.issueType !== f.issueType) return false;
    if (f.status !== "all" && r.status !== f.status) return false;
    const q = f.search.trim().toLowerCase();
    if (q) {
      const hay = `${r.id ?? ""} ${r.agent ?? ""} ${r.customer ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const since = anchor - cutoffMs;
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.region !== "all" && r.region !== f.region) return false;
    if (f.issueType !== "all" && r.issueType !== f.issueType) return false;
    if (f.status !== "all" && r.status !== f.status) return false;
    if (new Date(r.startedAt).getTime() < since) return false;
    if (q) {
      const hay = `${r.id ?? ""} ${r.agent ?? ""} ${r.customer ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
