"use client";

import { Award, Gauge, MessageSquareText, TrendingUp } from "lucide-react";

import { InsightPanel, MetricCard, RankingRow, StatusBadge } from "../../patterns/patterns";
import { RedesignPageHeader, RedesignShell } from "../../shell/redesign-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/primitives";
import { formatDuration, redesignAgents } from "../demo-data";
import { type RedesignDataState, RedesignStateSurface } from "../page-state";

function agentScore(agent: (typeof redesignAgents)[number]) {
  const rating = Math.max(0, Math.min(5, Number(agent.avg_rating ?? 0))) * 12;
  const resolution = Math.max(0, Math.min(100, Number(agent.resolved_rate ?? 0))) * 0.35;
  const efficiency = Math.max(0, 25 - Math.min(25, Number(agent.avg_resolution_seconds ?? 0) / 180));
  return Math.round(rating + resolution + efficiency);
}

export function RedesignAgentIntelligencePage({ state = "normal" }: { state?: RedesignDataState }) {
  const ranked = [...redesignAgents].sort((a, b) => agentScore(b) - agentScore(a));
  const avgResolution = redesignAgents.length ? redesignAgents.reduce((sum, agent) => sum + agent.resolved_rate, 0) / redesignAgents.length : 0;
  const avgHandle = redesignAgents.length ? redesignAgents.reduce((sum, agent) => sum + agent.avg_resolution_seconds, 0) / redesignAgents.length : 0;
  const escalations = redesignAgents.reduce((sum, agent) => sum + agent.escalated_calls, 0);

  return (
    <RedesignShell route="agent-intelligence">
      <div className="space-y-4 md:space-y-5">
        <RedesignPageHeader eyebrow="Team performance" title="Agent Intelligence" description="A ranked operational view of quality, resolution, efficiency, and coaching signals without turning the page into a generic leaderboard." />

        {state !== "normal" ? <RedesignStateSurface state={state} label="agent intelligence" /> : (
          <>
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <MetricCard label="Active agents" value={redesignAgents.length} comparison="current fixture roster" detail={<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Award className="h-3 w-3" /> ranked by quality</div>} />
              <MetricCard label="Resolution rate" value={`${avgResolution.toFixed(1)}%`} comparison="team average" tone="success" detail={<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><TrendingUp className="h-3 w-3" /> primary outcome</div>} />
              <MetricCard label="Avg resolution time" value={formatDuration(Math.round(avgHandle))} comparison="team average" detail={<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Gauge className="h-3 w-3" /> efficiency signal</div>} />
              <MetricCard label="Escalations" value={escalations} comparison="current roster" tone={escalations > 0 ? "warning" : "success"} />
            </section>

            <section className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              <Card>
                <CardHeader><CardTitle>Performance ranking</CardTitle><CardDescription className="mt-1">Composite view of resolution quality, customer rating, and handling efficiency</CardDescription></CardHeader>
                <CardContent>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="min-w-[760px] w-full text-xs">
                      <thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="pb-2.5">Rank</th><th className="pb-2.5">Agent</th><th className="pb-2.5">Region</th><th className="pb-2.5">Score</th><th className="pb-2.5">Resolution</th><th className="pb-2.5">Rating</th><th className="pb-2.5">Avg time</th><th className="pb-2.5">Escalations</th></tr></thead>
                      <tbody>{ranked.map((agent, index) => (
                        <tr key={agent.agent_id} className="border-b border-border/70 last:border-0 hover:bg-muted/25">
                          <td className="py-3 font-semibold tabular-nums">#{index + 1}</td>
                          <td className="py-3"><p className="font-medium">{agent.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{agent.agent_id}</p></td>
                          <td className="py-3 text-muted-foreground">{agent.region}</td>
                          <td className="py-3 text-sm font-semibold tabular-nums">{agentScore(agent)}</td>
                          <td className="py-3 tabular-nums">{agent.resolved_rate.toFixed(1)}%</td>
                          <td className="py-3 tabular-nums">{Number(agent.avg_rating).toFixed(1)}</td>
                          <td className="py-3 tabular-nums">{formatDuration(agent.avg_resolution_seconds)}</td>
                          <td className="py-3"><StatusBadge status={agent.escalated_calls ? `${agent.escalated_calls} escalated` : "clear"} /></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div className="space-y-2 lg:hidden">{ranked.map((agent, index) => <RankingRow key={agent.agent_id} rank={index + 1} name={agent.name} primary={`${agentScore(agent)}`} secondary={`${agent.resolved_rate.toFixed(0)}% resolution · ${agent.region}`} trend={index < Math.max(1, Math.floor(ranked.length / 3)) ? "up" : index >= Math.max(2, Math.ceil(ranked.length * 0.7)) ? "down" : "flat"} />)}</div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <InsightPanel title="Coaching priorities" items={ranked.slice(-3).reverse().map((agent) => ({
                  title: `${agent.name}: ${agent.resolved_rate.toFixed(0)}% resolution`,
                  detail: agent.escalated_calls > 0 ? `${agent.escalated_calls} escalations and ${formatDuration(agent.avg_resolution_seconds)} average resolution time suggest targeted coaching.` : `Review handling efficiency and repeatable behaviors before the next coaching session.`,
                  tone: agent.resolved_rate < 70 ? "danger" : "warning",
                }))} />
                <Card>
                  <CardHeader><CardTitle>Team signal</CardTitle><CardDescription className="mt-1">What to reinforce this week</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 rounded-md border border-border bg-muted/20 p-3"><MessageSquareText className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-xs font-medium">Coach from evidence</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Use resolution rate and handling time together, not a single rank, when selecting coaching examples.</p></div></div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}
      </div>
    </RedesignShell>
  );
}
