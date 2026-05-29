import type { AgentPerformance } from "../../lib/data/types";
import { SectionCard } from "../../components/ui/figma-primitives";

interface AgentsLeaderboardProps {
  agents: AgentPerformance[];
}

export function AgentsLeaderboard({ agents }: AgentsLeaderboardProps) {
  return (
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
            {agents.map((agent) => (
              <tr key={agent.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-[10px] text-background">
                      {agent.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                    </span>
                    <div>
                      <div className="text-foreground">{agent.name}</div>
                      <div className="text-[10px] text-muted-foreground">{agent.role}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 tabular-nums text-muted-foreground">{agent.region}</td>
                <td className="px-4 py-2 tabular-nums">{agent.csat}%</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-accent" style={{ width: `${agent.sla}%` }} />
                    </div>
                    <span className="tabular-nums">{agent.sla}%</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {agent.focusAreas.map((focus) => (
                      <span key={focus} className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {focus}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
