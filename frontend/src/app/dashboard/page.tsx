"use client";

import { useEffect, useMemo, useState } from "react";
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

import { AppShell } from "../../components/layout/app-shell";
import { FigmaKpiCard, InsightItem, SectionCard, StatusBadge } from "../../components/ui/figma-primitives";
import { useCalls, useMetrics } from "../../lib/api/hooks";
import { proactiveInsights } from "../../lib/data/dashboard-data";
import { useDemoFilters } from "../../lib/state/demoFilters";
import {
  buildCallsQueryFromSelection,
  buildDashboardKpisFromMetrics,
  buildIssueBreakdownFromMetrics,
  buildRegionPerformanceFromMetrics,
  buildVolumeSeriesFromCalls,
  toUiCallRecords,
} from "../../lib/viz/transformers";

export default function DashboardPage() {
  const [chartsReady, setChartsReady] = useState(false);
  const selection = useDemoFilters((state) => state.selection);
  const callsQueryParams = useMemo(() => buildCallsQueryFromSelection(selection, 1, 200), [selection]);
  const callsQuery = useCalls(callsQueryParams);
  const metricsQuery = useMetrics({
    region: selection.region === "Global" ? undefined : selection.region,
    issue_type: selection.intent === "All intents" ? undefined : selection.intent,
  });

  const kpis = useMemo(() => (metricsQuery.data ? buildDashboardKpisFromMetrics(metricsQuery.data) : []), [metricsQuery.data]);
  const issues = useMemo(() => (metricsQuery.data ? buildIssueBreakdownFromMetrics(metricsQuery.data).slice(0, 6) : []), [metricsQuery.data]);
  const regions = useMemo(() => (metricsQuery.data ? buildRegionPerformanceFromMetrics(metricsQuery.data) : []), [metricsQuery.data]);
  const calls = useMemo(() => toUiCallRecords(callsQuery.data?.data ?? []), [callsQuery.data]);
  const series = useMemo(() => buildVolumeSeriesFromCalls(callsQuery.data?.data ?? []), [callsQuery.data]);
  const latest = calls.slice(0, 8);

  useEffect(() => {
    setChartsReady(true);
  }, []);

  return (
    <AppShell title="Overview" description="Operational snapshot across customer support, account risk, and ETL health.">
      <div className="space-y-4">
        {(metricsQuery.isLoading || callsQuery.isLoading) && <StateStrip message="Loading dashboard analytics..." />}
        {(metricsQuery.isError || callsQuery.isError) && <StateStrip tone="error" message="Unable to load dashboard analytics." />}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <FigmaKpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              delta={kpi.trend === "down" ? -Math.abs(kpi.delta) : kpi.trend === "up" ? Math.abs(kpi.delta) : 0}
              hint={kpi.descriptor}
            />
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <SectionCard title="Call volume" description="Recent support interactions" className="lg:col-span-2">
            <div className="h-[220px] w-full min-w-0">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="2 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: "var(--border)" }} />
                    <Area type="monotone" dataKey="total" name="Calls" stroke="var(--chart-1)" strokeWidth={1.5} fill="url(#dashVolumeGrad)" />
                    <Line type="monotone" dataKey="forecast" name="Forecast" stroke="var(--chart-5)" strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <ChartSkeleton />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Issue breakdown" description="Top categories">
            <div className="h-[220px] w-full min-w-0">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={issues} layout="vertical" margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="2 3" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="issue" type="category" width={110} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 2, 2, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartSkeleton />
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Region performance" description="Volume, SLA, CSAT, and escalations">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {regions.map((region) => (
              <div key={region.region} className="bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] tabular-nums text-foreground">{region.region}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{region.volume} calls</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[20px] tabular-nums">{region.sla.toFixed(0)}%</span>
                  <span className="text-[11px] text-muted-foreground">{region.csat.toFixed(0)} CSAT</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-accent" style={{ width: `${region.sla}%` }} />
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground">{region.escalations} escalated</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-3 lg:grid-cols-3">
          <SectionCard title="Insights" description="Generated from analytics signals">
            <div className="space-y-2">
              {proactiveInsights.slice(0, 3).map((insight) => (
                <InsightItem
                  key={insight.title}
                  severity={insight.severity === "warning" ? "warn" : insight.severity}
                  title={insight.title}
                  body={insight.detail}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Latest calls" description="Most recent support interactions" className="lg:col-span-2">
            <div className="-m-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2">Case</th>
                    <th className="px-4 py-2">Agent</th>
                    <th className="px-4 py-2">Region</th>
                    <th className="px-4 py-2">Issue</th>
                    <th className="px-4 py-2">Duration</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map((call) => (
                    <tr key={call.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-2 font-mono text-[11px] text-foreground">{call.caseId}</td>
                      <td className="px-4 py-2">{call.agent}</td>
                      <td className="px-4 py-2 text-muted-foreground">{call.region}</td>
                      <td className="px-4 py-2">{call.issue}</td>
                      <td className="px-4 py-2 tabular-nums">{Math.round(call.durationSeconds / 60)}m</td>
                      <td className="px-4 py-2"><StatusBadge status={call.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

const chartTooltipStyle: React.CSSProperties = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 11,
  padding: "4px 8px",
  color: "var(--foreground)",
};

function StateStrip({ message, tone = "muted" }: { message: string; tone?: "muted" | "error" }) {
  return <div className={`rounded-md border border-border bg-card px-3 py-2 text-xs ${tone === "error" ? "text-destructive" : "text-muted-foreground"}`}>{message}</div>;
}

function ChartSkeleton() {
  return <div className="h-full rounded-md bg-muted/40" />;
}
