import { useMemo, useState } from "react";
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { CALLS, buildIssueBreakdown, buildRegionPerformance, buildVolumeSeries, fmtDuration } from "../data";
import { GlobalFilters, FilterState, DEFAULT_FILTERS, applyFilters } from "../filters";
import { KpiCard, SectionCard } from "../primitives";
import { PageHeader } from "../shell";
import { chartTooltipStyle, LegendDot } from "./dashboard";
import { cn } from "../ui/utils";

export function MetricsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [tab, setTab] = useState<"overview" | "volume" | "breakdown" | "regions">("overview");
  const data = useMemo(() => applyFilters(CALLS, filters), [filters]);
  const series = useMemo(() => buildVolumeSeries(data), [data]);
  const breakdown = useMemo(() => buildIssueBreakdown(data), [data]);
  const regions = useMemo(() => buildRegionPerformance(data), [data]);

  const resolved = data.filter((c) => c.status === "resolved").length;
  const escalated = data.filter((c) => c.status === "escalated").length;
  const avgDur = data.length ? Math.round(data.reduce((a, c) => a + c.durationSec, 0) / data.length) : 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Metrics" description="Drill into volume, resolution, and regional performance." />
      <GlobalFilters value={filters} onChange={setFilters} count={data.length} total={CALLS.length} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Calls" value={data.length.toLocaleString()} delta={4.2} />
        <KpiCard label="Resolved" value={resolved.toLocaleString()} delta={1.4} />
        <KpiCard label="Escalated" value={escalated.toLocaleString()} delta={-6.2} />
        <KpiCard label="Avg duration" value={fmtDuration(avgDur)} delta={-2.1} />
      </div>

      <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 text-xs">
        {(["overview", "volume", "breakdown", "regions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded px-2.5 py-1 capitalize", tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
          >
            {t}
          </button>
        ))}
      </div>

      {(tab === "overview" || tab === "volume") && (
        <SectionCard
          title="Call volume by day"
          description="Resolved vs. escalated"
          action={<LegendDot items={[{ label: "Resolved", color: "var(--chart-1)" }, { label: "Escalated", color: "var(--chart-5)" }, { label: "All", color: "var(--chart-2)" }]} />}
        >
          <div className="h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <ComposedChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs key="defs">
                  <linearGradient key="metrics-volume-gradient" id="metricsVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" stroke="var(--border)" strokeDasharray="2 3" vertical={false} />
                <XAxis key="x-axis" dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis key="y-axis" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip key="tooltip" contentStyle={chartTooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Area key="area-resolved" type="monotone" dataKey="resolved" name="Resolved" stroke="var(--chart-1)" strokeWidth={1.75} fill="url(#metricsVolumeGrad)" dot={false} activeDot={{ r: 3 }} />
                <Line key="line-escalated" type="monotone" dataKey="escalated" name="Escalated" stroke="var(--chart-5)" strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} />
                <Line key="line-all" type="monotone" dataKey="calls" name="All" stroke="var(--chart-2)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} activeDot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {(tab === "overview" || tab === "breakdown") && (
        <div className="grid gap-3 lg:grid-cols-2">
          <SectionCard title="Issue type breakdown">
            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={breakdown} layout="vertical" margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid key="grid" stroke="var(--border)" strokeDasharray="2 3" horizontal={false} />
                  <XAxis key="x-axis" type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis key="y-axis" dataKey="issue" type="category" width={120} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip key="tooltip" contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <Bar key="bar-count" dataKey="count" fill="var(--chart-2)" radius={[0, 2, 2, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Duration trend" description="Average daily handle time (minutes)">
            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <LineChart
                  data={series.map((s) => ({ ...s, avgMin: +(((360 + s.calls * 2)) / 60).toFixed(1) }))}
                  margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid key="grid" stroke="var(--border)" strokeDasharray="2 3" vertical={false} />
                  <XAxis key="x-axis" dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <Tooltip key="tooltip" contentStyle={chartTooltipStyle} cursor={{ stroke: "var(--border)" }} formatter={(v: number) => `${v}m`} />
                  <Line key="line" type="monotone" dataKey="avgMin" name="Avg" stroke="var(--chart-3)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      )}

      {(tab === "overview" || tab === "regions") && (
        <SectionCard
          title="Region comparison"
          description="Resolved vs. escalated by region"
          action={<LegendDot items={[{ label: "Resolved", color: "var(--chart-1)" }, { label: "Escalated", color: "var(--chart-5)" }]} />}
        >
          <div className="h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart
                data={regions.map((r) => ({
                  region: r.region,
                  resolved: Math.max(0, r.total - r.escalated),
                  escalated: r.escalated,
                }))}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                barGap={4}
              >
                <CartesianGrid key="grid" stroke="var(--border)" strokeDasharray="2 3" vertical={false} />
                <XAxis key="x-axis" dataKey="region" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis key="y-axis" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip key="tooltip" contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar key="bar-resolved" dataKey="resolved" name="Resolved" fill="var(--chart-1)" radius={[2, 2, 0, 0]} barSize={14} />
                <Bar key="bar-escalated" dataKey="escalated" name="Escalated" fill="var(--chart-5)" radius={[2, 2, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
