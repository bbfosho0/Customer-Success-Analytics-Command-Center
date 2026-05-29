"use client";

import { useMemo } from "react";

import { AppShell } from "../../../components/layout/app-shell";
import { EmptyState, ErrorState, LoadingState, SectionCard } from "../../../components/ui/figma-primitives";
import { LtvBySegmentChart } from "../../../features/customer-analytics/components/LtvBySegmentChart";
import { ltvLeaders } from "../../../features/customer-analytics/mappers";
import { useLtvBySegment } from "../../../features/customer-analytics/hooks/useLtvBySegment";

export default function LtvPage() {
  const ltvQuery = useLtvBySegment();
  const rows = useMemo(() => ltvLeaders(ltvQuery.data), [ltvQuery.data]);

  return (
    <AppShell title="Customer lifetime value" description="Estimated LTV by customer segment and plan tier from the DuckDB mart.">
      <div className="space-y-6">
        {ltvQuery.isLoading && <SectionCard><LoadingState label="Loading LTV mart" /></SectionCard>}
        {ltvQuery.isError && <SectionCard><ErrorState title="Unable to load LTV analytics" /></SectionCard>}
        {!ltvQuery.isLoading && !ltvQuery.isError && !rows.length && <SectionCard><EmptyState title="No LTV rows are available" /></SectionCard>}
        {!!rows.length && <LtvBySegmentChart rows={rows} />}
      </div>
    </AppShell>
  );
}
