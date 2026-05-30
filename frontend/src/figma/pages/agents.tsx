"use client";

import { useMemo } from "react";

import { SectionCard } from "../primitives";
import { PageHeader } from "../shell";
import { useAgents } from "../../lib/api/hooks";

const regionMap: Record<string, string> = {
  "us-east-1": "NA",
  "us-west-2": "NA",
  "eu-west-1": "EMEA",
  "eu-central-1": "EMEA",
  "ap-southeast-1": "APAC",
  "ap-northeast-1": "APAC",
};

export function AgentsPage() {
  const agentsQuery = useAgents({ sort: "total_calls", direction: "desc" });
  const agents = useMemo(() => (agentsQuery.data ?? []).map((agent) => ({
    id: agent.agent_id,
    name: agent.name,
    geoRegion: regionMap[agent.region] ?? agent.region,
    specialty: agent.escalated_calls > 0 ? "Escalations" : "Core",
    csat: Number((agent.avg_rating * 20).toFixed(0)),
    sla: Number(Math.min(99, Math.max(70, agent.resolved_rate)).toFixed(0)),
    calls: agent.total_calls,
    aht: Number((agent.avg_resolution_seconds / 60).toFixed(1)),
    focus: agent.escalated_calls > 0 ? "Escalation follow-up" : "Quality coaching",
  })), [agentsQuery.data]);

  const sorted = useMemo(() => [...agents].sort((a, b) => a.csat - b.csat), [agents]);
  const spotlight = sorted.slice(0, 3);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Agent intelligence"
        description="Spot the trend lines keeping our premium queues stable before the AWS go-live."
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {spotlight.map((agent) => (
          <div key={agent.id} className="rounded-md border border-border bg-card p-4">
            <div className="mb-4">
              <p className="text-[14px] text-foreground">{agent.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {agent.specialty} · {agent.geoRegion}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="CSAT" value={`${agent.csat}%`} />
              <MetricBox label="SLA" value={`${agent.sla}%`} />
              <MetricBox label="CALLS" value={String(agent.calls)} />
              <MetricBox label="AHT" value={`${agent.aht}m`} />
            </div>
          </div>
        ))}
      </div>

      <SectionCard title="Leaderboard" description="Live API aggregates by agent">
        <div className="-m-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2">Agent</th>
                <th className="px-4 py-2">Region</th>
                <th className="px-4 py-2">CSAT</th>
                <th className="px-4 py-2">SLA</th>
                <th className="px-4 py-2">Focus</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((agent) => (
                <tr key={agent.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground text-background text-[10px]">
                        {agent.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <div>
                        <p className="text-[13px] text-foreground">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground">{agent.specialty}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{agent.geoRegion}</td>
                  <td className="px-4 py-2 tabular-nums">{agent.csat}%</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${agent.sla}%` }}
                        />
                      </div>
                      <span className="tabular-nums">{agent.sla}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {agent.geoRegion}
                      </span>
                      <span className="text-muted-foreground">{agent.focus}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-[22px] tabular-nums text-foreground">{value}</p>
    </div>
  );
}
