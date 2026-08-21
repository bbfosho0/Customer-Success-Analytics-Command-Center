"use client";

import { useMemo, useState } from "react";
import { Download, HeartPulse, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";

import { InsightPanel, MetricCard, MobileDataRow, StatusBadge, TabBar } from "../../patterns/patterns";
import { RedesignPageHeader, RedesignShell } from "../../shell/redesign-shell";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/primitives";
import { formatMoney, redesignCustomer } from "../demo-data";
import { type RedesignDataState, RedesignStateSurface } from "../page-state";

export type Customer360View = "overview" | "churn-risk" | "retention" | "ltv";

const riskTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Healthy: "success",
  Watch: "warning",
  "At Risk": "warning",
  Critical: "danger",
};

export function RedesignCustomer360Page({ initialView = "overview", state = "normal" }: { initialView?: Customer360View; state?: RedesignDataState }) {
  const [view, setView] = useState<Customer360View>(initialView);
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const churnRows = useMemo(() => riskFilter === "all" ? redesignCustomer.churn : redesignCustomer.churn.filter((row) => row.risk_level === riskFilter), [riskFilter]);
  const totalMrr = redesignCustomer.churn.reduce((sum, row) => sum + row.mrr, 0);
  const avgHealth = redesignCustomer.churn.length ? redesignCustomer.churn.reduce((sum, row) => sum + row.health_score, 0) / redesignCustomer.churn.length : 0;
  const atRiskRows = redesignCustomer.churn.filter((row) => row.risk_level === "Critical" || row.risk_level === "At Risk");
  const atRiskMrr = atRiskRows.reduce((sum, row) => sum + row.mrr, 0);

  return (
    <RedesignShell route="customer-360">
      <div className="space-y-4 md:space-y-5">
        <RedesignPageHeader
          eyebrow="Customer intelligence"
          title="Customer 360"
          description="Account health, churn pressure, retention cohorts, lifetime value, and action queues in one operational workspace."
          actions={<Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> Export</Button>}
        />
        <TabBar value={view} onChange={setView} items={[
          { value: "overview", label: "Overview" }, { value: "churn-risk", label: "Churn Risk" }, { value: "retention", label: "Retention" }, { value: "ltv", label: "LTV" },
        ]} />

        {state !== "normal" ? <RedesignStateSurface state={state} label="customer analytics" /> : (
          <>
            {view === "overview" ? <CustomerOverview avgHealth={avgHealth} atRiskMrr={atRiskMrr} totalMrr={totalMrr} /> : null}
            {view === "churn-risk" ? <CustomerChurnRisk rows={churnRows} riskFilter={riskFilter} setRiskFilter={setRiskFilter} /> : null}
            {view === "retention" ? <CustomerRetention /> : null}
            {view === "ltv" ? <CustomerLtv /> : null}
          </>
        )}
      </div>
    </RedesignShell>
  );
}

