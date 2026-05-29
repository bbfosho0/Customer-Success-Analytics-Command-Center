import { AppShell } from "../../components/layout/app-shell";
import { AgentsLeaderboard } from "../../features/agents/leaderboard";
import { agentsPerformance, topAgents } from "../../lib/data/agents-data";

export default function AgentsPage() {
  return (
    <AppShell
      title="Agent intelligence"
      description="Spot the trend lines keeping our premium queues stable before the AWS go-live."
    >
      <p className="text-sm text-muted-foreground">
        The snapshots below simply highlight who is leading this week on satisfaction, SLA, and call volume so you
        can name-drop them during a briefing.
      </p>
      <section className="grid gap-4 md:grid-cols-3">
        {topAgents.slice(0, 3).map((agent) => (
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
      <AgentsLeaderboard agents={agentsPerformance} />
    </AppShell>
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
