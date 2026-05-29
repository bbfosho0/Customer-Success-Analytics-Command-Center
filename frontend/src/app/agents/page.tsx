"use client";

import { useMemo } from "react";

import { AppShell } from "../../components/layout/app-shell";
import { EmptyState, ErrorState, FigmaKpiCard, LoadingState, SectionCard } from "../../components/ui/figma-primitives";
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
      {agentsQuery.isLoading && <SectionCard><LoadingState label="Loading agent aggregates" /></SectionCard>}
      {agentsQuery.isError && <SectionCard><ErrorState title="Unable to load agent aggregates" /></SectionCard>}
      {!agentsQuery.isLoading && !agentsQuery.isError && !agents.length && <SectionCard><EmptyState title="No agent aggregates are available yet" /></SectionCard>}
      {!!topAgents.length && (
        <section className="grid gap-3 md:grid-cols-3">
          {topAgents.map((agent) => (
            <SectionCard key={agent.id} title={agent.name} description={`${agent.role} · ${agent.region}`}>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <FigmaKpiCard label="CSAT" value={`${agent.csat}%`} />
                <FigmaKpiCard label="SLA" value={`${agent.sla}%`} />
                <FigmaKpiCard label="Calls" value={`${agent.callsHandled}`} />
                <FigmaKpiCard label="AHT" value={`${agent.avgHandleTime}m`} />
              </div>
            </SectionCard>
          ))}
        </section>
      )}
      {!!agents.length && <AgentsLeaderboard agents={agents} />}
    </AppShell>
  );
}
