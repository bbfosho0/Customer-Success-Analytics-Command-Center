import { SectionCard } from "../../../components/ui/figma-primitives";
import type { LtvSegment } from "../types";

export function LtvBySegmentChart({ rows }: { rows: LtvSegment[] }) {
  const max = Math.max(...rows.map((row) => row.estimated_ltv), 1);
  return (
    <SectionCard title="LTV by segment">
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={`${row.segment}-${row.plan_tier}`}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{row.segment} · {row.plan_tier}</span>
              <span className="text-muted-foreground">${row.estimated_ltv.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(row.estimated_ltv / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
