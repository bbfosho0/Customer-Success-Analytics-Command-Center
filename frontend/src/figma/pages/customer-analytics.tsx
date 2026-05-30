"use client";

import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { KpiCard, SectionCard } from "../primitives";
import { PageHeader } from "../shell";
import { chartTooltipStyle, LegendDot } from "./dashboard";
import { cn } from "../ui/utils";
import { useCustomerAnalyticsOverview } from "../../features/customer-analytics/hooks/useCustomerAnalyticsOverview";
import { useChurnRiskAccounts } from "../../features/customer-analytics/hooks/useChurnRiskAccounts";
import { useRetentionCohorts } from "../../features/customer-analytics/hooks/useRetentionCohorts";
import { useLtvBySegment } from "../../features/customer-analytics/hooks/useLtvBySegment";
import { useSegmentPerformance } from "../../features/customer-analytics/hooks/useSegmentPerformance";
import { useExpansionOpportunities } from "../../features/customer-analytics/hooks/useExpansionOpportunities";
import { useCustomerHealth } from "../../features/customer-analytics/hooks/useCustomerHealth";
import { useBiExports } from "../../features/customer-analytics/hooks/useBiExports";

type Tab = "overview" | "churn-risk" | "retention" | "ltv";

const CSM_NAMES = ["Jordan Patel", "Mia Torres", "Sam Nguyen", "Alex Kim", "Riley Chen"];

