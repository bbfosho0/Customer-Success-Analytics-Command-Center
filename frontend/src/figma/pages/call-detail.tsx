"use client";

import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { buildIssueBreakdown, fmtDuration, fmtRelative, getCallSignals, toFigmaCalls } from "../data";
import { EmptyState, SectionCard, StatusBadge } from "../primitives";
import { PageHeader } from "../shell";
import { chartTooltipStyle } from "./dashboard";
import { useAgents, useCall, useCalls } from "../../lib/api/hooks";

const MAX_CALLS = 200;

export function CallDetailPage({ id, onBack, onOpen }: { id: string; onBack: () => void; onOpen: (id: string) => void }) {
  const callQuery = useCall(id);
  const agentsQuery = useAgents({ sort: "total_calls", direction: "desc" });

  const call = useMemo(() => (callQuery.data?.data ? toFigmaCalls([callQuery.data.data])[0] : null), [callQuery.data]);
  const regionCallsQuery = useCalls({
    page: 1,
    per_page: MAX_CALLS,
    region: call?.region,
  });

  const regionCalls = useMemo(() => toFigmaCalls(regionCallsQuery.data?.data ?? []), [regionCallsQuery.data]);
  const agent = useMemo(() => {
    if (!call) return null;
    const all = agentsQuery.data ?? [];
    const direct = all.find((a) => a.agent_id === call.agentId);
    if (direct) return direct;
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const byName = all.find((a) => normalize(a.name) === normalize(call.agent));
    return byName ?? null;
  }, [agentsQuery.data, call]);
  const signals = useMemo(() => (call ? getCallSignals(call) : null), [call]);
  const similar = useMemo(
    () => (call ? regionCalls.filter((c) => c.issueType === call.issueType && c.id !== call.id).slice(0, 6) : []),
    [call, regionCalls],
  );
  const issueDist = useMemo(() => (call ? buildIssueBreakdown(regionCalls) : []), [call, regionCalls]);

  if (callQuery.isLoading) {
    return (
      <div>
        <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to calls
        </button>
        <EmptyState title="Loading call detail" />
      </div>
    );
  }

  if (!call) {
    return (
      <div>
        <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to calls
        </button>
        <EmptyState title="Call not found" body={`No record with id ${id}`} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to calls
      </button>

      <PageHeader
        title={call.id}
        titleClassName="call-id"
        description={call.summary}
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-muted">
              <Copy className="h-3.5 w-3.5" /> Copy ID
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-muted">
              <ExternalLink className="h-3.5 w-3.5" /> Open transcript
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">CSAT</p>
          <p className="mt-1 text-[22px] tabular-nums">{signals?.csat}<span className="text-xs text-muted-foreground">/5</span></p>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-sm ${i < (signals?.csat ?? 0) ? "bg-accent" : "bg-muted"}`} />
            ))}
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Duration</p>
          <p className="mt-1 text-[22px] tabular-nums">{fmtDuration(call.durationSec)}</p>
          <p className="text-[11px] text-muted-foreground">{signals?.slaBreach ? "SLA breach" : "Within SLA"}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">First response</p>
          <p className="mt-1 text-[22px] tabular-nums">{fmtDuration(signals?.firstResponseSec ?? 0)}</p>
          <p className="text-[11px] text-muted-foreground">Time to first agent response</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Region</p>
          <p className="mt-1 font-mono text-[14px] tabular-nums">{call.region}</p>
          <p className="text-[11px] text-muted-foreground">{call.customer}</p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-border md:grid-cols-5">
          <Field label="Status"><StatusBadge status={call.status} /></Field>
          <Field label="Issue type">{call.issueType}</Field>
          <Field label="Service">{call.service}</Field>
          <Field label="Priority"><span className="font-mono text-[12px]">{signals?.priority}</span></Field>
          <Field label="Sentiment"><span className="capitalize">{signals?.sentiment}</span></Field>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">Timeline</p>
        <div className="relative flex items-start gap-0">
          {[
            { label: "Opened", time: new Date(call.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), done: true },
            { label: "First response", time: fmtDuration(signals?.firstResponseSec ?? 0), done: true },
            { label: "In progress", time: "", done: true },
            {
              label: call.status === "resolved" ? "Resolved" : call.status === "escalated" ? "Escalated" : "Pending",
              time: fmtDuration(call.durationSec),
              done: call.status === "resolved" || call.status === "escalated",
            },
          ].map((step, i, arr) => (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div className={`h-px flex-1 ${i === 0 ? "invisible" : step.done ? "bg-accent" : "bg-muted"}`} />
                <div className={`h-3 w-3 shrink-0 rounded-full border-2 ${step.done ? "border-accent bg-accent" : "border-muted bg-card"}`} />
                <div className={`h-px flex-1 ${i === arr.length - 1 ? "invisible" : step.done && arr[i + 1]?.done ? "bg-accent" : "bg-muted"}`} />
              </div>
              <p className="mt-1 text-center text-[11px] text-foreground">{step.label}</p>
              {step.time && <p className="text-center text-[10px] text-muted-foreground">{step.time}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <SectionCard title="Timing" className="lg:col-span-1">
          <dl className="grid grid-cols-2 gap-y-2 text-xs">
            <Dt>Started</Dt><Dd>{new Date(call.startedAt).toLocaleString()}</Dd>
            <Dt>Relative</Dt><Dd>{fmtRelative(call.startedAt)}</Dd>
            <Dt>Duration</Dt><Dd className="tabular-nums">{fmtDuration(call.durationSec)}</Dd>
            <Dt>Resolution</Dt><Dd><StatusBadge status={call.status} /></Dd>
          </dl>
        </SectionCard>

        <SectionCard title="Agent" className="lg:col-span-1">
          {agent ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background text-xs">
                  {agent.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className="break-words text-[13px]">{agent.name}</p>
                  <p className="text-[11px] text-muted-foreground"><span className="call-id">{agent.agent_id}</span> · {agent.region}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <Stat label="Skill" value={`${agent.skill_rating.toFixed(1)}/5`} />
                <Stat label="Calls" value={agent.total_calls} />
                <Stat label="Resolved" value={`${agent.resolved_rate.toFixed(0)}%`} />
              </div>
            </div>
          ) : (
            <EmptyState title="Agent not available" />
          )}
        </SectionCard>

        <SectionCard title="Issue distribution in region" description={`Across ${call.region}`} className="lg:col-span-1">
          <div className="h-[180px] w-full min-w-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={issueDist} layout="vertical" margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid key="grid" stroke="var(--border)" strokeDasharray="2 3" horizontal={false} />
                <XAxis key="x-axis" type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis key="y-axis" dataKey="issue" type="category" width={110} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip key="tooltip" contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar key="bar-count" dataKey="count" fill="var(--chart-2)" radius={[0, 2, 2, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Similar calls" description={`Other calls with issue type "${call.issueType}"`}>
        {similar.length === 0 ? (
          <EmptyState title="No similar calls" />
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2">Call ID</th>
                  <th className="px-4 py-2">Agent</th>
                  <th className="px-4 py-2">Region</th>
                  <th className="px-4 py-2">Duration</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Started</th>
                </tr>
              </thead>
              <tbody>
                {similar.map((c) => (
                  <tr key={c.id} onClick={() => onOpen(c.id)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/60">
                    <td className="px-4 py-2 text-[11px]"><span className="call-id">{c.id}</span></td>
                    <td className="px-4 py-2 break-words">{c.agent}</td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">{c.region}</td>
                    <td className="px-4 py-2 tabular-nums">{fmtDuration(c.durationSec)}</td>
                    <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-2 text-muted-foreground">{fmtRelative(c.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 text-[13px]">{children}</div>
    </div>
  );
}
function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-muted-foreground">{children}</dt>;
}
function Dd({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <dd className={"text-foreground " + className}>{children}</dd>;
}
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-2 py-1.5">
      <div className="text-[15px] tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
