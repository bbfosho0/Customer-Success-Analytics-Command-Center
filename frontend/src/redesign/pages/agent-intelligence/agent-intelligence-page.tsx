"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { MobileDataRow, StatusBadge } from "../../patterns/patterns";
import { RedesignPageHeader, RedesignShell } from "../../shell/redesign-shell";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select } from "../../ui/primitives";
import { formatDuration, redesignAgents } from "../demo-data";
import { type RedesignDataState, RedesignStateSurface } from "../page-state";

function csatPercent(agent: (typeof redesignAgents)[number]) {
  return Math.round(Math.max(0, Math.min(5, agent.avg_rating)) / 5 * 100);
}

function coachingFocus(agent: (typeof redesignAgents)[number]) {
  if (agent.resolved_rate < 75) return "SLA recovery";
  if (agent.escalated_calls >= 2) return "Escalation control";
  if (agent.avg_resolution_seconds > 900) return "Handle-time reduction";
  return "Quality consistency";
}

export function RedesignAgentIntelligencePage({ state = "normal" }: { state?: RedesignDataState }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState("sla");

  const regions = useMemo(() => Array.from(new Set(redesignAgents.map((agent) => agent.region))).sort(), []);
  const ranked = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = redesignAgents.filter((agent) => {
      if (region !== "all" && agent.region !== region) return false;
      return !query || `${agent.name} ${agent.agent_id} ${agent.region}`.toLowerCase().includes(query);
    });
    return rows.sort((a, b) => {
      if (sort === "csat") return csatPercent(b) - csatPercent(a);
      if (sort === "calls") return b.total_calls - a.total_calls;
      return b.resolved_rate - a.resolved_rate;
    });
  }, [region, search, sort]);

  const top = [...redesignAgents].sort((a, b) => b.resolved_rate - a.resolved_rate).slice(0, 3);
  const coaching = [...redesignAgents].sort((a, b) => a.resolved_rate - b.resolved_rate).slice(0, 3);
  const regionCounts = regions.map((name) => ({ name, count: redesignAgents.filter((agent) => agent.region === name).length }));
  const totalAgents = Math.max(redesignAgents.length, 1);
  const watchlist = redesignAgents.filter((agent) => agent.resolved_rate < 80 || agent.escalated_calls >= 2).length;

  return (
    <RedesignShell route="agent-intelligence">
      <div className="space-y-4 md:space-y-5">
        <RedesignPageHeader
          eyebrow="Team performance"
          title="Agent Intelligence"
          description="SLA, CSAT, workload, and coaching focus in one operational ranking surface."
          actions={<Button variant="outline" size="sm">Export</Button>}
        />

        {state !== "normal" ? <RedesignStateSurface state={state} label="agent intelligence" /> : (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle>Top performers</CardTitle><CardDescription className="mt-1">Highest SLA performers in the current roster</CardDescription></CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-3">
                  {top.map((agent, index) => (
                    <div key={agent.agent_id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/[0.12] p-3">
                      <div className="min-w-0"><p className="truncate text-xs font-semibold">#{index + 1} {agent.name}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{agent.region} · {csatPercent(agent)} CSAT</p></div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-emerald-400">{agent.resolved_rate.toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2.5 md:flex-row md:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="Search agent" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search agent…" className="pl-8" />
              </div>
              <div className="flex gap-2">
                <Select aria-label="Filter agent region" value={region} onChange={(event) => setRegion(event.target.value)} className="min-w-0 flex-1 md:w-40">
                  <option value="all">All regions</option>
                  {regions.map((name) => <option key={name} value={name}>{name}</option>)}
                </Select>
                <Select aria-label="Sort agents" value={sort} onChange={(event) => setSort(event.target.value)} className="min-w-0 flex-1 md:w-36">
                  <option value="sla">SLA ↓</option>
                  <option value="csat">CSAT ↓</option>
                  <option value="calls">Calls ↓</option>
                </Select>
                <Button variant="outline" size="icon" aria-label="Coaching filters" className="hidden md:inline-flex"><SlidersHorizontal className="h-4 w-4" /></Button>
              </div>
            </div>

            <Card>
              <CardHeader><CardTitle>Leaderboard</CardTitle><CardDescription className="mt-1">Ranked by the active performance lens with coaching context preserved</CardDescription></CardHeader>
              <CardContent>
                <div className="hidden md:block">
                  <table className="w-full table-fixed text-xs">
                    <thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="w-[24%] pb-2.5">Agent</th><th className="hidden w-[16%] pb-2.5 lg:table-cell">Region</th><th className="w-[14%] pb-2.5">CSAT</th><th className="w-[14%] pb-2.5">SLA</th><th className="w-[14%] pb-2.5">Calls</th><th className="hidden w-[15%] pb-2.5 xl:table-cell">AHT</th><th className="hidden w-[25%] pb-2.5 xl:table-cell">Coaching focus</th></tr></thead>
                    <tbody>{ranked.slice(0, 8).map((agent) => (
                      <tr key={agent.agent_id} className="border-b border-border/70 last:border-0 hover:bg-muted/25">
                        <td className="py-3 pr-3"><p className="truncate font-medium">{agent.name}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{agent.agent_id}</p></td>
                        <td className="hidden truncate py-3 pr-3 text-muted-foreground lg:table-cell">{agent.region}</td>
                        <td className="py-3 pr-3 font-medium tabular-nums">{csatPercent(agent)}</td>
                        <td className="py-3 pr-3 font-semibold tabular-nums">{agent.resolved_rate.toFixed(0)}%</td>
                        <td className="py-3 pr-3 tabular-nums">{agent.total_calls}</td>
                        <td className="hidden py-3 pr-3 tabular-nums xl:table-cell">{formatDuration(agent.avg_resolution_seconds)}</td>
                        <td className="hidden py-3 xl:table-cell"><StatusBadge status={coachingFocus(agent)} /></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="space-y-2 md:hidden">
                  {ranked.slice(0, 5).map((agent, index) => (
                    <MobileDataRow key={agent.agent_id} title={`${index + 1} · ${agent.name}`} subtitle={`${agent.resolved_rate.toFixed(0)}% SLA · ${csatPercent(agent)} CSAT`} status={<StatusBadge status={coachingFocus(agent)} />} meta={[`${agent.total_calls} calls`, agent.region]} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>{typeof window === "undefined" ? "Coaching priorities" : "Coaching priorities"}</CardTitle><CardDescription className="mt-1">Lowest-SLA signals to address first</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {coaching.map((agent) => (
                    <div key={agent.agent_id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                      <div className="min-w-0"><p className="truncate text-xs font-medium">{agent.name}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{coachingFocus(agent)}</p></div>
                      <span className="text-xs font-semibold tabular-nums text-amber-400">{agent.resolved_rate.toFixed(0)}% SLA</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="hidden md:block">
                <CardHeader><CardTitle>Team distribution</CardTitle><CardDescription className="mt-1">Roster mix and watchlist concentration</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {regionCounts.slice(0, 4).map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-[11px]"><span>{item.name}</span><span className="tabular-nums text-muted-foreground">{Math.round(item.count / totalAgents * 100)}%</span></div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${Math.max(8, item.count / totalAgents * 100)}%` }} /></div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-md border border-border bg-muted/[0.12] p-3"><span className="text-xs">Team watchlist</span><span className="text-sm font-semibold tabular-nums text-amber-400">{Math.round(watchlist / totalAgents * 100)}%</span></div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </RedesignShell>
  );
}
