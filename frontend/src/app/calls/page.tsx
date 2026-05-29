"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppShell } from "../../components/layout/app-shell";
import { CallsTable } from "../../components/tables/calls-table";
import { ErrorState, FigmaKpiCard, LoadingState, SectionCard, EmptyState } from "../../components/ui/figma-primitives";
import { CallsFilters } from "../../features/calls/filters";
import { useCalls } from "../../lib/api/hooks";
import { useDemoFilters } from "../../lib/state/demoFilters";
import { buildCallsQueryFromSelection, toUiCallRecords } from "../../lib/viz/transformers";

const PAGE_SIZE = 40;

export default function CallsPage() {
  const [page, setPage] = useState(1);
  const selection = useDemoFilters((state) => state.selection);
  useEffect(() => {
    setPage(1);
  }, [selection]);

  const query = useMemo(() => buildCallsQueryFromSelection(selection, page, PAGE_SIZE), [page, selection]);
  const callsQuery = useCalls(query);
  const calls = useMemo(() => toUiCallRecords(callsQuery.data?.data ?? []), [callsQuery.data]);
  const total = callsQuery.data?.meta.total ?? 0;

  const longestRunning = useMemo(() => [...calls].sort((a, b) => b.durationSeconds - a.durationSeconds).slice(0, 4), [calls]);
  const escalations = useMemo(() => calls.filter((call) => call.status === "escalated").slice(0, 4), [calls]);

  const sentimentScore = useMemo(() => {
    const scale = { positive: 1, neutral: 0, negative: -1 } as const;
    const totalScore = calls.reduce((acc, call) => acc + scale[call.sentiment], 0);
    return calls.length ? totalScore / calls.length : 0;
  }, [calls]);

  const fcr = useMemo(() => {
    const resolved = calls.filter((call) => call.firstContactResolution).length;
    return calls.length ? (resolved / calls.length) * 100 : 0;
  }, [calls]);

  const sla = useMemo(() => {
    const withinTarget = calls.filter((call) => call.firstResponseMinutes <= 15).length;
    return calls.length ? (withinTarget / calls.length) * 100 : 0;
  }, [calls]);

  return (
    <AppShell
      title="Calls explorer"
      description="Interactively slice the support analytics API and narrate key cases before AWS cutover."
    >
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <CallsFilters />
          <FocusCard title="Longest running" items={longestRunning.map((call) => `${call.caseId} · ${Math.round(call.durationSeconds / 60)}m`)} />
          <FocusCard title="Escalations" items={escalations.map((call) => `${call.caseId} · ${call.region}`)} />
        </div>
        <div className="space-y-6">
          {callsQuery.isLoading && <SectionCard><LoadingState label="Loading calls from the analytics API" /></SectionCard>}
          {callsQuery.isError && <SectionCard><ErrorState body="Check the backend API or static data mode." /></SectionCard>}
          {!callsQuery.isLoading && !callsQuery.isError && !calls.length && <SectionCard><EmptyState title="No calls match the current filters" /></SectionCard>}
          {!!calls.length && <CallsTable data={calls} caption="Streamed from typed API contract" />}
          <PaginationBar
            page={page}
            perPage={PAGE_SIZE}
            total={total}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <FigmaKpiCard label="Avg sentiment" value={`${sentimentScore >= 0 ? "+" : ""}${sentimentScore.toFixed(1)}`} hint="AI assist uplift" />
            <FigmaKpiCard label="FCR" value={`${fcr.toFixed(0)}%`} hint="First contact resolution" />
            <FigmaKpiCard label="SLA" value={`${sla.toFixed(1)}%`} hint="First response under 15m" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
function PaginationBar({
  page,
  perPage,
  total,
  onPrevious,
  onNext,
}: {
  page: number;
  perPage: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const start = total ? (page - 1) * perPage + 1 : 0;
  const end = Math.min(page * perPage, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()} calls
      </span>
      <div className="flex gap-2">
        <button type="button" onClick={onPrevious} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs disabled:opacity-40">
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </button>
        <button type="button" onClick={onNext} disabled={page * perPage >= total} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs disabled:opacity-40">
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function FocusCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.length ? (
          items.map((item) => (
            <li key={item} className="rounded-md bg-muted px-3 py-2 text-foreground">
              {item}
            </li>
          ))
        ) : (
          <li className="rounded-md bg-muted px-3 py-2 text-muted-foreground">No matching calls</li>
        )}
      </ul>
    </div>
  );
}
