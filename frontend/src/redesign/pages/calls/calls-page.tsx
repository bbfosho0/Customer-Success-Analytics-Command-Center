"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

import { FilterBar, MobileDataRow, StatusBadge } from "../../patterns/patterns";
import { RedesignPageHeader, RedesignShell } from "../../shell/redesign-shell";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select } from "../../ui/primitives";
import { formatDuration, redesignCalls, titleCase } from "../demo-data";
import { type RedesignDataState, RedesignStateSurface } from "../page-state";

export function RedesignCallsPage({ state = "normal", onOpen = () => undefined }: { state?: RedesignDataState; onOpen?: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => redesignCalls.filter((call) => {
    const query = search.trim().toLowerCase();
    if (status !== "all" && call.resolution_status.toLowerCase() !== status) return false;
    if (!query) return true;
    return `${call.id} ${call.agent_name} ${call.issue_type} ${call.customer_region}`.toLowerCase().includes(query);
  }), [search, status]);

  return (
    <RedesignShell route="calls">
      <div className="space-y-4 md:space-y-5">
        <RedesignPageHeader eyebrow="Operations" title="Calls" description="Searchable support operations with compact row density on desktop and scan-first records on smaller screens." />
        <FilterBar search={search} onSearch={setSearch} activeCount={status === "all" ? 2 : 3} summary={`Last 7 days · ${filtered.length} of ${redesignCalls.length} records`} actions={
          <Select aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All status</option><option value="resolved">Resolved</option><option value="escalated">Escalated</option><option value="open">Open</option><option value="pending">Pending</option>
          </Select>
        } />

        {state !== "normal" ? <RedesignStateSurface state={state} label="calls" /> : (
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div><CardTitle>Interaction queue</CardTitle><CardDescription className="mt-1">Operational records ordered by most recent activity</CardDescription></div>
              <Button variant="outline" size="sm"><ArrowUpDown className="h-3.5 w-3.5" /> Sort</Button>
            </CardHeader>
            <CardContent>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full table-fixed text-xs">
                  <thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="w-[16%] pb-2.5 pr-3">Call</th><th className="w-[22%] pb-2.5 pr-3">Agent</th><th className="hidden w-[16%] pb-2.5 pr-3 lg:table-cell">Region</th><th className="w-[28%] pb-2.5 pr-3 lg:w-[24%]">Issue</th><th className="w-[17%] pb-2.5 pr-3 lg:w-[14%]">Duration</th><th className="w-[17%] pb-2.5 pr-3 lg:w-[14%]">Status</th><th className="hidden w-[12%] pb-2.5 xl:table-cell">Started</th></tr></thead>
                  <tbody>{filtered.slice(0, 18).map((call) => (
                    <tr key={call.id} className="group cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/25" onClick={() => onOpen(call.id)}>
                      <td className="truncate py-3 pr-3 font-medium tabular-nums">{call.id}</td>
                      <td className="py-3 pr-3"><p className="truncate font-medium">{call.agent_name}</p><p className="mt-0.5 hidden truncate text-[10px] text-muted-foreground lg:block">{call.agent_id}</p></td>
                      <td className="hidden truncate py-3 pr-3 text-muted-foreground lg:table-cell">{call.customer_region}</td>
                      <td className="py-3 pr-3"><span className="line-clamp-2">{titleCase(call.issue_type)}</span></td>
                      <td className="py-3 pr-3 tabular-nums">{formatDuration(call.duration_seconds)}</td>
                      <td className="py-3 pr-3"><StatusBadge status={call.resolution_status} /></td>
                      <td className="hidden py-3 text-[11px] text-muted-foreground xl:table-cell">{call.started_at ? new Date(call.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Unavailable"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="space-y-2 md:hidden">
                {filtered.slice(0, 8).map((call) => <MobileDataRow key={call.id} title={call.id} subtitle={`${call.agent_name} · ${titleCase(call.issue_type)}`} status={<StatusBadge status={call.resolution_status} />} meta={[call.customer_region, formatDuration(call.duration_seconds)]} onClick={() => onOpen(call.id)} />)}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <p className="text-[11px] text-muted-foreground">Showing {Math.min(filtered.length, 18)} of {filtered.length}</p>
                <div className="flex items-center gap-1"><Button variant="outline" size="icon" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RedesignShell>
  );
}
