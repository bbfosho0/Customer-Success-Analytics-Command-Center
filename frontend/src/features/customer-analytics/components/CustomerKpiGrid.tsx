import { FigmaKpiCard } from "../../../components/ui/figma-primitives";
import type { CustomerAnalyticsOverview } from "../types";

export function CustomerKpiGrid({ kpis }: { kpis: CustomerAnalyticsOverview["kpis"] }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {kpis.map((kpi) => (
        <FigmaKpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint="Generated from Customer 360 marts" />
      ))}
    </section>
  );
}
