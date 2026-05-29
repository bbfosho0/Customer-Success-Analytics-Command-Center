import { Fragment } from "react";

import { SectionCard } from "../../../components/ui/figma-primitives";
import { retentionCohorts, retentionMonths } from "../mappers";
import type { RetentionCohortRow } from "../types";

export function RetentionCohortHeatmap({ rows }: { rows: RetentionCohortRow[] }) {
  const cohorts = retentionCohorts(rows);
  const months = retentionMonths(rows);
  const lookup = new Map(rows.map((row) => [`${row.cohort_month}-${row.month_number}`, row.retention_rate ?? 0]));

  return (
    <SectionCard title="Retention cohorts">
      <div className="overflow-x-auto">
        <div className="grid min-w-[680px] gap-2" style={{ gridTemplateColumns: `160px repeat(${months.length}, minmax(70px, 1fr))` }}>
          <div className="text-xs text-muted-foreground">Signup month</div>
          {months.map((month) => (
            <div key={month} className="text-xs text-muted-foreground">M{month}</div>
          ))}
          {cohorts.map((cohort) => (
            <Fragment key={cohort}>
              <div className="rounded-md bg-muted px-3 py-2 text-sm">{cohort.slice(0, 7)}</div>
              {months.map((month) => {
                const value = lookup.get(`${cohort}-${month}`) ?? 0;
                return (
                  <div
                    key={`${cohort}-${month}`}
                    className="rounded-md px-3 py-2 text-center text-sm text-foreground"
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
    </SectionCard>
  );
}
