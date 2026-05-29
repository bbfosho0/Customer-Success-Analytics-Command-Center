import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronRight } from "lucide-react";
import {
  CALLS,
  INSIGHTS,
  buildIssueBreakdown,
  buildRegionPerformance,
  buildVolumeSeries,
  fmtDuration,
  fmtRelative,
} from "../data";
import { GlobalFilters, FilterState, DEFAULT_FILTERS, applyFilters } from "../filters";
import { KpiCard, SectionCard, StatusBadge, InsightItem } from "../primitives";
import { PageHeader } from "../shell";

export function DashboardPage({ onOpenCall, onAllCalls }: { onOpenCall: (id: string) => void; onAllCalls: () => void }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const filtered = useMemo(() => applyFilters(CALLS, filters), [filters]);
  const series = useMemo(() => buildVolumeSeries(filtered), [filtered]);
  const breakdown = useMemo(() => buildIssueBreakdown(filtered).slice(0, 6), [filtered]);
  const regions = useMemo(() => buildRegionPerformance(filtered), [filtered]);
  const latest = filtered.slice(0, 8);

  const resolved = filtered.filter((c) => c.status === "resolved").length;
  const escalated = filtered.filter((c) => c.status === "escalated").length;
  const avgDur = filtered.length ? Math.round(filtered.reduce((a, c) => a + c.durationSec, 0) / filtered.length) : 0;
  const resolvedRate = filtered.length ? (resolved / filtered.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Overview"
        description="Operational snapshot of AWS serverless support across regions."
      />
      <GlobalFilters value={filters} onChange={setFilters} count={filtered.length} total={CALLS.length} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
        <KpiCard label="Total calls" value={filtered.length.toLocaleString()} delta={4.2} hint="vs. prior window" />
        <KpiCard label="Avg duration" value={fmtDuration(avgDur)} delta={-2.1} hint="lower is better" />
        <KpiCard label="Resolved rate" value={resolvedRate.toFixed(1)} unit="%" delta={1.4} />
        <KpiCard label="Escalations" value={escalated.toLocaleString()} delta={-6.2} />
        <KpiCard label="Active regions" value={regions.filter((r) => r.total > 0).length} hint="of 6" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <SectionCard
          title="Call volume"
          description="Daily calls, last 14 days"
          className="lg:col-span-2"
          action={<LegendDot items={[{ label: "Calls", color: "var(--chart-1)" }, { label: "Escalated", color: "var(--chart-5)" }]} />}
        >
          <div className="h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <ComposedChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs key="defs">
                  <linearGradient key="dashboard-volume-gradient" id="dashVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" stroke="var(--border)" strokeDasharray="2 3" vertical={false} />
                <XAxis key="x-axis" dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis key="y-axis" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip key="tooltip" contentStyle={chartTooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Area key="area" type="monotone" dataKey="calls" name="Calls" stroke="var(--chart-1)" strokeWidth={1.5} fill="url(#dashVolumeGrad)" />
                <Line key="line" type="monotone" dataKey="escalated" name="Escalated" stroke="var(--chart-5)" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Issue breakdown" description="Top categories">
          <div className="h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={breakdown} layout="vertical" margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid key="grid" stroke="var(--border)" strokeDasharray="2 3" horizontal={false} />
                <XAxis key="x-axis" type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis key="y-axis" dataKey="issue" type="category" width={110} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip key="tooltip" contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar key="bar-count" dataKey="count" fill="var(--chart-2)" radius={[0, 2, 2, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Region performance" description="Calls, resolution rate, avg handle time">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {regions.map((r) => (
            <div key={r.region} className="bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] tabular-nums text-foreground">{r.region}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.total} calls</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-[20px] tabular-nums">{(r.resolvedRate * 100).toFixed(0)}%</span>
                <span className="text-[11px] text-muted-foreground">{fmtDuration(r.avgDurationSec)}</span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-accent" style={{ width: `${r.resolvedRate * 100}%` }} />
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                {r.escalated} escalated
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-3 lg:grid-cols-3">
        <SectionCard title="Insights" description="Auto-generated from analytics signals" className="lg:col-span-1">
          <div className="space-y-2">
            {INSIGHTS.map((i) => (
              <InsightItem key={i.title} {...i} />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Latest calls"
          description="Most recent inbound support interactions"
          className="lg:col-span-2"
          action={
            <button onClick={onAllCalls} className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          }
        >
          <div className="-m-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2">Call ID</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Region</th>
                  <th className="px-4 py-2">Issue</th>
                  <th className="px-4 py-2">Duration</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Started</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onOpenCall(c.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/60"
                  >
                    <td className="px-4 py-2 font-mono text-[11px] text-foreground">{c.id}</td>
                    <td className="px-4 py-2">{c.customer}</td>
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
        </SectionCard>
      </div>
    </div>
  );
}

export const chartTooltipStyle: React.CSSProperties = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 11,
  padding: "4px 8px",
  color: "var(--foreground)",
};

export function LegendDot({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-3">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-sm" style={{ background: i.color }} /> {i.label}
        </span>
      ))}
    </div>
  );
}
