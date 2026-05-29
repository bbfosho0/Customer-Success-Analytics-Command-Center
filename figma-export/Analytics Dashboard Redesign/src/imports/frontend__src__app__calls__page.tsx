"use client";

import { useMemo } from "react";

import { AppShell } from "../../components/layout/app-shell";
import { CallsTable } from "../../components/tables/calls-table";
import { CallsFilters } from "../../features/calls/filters";
import { callsDataset } from "../../lib/data/calls-data";
import { useDemoFilters } from "../../lib/state/demoFilters";
import { filterCalls } from "../../lib/utils/callFiltering";

export default function CallsPage() {
  const selection = useDemoFilters((state) => state.selection);
  const filteredCalls = useMemo(() => filterCalls(callsDataset, selection), [selection]);
  const callsSubset = useMemo(() => filteredCalls.slice(0, 40), [filteredCalls]);

  const longestRunning = useMemo(
    () => [...filteredCalls].sort((a, b) => b.durationSeconds - a.durationSeconds).slice(0, 4),
    [filteredCalls],
  );
  const escalations = useMemo(
    () => filteredCalls.filter((call) => call.status === "escalated").slice(0, 4),
    [filteredCalls],
  );

  const sentimentScore = useMemo(() => {
    const scale = { positive: 1, neutral: 0, negative: -1 } as const;
    const total = filteredCalls.reduce((acc, call) => acc + scale[call.sentiment], 0);
    if (!filteredCalls.length) return 0;
    return total / filteredCalls.length;
  }, [filteredCalls]);

  const fcr = useMemo(() => {
    const resolved = filteredCalls.filter((call) => call.firstContactResolution).length;
    if (!filteredCalls.length) return 0;
    return (resolved / filteredCalls.length) * 100;
  }, [filteredCalls]);

  const sla = useMemo(() => {
    const withinTarget = filteredCalls.filter((call) => call.firstResponseMinutes <= 15).length;
    if (!filteredCalls.length) return 0;
    return (withinTarget / filteredCalls.length) * 100;
  }, [filteredCalls]);

  return (
    <AppShell
      title="Calls explorer"
      description="Interactively slice the mock Parquet sample and narrate key cases before AWS cutover."
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <CallsFilters />
          <FocusCard
            title="Longest running"
            items={longestRunning.map((call) => `${call.caseId} · ${Math.round(call.durationSeconds / 60)}m`)}
          />
          <FocusCard title="Escalations" items={escalations.map((call) => `${call.caseId} · ${call.region}`)} />
        </div>
        <div className="space-y-6">
          <CallsTable data={callsSubset} caption="Streamed from local Parquet sample" />
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

function FocusCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-card">
      <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="rounded-xl bg-surface-strong/70 px-3 py-2 text-foreground">
            {item}
          </li>
        ))}
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
