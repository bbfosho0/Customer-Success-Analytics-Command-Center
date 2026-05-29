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
import {
  buildDashboardKpis,
  buildIssueBreakdown,
  buildRegionPerformance,
  buildVolumeSeries,
  proactiveInsights,
} from "../../lib/data/dashboard-data";
import { callsDataset } from "../../lib/data/calls-data";
import { useDemoFilters } from "../../lib/state/demoFilters";
import { filterCalls } from "../../lib/utils/callFiltering";

export default function DashboardPage() {
  const selection = useDemoFilters((state) => state.selection);

  const filteredCalls = useMemo(() => filterCalls(callsDataset, selection), [selection]);
  const kpis = useMemo(() => buildDashboardKpis(filteredCalls), [filteredCalls]);
  const stabilityKpis = useMemo(() => kpis.filter((kpi) => kpi.category === "stability"), [kpis]);
  const efficiencyKpis = useMemo(() => kpis.filter((kpi) => kpi.category === "efficiency"), [kpis]);
  const volumeSeries = useMemo(() => buildVolumeSeries(filteredCalls), [filteredCalls]);
  const categoryBreakdown = useMemo(() => buildIssueBreakdown(filteredCalls), [filteredCalls]);
  const regions = useMemo(() => buildRegionPerformance(filteredCalls), [filteredCalls]);
  const latestCalls = useMemo(() => filteredCalls.slice(0, 10), [filteredCalls]);

  return (
    <div className="space-y-10 pb-16">
      <DashboardHero
        totalInteractions={filteredCalls.length}
        backlogMinutes={42}
        refreshEta="Refresh in 07:15"
        focusStreams={["Premium voice", "EU compliance", "AI deflection"]}
        slaAttainment={92.4}
        slaTarget={95}
      />
      <GlobalFilters activeCount={filteredCalls.length} totalCount={callsDataset.length} />
      <section className="grid gap-6 lg:grid-cols-2">
        <KpiRunway title="Service health" tagline="Stability guardrails" kpis={stabilityKpis} />
        <KpiRunway title="Efficiency" tagline="Productivity levers" kpis={efficiencyKpis} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <VolumeArea data={volumeSeries} title="Interaction flow" subTitle="Actuals vs. five-day forecast" />
        <CategoryBreakdown items={categoryBreakdown} />
      </section>
      <RegionGrid regions={regions} />
      <InsightBoard insights={proactiveInsights} />
      <CallsTable data={latestCalls} caption="Latest transcripts" />
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
  kpis: ReturnType<typeof buildDashboardKpis>;
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
