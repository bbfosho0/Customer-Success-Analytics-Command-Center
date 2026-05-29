import { SectionCard } from "../../../components/ui/figma-primitives";
import type { CustomerAnalyticsOverview } from "../types";

const bandTone: Record<string, string> = {
  Healthy: "bg-success/70",
  Watch: "bg-warning/80",
  "At Risk": "bg-danger/70",
  Critical: "bg-danger",
};

export function CustomerHealthDistribution({ rows }: { rows: CustomerAnalyticsOverview["health_distribution"] }) {
  const maxCustomers = Math.max(...rows.map((row) => row.customers), 1);
  return (
    <SectionCard title="Customer health" description="MRR-weighted health bands">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Risk distribution</h2>
        </div>
        <p className="text-sm text-muted-foreground">MRR-weighted health bands</p>
      </div>
      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.risk_level}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{row.risk_level}</span>
              <span className="text-muted-foreground">
                {row.customers} accounts · ${row.mrr.toLocaleString()}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full ${bandTone[row.risk_level] ?? "bg-accent"}`} style={{ width: `${(row.customers / maxCustomers) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
