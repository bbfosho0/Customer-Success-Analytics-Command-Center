"use client";

import { useMemo } from "react";

import { useManifest, useRefreshManifest } from "../../lib/api/hooks";
import { refreshHistory } from "../../lib/data/settings-data";
import type { RefreshEvent } from "../../lib/data/types";
import { buildManifestDiagnostics } from "../../lib/viz/transformers";
import { SectionCard, StatusBadge } from "../../components/ui/figma-primitives";

export function RefreshPanel() {
  const manifestQuery = useManifest();
  const refreshMutation = useRefreshManifest();
  const diagnostics = useMemo(() => buildManifestDiagnostics(manifestQuery.data), [manifestQuery.data]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard title="Data plane">
        {manifestQuery.isLoading && <StateMessage message="Loading manifest diagnostics…" />}
        {manifestQuery.isError && <StateMessage tone="error" message="Unable to load manifest diagnostics." />}
        {!manifestQuery.isLoading && !manifestQuery.isError && !diagnostics.length && (
          <StateMessage message="No manifest diagnostics are available yet." />
        )}
        {diagnostics.length > 0 && (
          <dl className="space-y-4 text-sm">
            {diagnostics.map((item) => (
              <div key={item.label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="text-right font-semibold text-foreground">
                  {item.value}
                  {item.hint && <p className="text-xs font-normal text-muted-foreground">{item.hint}</p>}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <button
          type="button"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-accent px-4 py-2 text-sm text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshMutation.isPending ? "Refreshing…" : "Trigger refresh"}
        </button>
        {refreshMutation.isError && <p className="mt-2 text-xs text-danger">{refreshMutation.error.message}</p>}
        {refreshMutation.isSuccess && <p className="mt-2 text-xs text-success">Manifest refreshed successfully.</p>}
      </SectionCard>
      <HistoryPanel history={refreshHistory} />
    </div>
  );
}

function StateMessage({ message, tone = "muted" }: { message: string; tone?: "muted" | "error" }) {
  return <p className={`mt-4 text-sm ${tone === "error" ? "text-danger" : "text-muted-foreground"}`}>{message}</p>;
}

function HistoryPanel({ history }: { history: RefreshEvent[] }) {
  return (
    <SectionCard title="History">
      <ul className="space-y-4 text-sm">
        {history.map((event) => (
          <li key={event.id} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{event.timestamp.replace("T", " ")}</span>
              <StatusBadge status={event.result} />
            </div>
            <p className="text-xs text-muted-foreground">
              {event.durationSeconds}s · {event.note ?? "Scheduled"}
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
