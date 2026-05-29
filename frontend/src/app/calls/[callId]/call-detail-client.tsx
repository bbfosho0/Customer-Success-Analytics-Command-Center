"use client";

import { AppShell } from "../../../components/layout/app-shell";
import { useCall } from "../../../lib/api/hooks";
import { toUiCallRecord } from "../../../lib/viz/transformers";

export function CallDetailClient({ callId }: { callId: string }) {
  const callQuery = useCall(callId);

  if (callQuery.isLoading) {
    return (
      <AppShell title="Loading case" description="Fetching call detail from the analytics API.">
        <StateCard message="Loading call detail…" />
      </AppShell>
    );
  }

  if (callQuery.isError) {
    return (
      <AppShell title="Call unavailable" description="The requested call could not be loaded.">
        <StateCard tone="error" message="Unable to load this call. Check that the backend is running or enable static demo mode." />
      </AppShell>
    );
  }

  if (!callQuery.data?.data) {
    return (
      <AppShell title="Call not found" description="No matching support interaction exists for this route.">
        <StateCard message="No call detail is available for this identifier." />
      </AppShell>
    );
  }

  const call = toUiCallRecord(callQuery.data.data);

  return (
    <AppShell title={`Case ${call.caseId}`} description={`Handled by ${call.agent} (${call.region})`}>
      <article className="grid gap-6 rounded-3xl border border-border/70 bg-surface p-6 shadow-card md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Timeline</p>
          <ul className="mt-4 space-y-3 text-sm text-foreground">
            <li>
              <strong>Opened</strong> · {new Date(call.openedAt).toLocaleString()}
            </li>
            <li>
              <strong>Closed</strong> · {new Date(call.closedAt).toLocaleString()}
            </li>
            <li>
              <strong>Duration</strong> · {Math.round(call.durationSeconds / 60)} minutes
            </li>
            <li>
              <strong>First response</strong> · {call.firstResponseMinutes} minutes
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Signal</p>
          <div className="mt-4 grid gap-3 text-sm">
            <Metric label="Priority" value={call.priority} />
            <Metric label="Issue" value={call.issue} />
            <Metric label="Sentiment" value={call.sentiment} />
            <Metric label="Status" value={call.status} />
            <Metric label="CSAT" value={`${call.csat}%`} />
          </div>
        </div>
      </article>
    </AppShell>
  );
}

function StateCard({ message, tone = "muted" }: { message: string; tone?: "muted" | "error" }) {
  return (
    <div className={`rounded-3xl border border-border/70 bg-surface p-6 text-sm shadow-card ${tone === "error" ? "text-danger" : "text-muted-foreground"}`}>
      {message}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 px-4 py-3 text-foreground">
      <p className="text-xs uppercase tracking-[0.35rem] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold capitalize">{value}</p>
    </div>
  );
}
