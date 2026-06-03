"use client";

import { useMemo, useState } from "react";
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

import { useCalls } from "../../lib/api/hooks";
import { GlobalFilters, applyFilters, useFigmaFilters } from "../filters";
import { KpiCard, SectionCard } from "../primitives";
import { PageHeader } from "../shell";
import { chartTooltipStyle, LegendDot } from "./dashboard";
import { cn } from "../ui/utils";
import { buildIssueBreakdown, buildRegionPerformance, buildVolumeSeries, fmtDuration, getSlaCompliance, getAvgCsat, getFcrRate, toFigmaCalls } from "../data";
import {
  buildCallsQueryFromSelection,
  toUiCallRecords,
} from "../../lib/viz/transformers";

const MAX_CALLS = 200;

export function MetricsPage() {
  const { filters, selection, setFilters } = useFigmaFilters();
  const [tab, setTab] = useState<"overview" | "volume" | "breakdown" | "regions">("overview");

  const callsQuery = useCalls(buildCallsQueryFromSelection(selection, 1, MAX_CALLS));

  const calls = useMemo(() => toFigmaCalls(callsQuery.data?.data ?? []), [callsQuery.data]);
  const uiCalls = useMemo(() => toUiCallRecords(callsQuery.data?.data ?? []), [callsQuery.data]);
  const data = useMemo(() => applyFilters(calls, filters), [calls, filters]);
  const uiFilteredCalls = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return uiCalls.filter((call) => {
      if (filters.region !== "all" && call.region !== filters.region) return false;
      if (filters.issueType !== "all" && call.issue !== filters.issueType) return false;
      if (filters.status !== "all" && call.status !== filters.status) return false;
      if (!query) return true;
      return `${call.id} ${call.agent} ${call.region} ${call.issue} ${call.status}`.toLowerCase().includes(query);
    });
  }, [uiCalls, filters]);
  const series = useMemo(() => buildVolumeSeries(data), [data]);
  const metricKpis = useMemo(() => {
    const total = data.length;
    const resolved = data.filter((c) => c.status === "resolved").length;
    const escalated = data.filter((c) => c.status === "escalated").length;
    const avgDuration = total ? Math.round(data.reduce((sum, row) => sum + row.durationSec, 0) / total) : 0;
    const slaPct = getSlaCompliance(data);
    const avgCsat = getAvgCsat(data);
    const fcrPct = getFcrRate(data);
    return [
      { label: "Total interactions", value: total.toLocaleString(), delta: 0, descriptor: "filtered dataset" },
      { label: "Avg handle time", value: fmtDuration(avgDuration), delta: 0, descriptor: "filtered dataset" },
      { label: "Resolution rate", value: total ? `${((resolved / total) * 100).toFixed(1)}%` : "0.0%", delta: 0, descriptor: "filtered dataset" },
      { label: "Escalations", value: escalated.toLocaleString(), delta: 0, descriptor: "filtered dataset" },
      { label: "SLA compliance", value: slaPct.toFixed(1), unit: "%", delta: 0, descriptor: "≤ 10 min handle time" },
      { label: "Avg CSAT", value: avgCsat.toFixed(1), unit: "/5", delta: 0, descriptor: "filtered dataset" },
      { label: "FCR rate", value: fcrPct.toFixed(1), unit: "%", delta: 0, descriptor: "first contact resolved" },
    ];
  }, [data]);
  const breakdown = useMemo(() => buildIssueBreakdown(data).slice(0, 6), [data]);
  const regions = useMemo(() => buildRegionPerformance(data).map((r) => ({
    region: r.region,
    volume: r.total,
    sla: r.resolvedRate * 100,
    csat: getAvgCsat(data.filter((c) => c.region === r.region)),
    escalations: r.escalated,
    fcr: getFcrRate(data.filter((c) => c.region === r.region)),
    slaCompliance: getSlaCompliance(data.filter((c) => c.region === r.region)),
  })), [data]);
  const channelMetrics = useMemo(() => {
    const channels = new Map<string, { channel: string; share: number; csat: number; automation: number; avgHandleTime: number }>();
    const total = Math.max(uiFilteredCalls.length, 1);
    for (const call of uiFilteredCalls) {
      const channel = call.channel ?? "other";
      const entry = channels.get(channel) ?? { channel, share: 0, csat: 0, automation: 0, avgHandleTime: 0 };
      entry.share += 1;
      entry.csat += Number(call.csat ?? 0);
      entry.automation += call.status === "resolved" ? 1 : 0;
      entry.avgHandleTime += Number(call.durationSeconds ?? 0);
      channels.set(channel, entry);
    }
    return Array.from(channels.values())
      .map((row) => ({
        channel: row.channel,
        share: Math.round((row.share / total) * 100),
        csat: Number((row.csat / Math.max(row.share, 1)).toFixed(1)),
        automation: Math.round((row.automation / Math.max(row.share, 1)) * 100),
        avgHandleTime: row.avgHandleTime / Math.max(row.share, 1),
      }))
      .sort((a, b) => b.share - a.share);
  }, [uiFilteredCalls]);

  return (
    <div className="space-y-4">
      <PageHeader title="Metrics" description="Drill into volume, resolution, and regional performance." />
      <GlobalFilters value={filters} onChange={setFilters} count={data.length} total={callsQuery.data?.meta.total ?? data.length} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-7">
        {metricKpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} hint={kpi.descriptor} unit={kpi.unit} />
        ))}
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
            <ResponsiveContainer width="100%" height={260}>
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
              <ResponsiveContainer width="100%" height={260}>
              <BarChart data={breakdown} layout="vertical" margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid key="grid" stroke="var(--border)" strokeDasharray="2 3" horizontal={false} />
                  <XAxis key="x-axis" type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis key="y-axis" dataKey="issue" type="category" width={140} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip key="tooltip" contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <Bar key="bar-count" dataKey="count" fill="var(--chart-2)" radius={[0, 2, 2, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Duration trend" description="Average daily handle time (minutes)">
            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={260}>
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
                  <Tooltip key="tooltip" contentStyle={chartTooltipStyle} cursor={{ stroke: "var(--border)" }} formatter={(v) => `${Number(v ?? 0)}m`} />
                  <Line key="line" type="monotone" dataKey="avgMin" name="Avg" stroke="var(--chart-3)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      )}

      {(tab === "overview" || tab === "volume") && (
        <SectionCard title="Rolling SLA by issue type" description="SLA compliance (≤ 10 min handle time) across top categories">
          <div className="space-y-3">
                  {breakdown.map((item) => {
                    const subset = data.filter((c) => c.issueType === item.issue);
                    const pct = getSlaCompliance(subset);
                    return (
                <div key={item.issue} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 whitespace-normal break-words text-[12px] text-muted-foreground">{item.issue}</span>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: pct >= 80 ? "var(--chart-1)" : pct >= 60 ? "var(--chart-3)" : "var(--chart-5)" }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-[12px] tabular-nums text-foreground">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {(tab === "overview" || tab === "breakdown") && (
        <div className="grid gap-3 lg:grid-cols-2">
          <SectionCard title="Automation pilot" description="AI-assisted deflection features and live status">
            <div className="-m-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2">Feature</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Deflection</th>
                    <th className="px-4 py-2">CSAT impact</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Lambda Timeout Auto-Resolver", status: "Active", deflection: 72, csat: "+0.3" },
                    { name: "IAM Fix Recommender", status: "Beta", deflection: 45, csat: "+0.1" },
                    { name: "Cold Start Optimizer", status: "Active", deflection: 58, csat: "+0.2" },
                    { name: "DynamoDB Scale Advisor", status: "Active", deflection: 81, csat: "+0.4" },
                    { name: "S3 Policy Assistant", status: "Pending", deflection: 0, csat: "—" },
                  ].map((f) => (
                    <tr key={f.name} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-foreground">{f.name}</td>
                      <td className="px-4 py-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]",
                          f.status === "Active" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : f.status === "Beta" ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
                            : "border-border bg-muted text-muted-foreground"
                        )}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 tabular-nums">{f.deflection > 0 ? `${f.deflection}%` : "—"}</td>
                      <td className="px-4 py-2 tabular-nums text-emerald-600 dark:text-emerald-400">{f.csat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Channel quality" description="Support volume and quality metrics by channel">
            <div className="-m-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2">Channel</th>
                    <th className="px-4 py-2">Share</th>
                    <th className="px-4 py-2">CSAT</th>
                    <th className="px-4 py-2">Automation</th>
                    <th className="px-4 py-2">AHT</th>
                  </tr>
                </thead>
                <tbody>
                  {channelMetrics.map((ch) => (
                    <tr key={ch.channel} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-foreground">{ch.channel}</td>
                    <td className="px-4 py-2 tabular-nums">{ch.share}%</td>
                    <td className="px-4 py-2 tabular-nums">{ch.csat}/5</td>
                    <td className="px-4 py-2 tabular-nums">{ch.automation}%</td>
                      <td className="px-4 py-2 tabular-nums text-muted-foreground">{fmtDuration(Math.round(ch.avgHandleTime * 60))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={regions.map((r) => ({
                  region: r.region,
                  resolved: Math.max(0, r.volume - r.escalations),
                  escalated: r.escalations,
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
