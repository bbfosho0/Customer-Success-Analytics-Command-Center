"use client";

import { useMemo } from "react";

import { AppShell } from "../../components/layout/app-shell";
import { AgentsLeaderboard } from "../../features/agents/leaderboard";
import { useAgents } from "../../lib/api/hooks";
import { buildAgentPerformanceRows } from "../../lib/viz/transformers";

export default function AgentsPage() {
  const agentsQuery = useAgents({ sort: "total_calls", direction: "desc" });
  const agents = useMemo(() => buildAgentPerformanceRows(agentsQuery.data ?? []), [agentsQuery.data]);
  const topAgents = useMemo(() => agents.slice(0, 3), [agents]);

  return (
    <AppShell
      title="Agent intelligence"
      description="Spot the trend lines keeping our premium queues stable before the AWS go-live."
    >
      <p className="text-sm text-muted-foreground">
        The snapshots below highlight the live API leaders for satisfaction, SLA, and call volume so you can name-drop
        them during a briefing.
      </p>
      {agentsQuery.isLoading && <StatePanel message="Loading agent aggregates…" />}
      {agentsQuery.isError && <StatePanel tone="error" message="Unable to load agent aggregates." />}
      {!agentsQuery.isLoading && !agentsQuery.isError && !agents.length && <StatePanel message="No agent aggregates are available yet." />}
      {!!topAgents.length && (
        <section className="grid gap-4 md:grid-cols-3">
          {topAgents.map((agent) => (
            <article key={agent.id} className="rounded-3xl border border-border/70 bg-surface p-4 shadow-card">
              <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">{agent.region}</p>
              <h3 className="text-xl font-semibold text-foreground">{agent.name}</h3>
              <p className="text-sm text-muted-foreground">{agent.role}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Metric label="CSAT" value={`${agent.csat}%`} />
                <Metric label="SLA" value={`${agent.sla}%`} />
                <Metric label="Calls" value={`${agent.callsHandled}`} />
                <Metric label="AHT" value={`${agent.avgHandleTime}m`} />
              </div>
            </article>
          ))}
        </section>
      )}
      {!!agents.length && <AgentsLeaderboard agents={agents} />}
    </AppShell>
  );
}

function StatePanel({ message, tone = "muted" }: { message: string; tone?: "muted" | "error" }) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-surface p-5 text-sm shadow-card ${tone === "error" ? "text-danger" : "text-muted-foreground"}`}>
      {message}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
