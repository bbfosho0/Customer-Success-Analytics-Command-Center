"use client";

import { useMemo } from "react";

import { KpiCard } from "../../components/charts/kpi-card";
import { GlobalFilters } from "../../components/filters/global-filters";
import { AppShell } from "../../components/layout/app-shell";
import { EmptyState, ErrorState, LoadingState, SectionCard } from "../../components/ui/figma-primitives";
import {
  automationPrograms,
  buildChannelMetrics,
  slaTrend,
  type AutomationProgram,
  type ChannelMetric,
  type SlaTrendPoint,
} from "../../lib/data/metrics-data";
import { useCalls, useMetrics } from "../../lib/api/hooks";
import { useDemoFilters } from "../../lib/state/demoFilters";
import {
  buildCallsQueryFromSelection,
  buildDashboardKpisFromMetrics,
  toUiCallRecords,
} from "../../lib/viz/transformers";

export default function MetricsPage() {
  const selection = useDemoFilters((state) => state.selection);

  const callsQueryParams = useMemo(() => buildCallsQueryFromSelection(selection, 1, 200), [selection]);
  const callsQuery = useCalls(callsQueryParams);
  const metricsQuery = useMetrics({
    region: selection.region === "Global" ? undefined : selection.region,
    issue_type: selection.intent === "All intents" ? undefined : selection.intent,
  });
  const filteredCalls = useMemo(() => toUiCallRecords(callsQuery.data?.data ?? []), [callsQuery.data]);
  const kpis = useMemo(() => (metricsQuery.data ? buildDashboardKpisFromMetrics(metricsQuery.data) : []), [metricsQuery.data]);
  const channels = useMemo(() => buildChannelMetrics(filteredCalls), [filteredCalls]);
  const activeCount = callsQuery.data?.meta.total ?? 0;

  return (
    <AppShell
      title="Metrics observatory"
      description="Live QA, SLA, and automation telemetry to prove the local-first mirror is production ready."
    >
      <GlobalFilters activeCount={activeCount} totalCount={activeCount} />
      {(metricsQuery.isLoading || callsQuery.isLoading) && <SectionCard><LoadingState label="Loading metric drill-downs" /></SectionCard>}
      {(metricsQuery.isError || callsQuery.isError) && <SectionCard><ErrorState title="Unable to load metric drill-downs from the API" /></SectionCard>}
      {!metricsQuery.isLoading && !metricsQuery.isError && !kpis.length && <SectionCard><EmptyState title="No metrics are available yet" /></SectionCard>}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <TrendPanel data={slaTrend} />
        <AutomationPanel programs={automationPrograms} />
      </section>
      {channels.length ? <ChannelTable metrics={channels} /> : <SectionCard><EmptyState title="No channel metrics match the current filters" /></SectionCard>}
    </AppShell>
  );
}

function TrendPanel({ data }: { data: SlaTrendPoint[] }) {
  return (
    <SectionCard title="Rolling SLA">
      <div className="space-y-5">
        {data.map((point) => (
          <div key={point.label}>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{point.label}</span>
              <span className="font-semibold text-foreground">{point.sla.toFixed(1)}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(point.sla, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Backlog {point.backlogMinutes}m</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function AutomationPanel({ programs }: { programs: AutomationProgram[] }) {
  return (
    <SectionCard title="Automation pilots">
      <ul className="space-y-3 text-sm">
        {programs.map((program) => (
          <li key={program.id} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{program.name}</p>
                <p className="text-xs text-muted-foreground">{program.descriptor}</p>
              </div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{program.owner}</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Coverage</span>
                <span className="text-foreground">
                  {program.coverage}% / target {program.target}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-border/60">
                <div
                  className="h-full rounded-full bg-success"
                  style={{ width: `${Math.min(program.coverage, 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function ChannelTable({ metrics }: { metrics: ChannelMetric[] }) {
  return (
    <SectionCard title="Channel quality" description="Share, CSAT, and automation to prep the AWS go-live." className="overflow-hidden">
      <table className="min-w-full divide-y divide-border/60 text-sm">
        <thead className="text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-6 py-3 text-left">Channel</th>
            <th className="px-4 py-3 text-left">Share</th>
            <th className="px-4 py-3 text-left">CSAT</th>
            <th className="px-4 py-3 text-left">Automation</th>
            <th className="px-4 py-3 text-left">AHT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {metrics.map((metric) => (
            <tr key={metric.channel}>
              <td className="px-6 py-4 font-semibold capitalize text-foreground">{metric.channel}</td>
              <td className="px-4 py-4">{metric.share}%</td>
              <td className="px-4 py-4">{metric.csat}%</td>
              <td className="px-4 py-4">{metric.automation}%</td>
              <td className="px-4 py-4">{metric.avgHandleTime}m</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
