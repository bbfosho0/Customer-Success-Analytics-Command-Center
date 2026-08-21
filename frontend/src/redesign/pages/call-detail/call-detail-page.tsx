"use client";

import { ArrowLeft, ExternalLink, FileText, Timer, UserRound } from "lucide-react";

import { MobileDataRow, StatusBadge, StatusTimeline } from "../../patterns/patterns";
import { RedesignPageHeader, RedesignShell } from "../../shell/redesign-shell";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/primitives";
import { formatDuration, redesignCallDetail, redesignCalls, titleCase } from "../demo-data";
import { type RedesignDataState, RedesignStateSurface } from "../page-state";

export function RedesignCallDetailPage({ state = "normal", id = redesignCallDetail?.id ?? "CALL_0001", onBack = () => undefined, onOpen = () => undefined }: { state?: RedesignDataState; id?: string; onBack?: () => void; onOpen?: (id: string) => void }) {
  const call = redesignCalls.find((row) => row.id === id) ?? redesignCallDetail ?? redesignCalls[0];
  const related = redesignCalls.filter((row) => row.id !== call?.id && row.issue_type === call?.issue_type).slice(0, 4);

  return (
    <RedesignShell route="call-detail">
      <div className="space-y-4 md:space-y-5">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to calls</button>
        <RedesignPageHeader
          eyebrow="Call detail"
          title={call?.id ?? id}
          description={call ? `${titleCase(call.issue_type)} · ${call.customer_region}` : "Support interaction detail"}
          actions={call ? <StatusBadge status={call.resolution_status} /> : undefined}
        />

        {state !== "normal" || !call ? <RedesignStateSurface state={state === "normal" ? "empty" : state} label="call detail" /> : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-3.5"><p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><UserRound className="h-3 w-3" /> Agent</p><p className="mt-2 text-sm font-medium">{call.agent_name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{call.agent_id}</p></div>
              <div className="rounded-lg border border-border bg-card p-3.5"><p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><Timer className="h-3 w-3" /> Duration</p><p className="mt-2 text-sm font-medium tabular-nums">{formatDuration(call.duration_seconds)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">full interaction</p></div>
              <div className="rounded-lg border border-border bg-card p-3.5"><p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Region</p><p className="mt-2 text-sm font-medium">{call.customer_region}</p><p className="mt-0.5 text-[10px] text-muted-foreground">customer location</p></div>
              <div className="rounded-lg border border-border bg-card p-3.5"><p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Skill rating</p><p className="mt-2 text-sm font-medium tabular-nums">{Number(call.skill_rating ?? 0).toFixed(1)} / 5</p><p className="mt-0.5 text-[10px] text-muted-foreground">handling complexity</p></div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <Card>
                <CardHeader><CardTitle>Interaction narrative</CardTitle><CardDescription className="mt-1">Operational summary and support context</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/[0.16] p-4">
                    <div className="flex items-start gap-3"><div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary"><FileText className="h-4 w-4" /></div><div><p className="text-sm font-medium">{titleCase(call.issue_type)}</p><p className="mt-1.5 text-xs leading-6 text-muted-foreground">The interaction was routed to {call.agent_name} in {call.customer_region}. This redesign keeps the detail surface dense enough for operations while preserving a clear reading path for issue context, duration, status, and related records.</p></div></div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-border p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Resolution status</p><div className="mt-2"><StatusBadge status={call.resolution_status} /></div></div>
                    <div className="rounded-md border border-border p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Started</p><p className="mt-2 text-xs font-medium">{call.started_at ? new Date(call.started_at).toLocaleString() : "No timestamp"}</p></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Lifecycle</CardTitle><CardDescription className="mt-1">Interaction milestones</CardDescription></CardHeader>
                <CardContent><StatusTimeline items={[
                  { label: "Call received", detail: call.started_at ? new Date(call.started_at).toLocaleTimeString() : "Timestamp unavailable", state: "done" },
                  { label: "Agent connected", detail: call.agent_name, state: "done" },
                  { label: "Issue classified", detail: titleCase(call.issue_type), state: "done" },
                  { label: call.resolution_status.toLowerCase() === "resolved" ? "Resolved" : "Current status", detail: titleCase(call.resolution_status), state: call.resolution_status.toLowerCase() === "resolved" ? "done" : "active" },
                ]} /></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle>Related calls</CardTitle><CardDescription className="mt-1">Same issue family, useful for pattern recognition</CardDescription></div><Button variant="ghost" size="sm">Open search <ExternalLink className="h-3.5 w-3.5" /></Button></CardHeader>
              <CardContent>
                <div className="hidden lg:block"><div className="grid gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-2">{related.map((row) => <button key={row.id} type="button" onClick={() => onOpen(row.id)} className="bg-card p-3.5 text-left hover:bg-muted/30"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium">{row.id}</p><StatusBadge status={row.resolution_status} /></div><p className="mt-2 text-[11px] text-muted-foreground">{row.agent_name} · {formatDuration(row.duration_seconds)}</p></button>)}</div></div>
                <div className="space-y-2 lg:hidden">{related.map((row) => <MobileDataRow key={row.id} title={row.id} subtitle={row.agent_name} status={<StatusBadge status={row.resolution_status} />} meta={[formatDuration(row.duration_seconds), row.customer_region]} onClick={() => onOpen(row.id)} />)}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </RedesignShell>
  );
}
