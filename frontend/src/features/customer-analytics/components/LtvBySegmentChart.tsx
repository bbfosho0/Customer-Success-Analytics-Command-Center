import type { LtvSegment } from "../types";

export function LtvBySegmentChart({ rows }: { rows: LtvSegment[] }) {
  const max = Math.max(...rows.map((row) => row.estimated_ltv), 1);
  return (
    <section className="rounded-2xl border border-border/60 bg-surface p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.3rem] text-muted-foreground">LTV by segment</p>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div key={`${row.segment}-${row.plan_tier}`}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{row.segment} · {row.plan_tier}</span>
              <span className="text-muted-foreground">${row.estimated_ltv.toLocaleString()}</span>
            </div>
            <div className="h-3 rounded-full bg-surface-strong">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(row.estimated_ltv / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