export function CustomerAnalyticsPage({ initialTab = "overview" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [riskFilter, setRiskFilter] = useState<string | "all">("all");

  const overviewQuery = useCustomerAnalyticsOverview();
  const churnQuery = useChurnRiskAccounts();
  const retentionQuery = useRetentionCohorts();
  const ltvQuery = useLtvBySegment();
  const segmentQuery = useSegmentPerformance();
  const expansionQuery = useExpansionOpportunities();
  const healthQuery = useCustomerHealth();
  const exportsQuery = useBiExports();

  const healthSummary = useMemo(() => {
    const dist = overviewQuery.data?.health_distribution ?? [];
    const byRisk = new Map(dist.map((d) => [d.risk_level, d]));
    return {
      healthy: byRisk.get("Healthy")?.customers ?? 0,
      watch: byRisk.get("Watch")?.customers ?? 0,
      atRisk: byRisk.get("At Risk")?.customers ?? 0,
      critical: byRisk.get("Critical")?.customers ?? 0,
      total: dist.reduce((sum, row) => sum + row.customers, 0),
    };
  }, [overviewQuery.data]);

  const avgHealth = useMemo(() => {
    const rows = healthQuery.data ?? [];
    if (!rows.length) return 0;
    return Math.round(rows.reduce((sum, row) => sum + row.health_score, 0) / rows.length);
  }, [healthQuery.data]);

  const atRiskMrr = useMemo(() => {
    const rows = healthQuery.data ?? [];
    return rows
      .filter((row) => row.risk_level === "At Risk" || row.risk_level === "Critical")
      .reduce((sum, row) => sum + row.mrr, 0);
  }, [healthQuery.data]);

  const churnRate = useMemo(() => {
    const rows = healthQuery.data ?? [];
    if (!rows.length) return 0;
    const atRisk = rows.filter((row) => row.risk_level === "At Risk" || row.risk_level === "Critical").length;
    return (atRisk / rows.length) * 100;
  }, [healthQuery.data]);

  const ltvData = useMemo(() => (ltvQuery.data ?? []).map((row) => ({
    segment: row.segment,
    plan: row.plan_tier,
    label: `${row.segment} / ${row.plan_tier}`,
    avgMrr: row.average_mrr,
    avgLtv: row.estimated_ltv,
    count: row.customers,
  })), [ltvQuery.data]);

  const segmentPerf = useMemo(() => (segmentQuery.data ?? []).map((seg) => {
    const churnRatePct = seg.churn_rate * 100;
    const assumedChurn = seg.churn_rate > 0 ? seg.churn_rate : 0.02;
    const avgLtv = Math.round((seg.current_mrr / Math.max(seg.customers, 1)) * 0.75 / assumedChurn);
    return {
      segment: seg.segment,
      count: seg.customers,
      totalMrr: seg.current_mrr,
      avgHealthScore: Math.round(seg.avg_health_score),
      churnRisk: Math.round(churnRatePct),
      avgLtv,
    };
  }), [segmentQuery.data]);

  const retentionCohorts = useMemo(() => {
    const rows = retentionQuery.data ?? [];
    const groups = new Map<string, { month: string; size: number; m1: number | null; m3: number | null; m6: number | null; m12: number | null }>();
    rows.forEach((row) => {
      const key = row.cohort_month;
      const entry = groups.get(key) ?? { month: key, size: row.cohort_size, m1: null, m3: null, m6: null, m12: null };
      if (row.month_number === 1) entry.m1 = Math.round((row.retention_rate ?? 0) * 100);
      if (row.month_number === 3) entry.m3 = Math.round((row.retention_rate ?? 0) * 100);
      if (row.month_number === 6) entry.m6 = Math.round((row.retention_rate ?? 0) * 100);
      if (row.month_number === 12) entry.m12 = Math.round((row.retention_rate ?? 0) * 100);
      groups.set(key, entry);
    });
    return Array.from(groups.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [retentionQuery.data]);

  const churnRows = useMemo(() => churnQuery.data ?? [], [churnQuery.data]);

  const filteredCustomers = useMemo(
    () => (riskFilter === "all" ? churnRows : churnRows.filter((c) => c.risk_level === riskFilter)),
    [riskFilter, churnRows],
  );

  const healthDist = useMemo(() => (overviewQuery.data?.health_distribution ?? []).map((band) => ({
    name: band.risk_level,
    value: band.customers,
    color: band.risk_level === "Healthy"
      ? "var(--chart-1)"
      : band.risk_level === "Watch"
        ? "#60a5fa"
        : band.risk_level === "At Risk"
          ? "var(--chart-3)"
          : "var(--chart-5)",
  })), [overviewQuery.data]);

  const topAtRisk = useMemo(() => [...churnRows]
    .filter((c) => c.risk_level === "Critical" || c.risk_level === "At Risk")
    .sort((a, b) => a.health_score - b.health_score)
    .slice(0, 5), [churnRows]);

  const expandable = useMemo(() => expansionQuery.data ?? [], [expansionQuery.data]);

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
            <KpiCard label="Total accounts" value={healthSummary.total} />
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
                      <tr key={c.account_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <p className="text-foreground">{c.account_name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{c.account_id}</p>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{c.segment}</td>
                        <td className="px-4 py-2 tabular-nums">{fmtMrr(c.mrr)}</td>
                        <td className="px-4 py-2">
                          <HealthBadge score={c.health_score} risk={c.risk_level} />
                        </td>
                        <td className="max-w-[130px] truncate px-4 py-2 text-muted-foreground">{c.main_risk_driver}</td>
                        <td className="max-w-[120px] truncate px-4 py-2 text-muted-foreground">{c.recommended_action}</td>
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
                {churnRows
                  .filter((c) => c.risk_level !== "Healthy")
                  .slice(0, 5)
                  .map((c) => (
                    <div
                      key={c.account_id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <RiskDot risk={c.risk_level} />
                          <span className="truncate text-[13px]">{c.account_name}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{getCsmName(c.account_id)}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{c.recommended_action}</p>
                      </div>
                      <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">{fmtMrr(c.mrr)}</span>
                    </div>
                  ))}
              </div>
            </SectionCard>

            <SectionCard title="BI export availability" description="Tableau / CRM Analytics-ready mart datasets">
              <div className="space-y-0">
                {(exportsQuery.data ?? []).map((ds) => (
                  <div
                    key={ds.name}
                    className="flex items-center justify-between border-b border-border py-2 last:border-0"
                  >
                    <div>
                      <p className="font-mono text-[12px] text-foreground">{ds.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ds.rows} rows · Updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                onClick={() => setRiskFilter(r)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                  riskFilter === r
                    ? "border-foreground/30 bg-foreground/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {r !== "all" && <RiskDot risk={r} />}
                {r === "all"
                  ? `All (${churnRows.length})`
                  : `${r} (${churnRows.filter((c) => c.risk_level === r).length})`}
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
                    .sort((a, b) => a.health_score - b.health_score)
                    .map((c) => (
                      <tr key={c.account_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <p className="text-foreground">{c.account_name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {c.account_id}
                          </p>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{c.segment}</td>
                        <td className="px-4 py-2 text-muted-foreground">{c.plan_tier}</td>
                        <td className="px-4 py-2 tabular-nums">{fmtMrr(c.mrr)}</td>
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">{fmtLtv(estimateLtv(c.mrr, c.risk_level))}</td>
                        <td className="px-4 py-2">
                          <HealthBadge score={c.health_score} risk={c.risk_level} />
                        </td>
                        <td className="max-w-[130px] truncate px-4 py-2 text-muted-foreground">{c.main_risk_driver}</td>
                        <td className="px-4 py-2 text-muted-foreground">{getCsmName(c.account_id)}</td>
                        <td className="max-w-[120px] truncate px-4 py-2 text-muted-foreground">{c.recommended_action}</td>
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
                    {retentionCohorts.map((cohort) => (
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
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => fmtLtv(Number(v ?? 0))} />
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
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => fmtLtv(Number(v ?? 0))} />
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
                    <tr key={c.account_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-2">
                        <p className="text-foreground">{c.account_name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{c.account_id}</p>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{c.segment}</td>
                      <td className="px-4 py-2 text-muted-foreground">{c.plan_tier}</td>
                      <td className="px-4 py-2 tabular-nums">{fmtMrr(c.mrr)}</td>
                      <td className="px-4 py-2 tabular-nums">{fmtLtv(estimateLtv(c.mrr, c.expansion_readiness))}</td>
                      <td className="px-4 py-2">
                        <HealthBadge score={c.health_score} risk={c.expansion_readiness} />
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{c.region}</td>
                      <td className="px-4 py-2 text-muted-foreground">{getCsmName(c.account_id)}</td>
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

function getCsmName(id: string) {
  const seed = Array.from(id).reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return CSM_NAMES[seed % CSM_NAMES.length];
}

function estimateLtv(mrr: number, risk: string) {
  const churnRate = risk === "Critical" ? 0.08 : risk === "At Risk" ? 0.05 : risk === "Watch" ? 0.02 : 0.01;
  return Math.round((mrr * 0.75) / churnRate);
}

function fmtMrr(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

function fmtLtv(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

function HealthBadge({ score, risk }: { score: number; risk: string }) {
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
      {Math.round(score)} · {risk}
    </span>
  );
}

function RiskDot({ risk }: { risk: string }) {
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
