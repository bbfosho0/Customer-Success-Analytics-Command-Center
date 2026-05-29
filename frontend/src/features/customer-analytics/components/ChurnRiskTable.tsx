import type { ChurnRiskAccount } from "../types";

export function ChurnRiskTable({ rows }: { rows: ChurnRiskAccount[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-surface-strong text-xs uppercase tracking-[0.22rem] text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Segment</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">MRR</th>
            <th className="px-4 py-3">Health</th>
            <th className="px-4 py-3">Risk</th>
            <th className="px-4 py-3">Driver</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.account_id} className="border-t border-border/50">
              <td className="px-4 py-4 font-medium">{row.account_name}</td>
              <td className="px-4 py-4 text-muted-foreground">{row.segment}</td>
              <td className="px-4 py-4 text-muted-foreground">{row.plan_tier}</td>
              <td className="px-4 py-4">${row.mrr.toLocaleString()}</td>
              <td className="px-4 py-4">{row.health_score.toFixed(1)}</td>
              <td className="px-4 py-4">{row.risk_level}</td>
              <td className="px-4 py-4 text-muted-foreground">{row.main_risk_driver}</td>
              <td className="px-4 py-4 text-muted-foreground">{row.recommended_action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
