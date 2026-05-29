"use client";

import { useMemo } from "react";

import { AppShell } from "../../../components/layout/app-shell";
import { LtvBySegmentChart } from "../../../features/customer-analytics/components/LtvBySegmentChart";
import { RetentionCohortHeatmap } from "../../../features/customer-analytics/components/RetentionCohortHeatmap";
import { ltvLeaders, segmentLeaders } from "../../../features/customer-analytics/mappers";
import { useLtvBySegment } from "../../../features/customer-analytics/hooks/useLtvBySegment";
import { useRetentionCohorts } from "../../../features/customer-analytics/hooks/useRetentionCohorts";
import { useSegmentPerformance } from "../../../features/customer-analytics/hooks/useSegmentPerformance";

export default function RetentionPage() {
  const retentionQuery = useRetentionCohorts();
  const ltvQuery = useLtvBySegment();
  const segmentQuery = useSegmentPerformance();
  const ltvRows = useMemo(() => ltvLeaders(ltvQuery.data), [ltvQuery.data]);
  const segments = useMemo(() => segmentLeaders(segmentQuery.data).slice(0, 5), [segmentQuery.data]);

  return (
    <AppShell title="Retention and LTV" description="Cohort retention, customer lifetime value, and segment performance from DuckDB marts.">
      <div className="space-y-8">
        {(retentionQuery.isLoading || ltvQuery.isLoading) && <StatePanel message="Loading retention and LTV marts…" />}
        {(retentionQuery.isError || ltvQuery.isError) && <StatePanel tone="error" message="Unable to load retention or LTV analytics." />}
        {!!retentionQuery.data?.length && <RetentionCohortHeatmap rows={retentionQuery.data} />}
        {!!ltvRows.length && <LtvBySegmentChart rows={ltvRows} />}
        {!!segments.length && (
          <section className="rounded-2xl border border-border/60 bg-surface p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.3rem] text-muted-foreground">Segment performance</p>
            <div className="mt-4 grid gap-3">
              {segments.map((row) => (
                <div key={`${row.segment}-${row.region}-${row.plan_tier}`} className="grid gap-3 rounded-xl bg-surface-strong/70 p-4 text-sm md:grid-cols-4">
                  <span>{row.segment} · {row.plan_tier}</span>
                  <span className="text-muted-foreground">{row.region}</span>
                  <span>${row.current_mrr.toLocaleString()} MRR</span>
                  <span>{(row.churn_rate * 100).toFixed(1)}% churn</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function StatePanel({ message, tone = "muted" }: { message: string; tone?: "muted" | "error" }) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-surface p-5 text-sm shadow-card ${tone === "error" ? "text-danger" : "text-muted-foreground"}`}>
      {message}
    </div>
  );
}
