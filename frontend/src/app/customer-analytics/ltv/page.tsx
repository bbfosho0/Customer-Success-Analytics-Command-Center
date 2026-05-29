"use client";

import { useMemo } from "react";

import { AppShell } from "../../../components/layout/app-shell";
import { LtvBySegmentChart } from "../../../features/customer-analytics/components/LtvBySegmentChart";
import { ltvLeaders } from "../../../features/customer-analytics/mappers";
import { useLtvBySegment } from "../../../features/customer-analytics/hooks/useLtvBySegment";

export default function LtvPage() {
  const ltvQuery = useLtvBySegment();
  const rows = useMemo(() => ltvLeaders(ltvQuery.data), [ltvQuery.data]);

  return (
    <AppShell title="Customer lifetime value" description="Estimated LTV by customer segment and plan tier from the DuckDB mart.">
      <div className="space-y-6">
        {ltvQuery.isLoading && <StatePanel message="Loading LTV mart…" />}
        {ltvQuery.isError && <StatePanel tone="error" message="Unable to load LTV analytics." />}
        {!ltvQuery.isLoading && !ltvQuery.isError && !rows.length && <StatePanel message="No LTV rows are available." />}
        {!!rows.length && <LtvBySegmentChart rows={rows} />}
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
