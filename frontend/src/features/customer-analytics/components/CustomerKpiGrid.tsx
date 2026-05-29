import type { CustomerAnalyticsOverview } from "../types";

export function CustomerKpiGrid({ kpis }: { kpis: CustomerAnalyticsOverview["kpis"] }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-2xl border border-border/60 bg-surface p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.28rem] text-muted-foreground">{kpi.label}</p>
          <p className="mt-3 font-display text-3xl font-semibold">{kpi.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">Generated from Customer 360 marts</p>
        </div>
      ))}
    </section>
  );
}
