import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  CUSTOMERS, RETENTION_COHORTS, RiskLevel,
  getHealthSummary, getAtRiskMrr, getAvgCustomerHealth, getChurnRatePercent,
  getLtvBySegment, getSegmentPerformance, fmtMrr, fmtLtv,
} from "../customer-data";
import { KpiCard, SectionCard } from "../primitives";
import { PageHeader } from "../shell";
import { chartTooltipStyle, LegendDot } from "./dashboard";
import { cn } from "../ui/utils";

type Tab = "overview" | "churn-risk" | "retention" | "ltv";

export function CustomerAnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");

  const summary = useMemo(() => getHealthSummary(), []);
  const atRiskMrr = useMemo(() => getAtRiskMrr(), []);
  const avgHealth = useMemo(() => getAvgCustomerHealth(), []);
  const churnRate = useMemo(() => getChurnRatePercent(), []);
  const ltvData = useMemo(() => getLtvBySegment(), []);
  const segmentPerf = useMemo(() => getSegmentPerformance(), []);

  const filteredCustomers = useMemo(
    () => (riskFilter === "all" ? CUSTOMERS : CUSTOMERS.filter((c) => c.riskLevel === riskFilter)),
    [riskFilter],
  );

  const healthDist = [
    { name: "Healthy", value: summary.healthy, color: "var(--chart-1)" },
    { name: "Watch", value: summary.watch, color: "#60a5fa" },
    { name: "At Risk", value: summary.atRisk, color: "var(--chart-3)" },
    { name: "Critical", value: summary.critical, color: "var(--chart-5)" },
  ];

  const topAtRisk = CUSTOMERS.filter((c) => c.riskLevel === "Critical" || c.riskLevel === "At Risk")
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 5);

  const expandable = CUSTOMERS.filter((c) => c.expansionReady);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customer 360"
        description="Account health, churn risk, retention cohorts, LTV, and expansion pipeline."
      />

      <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 text-xs">
        {(["overview", "churn-risk", "retention", "ltv"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded px-2.5 py-1 capitalize",
              tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.replace("-", " ")}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Total accounts" value={summary.total} />
            <KpiCard label="Avg health score" value={avgHealth} unit="/100" delta={2.1} />
            <KpiCard label="At-risk MRR" value={fmtMrr(atRiskMrr)} delta={-3.2} hint="Critical + At Risk" />
            <KpiCard label="Churn risk" value={churnRate.toFixed(1)} unit="%" delta={-1.4} />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <SectionCard
              title="Health distribution"
              description="Accounts by risk band"
              action={
                <LegendDot
                  items={healthDist.map((d) => ({ label: d.name, color: d.color }))}
                />
              }
            >
              <div className="flex h-[220px] items-center justify-center">
                <div className="h-[220px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={healthDist}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={82}
                        strokeWidth={2}
                        stroke="var(--card)"
                      >
                        {healthDist.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Churn risk queue"
              description="Top accounts by lowest health score"
              className="lg:col-span-2"
            >
              <div className="-m-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-2">Account</th>
                      <th className="px-4 py-2">Seg</th>
                      <th className="px-4 py-2">MRR</th>
                      <th className="px-4 py-2">Health</th>
                      <th className="px-4 py-2">Risk driver</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAtRisk.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <p className="text-foreground">{c.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{c.id}</p>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{c.segment}</td>
                        <td className="px-4 py-2 tabular-nums">{fmtMrr(c.mrr)}</td>
                        <td className="px-4 py-2">
                          <HealthBadge score={c.healthScore} risk={c.riskLevel} />
                        </td>
                        <td className="max-w-[130px] truncate px-4 py-2 text-muted-foreground">{c.riskDriver}</td>
                        <td className="max-w-[120px] truncate px-4 py-2 text-muted-foreground">{c.recommendedAction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <SectionCard title="Recommended actions" description="Auto-prioritized CS queue">
              <div className="space-y-2">
                {CUSTOMERS.filter((c) => c.riskLevel !== "Healthy")
                  .slice(0, 5)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <RiskDot risk={c.riskLevel} />
                          <span className="truncate text-[13px]">{c.name}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{c.csm}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{c.recommendedAction}</p>
                      </div>
                      <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">{fmtMrr(c.mrr)}</span>
                    </div>
                  ))}
              </div>
            </SectionCard>

            <SectionCard title="BI export availability" description="Tableau / CRM Analytics-ready mart datasets">
              <div className="space-y-0">
                {[
                  { name: "customer_360", rows: summary.total, updated: "Today 14:22" },
                  { name: "churn_risk_accounts", rows: summary.atRisk + summary.critical, updated: "Today 14:22" },
                  { name: "retention_cohorts", rows: RETENTION_COHORTS.length, updated: "Today 14:22" },
                  { name: "ltv_by_segment", rows: ltvData.length, updated: "Today 14:22" },
                  { name: "expansion_opportunities", rows: expandable.length, updated: "Today 14:22" },
                  { name: "segment_performance", rows: segmentPerf.length, updated: "Today 14:22" },
                ].map((ds) => (
                  <div
                    key={ds.name}
                    className="flex items-center justify-between border-b border-border py-2 last:border-0"
                  >
                    <div>
                      <p className="font-mono text-[12px] text-foreground">{ds.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ds.rows} rows · {ds.updated}
                      </p>
                    </div>
                    <button className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted">
                      Export CSV
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "churn-risk" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "Critical", "At Risk", "Watch", "Healthy"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r as RiskLevel | "all")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                  riskFilter === r
                    ? "border-foreground/30 bg-foreground/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {r !== "all" && <RiskDot risk={r as RiskLevel} />}
                {r === "all"
                  ? `All (${CUSTOMERS.length})`
                  : `${r} (${CUSTOMERS.filter((c) => c.riskLevel === r).length})`}
              </button>
            ))}
          </div>

          <SectionCard
            title={`${filteredCustomers.length} accounts`}
            description="Sorted by health score ascending — lowest health first"
          >
            <div className="-m-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2">Account</th>
                    <th className="px-4 py-2">Segment</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">MRR</th>
                    <th className="px-4 py-2">Est. LTV</th>
                    <th className="px-4 py-2">Health</th>
                    <th className="px-4 py-2">Risk driver</th>
                    <th className="px-4 py-2">CSM</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredCustomers]
                    .sort((a, b) => a.healthScore - b.healthScore)
                    .map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <p className="text-foreground">{c.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {c.id} · {c.restaurantType}
                          </p>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{c.segment}</td>
                        <td className="px-4 py-2 text-muted-foreground">{c.plan}</td>
                        <td className="px-4 py-2 tabular-nums">{fmtMrr(c.mrr)}</td>
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">{fmtLtv(c.ltv)}</td>
                        <td className="px-4 py-2">
                          <HealthBadge score={c.healthScore} risk={c.riskLevel} />
                        </td>
                        <td className="max-w-[130px] truncate px-4 py-2 text-muted-foreground">{c.riskDriver}</td>
                        <td className="px-4 py-2 text-muted-foreground">{c.csm}</td>
                        <td className="max-w-[120px] truncate px-4 py-2 text-muted-foreground">{c.recommendedAction}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "retention" && (
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <SectionCard
              title="Retention cohorts"
              description="Signup-month cohorts — retention % at M1 M3 M6 M12"
            >
              <div className="-m-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-2">Cohort</th>
                      <th className="px-4 py-2">Size</th>
                      <th className="px-4 py-2 text-center">M1</th>
                      <th className="px-4 py-2 text-center">M3</th>
                      <th className="px-4 py-2 text-center">M6</th>
                      <th className="px-4 py-2 text-center">M12</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RETENTION_COHORTS.map((cohort) => (
                      <tr key={cohort.month} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 font-mono text-[11px]">{cohort.month}</td>
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">{cohort.size}</td>
                        <HeatCell pct={cohort.m1} />
                        <HeatCell pct={cohort.m3} />
                        <HeatCell pct={cohort.m6} />
                        <HeatCell pct={cohort.m12} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="LTV by segment" description="Average estimated lifetime value">
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={ltvData.slice(0, 6)}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="2 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmtLtv(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtLtv(v)} />
                    <Bar dataKey="avgLtv" name="Avg LTV" fill="var(--chart-1)" radius={[0, 2, 2, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Segment performance"
            description="MRR, health, churn risk, and LTV by customer segment"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {segmentPerf.map((seg) => (
                <div key={seg.segment} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px]">{seg.segment}</span>
                    <span className="text-[11px] text-muted-foreground">{seg.count} accounts</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Metric label="Total MRR" value={fmtMrr(seg.totalMrr)} />
                    <Metric label="Avg health" value={`${seg.avgHealthScore} / 100`} />
                    <Metric label="Churn risk" value={`${seg.churnRisk}%`} />
                    <Metric label="Avg LTV" value={fmtLtv(seg.avgLtv)} />
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${seg.avgHealthScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "ltv" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {segmentPerf.map((seg) => (
              <KpiCard key={seg.segment} label={`${seg.segment} avg LTV`} value={fmtLtv(seg.avgLtv)} />
            ))}
          </div>

          <SectionCard
            title="LTV by segment and plan"
            description="Estimated customer lifetime value — avg MRR × 0.75 gross margin ÷ monthly churn rate"
            action={
              <LegendDot
                items={[
                  { label: "Avg LTV", color: "var(--chart-1)" },
                  { label: "Avg MRR", color: "var(--chart-2)" },
                ]}
              />
            }
          >
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ltvData} margin={{ top: 4, right: 12, left: 12, bottom: 32 }} barGap={4}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => fmtLtv(v)}
                    width={52}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtLtv(v)} />
                  <Bar dataKey="avgLtv" name="Avg LTV" fill="var(--chart-1)" radius={[2, 2, 0, 0]} barSize={18} />
                  <Bar dataKey="avgMrr" name="Avg MRR" fill="var(--chart-2)" radius={[2, 2, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Expansion opportunities"
            description="Accounts with health ≥ 70 and MRR > $500 — strong candidates for upsell or cross-sell"
          >
            <div className="-m-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2">Account</th>
                    <th className="px-4 py-2">Segment</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Current MRR</th>
                    <th className="px-4 py-2">Est. LTV</th>
                    <th className="px-4 py-2">Health</th>
                    <th className="px-4 py-2">Region</th>
                    <th className="px-4 py-2">CSM</th>
                  </tr>
                </thead>
                <tbody>
                  {expandable.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-2">
                        <p className="text-foreground">{c.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{c.id}</p>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{c.segment}</td>
                      <td className="px-4 py-2 text-muted-foreground">{c.plan}</td>
                      <td className="px-4 py-2 tabular-nums">{fmtMrr(c.mrr)}</td>
                      <td className="px-4 py-2 tabular-nums">{fmtLtv(c.ltv)}</td>
                      <td className="px-4 py-2">
                        <HealthBadge score={c.healthScore} risk={c.riskLevel} />
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{c.region}</td>
                      <td className="px-4 py-2 text-muted-foreground">{c.csm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

function HealthBadge({ score, risk }: { score: number; risk: RiskLevel }) {
  const cls =
    risk === "Healthy"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
      : risk === "Watch"
        ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
        : risk === "At Risk"
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]", cls)}>
      <RiskDot risk={risk} />
      {score} · {risk}
    </span>
  );
}

function RiskDot({ risk }: { risk: RiskLevel }) {
  const color =
    risk === "Healthy"
      ? "bg-emerald-500"
      : risk === "Watch"
        ? "bg-sky-500"
        : risk === "At Risk"
          ? "bg-amber-500"
          : "bg-rose-500";
  return <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", color)} />;
}

function HeatCell({ pct }: { pct: number | null }) {
  if (pct === null)
    return (
      <td className="px-4 py-2 text-center text-[11px] text-muted-foreground">—</td>
    );
  const cls =
    pct >= 90
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
      : pct >= 80
        ? "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300"
        : pct >= 70
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
          : pct >= 60
            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
            : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300";
  return (
    <td className="px-4 py-2 text-center">
      <span className={cn("inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] tabular-nums", cls)}>
        {pct}%
      </span>
    </td>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}