function CustomerOverview({ avgHealth, atRiskMrr, totalMrr }: { avgHealth: number; atRiskMrr: number; totalMrr: number }) {
  const topRisk = redesignCustomer.churn.slice(0, 5);
  const healthTotal = redesignCustomer.overview.health_distribution.reduce((sum, row) => sum + row.customers, 0) || 1;
  return (
    <div className="space-y-3">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Active accounts" value={redesignCustomer.churn.length} comparison="customer portfolio" />
        <MetricCard label="Current MRR" value={formatMoney(totalMrr)} comparison="active portfolio" />
        <MetricCard label="Avg health score" value={avgHealth.toFixed(0)} comparison="out of 100" tone={avgHealth >= 70 ? "success" : "warning"} />
        <MetricCard label="At-risk MRR" value={formatMoney(atRiskMrr)} comparison="Critical + At Risk" tone="danger" />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Account health distribution</CardTitle><CardDescription className="mt-1">Portfolio distribution by current risk band</CardDescription></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {redesignCustomer.overview.health_distribution.map((row) => (
                <div key={row.risk_level} className="rounded-lg border border-border bg-muted/[0.12] p-4">
                  <div className="flex items-center justify-between"><StatusBadge status={row.risk_level} /><span className="text-xs tabular-nums text-muted-foreground">{((row.customers / healthTotal) * 100).toFixed(0)}%</span></div>
                  <div className="mt-4 flex items-end justify-between"><div><p className="text-2xl font-semibold tabular-nums">{row.customers}</p><p className="mt-1 text-[10px] text-muted-foreground">accounts · {formatMoney(row.mrr)} MRR</p></div><HeartPulse className="h-5 w-5 text-primary" /></div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${Math.max(7, row.customers / healthTotal * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <InsightPanel title="Recommended actions" items={redesignCustomer.overview.recommended_actions.map((detail, index) => ({ title: index === 0 ? "Protect critical renewals" : index === 1 ? "Gate expansion by health" : "Join support and success context", detail, tone: index === 0 ? "danger" : index === 1 ? "warning" : "info" }))} />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Churn risk queue</CardTitle><CardDescription className="mt-1">Lowest-health accounts first, paired with the recommended action</CardDescription></CardHeader>
          <CardContent>
            <div className="hidden overflow-x-auto lg:block"><table className="min-w-[760px] w-full text-xs"><thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="pb-2.5">Account</th><th className="pb-2.5">Segment</th><th className="pb-2.5">MRR</th><th className="pb-2.5">Health</th><th className="pb-2.5">Driver</th><th className="pb-2.5">Action</th></tr></thead><tbody>{topRisk.map((row) => <tr key={row.account_id} className="border-b border-border/70 last:border-0"><td className="py-3 pr-3"><p className="font-medium">{row.account_name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{row.customer_success_manager}</p></td><td className="py-3 pr-3 text-muted-foreground">{row.segment}</td><td className="py-3 pr-3 tabular-nums">{formatMoney(row.mrr)}</td><td className="py-3 pr-3"><StatusBadge status={`${row.health_score.toFixed(0)} · ${row.risk_level}`} /></td><td className="max-w-[180px] py-3 pr-3 text-muted-foreground">{row.main_risk_driver}</td><td className="max-w-[220px] py-3 text-muted-foreground">{row.recommended_action}</td></tr>)}</tbody></table></div>
            <div className="space-y-2 lg:hidden">{topRisk.map((row) => <MobileDataRow key={row.account_id} title={row.account_name} subtitle={row.recommended_action} status={<StatusBadge status={row.risk_level} />} meta={[`${row.health_score.toFixed(0)} health`, formatMoney(row.mrr), row.segment]} />)}</div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>BI exports</CardTitle><CardDescription className="mt-1">Analytics-ready customer datasets</CardDescription></CardHeader><CardContent className="space-y-2">{redesignCustomer.exports.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 rounded-md border border-border p-3"><div className="min-w-0"><p className="truncate font-mono text-[11px]">{item.name}.csv</p><p className="mt-0.5 text-[10px] text-muted-foreground">{item.rows} rows</p></div><StatusBadge status="Ready" /></div>)}</CardContent></Card>
      </section>
    </div>
  );
}

function CustomerChurnRisk({ rows, riskFilter, setRiskFilter }: { rows: typeof redesignCustomer.churn; riskFilter: string; setRiskFilter: (value: string) => void }) {
  const critical = redesignCustomer.churn.filter((row) => row.risk_level === "Critical").length;
  const atRisk = redesignCustomer.churn.filter((row) => row.risk_level === "At Risk").length;
  const drivers = Array.from(new Map(redesignCustomer.churn.map((row) => [row.main_risk_driver, row])).keys()).slice(0, 4);
  return (
    <div className="space-y-3">
      <section className="grid grid-cols-3 gap-3">
        <MetricCard label="Risk accounts" value={critical + atRisk} comparison="Critical + At Risk" tone="danger" />
        <MetricCard label="Critical" value={critical} comparison="immediate action" tone="danger" />
        <MetricCard label="At Risk" value={atRisk} comparison="success plan" tone="warning" />
      </section>
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 [scrollbar-width:none]">{["all","Critical","At Risk","Watch","Healthy"].map((risk) => <button key={risk} type="button" onClick={() => setRiskFilter(risk)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${riskFilter === risk ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{risk === "all" ? `All ${redesignCustomer.churn.length}` : `${risk} ${redesignCustomer.churn.filter((row) => row.risk_level === risk).length}`}</button>)}</div>
      <Card>
        <CardHeader><CardTitle>Risk accounts</CardTitle><CardDescription className="mt-1">Lowest health first, with driver, owner, and next action kept visible</CardDescription></CardHeader>
        <CardContent>
          <div className="hidden overflow-x-auto lg:block"><table className="min-w-[960px] w-full text-xs"><thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="pb-2.5">Account</th><th className="pb-2.5">Segment</th><th className="pb-2.5">MRR</th><th className="pb-2.5">Health</th><th className="pb-2.5">Driver</th><th className="pb-2.5">CSM</th><th className="pb-2.5">Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.account_id} className="border-b border-border/70 last:border-0"><td className="py-3 pr-3 font-medium">{row.account_name}</td><td className="py-3 pr-3 text-muted-foreground">{row.segment}</td><td className="py-3 pr-3 tabular-nums">{formatMoney(row.mrr)}</td><td className="py-3 pr-3"><StatusBadge status={`${row.health_score.toFixed(0)} · ${row.risk_level}`} /></td><td className="max-w-[190px] py-3 pr-3 text-muted-foreground">{row.main_risk_driver}</td><td className="py-3 pr-3 text-muted-foreground">{row.customer_success_manager}</td><td className="max-w-[240px] py-3 text-muted-foreground">{row.recommended_action}</td></tr>)}</tbody></table></div>
          <div className="space-y-2 lg:hidden">{rows.map((row) => <MobileDataRow key={row.account_id} title={row.account_name} subtitle={`${row.main_risk_driver} · ${row.recommended_action}`} status={<StatusBadge status={row.risk_level} />} meta={[`${row.health_score.toFixed(0)} health`, formatMoney(row.mrr), row.customer_success_manager]} />)}</div>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Top risk drivers</CardTitle></CardHeader><CardContent className="space-y-2">{drivers.map((driver, index) => <div key={driver} className="flex items-center justify-between rounded-md border border-border p-3"><p className="text-xs">{driver}</p><span className="text-xs font-semibold tabular-nums">{redesignCustomer.churn.filter((row) => row.main_risk_driver === driver).length}</span></div>)}</CardContent></Card>
        <InsightPanel title="Action mix" items={[{ title: "Executive / CSM intervention", detail: `${critical} accounts require immediate risk review or direct success intervention.`, tone: "danger" }, { title: "Adoption and renewal plans", detail: `${atRisk} accounts are best served by structured adoption or renewal plays.`, tone: "warning" }]} />
      </div>
    </div>
  );
}

function CustomerRetention() {
  const cohorts = useMemo(() => {
    const map = new Map<string, { month: string; size: number; values: Record<number, number> }>();
    redesignCustomer.retention.forEach((row) => {
      const entry = map.get(row.cohort_month) ?? { month: row.cohort_month, size: row.cohort_size, values: {} };
      entry.values[row.month_number] = Math.round(row.retention_rate * 100);
      map.set(row.cohort_month, entry);
    });
    return Array.from(map.values()).slice(-6);
  }, []);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card><CardHeader><CardTitle>Retention cohorts</CardTitle><CardDescription className="mt-1">Cohort survival across lifecycle checkpoints</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="min-w-[600px] w-full text-xs"><thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="pb-2">Cohort</th><th className="pb-2">Size</th>{[0,1,3,6,12].map((month)=><th key={month} className="pb-2">M{month}</th>)}</tr></thead><tbody>{cohorts.map((cohort)=><tr key={cohort.month} className="border-b border-border/70 last:border-0"><td className="py-3 font-medium">{cohort.month.slice(0,7)}</td><td className="py-3 tabular-nums">{cohort.size}</td>{[0,1,3,6,12].map((month)=>{const value=cohort.values[month];return <td key={month} className="py-3"><span className="inline-flex min-w-11 justify-center rounded px-2 py-1 text-[11px] font-medium" style={{ background: typeof value === "number" ? `color-mix(in srgb, var(--chart-2) ${Math.max(12,value)}%, transparent)` : "var(--muted)", color:"var(--foreground)" }}>{typeof value === "number" ? `${value}%` : "—"}</span></td>})}</tr>)}</tbody></table></div></CardContent></Card>
        <Card><CardHeader><CardTitle>LTV by segment</CardTitle><CardDescription className="mt-1">Economic value beside retention context</CardDescription></CardHeader><CardContent className="space-y-4">{redesignCustomer.ltv.map((row)=>{const max=Math.max(...redesignCustomer.ltv.map((item)=>item.estimated_ltv),1);return <div key={`${row.segment}-${row.plan_tier}`}><div className="flex justify-between gap-3"><div><p className="text-xs font-medium">{row.segment}</p><p className="text-[10px] text-muted-foreground">{row.customers} accounts · {row.plan_tier}</p></div><p className="text-xs font-semibold tabular-nums">{formatMoney(row.estimated_ltv)}</p></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-[var(--chart-1)]" style={{width:`${Math.max(6,row.estimated_ltv/max*100)}%`}}/></div></div>})}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Segment performance</CardTitle><CardDescription className="mt-1">Retention context paired with health, MRR, and pipeline</CardDescription></CardHeader><CardContent><div className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">{redesignCustomer.segments.map((row)=><div key={`${row.segment}-${row.region}`} className="bg-card p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium">{row.segment}</p><StatusBadge status={row.churn_rate > .2 ? "Watch" : "Healthy"}/></div><p className="mt-4 text-2xl font-semibold tabular-nums">{row.avg_health_score.toFixed(0)}</p><p className="text-[10px] text-muted-foreground">avg health · {formatMoney(row.current_mrr)} MRR</p><div className="mt-3 text-[10px] text-muted-foreground">{(row.churn_rate*100).toFixed(0)}% churn · {formatMoney(row.weighted_pipeline_amount)} weighted pipeline</div></div>)}</div></CardContent></Card>
    </div>
  );
}

function CustomerLtv() {
  const maxLtv = Math.max(...redesignCustomer.ltv.map((row) => row.estimated_ltv), 1);
  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-3">{redesignCustomer.ltv.map((row)=><MetricCard key={`${row.segment}-${row.plan_tier}`} label={`${row.segment} avg LTV`} value={formatMoney(row.estimated_ltv)} comparison={`${row.customers} accounts · ${row.plan_tier}`} detail={<div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-[var(--chart-1)]" style={{width:`${Math.max(6,row.estimated_ltv/maxLtv*100)}%`}}/></div>} />)}</section>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Card><CardHeader><CardTitle>Lifetime value by segment</CardTitle><CardDescription className="mt-1">Value concentration and average recurring revenue</CardDescription></CardHeader><CardContent className="space-y-5">{redesignCustomer.ltv.map((row,index)=><div key={`${row.segment}-${row.plan_tier}`}><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-medium">{row.segment}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{row.plan_tier} · {formatMoney(row.average_mrr)} avg MRR</p></div><p className="text-lg font-semibold tabular-nums">{formatMoney(row.estimated_ltv)}</p></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{width:`${Math.max(7,row.estimated_ltv/maxLtv*100)}%`,background:`var(--chart-${index+1})`}}/></div></div>)}</CardContent></Card>
        <InsightPanel title="Expansion readiness" items={redesignCustomer.segments.map((row)=>({ title: `${row.segment}: ${formatMoney(row.weighted_pipeline_amount)} weighted`, detail: `Health ${row.avg_health_score.toFixed(0)} with ${(row.churn_rate*100).toFixed(0)}% churn. ${row.avg_health_score >= 75 ? "Strongest segment for expansion conversations." : "Stabilize health before advancing expansion."}`, tone: row.avg_health_score >= 75 ? "success" : "warning" }))} />
      </div>
      <Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Segment economics</CardTitle><CardDescription className="mt-1">MRR, health, churn, and pipeline in one comparison surface</CardDescription></div><Sparkles className="h-5 w-5 text-primary" /></CardHeader><CardContent><div className="hidden overflow-x-auto md:block"><table className="w-full text-xs"><thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="pb-2">Segment</th><th className="pb-2">Accounts</th><th className="pb-2">MRR</th><th className="pb-2">Health</th><th className="pb-2">Churn</th><th className="pb-2">Pipeline</th></tr></thead><tbody>{redesignCustomer.segments.map((row)=><tr key={`${row.segment}-${row.region}`} className="border-b border-border/70 last:border-0"><td className="py-3 font-medium">{row.segment}</td><td className="py-3 tabular-nums">{row.customers}</td><td className="py-3 tabular-nums">{formatMoney(row.current_mrr)}</td><td className="py-3 tabular-nums">{row.avg_health_score.toFixed(0)}</td><td className="py-3 tabular-nums">{(row.churn_rate*100).toFixed(0)}%</td><td className="py-3 tabular-nums">{formatMoney(row.weighted_pipeline_amount)}</td></tr>)}</tbody></table></div><div className="space-y-2 md:hidden">{redesignCustomer.segments.map((row)=><div key={`${row.segment}-${row.region}`} className="rounded-md border border-border p-3"><div className="flex items-center justify-between"><p className="text-xs font-medium">{row.segment}</p><TrendingUp className="h-4 w-4 text-primary" /></div><div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground"><span>{formatMoney(row.current_mrr)} MRR</span><span>{row.avg_health_score.toFixed(0)} health</span><span>{(row.churn_rate*100).toFixed(0)}% churn</span><span>{formatMoney(row.weighted_pipeline_amount)} pipeline</span></div></div>)}</div></CardContent></Card>
    </div>
  );
}
