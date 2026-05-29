"use client";

import { useMemo, useState } from "react";

import { AppShell } from "../../../components/layout/app-shell";
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
              className={`rounded-full border border-border/60 px-4 py-2 text-sm ${riskLevel === level ? "bg-accent text-accent-foreground" : "bg-surface text-muted-foreground"}`}
            >
              {level}
            </button>
          ))}
        </div>
        {query.isLoading && <StatePanel message="Loading churn-risk accounts…" />}
        {query.isError && <StatePanel tone="error" message="Unable to load churn-risk accounts." />}
        {!query.isLoading && !query.isError && !rows.length && <StatePanel message="No accounts match the current risk filter." />}
        {!!rows.length && <ChurnRiskTable rows={rows} />}
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
