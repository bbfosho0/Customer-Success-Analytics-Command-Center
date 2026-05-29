import { useMemo, useState } from "react";
import { ArrowUpDown, Star } from "lucide-react";
import { AGENTS, Agent, fmtDuration } from "../data";
import { SectionCard } from "../primitives";
import { PageHeader } from "../shell";
import { cn } from "../ui/utils";

type Field = "name" | "region" | "skill" | "totalCalls" | "avgDurationSec" | "resolutionRate" | "escalated";

export function AgentsPage() {
  const [field, setField] = useState<Field>("resolutionRate");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<"table" | "cards">("table");

  const rows = useMemo(() => {
    const r = [...AGENTS].sort((a, b) => {
      const av = a[field]; const bv = b[field];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [field, dir]);

  const toggle = (f: Field) => {
    if (field === f) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setField(f); setDir("desc"); }
  };

  const best = rows[0];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Agents"
        description="Resolution performance across the support roster."
        actions={
          <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 text-xs">
            <button onClick={() => setView("table")} className={cn("rounded px-2 py-1", view === "table" ? "bg-foreground text-background" : "text-muted-foreground")}>Table</button>
            <button onClick={() => setView("cards")} className={cn("rounded px-2 py-1", view === "cards" ? "bg-foreground text-background" : "text-muted-foreground")}>Cards</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Mini label="Roster" value={AGENTS.length} />
        <Mini label="Avg resolution" value={`${(AGENTS.reduce((a, x) => a + x.resolutionRate, 0) / AGENTS.length * 100).toFixed(1)}%`} />
        <Mini label="Avg handle time" value={fmtDuration(Math.round(AGENTS.reduce((a, x) => a + x.avgDurationSec, 0) / AGENTS.length))} />
        <Mini label="Top performer" value={best.name.split(" ")[0]} hint={`${(best.resolutionRate * 100).toFixed(0)}% resolved`} />
      </div>

      {view === "table" ? (
        <SectionCard title="Leaderboard" description="Click a header to sort">
          <div className="-m-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <Th onClick={() => toggle("name")}>Agent</Th>
                  <Th onClick={() => toggle("region")}>Region</Th>
                  <Th onClick={() => toggle("skill")}>Skill</Th>
                  <Th onClick={() => toggle("totalCalls")}>Total calls</Th>
                  <Th onClick={() => toggle("avgDurationSec")}>Avg duration</Th>
                  <Th onClick={() => toggle("resolutionRate")}>Resolved</Th>
                  <Th onClick={() => toggle("escalated")}>Escalated</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-background text-[10px]">{a.name.split(" ").map((n) => n[0]).join("")}</span>
                        <div>
                          <div className="text-foreground">{a.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{a.id}</div>
                        </div>
                        {i === 0 && <Star className="h-3 w-3 text-amber-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">{a.region}</td>
                    <td className="px-4 py-2"><Skill v={a.skill} /></td>
                    <td className="px-4 py-2 tabular-nums">{a.totalCalls}</td>
                    <td className="px-4 py-2 tabular-nums">{fmtDuration(a.avgDurationSec)}</td>
                    <td className="px-4 py-2"><Bar pct={a.resolutionRate * 100} /></td>
                    <td className="px-4 py-2 tabular-nums">{a.escalated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((a) => (
            <div key={a.id} className="rounded-md border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background text-[11px]">{a.name.split(" ").map((n) => n[0]).join("")}</span>
                <div className="min-w-0">
                  <p className="truncate text-[13px]">{a.name}</p>
                  <p className="truncate text-[10px] font-mono text-muted-foreground">{a.region} · {a.id}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
                <div className="text-muted-foreground">Skill</div><div><Skill v={a.skill} /></div>
                <div className="text-muted-foreground">Calls</div><div className="tabular-nums">{a.totalCalls}</div>
                <div className="text-muted-foreground">Avg</div><div className="tabular-nums">{fmtDuration(a.avgDurationSec)}</div>
                <div className="text-muted-foreground">Escalated</div><div className="tabular-nums">{a.escalated}</div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Resolution</span><span className="tabular-nums">{(a.resolutionRate * 100).toFixed(0)}%</span>
                </div>
                <Bar pct={a.resolutionRate * 100} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th className="px-4 py-2">
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
        {children}<ArrowUpDown className="h-3 w-3 opacity-60" />
      </button>
    </th>
  );
}
function Mini({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-[20px] tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
function Skill({ v }: { v: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={cn("h-1.5 w-3 rounded-sm", i < v ? "bg-accent" : "bg-muted")} />
      ))}
    </span>
  );
}
function Bar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums text-xs">{pct.toFixed(0)}%</span>
    </div>
  );
}
