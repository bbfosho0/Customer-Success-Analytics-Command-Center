"use client";

import { useMemo, useState } from "react";

import { AppShell } from "../../../components/layout/app-shell";
import { EmptyState, ErrorState, LoadingState, SectionCard } from "../../../components/ui/figma-primitives";
import { ChurnRiskTable } from "../../../features/customer-analytics/components/ChurnRiskTable";
import { atRiskAccounts } from "../../../features/customer-analytics/mappers";
import { useChurnRiskAccounts } from "../../../features/customer-analytics/hooks/useChurnRiskAccounts";

const riskLevels = ["All", "Critical", "At Risk", "Watch", "Healthy"];

export default function ChurnRiskPage() {
  const [riskLevel, setRiskLevel] = useState("All");
  const query = useChurnRiskAccounts(riskLevel === "All" ? {} : { risk_level: riskLevel });
  const rows = useMemo(() => atRiskAccounts(query.data), [query.data]);

  return (
    <AppShell title="Churn risk queue" description="Prioritized Customer Success worklist from the generated churn-risk mart.">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {riskLevels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setRiskLevel(level)}
              className={`rounded-md border border-border px-3 py-1.5 text-sm ${riskLevel === level ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {level}
            </button>
          ))}
        </div>
        {query.isLoading && <SectionCard><LoadingState label="Loading churn-risk accounts" /></SectionCard>}
        {query.isError && <SectionCard><ErrorState title="Unable to load churn-risk accounts" /></SectionCard>}
        {!query.isLoading && !query.isError && !rows.length && <SectionCard><EmptyState title="No accounts match the current risk filter" /></SectionCard>}
        {!!rows.length && <ChurnRiskTable rows={rows} />}
      </div>
    </AppShell>
  );
}
