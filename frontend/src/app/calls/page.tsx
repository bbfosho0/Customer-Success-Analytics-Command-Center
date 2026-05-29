"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "../../components/layout/app-shell";
import { CallsTable } from "../../components/tables/calls-table";
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
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <CallsFilters />
          <FocusCard title="Longest running" items={longestRunning.map((call) => `${call.caseId} · ${Math.round(call.durationSeconds / 60)}m`)} />
          <FocusCard title="Escalations" items={escalations.map((call) => `${call.caseId} · ${call.region}`)} />
        </div>
        <div className="space-y-6">
          {callsQuery.isLoading && <StatePanel message="Loading calls from the analytics API…" />}
          {callsQuery.isError && <StatePanel tone="error" message="Unable to load calls. Check the backend API or static data mode." />}
          {!callsQuery.isLoading && !callsQuery.isError && !calls.length && <StatePanel message="No calls match the current filters." />}
          {!!calls.length && <CallsTable data={calls} caption="Streamed from typed API contract" />}
          <PaginationBar
            page={page}
            perPage={PAGE_SIZE}
            total={total}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Avg sentiment" value={`${sentimentScore >= 0 ? "+" : ""}${sentimentScore.toFixed(1)}`} detail="AI assist uplift" />
            <StatCard label="FCR" value={`${fcr.toFixed(0)}%`} detail="First contact resolution" />
            <StatCard label="SLA" value={`${sla.toFixed(1)}%`} detail="First response under 15m" />
          </div>
        </div>
      </div>
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface p-4 text-sm shadow-card">
      <span className="text-muted-foreground">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()} calls
      </span>
      <div className="flex gap-2">
        <button type="button" onClick={onPrevious} disabled={page <= 1} className="rounded-full border border-border/60 px-4 py-2 text-xs font-semibold disabled:opacity-40">
          Previous
        </button>
        <button type="button" onClick={onNext} disabled={page * perPage >= total} className="rounded-full border border-border/60 px-4 py-2 text-xs font-semibold disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}

function FocusCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-card">
      <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.length ? (
          items.map((item) => (
            <li key={item} className="rounded-xl bg-surface-strong/70 px-3 py-2 text-foreground">
              {item}
            </li>
          ))
        ) : (
          <li className="rounded-xl bg-surface-strong/70 px-3 py-2 text-muted-foreground">No matching calls</li>
        )}
      </ul>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/80 p-4 text-sm shadow-card">
      <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
