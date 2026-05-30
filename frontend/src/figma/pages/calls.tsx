"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";

import { fmtDuration, fmtRelative, getSlaCompliance, getAvgCsat, getFcrRate, toFigmaCalls } from "../data";
import { GlobalFilters, applyFilters, useFigmaFilters } from "../filters";
import { EmptyState, ErrorState, LoadingState, SectionCard, StatusBadge } from "../primitives";
import { PageHeader } from "../shell";
import { cn } from "../ui/utils";
import { useAgents, useCalls } from "../../lib/api/hooks";

type SortField = "startedAt" | "durationSec" | "agent" | "region" | "status";
const PAGE_SIZE = 12;
const MAX_CALLS = 200;

export function CallsPage({ onOpen }: { onOpen: (id: string) => void }) {
  const { filters, setFilters } = useFigmaFilters();
  const [agent, setAgent] = useState<string>("all");
  const [minDur, setMinDur] = useState(0);
  const [maxDur, setMaxDur] = useState(1800);
  const [sortField, setSortField] = useState<SortField>("startedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const callsQuery = useCalls({
    page: 1,
    per_page: MAX_CALLS,
    region: filters.region === "all" ? undefined : filters.region,
    issue_type: filters.issueType === "all" ? undefined : filters.issueType,
  });
  const agentsQuery = useAgents({ sort: "total_calls", direction: "desc" });

  const calls = useMemo(() => toFigmaCalls(callsQuery.data?.data ?? []), [callsQuery.data]);

  const rows = useMemo(() => {
    let r = applyFilters(calls, filters);
    if (agent !== "all") r = r.filter((c) => c.agentId === agent || c.agent === agent);
    r = r.filter((c) => c.durationSec >= minDur && c.durationSec <= maxDur);
    r.sort((a, b) => {
      const av = (a as any)[sortField];
      const bv = (b as any)[sortField];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [calls, filters, agent, minDur, maxDur, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const longestCall = useMemo(() => [...rows].sort((a, b) => b.durationSec - a.durationSec)[0] ?? null, [rows]);
  const mostEscalatedCustomer = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.filter((c) => c.status === "escalated").forEach((c) => { counts[c.customer] = (counts[c.customer] ?? 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? { customer: top[0], count: top[1] } : null;
  }, [rows]);
  const sla = useMemo(() => getSlaCompliance(rows), [rows]);
  const csat = useMemo(() => getAvgCsat(rows), [rows]);
  const fcr = useMemo(() => getFcrRate(rows), [rows]);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(f); setSortDir("desc"); }
  };

  const tableState = callsQuery.isLoading
    ? "loading"
    : callsQuery.isError
      ? "error"
      : rows.length === 0
        ? "empty"
        : "ready";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calls"
        description="Server-paginated record of support calls."
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-muted">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-muted">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">SLA compliance</p>
          <p className="mt-1 text-[22px] tabular-nums">{sla.toFixed(1)}<span className="text-xs text-muted-foreground">%</span></p>
          <p className="text-[11px] text-muted-foreground">≤ 10 min handle time</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg CSAT</p>
          <p className="mt-1 text-[22px] tabular-nums">{csat.toFixed(1)}<span className="text-xs text-muted-foreground">/5</span></p>
          <p className="text-[11px] text-muted-foreground">Customer satisfaction score</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">FCR rate</p>
          <p className="mt-1 text-[22px] tabular-nums">{fcr.toFixed(1)}<span className="text-xs text-muted-foreground">%</span></p>
          <p className="text-[11px] text-muted-foreground">First contact resolution</p>
        </div>
      </div>

      {(longestCall || mostEscalatedCustomer) && (
        <div className="grid gap-3 md:grid-cols-2">
          {longestCall && (
            <div
              className="flex cursor-pointer items-start gap-3 rounded-md border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/20"
              onClick={() => onOpen(longestCall.id)}
            >
              <div className="mt-0.5 shrink-0 rounded-md border border-amber-200 bg-amber-100 p-1.5 dark:border-amber-900 dark:bg-amber-950/40">
                <span className="text-amber-700 dark:text-amber-400 text-[11px]">⏱</span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Longest running call</p>
                <p className="truncate text-[13px] text-foreground">{longestCall.id} · {longestCall.customer}</p>
                <p className="text-[11px] text-muted-foreground">{fmtDuration(longestCall.durationSec)} · {longestCall.issueType} · {longestCall.region}</p>
              </div>
            </div>
          )}
          {mostEscalatedCustomer && (
            <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900 dark:bg-rose-950/20">
              <div className="mt-0.5 shrink-0 rounded-md border border-rose-200 bg-rose-100 p-1.5 dark:border-rose-900 dark:bg-rose-950/40">
                <span className="text-rose-700 dark:text-rose-400 text-[11px]">⚡</span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-400">Most escalated customer</p>
                <p className="truncate text-[13px] text-foreground">{mostEscalatedCustomer.customer}</p>
                <p className="text-[11px] text-muted-foreground">{mostEscalatedCustomer.count} escalations in current filter window</p>
              </div>
            </div>
          )}
        </div>
      )}

      <GlobalFilters value={filters} onChange={(f) => { setFilters(f); setPage(1); }} count={rows.length} total={callsQuery.data?.meta.total ?? rows.length} />

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2.5">
        <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 h-8 text-xs">
          <span className="text-muted-foreground">Agent</span>
          <select value={agent} onChange={(e) => setAgent(e.target.value)} style={{ colorScheme: "inherit" }} className="bg-transparent outline-none [&>option]:bg-popover [&>option]:text-popover-foreground">
            <option value="all">All</option>
            {(agentsQuery.data ?? []).map((a) => (<option key={a.agent_id} value={a.agent_id}>{a.name}</option>))}
          </select>
        </label>
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2 h-8 text-xs">
          <span className="text-muted-foreground">Duration</span>
          <input type="number" min={0} value={minDur} onChange={(e) => setMinDur(+e.target.value)} className="w-14 bg-transparent text-right tabular-nums outline-none" />
          <span className="text-muted-foreground">–</span>
          <input type="number" min={0} value={maxDur} onChange={(e) => setMaxDur(+e.target.value)} className="w-14 bg-transparent text-right tabular-nums outline-none" />
          <span className="text-muted-foreground">s</span>
        </div>
        <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 h-8 text-xs">
          <span className="text-muted-foreground">Sort</span>
          <select value={sortField} onChange={(e) => setSortField(e.target.value as SortField)} style={{ colorScheme: "inherit" }} className="bg-transparent outline-none [&>option]:bg-popover [&>option]:text-popover-foreground">
            <option value="startedAt">Started at</option>
            <option value="durationSec">Duration</option>
            <option value="agent">Agent</option>
            <option value="region">Region</option>
            <option value="status">Status</option>
          </select>
          <button onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")} className="text-muted-foreground hover:text-foreground">
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </label>
      </div>

      <SectionCard
        title={`${rows.length.toLocaleString()} calls`}
        description={`Page ${page} of ${totalPages}`}
        action={
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border disabled:opacity-40 hover:bg-muted"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border disabled:opacity-40 hover:bg-muted"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        }
      >
        {tableState === "loading" ? (
          <LoadingState label="Fetching calls" />
        ) : tableState === "error" ? (
          <ErrorState body="The analytics service returned a 503. Retry in a few seconds." retry={() => {}} />
        ) : tableState === "empty" ? (
          <EmptyState title="No calls match the current filters" body="Widen the date range or clear filters to see more results." />
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <Th>Call ID</Th>
                  <Th sortable onClick={() => toggleSort("agent")}>Agent</Th>
                  <Th sortable onClick={() => toggleSort("region")}>Region</Th>
                  <Th>Issue type</Th>
                  <Th sortable onClick={() => toggleSort("durationSec")}>Duration</Th>
                  <Th sortable onClick={() => toggleSort("status")}>Status</Th>
                  <Th sortable onClick={() => toggleSort("startedAt")}>Started</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((c) => (
                  <tr
                    key={c.id}
                    onMouseEnter={() => setSelectedId(c.id)}
                    onClick={() => onOpen(c.id)}
                    className={cn(
                      "cursor-pointer border-b border-border last:border-0",
                      selectedId === c.id ? "bg-muted/70" : "hover:bg-muted/50",
                    )}
                  >
                    <td className="px-4 py-2 font-mono text-[11px] text-foreground">{c.id}</td>
                    <td className="px-4 py-2">{c.agent}</td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">{c.region}</td>
                    <td className="px-4 py-2">{c.issueType}</td>
                    <td className="px-4 py-2 tabular-nums">{fmtDuration(c.durationSec)}</td>
                    <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-2 text-muted-foreground">{fmtRelative(c.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function Th({ children, sortable, onClick }: { children: React.ReactNode; sortable?: boolean; onClick?: () => void }) {
  return (
    <th className="px-4 py-2">
      <button
        onClick={onClick}
        disabled={!sortable}
        className={cn("inline-flex items-center gap-1", sortable && "hover:text-foreground")}
      >
        {children}
        {sortable && <ArrowUpDown className="h-3 w-3 opacity-60" />}
      </button>
    </th>
  );
}
