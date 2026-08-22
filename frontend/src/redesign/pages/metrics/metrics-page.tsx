"use client";

import { useMemo, useState } from "react";
import { Activity, Clock3, Gauge, MapPinned } from "lucide-react";

import { MetricCard, StatusBadge, TabBar } from "../../patterns/patterns";
import { RedesignPageHeader, RedesignShell } from "../../shell/redesign-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/primitives";
import { formatDuration, redesignCalls, redesignMetrics, titleCase } from "../demo-data";
import { type RedesignDataState, RedesignStateSurface } from "../page-state";

export type MetricsView = "overview" | "volume" | "breakdown" | "regions";

function buildDailyVolume() {
  const grouped = new Map<string, { total: number; resolved: number; escalated: number }>();
  redesignCalls.forEach((call) => {
    const key = call.started_at ? new Date(call.started_at).toISOString().slice(5, 10) : "unknown";
    const entry = grouped.get(key) ?? { total: 0, resolved: 0, escalated: 0 };
    entry.total += 1;
    if (call.resolution_status.toLowerCase() === "resolved") entry.resolved += 1;
    if (call.resolution_status.toLowerCase() === "escalated") entry.escalated += 1;
    grouped.set(key, entry);
  });
  return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([date, values]) => ({ date, ...values }));
}

export function RedesignMetricsPage({ initialView = "overview", state = "normal" }: { initialView?: MetricsView; state?: RedesignDataState }) {
  const [view, setView] = useState<MetricsView>(initialView);
  const daily = useMemo(buildDailyVolume, []);
  const maxVolume = Math.max(...daily.map((row) => row.total), 1);
  const avgDuration = redesignCalls.length ? redesignCalls.reduce((sum, call) => sum + call.duration_seconds, 0) / redesignCalls.length : 0;
  const resolved = redesignCalls.filter((call) => call.resolution_status.toLowerCase() === "resolved").length;
  const escalated = redesignCalls.filter((call) => call.resolution_status.toLowerCase() === "escalated").length;
  const resolutionRate = redesignCalls.length ? (resolved / redesignCalls.length) * 100 : 0;

  return (
    <RedesignShell route="metrics">
      <div className="space-y-4 md:space-y-5">
        <RedesignPageHeader eyebrow="Analytics" title="Metrics" description="Four analytical lenses with distinct hierarchy for health, volume, issue pressure, and regional comparison." />
        <TabBar value={view} onChange={setView} items={[
          { value: "overview", label: "Overview" }, { value: "volume", label: "Volume" }, { value: "breakdown", label: "Breakdown" }, { value: "regions", label: "Regions" },
        ]} />

        {state !== "normal" ? <RedesignStateSurface state={state} label="metrics" /> : (
          <>
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <MetricCard label="Interactions" value={redesignCalls.length.toLocaleString()} comparison="current window" />
              <MetricCard label="Avg handle time" value={formatDuration(Math.round(avgDuration))} comparison="all interactions" />
              <MetricCard label="Resolution rate" value={`${resolutionRate.toFixed(1)}%`} comparison="target 90%" tone={resolutionRate >= 90 ? "success" : "warning"} />
              <MetricCard label="Escalations" value={escalated.toLocaleString()} comparison={`${((escalated / Math.max(redesignCalls.length, 1)) * 100).toFixed(1)}% of calls`} tone="warning" />
            </section>

            {view === "overview" ? <MetricsOverview daily={daily} maxVolume={maxVolume} /> : null}
            {view === "volume" ? <MetricsVolume daily={daily} maxVolume={maxVolume} resolutionRate={resolutionRate} avgDuration={avgDuration} /> : null}
            {view === "breakdown" ? <MetricsBreakdown avgDuration={avgDuration} /> : null}
            {view === "regions" ? <MetricsRegions /> : null}
          </>
        )}
      </div>
    </RedesignShell>
  );
}

