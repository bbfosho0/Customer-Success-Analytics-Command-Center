"use client";

import { ArrowRight, Clock3, Headphones, ShieldCheck } from "lucide-react";

import { FilterBar, InsightPanel, MetricCard, MobileDataRow, StatusBadge } from "../../patterns/patterns";
import { RedesignPageHeader, RedesignShell } from "../../shell/redesign-shell";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/primitives";
import { formatDuration, redesignCalls, redesignMetrics, titleCase } from "../demo-data";
import { type RedesignDataState, RedesignStateSurface } from "../page-state";

const volumeBars = [42, 58, 51, 67, 63, 78, 72, 88, 69, 84, 76, 92];

export function RedesignDashboardPage({ state = "normal", onOpenCall = () => undefined, onAllCalls = () => undefined }: { state?: RedesignDataState; onOpenCall?: (id: string) => void; onAllCalls?: () => void }) {
  const calls = redesignCalls.slice(0, 8);
  const issueMax = Math.max(...redesignMetrics.issue_breakdown.map((row) => row.value), 1);

  return (
    <RedesignShell route="dashboard">
      <div className="space-y-4 md:space-y-5">
        <RedesignPageHeader
          eyebrow="Operations"
          title="Overview"
          description="A prioritized command surface for support volume, service quality, escalation pressure, and recent customer interactions."
          actions={<Button variant="outline" size="sm">Export snapshot</Button>}
        />
        <FilterBar activeCount={3} summary={`Last 7 days · ${redesignMetrics.region_breakdown.length} regions · ${redesignCalls.length} calls`} />

        {state !== "normal" ? <RedesignStateSurface state={state} label="dashboard analytics" /> : (
          <>
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Primary support KPIs">
              {redesignMetrics.kpis.map((kpi, index) => (
                <MetricCard
                  key={kpi.label}
                  label={kpi.label}
                  value={kpi.value}
                  comparison={index === 2 ? "Target 90%" : "vs previous equal window"}
                  tone={index === 3 ? "warning" : index === 2 ? "success" : "default"}
                  detail={index === 0 ? <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Headphones className="h-3 w-3" /> inbound support</div> : index === 1 ? <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Clock3 className="h-3 w-3" /> median pressure stable</div> : index === 2 ? <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck className="h-3 w-3" /> within service target</div> : null}
                />
              ))}
            </section>

            <section className="grid gap-3 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>Call volume</CardTitle>
                    <CardDescription className="mt-1">Daily interaction load with resolution and escalation context</CardDescription>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">12 day signal</span>
                </CardHeader>
                <CardContent>
                  <div className="grid h-56 grid-cols-12 items-end gap-1.5 rounded-md border border-border bg-muted/[0.12] px-3 pb-3 pt-5 sm:gap-2">
                    {volumeBars.map((height, index) => (
                      <div key={index} className="group relative flex h-full items-end">
                        <div className="w-full rounded-sm bg-[var(--chart-1)] opacity-75 transition-opacity group-hover:opacity-100" style={{ height: `${height}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Aug 10</span><span className="hidden sm:inline">Resolution remained above target through peak volume</span><span>Aug 21</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Issue mix</CardTitle><CardDescription className="mt-1">Share of current support pressure</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {redesignMetrics.issue_breakdown.slice(0, 5).map((row, index) => (
                    <div key={row.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]"><span className="truncate">{titleCase(row.label)}</span><span className="tabular-nums text-muted-foreground">{row.value}</span></div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.max(10, (row.value / issueMax) * 100)}%`, background: `var(--chart-${(index % 5) + 1})` }} /></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader className="pb-3"><CardTitle>Region performance</CardTitle><CardDescription className="mt-1">Compact comparative view, ranked by interaction volume</CardDescription></CardHeader>
              <CardContent>
                <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
                  {redesignMetrics.region_breakdown.slice(0, 4).map((row, index) => (
                    <div key={row.label} className="bg-card p-3.5">
                      <div className="flex items-center justify-between"><p className="text-xs font-medium">{row.label}</p><span className="text-[10px] text-muted-foreground">#{index + 1}</span></div>
                      <p className="mt-3 text-xl font-semibold tabular-nums">{row.value}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">calls in current window</p>
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[var(--chart-2)]" style={{ width: `${Math.max(18, 92 - index * 13)}%` }} /></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-3 xl:grid-cols-3">
              <InsightPanel items={[
                { title: "Authentication escalation pressure", detail: "Authentication and access issues remain the highest-priority coaching signal.", tone: "danger" },
                { title: "Resolution quality is stable", detail: "Current resolution performance remains above the operating target.", tone: "success" },
                { title: "Watch regional imbalance", detail: "The busiest region is carrying a disproportionate share of current volume.", tone: "warning" },
              ]} />

              <Card className="xl:col-span-2">
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div><CardTitle>Latest calls</CardTitle><CardDescription className="mt-1">Most recent support interactions</CardDescription></div>
                  <Button variant="ghost" size="sm" onClick={onAllCalls}>View all <ArrowRight className="h-3.5 w-3.5" /></Button>
                </CardHeader>
                <CardContent>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="pb-2">Call</th><th className="pb-2">Customer</th><th className="pb-2">Issue</th><th className="pb-2">Duration</th><th className="pb-2">Status</th></tr></thead>
                      <tbody>{calls.map((call) => <tr key={call.id} onClick={() => onOpenCall(call.id)} className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/25"><td className="py-2.5 font-medium">{call.id}</td><td className="py-2.5">{call.agent_name}</td><td className="py-2.5 text-muted-foreground">{call.issue_type}</td><td className="py-2.5 tabular-nums">{formatDuration(call.duration_seconds)}</td><td className="py-2.5"><StatusBadge status={call.resolution_status} /></td></tr>)}</tbody>
                    </table>
                  </div>
                  <div className="space-y-2 lg:hidden">{calls.slice(0, 5).map((call) => <MobileDataRow key={call.id} title={call.id} subtitle={`${call.agent_name} · ${call.issue_type}`} status={<StatusBadge status={call.resolution_status} />} meta={[call.customer_region, formatDuration(call.duration_seconds)]} onClick={() => onOpenCall(call.id)} />)}</div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </RedesignShell>
  );
}
