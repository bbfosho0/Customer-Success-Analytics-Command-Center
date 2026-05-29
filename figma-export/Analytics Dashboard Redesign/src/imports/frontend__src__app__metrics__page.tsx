"use client";

import { useMemo } from "react";

import { KpiCard } from "../../components/charts/kpi-card";
import { GlobalFilters } from "../../components/filters/global-filters";
import { AppShell } from "../../components/layout/app-shell";
import {
  automationPrograms,
  buildChannelMetrics,
  buildMetricsKpis,
  slaTrend,
  type AutomationProgram,
  type ChannelMetric,
  type SlaTrendPoint,
} from "../../lib/data/metrics-data";
import { callsDataset } from "../../lib/data/calls-data";
import { useDemoFilters } from "../../lib/state/demoFilters";
import { filterCalls } from "../../lib/utils/callFiltering";

export default function MetricsPage() {
  const selection = useDemoFilters((state) => state.selection);

  const filteredCalls = useMemo(() => filterCalls(callsDataset, selection), [selection]);
  const kpis = useMemo(() => buildMetricsKpis(filteredCalls), [filteredCalls]);
  const channels = useMemo(() => buildChannelMetrics(filteredCalls), [filteredCalls]);

  return (
    <AppShell
      title="Metrics observatory"
      description="Live QA, SLA, and automation telemetry to prove the local-first mirror is production ready."
    >
      <GlobalFilters activeCount={filteredCalls.length} totalCount={callsDataset.length} />
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <TrendPanel data={slaTrend} />
        <AutomationPanel programs={automationPrograms} />
      </section>
      <ChannelTable metrics={channels} />
    </AppShell>
  );
}

function TrendPanel({ data }: { data: SlaTrendPoint[] }) {
  return (
    <article className="rounded-3xl border border-border/70 bg-surface p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Rolling SLA</p>
      <div className="mt-6 space-y-6">
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
    </article>
  );
}

function AutomationPanel({ programs }: { programs: AutomationProgram[] }) {
  return (
    <article className="rounded-3xl border border-border/70 bg-surface p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Automation pilots</p>
      <ul className="mt-5 space-y-4 text-sm">
        {programs.map((program) => (
          <li key={program.id} className="rounded-2xl border border-border/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{program.name}</p>
                <p className="text-xs text-muted-foreground">{program.descriptor}</p>
              </div>
              <span className="text-xs uppercase tracking-[0.35rem] text-muted-foreground">{program.owner}</span>
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
    </article>
  );
}

function ChannelTable({ metrics }: { metrics: ChannelMetric[] }) {
  return (
    <article className="rounded-3xl border border-border/70 bg-surface shadow-card">
      <div className="border-b border-border/60 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Channel quality</p>
        <p className="text-sm text-muted-foreground">Share, CSAT, and automation to prep the AWS go-live.</p>
      </div>
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
    </article>
  );
}
