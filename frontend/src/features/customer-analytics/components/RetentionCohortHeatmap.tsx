import { Fragment } from "react";

import { retentionCohorts, retentionMonths } from "../mappers";
import type { RetentionCohortRow } from "../types";

export function RetentionCohortHeatmap({ rows }: { rows: RetentionCohortRow[] }) {
  const cohorts = retentionCohorts(rows);
  const months = retentionMonths(rows);
  const lookup = new Map(rows.map((row) => [`${row.cohort_month}-${row.month_number}`, row.retention_rate ?? 0]));

  return (
    <section className="rounded-2xl border border-border/60 bg-surface p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.3rem] text-muted-foreground">Retention cohorts</p>
      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-[680px] gap-2" style={{ gridTemplateColumns: `160px repeat(${months.length}, minmax(70px, 1fr))` }}>
          <div className="text-xs text-muted-foreground">Signup month</div>
          {months.map((month) => (
            <div key={month} className="text-xs text-muted-foreground">M{month}</div>
          ))}
          {cohorts.map((cohort) => (
            <Fragment key={cohort}>
              <div className="rounded-xl bg-surface-strong px-3 py-2 text-sm">{cohort.slice(0, 7)}</div>
              {months.map((month) => {
                const value = lookup.get(`${cohort}-${month}`) ?? 0;
                return (
                  <div
                    key={`${cohort}-${month}`}
                    className="rounded-xl px-3 py-2 text-center text-sm text-foreground"
                    style={{ backgroundColor: `rgba(46, 125, 90, ${0.18 + value * 0.62})` }}
                  >
                    {(value * 100).toFixed(0)}%
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
