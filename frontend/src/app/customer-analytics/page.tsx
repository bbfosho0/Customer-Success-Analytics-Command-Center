"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AppShell } from "../../components/layout/app-shell";
import { BiExportsPanel } from "../../features/customer-analytics/components/BiExportsPanel";
import { ChurnRiskTable } from "../../features/customer-analytics/components/ChurnRiskTable";
import { CustomerHealthDistribution } from "../../features/customer-analytics/components/CustomerHealthDistribution";
import { CustomerKpiGrid } from "../../features/customer-analytics/components/CustomerKpiGrid";
import { atRiskAccounts, overviewKpis } from "../../features/customer-analytics/mappers";
import { useBiExports } from "../../features/customer-analytics/hooks/useBiExports";
import { useChurnRiskAccounts } from "../../features/customer-analytics/hooks/useChurnRiskAccounts";
import { useCustomerAnalyticsOverview } from "../../features/customer-analytics/hooks/useCustomerAnalyticsOverview";

export default function CustomerAnalyticsPage() {
  const overviewQuery = useCustomerAnalyticsOverview();
  const churnQuery = useChurnRiskAccounts();
  const exportsQuery = useBiExports();
  const kpis = useMemo(() => overviewKpis(overviewQuery.data), [overviewQuery.data]);
  const churnRows = useMemo(() => atRiskAccounts(churnQuery.data).slice(0, 6), [churnQuery.data]);

  return (
    <AppShell
      title="Customer Success Analytics"
      description="Customer 360 view across churn risk, retention, LTV, support impact, and expansion readiness."
      actions={<Link className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" href="/customer-analytics/churn-risk">Risk queue</Link>}
    >
      <div className="space-y-8">
        {(overviewQuery.isLoading || churnQuery.isLoading) && <StatePanel message="Loading customer analytics marts…" />}
        {(overviewQuery.isError || churnQuery.isError) && <StatePanel tone="error" message="Unable to load customer analytics. Regenerate the phase 6 marts or switch to static demo mode." />}
        {!!kpis.length && <CustomerKpiGrid kpis={kpis} />}
        {overviewQuery.data && <CustomerHealthDistribution rows={overviewQuery.data.health_distribution} />}
        {!!churnRows.length && <ChurnRiskTable rows={churnRows} />}
        {overviewQuery.data && (
          <section className="grid gap-4 md:grid-cols-3">
            {overviewQuery.data.recommended_actions.map((action) => (
              <div key={action} className="rounded-2xl border border-border/60 bg-surface p-5 text-sm text-muted-foreground shadow-card">
                {action}
              </div>
            ))}
          </section>
        )}
        {exportsQuery.data && <BiExportsPanel rows={exportsQuery.data} />}
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
