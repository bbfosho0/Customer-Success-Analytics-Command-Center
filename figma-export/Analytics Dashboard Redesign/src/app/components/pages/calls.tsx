import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { AGENTS, CALLS, fmtDuration, fmtRelative } from "../data";
import { GlobalFilters, FilterState, DEFAULT_FILTERS, applyFilters } from "../filters";
import { EmptyState, ErrorState, LoadingState, SectionCard, StatusBadge } from "../primitives";
import { PageHeader } from "../shell";
import { cn } from "../ui/utils";

type SortField = "startedAt" | "durationSec" | "agent" | "region" | "status";
const PAGE_SIZE = 12;

export function CallsPage({ onOpen, fakeState }: { onOpen: (id: string) => void; fakeState?: "loading" | "error" | "empty" }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [agent, setAgent] = useState<string>("all");
  const [minDur, setMinDur] = useState(0);
  const [maxDur, setMaxDur] = useState(1800);
  const [sortField, setSortField] = useState<SortField>("startedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    let r = applyFilters(CALLS, filters);
    if (agent !== "all") r = r.filter((c) => c.agentId === agent);
    r = r.filter((c) => c.durationSec >= minDur && c.durationSec <= maxDur);
    r.sort((a, b) => {
      const av = (a as any)[sortField];
      const bv = (b as any)[sortField];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [filters, agent, minDur, maxDur, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(f); setSortDir("desc"); }
  };

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
      <GlobalFilters value={filters} onChange={(f) => { setFilters(f); setPage(1); }} count={rows.length} total={CALLS.length} />

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2.5">
        <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 h-8 text-xs">
          <span className="text-muted-foreground">Agent</span>
          <select value={agent} onChange={(e) => setAgent(e.target.value)} style={{ colorScheme: "inherit" }} className="bg-transparent outline-none [&>option]:bg-popover [&>option]:text-popover-foreground">
            <option value="all">All</option>
            {AGENTS.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
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
        {fakeState === "loading" ? (
          <LoadingState label="Fetching calls" />
        ) : fakeState === "error" ? (
          <ErrorState body="The analytics service returned a 503. Retry in a few seconds." retry={() => {}} />
        ) : fakeState === "empty" || rows.length === 0 ? (
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
