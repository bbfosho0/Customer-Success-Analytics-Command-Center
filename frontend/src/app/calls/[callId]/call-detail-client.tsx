"use client";

import { AppShell } from "../../../components/layout/app-shell";
import { ErrorState, LoadingState, SectionCard, StatusBadge, FigmaKpiCard, EmptyState } from "../../../components/ui/figma-primitives";
import { useCall } from "../../../lib/api/hooks";
import { toUiCallRecord } from "../../../lib/viz/transformers";

export function CallDetailClient({ callId }: { callId: string }) {
  const callQuery = useCall(callId);

  if (callQuery.isLoading) {
    return (
      <AppShell title="Loading case" description="Fetching call detail from the analytics API.">
        <SectionCard><LoadingState label="Loading call detail" /></SectionCard>
      </AppShell>
    );
  }

  if (callQuery.isError) {
    return (
      <AppShell title="Call unavailable" description="The requested call could not be loaded.">
        <SectionCard><ErrorState body="Check that the backend is running or enable static demo mode." /></SectionCard>
      </AppShell>
    );
  }

  if (!callQuery.data?.data) {
    return (
      <AppShell title="Call not found" description="No matching support interaction exists for this route.">
        <SectionCard><EmptyState title="No call detail is available for this identifier" /></SectionCard>
      </AppShell>
    );
  }

  const call = toUiCallRecord(callQuery.data.data);

  return (
    <AppShell title={`Case ${call.caseId}`} description={`Handled by ${call.agent} (${call.region})`}>
      <div className="grid gap-3 md:grid-cols-4">
        <FigmaKpiCard label="CSAT" value={`${call.csat}%`} hint="Customer satisfaction" />
        <FigmaKpiCard label="Duration" value={Math.round(call.durationSeconds / 60)} unit="m" hint="Handle time" />
        <FigmaKpiCard label="First response" value={call.firstResponseMinutes} unit="m" hint="First touch" />
        <FigmaKpiCard label="Region" value={call.region} hint={call.channel} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Timeline" description="Support interaction lifecycle">
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
        </SectionCard>
        <SectionCard title="Signal" description="Operational triage fields">
          <div className="mt-4 grid gap-3 text-sm">
            <Metric label="Priority" value={call.priority} />
            <Metric label="Issue" value={call.issue} />
            <Metric label="Sentiment" value={call.sentiment} />
            <div className="rounded-md border border-border px-3 py-2 text-foreground">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</p>
              <StatusBadge status={call.status} />
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-3 py-2 text-foreground">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm capitalize">{value}</p>
    </div>
  );
}
