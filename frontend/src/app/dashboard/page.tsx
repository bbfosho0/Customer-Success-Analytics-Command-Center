"use client";

import { useMemo } from "react";

import { CategoryBreakdown } from "../../components/charts/category-breakdown";
import { KpiCard } from "../../components/charts/kpi-card";
import { RegionGrid } from "../../components/charts/region-grid";
import { VolumeArea } from "../../components/charts/volume-area";
import { InsightBoard } from "../../components/feedback/insight-board";
import { GlobalFilters } from "../../components/filters/global-filters";
import { CallsTable } from "../../components/tables/calls-table";
import { DashboardHero } from "../../features/dashboard/hero";
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
  const selection = useDemoFilters((state) => state.selection);
  const callsQueryParams = useMemo(() => buildCallsQueryFromSelection(selection, 1, 200), [selection]);
  const callsQuery = useCalls(callsQueryParams);
  const metricsQuery = useMetrics({
    region: selection.region === "Global" ? undefined : selection.region,
    issue_type: selection.intent === "All intents" ? undefined : selection.intent,
  });

  const kpis = useMemo(() => (metricsQuery.data ? buildDashboardKpisFromMetrics(metricsQuery.data) : []), [metricsQuery.data]);
  const stabilityKpis = useMemo(() => kpis.filter((kpi) => kpi.category === "stability"), [kpis]);
  const efficiencyKpis = useMemo(() => kpis.filter((kpi) => kpi.category === "efficiency"), [kpis]);
  const categoryBreakdown = useMemo(() => (metricsQuery.data ? buildIssueBreakdownFromMetrics(metricsQuery.data) : []), [metricsQuery.data]);
  const regions = useMemo(() => (metricsQuery.data ? buildRegionPerformanceFromMetrics(metricsQuery.data) : []), [metricsQuery.data]);
  const volumeSeries = useMemo(() => buildVolumeSeriesFromCalls(callsQuery.data?.data ?? []), [callsQuery.data]);
  const latestCalls = useMemo(() => toUiCallRecords(callsQuery.data?.data.slice(0, 10) ?? []), [callsQuery.data]);
  const activeCount = callsQuery.data?.meta.total ?? 0;

  return (
    <div className="space-y-10 pb-16">
      <DashboardHero
        totalInteractions={activeCount}
        backlogMinutes={42}
        refreshEta={metricsQuery.isFetching || callsQuery.isFetching ? "Refreshing…" : "API synced"}
        focusStreams={["Premium voice", "EU compliance", "AI deflection"]}
        slaAttainment={92.4}
        slaTarget={95}
      />
      <GlobalFilters activeCount={activeCount} totalCount={activeCount} />
      {(metricsQuery.isLoading || callsQuery.isLoading) && <StatePanel message="Loading dashboard analytics…" />}
      {(metricsQuery.isError || callsQuery.isError) && <StatePanel tone="error" message="Unable to load dashboard analytics from the API." />}
      {!metricsQuery.isLoading && !metricsQuery.isError && !kpis.length && <StatePanel message="No dashboard metrics are available yet." />}
      {!!kpis.length && (
        <section className="grid gap-6 lg:grid-cols-2">
          <KpiRunway title="Service health" tagline="Stability guardrails" kpis={stabilityKpis} />
          <KpiRunway title="Efficiency" tagline="Productivity levers" kpis={efficiencyKpis} />
        </section>
      )}
      {!!categoryBreakdown.length && (
        <section className="grid gap-6 xl:grid-cols-[3fr_2fr]">
          <VolumeArea data={volumeSeries} title="Interaction flow" subTitle="Actuals vs. five-day forecast" />
          <CategoryBreakdown items={categoryBreakdown} />
        </section>
      )}
      {!!regions.length && <RegionGrid regions={regions} />}
      <InsightBoard insights={proactiveInsights} />
      {!!latestCalls.length && <CallsTable data={latestCalls} caption="Latest transcripts" />}
    </div>
  );
}

function StatePanel({ message, tone = "muted" }: { message: string; tone?: "muted" | "error" }) {
  return (
    <div className={`rounded-3xl border border-border/70 bg-surface p-6 text-sm shadow-card ${tone === "error" ? "text-danger" : "text-muted-foreground"}`}>
      {message}
    </div>
  );
}

function KpiRunway({
  title,
  tagline,
  kpis,
}: {
  title: string;
  tagline: string;
  kpis: ReturnType<typeof buildDashboardKpisFromMetrics>;
}) {
  return (
    <div className="rounded-[28px] border border-border/60 bg-surface/90 p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{tagline}</p>
        </div>
        <span className="rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground">
          {kpis.length} signals
        </span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>
    </div>
  );
}