function VolumeBars({ daily, maxVolume, compact = false }: { daily: ReturnType<typeof buildDailyVolume>; maxVolume: number; compact?: boolean }) {
  const firstDate = daily[0]?.date ?? "";
  const lastDate = daily[daily.length - 1]?.date ?? "";

  return (
    <div data-testid="metrics-volume-bars">
      <div className="mb-3 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--chart-1)", opacity: 0.85 }} />Total</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--chart-5)", opacity: 0.85 }} />Escalated</span>
      </div>
      <div className={compact ? "flex h-44 items-end gap-1.5" : "flex h-64 items-end gap-2"}>
        {daily.map((row) => (
          <div key={row.date} className="group flex h-full min-w-0 flex-1 items-end gap-[2px]" title={`${row.date}: ${row.total} calls, ${row.escalated} escalated`}>
            <div data-series="total" className="w-full rounded-sm" style={{ height: `${Math.max(8, (row.total / maxVolume) * 100)}%`, backgroundColor: "var(--chart-1)", opacity: 0.85 }} />
            <div data-series="escalated" className="w-1/4 rounded-sm" style={{ height: `${Math.max(3, (row.escalated / maxVolume) * 100)}%`, backgroundColor: "var(--chart-5)", opacity: 0.85 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>{firstDate}</span><span>{lastDate}</span></div>
    </div>
  );
}

function MetricsOverview({ daily, maxVolume }: { daily: ReturnType<typeof buildDailyVolume>; maxVolume: number }) {
  const issueMax = Math.max(...redesignMetrics.issue_breakdown.map((row) => row.value), 1);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader><CardTitle>Call volume</CardTitle><CardDescription className="mt-1">Primary operating signal, total volume with escalation context</CardDescription></CardHeader><CardContent><VolumeBars daily={daily} maxVolume={maxVolume} /></CardContent></Card>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Card><CardHeader><CardTitle>Issue type breakdown</CardTitle></CardHeader><CardContent className="space-y-2.5">{redesignMetrics.issue_breakdown.slice(0, 4).map((row, index) => <div key={row.label}><div className="flex justify-between text-[11px]"><span>{titleCase(row.label)}</span><span className="tabular-nums text-muted-foreground">{row.value}</span></div><div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.max(8, row.value / issueMax * 100)}%`, background: `var(--chart-${(index % 5) + 1})` }} /></div></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Duration pressure</CardTitle></CardHeader><CardContent><div className="flex items-end justify-between"><div><p className="text-2xl font-semibold tabular-nums">{formatDuration(Math.round(redesignCalls.reduce((sum, call) => sum + call.duration_seconds, 0) / Math.max(redesignCalls.length, 1)))}</p><p className="mt-1 text-[11px] text-muted-foreground">average handle time</p></div><Clock3 className="h-5 w-5 text-primary" /></div></CardContent></Card>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <RollingSlaByIssue />
        <RegionComparison compact />
      </div>
    </div>
  );
}

function MetricsVolume({ daily, maxVolume, resolutionRate, avgDuration }: { daily: ReturnType<typeof buildDailyVolume>; maxVolume: number; resolutionRate: number; avgDuration: number }) {
  return (
    <div className="space-y-3">
      <Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Daily call volume</CardTitle><CardDescription className="mt-1">Total interactions with escalation context across the current window</CardDescription></div><Activity className="h-5 w-5 text-primary" /></CardHeader><CardContent><VolumeBars daily={daily} maxVolume={maxVolume} /></CardContent></Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Rolling SLA</CardTitle><CardDescription className="mt-1">Resolution quality against operating target</CardDescription></CardHeader><CardContent><div className="flex items-end justify-between"><div><p className="text-3xl font-semibold tabular-nums">{resolutionRate.toFixed(1)}%</p><p className="mt-1 text-xs text-muted-foreground">90% target</p></div><Gauge className="h-6 w-6 text-[var(--chart-2)]" /></div><div className="mt-5 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-[var(--chart-2)]" style={{ width: `${Math.min(100, resolutionRate)}%` }} /></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Current window</CardTitle><CardDescription className="mt-1">Workload composition at a glance</CardDescription></CardHeader><CardContent className="grid grid-cols-2 gap-3"><WindowStat label="Avg handle" value={formatDuration(Math.round(avgDuration))} /><WindowStat label="Peak day" value={`${maxVolume} calls`} /><WindowStat label="Days sampled" value={`${daily.length}`} /><WindowStat label="Regions" value={`${redesignMetrics.region_breakdown.length}`} /></CardContent></Card>
      </div>
    </div>
  );
}

function WindowStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-border bg-muted/15 p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1.5 text-sm font-semibold tabular-nums">{value}</p></div>;
}

function MetricsBreakdown({ avgDuration }: { avgDuration: number }) {
  const issueMax = Math.max(...redesignMetrics.issue_breakdown.map((row) => row.value), 1);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card><CardHeader><CardTitle>Issue type breakdown</CardTitle><CardDescription className="mt-1">Where support demand is concentrated</CardDescription></CardHeader><CardContent className="space-y-3">{redesignMetrics.issue_breakdown.slice(0, 7).map((row, index) => <div key={row.label} className="grid grid-cols-[minmax(110px,180px)_1fr_36px] items-center gap-3"><span className="truncate text-xs">{titleCase(row.label)}</span><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.max(7, row.value / issueMax * 100)}%`, background: index === 0 ? "var(--chart-5)" : "var(--chart-1)" }} /></div><span className="text-right text-[11px] tabular-nums text-muted-foreground">{row.value}</span></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Duration trend</CardTitle><CardDescription className="mt-1">Handling-time pressure</CardDescription></CardHeader><CardContent><p className="text-3xl font-semibold tabular-nums">{formatDuration(Math.round(avgDuration))}</p><p className="mt-1 text-xs text-muted-foreground">average handle time</p><div data-testid="metrics-duration-bars" className="mt-6 grid h-28 grid-cols-8 items-end gap-1.5">{[38,52,48,61,72,66,79,70].map((height, index) => <div key={index} className="rounded-sm" style={{ height: `${height}%`, backgroundColor: "var(--chart-3)", opacity: 0.75 }} />)}</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Automation pilot</CardTitle><CardDescription className="mt-1">Candidate issue families for assisted resolution workflows</CardDescription></CardHeader><CardContent><div className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">{redesignMetrics.issue_breakdown.slice(0, 3).map((row, index) => <div key={row.label} className="bg-card p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium">{titleCase(row.label)}</p><StatusBadge status={index === 0 ? "Review" : index === 1 ? "Pilot" : "Candidate"} /></div><p className="mt-3 text-2xl font-semibold tabular-nums">{row.value}</p><p className="mt-1 text-[11px] text-muted-foreground">interactions in current window</p></div>)}</div></CardContent></Card>
    </div>
  );
}

function MetricsRegions() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-3"><RegionComparison className="xl:col-span-2" /><RegionalHealth /></div>
      <Card><CardHeader><CardTitle>Detailed region comparison</CardTitle><CardDescription className="mt-1">Ranked operating footprint, compact on phone</CardDescription></CardHeader><CardContent><div className="hidden lg:block"><table className="w-full text-xs"><thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="pb-2">Rank</th><th className="pb-2">Region</th><th className="pb-2">Volume</th><th className="pb-2">Share</th><th className="pb-2">Health</th></tr></thead><tbody>{redesignMetrics.region_breakdown.map((row, index) => <tr key={row.label} className="border-b border-border/70 last:border-0"><td className="py-3 font-semibold">#{index + 1}</td><td className="py-3">{row.label}</td><td className="py-3 tabular-nums">{row.value}</td><td className="py-3 tabular-nums text-muted-foreground">{((row.value / Math.max(redesignCalls.length,1))*100).toFixed(1)}%</td><td className="py-3"><StatusBadge status={index === 0 ? "Watch" : "Healthy"} /></td></tr>)}</tbody></table></div><div className="space-y-2 lg:hidden">{redesignMetrics.region_breakdown.map((row, index) => <div key={row.label} className="flex items-center justify-between rounded-md border border-border p-3"><div><p className="text-xs font-medium">#{index+1} · {row.label}</p><p className="mt-1 text-[10px] text-muted-foreground">{row.value} interactions</p></div><StatusBadge status={index === 0 ? "Watch" : "Healthy"} /></div>)}</div></CardContent></Card>
    </div>
  );
}

function RegionComparison({ compact = false, className }: { compact?: boolean; className?: string }) {
  const max = Math.max(...redesignMetrics.region_breakdown.map((row) => row.value), 1);
  return <Card className={className}><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Region comparison</CardTitle><CardDescription className="mt-1">Relative volume across service regions</CardDescription></div><MapPinned className="h-5 w-5 text-primary" /></CardHeader><CardContent className="space-y-3">{redesignMetrics.region_breakdown.slice(0, compact ? 4 : 6).map((row, index) => <div key={row.label}><div className="flex justify-between text-[11px]"><span>{row.label}</span><span className="tabular-nums text-muted-foreground">{row.value}</span></div><div className="mt-1.5 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${Math.max(9, row.value/max*100)}%`, opacity: 1-index*0.08 }} /></div></div>)}</CardContent></Card>;
}

function RegionalHealth() {
  return <Card><CardHeader><CardTitle>Regional health</CardTitle><CardDescription className="mt-1">Attention order for the current window</CardDescription></CardHeader><CardContent className="space-y-2">{redesignMetrics.region_breakdown.slice(0,5).map((row,index)=><div key={row.label} className="flex items-center justify-between rounded-md border border-border p-3"><div><p className="text-xs font-medium">{row.label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{row.value} calls</p></div><StatusBadge status={index===0?"Watch":"Healthy"}/></div>)}</CardContent></Card>;
}

function RollingSlaByIssue() {
  const issueSla = Array.from(
    redesignCalls.reduce((groups, call) => {
      const label = call.issue_type;
      const current = groups.get(label) ?? { total: 0, resolved: 0 };
      current.total += 1;
      if (call.resolution_status.toLowerCase() === "resolved") current.resolved += 1;
      groups.set(label, current);
      return groups;
    }, new Map<string, { total: number; resolved: number }>()),
  )
    .map(([label, values]) => ({ label, rate: values.total ? (values.resolved / values.total) * 100 : 0, total: values.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  return <Card><CardHeader><CardTitle>Rolling SLA by issue</CardTitle><CardDescription className="mt-1">Resolution rate by highest-volume issue family</CardDescription></CardHeader><CardContent className="space-y-3">{issueSla.map((row) => <div key={row.label}><div className="flex items-center justify-between gap-3 text-[11px]"><span className="truncate">{titleCase(row.label)}</span><span className="tabular-nums text-muted-foreground">{row.rate.toFixed(0)}%</span></div><div className="mt-1.5 h-2 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.max(5, Math.min(100, row.rate))}%`, backgroundColor: row.rate >= 90 ? "var(--chart-2)" : "var(--chart-5)" }} /></div></div>)}</CardContent></Card>;
}
