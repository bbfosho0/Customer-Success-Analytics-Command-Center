"use client";

import { RefreshCw, Database, Wifi, CheckCircle2, Copy, FileText, Clock } from "lucide-react";
import { useState } from "react";

import { SectionCard } from "../primitives";
import { PageHeader } from "../shell";
import { cn } from "../ui/utils";
import { useManifest, useRefreshManifest } from "../../lib/api/hooks";

export function SettingsPage({
  mode,
  refreshDisabled = false,
}: {
  mode: "live" | "demo";
  refreshDisabled?: boolean;
}) {
  const manifestQuery = useManifest();
  const refreshMutation = useRefreshManifest();
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const refresh = async () => {
    if (refreshDisabled || refreshMutation.isPending) return;
    await refreshMutation.mutateAsync();
    setLastRefreshed(new Date().toLocaleString());
  };

  const manifest = manifestQuery.data;
  const columns = MANIFEST_COLUMNS;

  return (
    <div className="space-y-4">
      <PageHeader title="Settings · Manifest" description="Dataset metadata and runtime mode." />

      <div className="grid gap-3 md:grid-cols-2">
        <SectionCard title="Runtime mode" description="How the frontend is sourcing analytics data">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mode === "live" ? <Wifi className="h-4 w-4 text-emerald-600" /> : <Database className="h-4 w-4 text-amber-600" />}
              <div>
                <p className="text-[13px]">{mode === "live" ? "Live API" : "Static demo"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {mode === "live"
                    ? "Reading from /api/v1/analytics (phase 2 backend)."
                    : "Bundled dataset; mutations and refresh disabled."}
                </p>
              </div>
            </div>
            <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]",
              mode === "live"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300")}>
              <CheckCircle2 className="h-3 w-3" /> Operational
            </span>
          </div>
        </SectionCard>

        <SectionCard
          title="Refresh"
          description="Re-pull the latest analytics manifest"
          action={
            <button
              onClick={refresh}
              disabled={refreshDisabled || refreshMutation.isPending}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
                refreshDisabled
                  ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                  : "border-border bg-card hover:bg-muted",
              )}
              title={refreshDisabled ? "Disabled by config (read-only demo mode)" : undefined}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshMutation.isPending && "animate-spin")} />
              {refreshMutation.isPending ? "Refreshing" : "Refresh now"}
            </button>
          }
        >
          <p className="text-xs text-muted-foreground">
            {refreshDisabled
              ? "Refresh is disabled because static demo mode is enforced by configuration."
              : lastRefreshed
                ? `Last refreshed ${lastRefreshed}.`
                : "Manifest hasn't been re-fetched in this session."}
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Dataset manifest" description={manifest?.dataset ?? "Support analytics"}>
        <dl className="grid grid-cols-1 gap-y-2 text-xs md:grid-cols-2">
          <Row label="Name" value={<span className="font-mono">{manifest?.dataset ?? "support-calls"}</span>} />
          <Row label="Rows" value={<span className="tabular-nums">{manifest?.row_count?.toLocaleString() ?? "—"}</span>} />
          <Row
            label="Path"
            value={
              <span className="flex items-center gap-1.5">
                <span className="break-all font-mono text-[11px]">{manifest?.path ?? "—"}</span>
                {manifest?.path && (
                  <button className="rounded p-0.5 text-muted-foreground hover:bg-muted" onClick={() => navigator.clipboard?.writeText(manifest.path)}>
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </span>
            }
          />
          <Row label="Size" value={manifest ? fmtBytes(manifest.size_bytes) : "—"} />
          <Row
            label="Hash"
            value={
              <span className="flex items-center gap-1.5">
                <span className="break-all font-mono text-[11px]">{manifest?.hash ?? "—"}</span>
                {manifest?.hash && (
                  <button className="rounded p-0.5 text-muted-foreground hover:bg-muted" onClick={() => navigator.clipboard?.writeText(manifest.hash)}>
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </span>
            }
          />
          <Row label="Generated" value={manifest ? new Date(manifest.generated_at).toLocaleString() : "—"} />
        </dl>
      </SectionCard>

      <SectionCard
        title="Columns"
        description={`${columns.length} fields in the analytics contract`}
        action={
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <FileText className="h-3 w-3" /> phase-2 schema
          </span>
        }
      >
        <div className="-m-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2">Column</th>
                <th className="px-4 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((c) => (
                <tr key={c.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono text-[12px]">{c.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Audit trail"
        description="Recent pipeline operations and system events"
        action={<span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> Last 7 days</span>}
      >
        <div className="-m-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2">Operation</th>
                <th className="px-4 py-2">Result</th>
                <th className="px-4 py-2">Detail</th>
                <th className="px-4 py-2">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_ENTRIES.map((e, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 text-foreground">{e.op}</td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]",
                      e.result === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                    )}>
                      {e.result}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{e.detail}</td>
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{new Date(e.ts).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

const AUDIT_ENTRIES = [
  { op: "ETL pipeline run", result: "success", detail: "284 calls → cleaned_calls.parquet", ts: "2026-05-29T14:22:11Z" },
  { op: "Customer analytics generated", result: "success", detail: "25 accounts · 8 marts exported", ts: "2026-05-29T14:22:09Z" },
  { op: "BI export: customer_360.csv", result: "success", detail: "25 rows · 4.8 MB", ts: "2026-05-29T14:21:55Z" },
  { op: "BI export: churn_risk_accounts.csv", result: "success", detail: "12 rows", ts: "2026-05-29T14:21:54Z" },
  { op: "Schema validation", result: "success", detail: "11 columns · 0 type errors", ts: "2026-05-29T14:21:48Z" },
  { op: "OpenAPI type sync", result: "success", detail: "frontend/src/types/api.ts updated", ts: "2026-05-29T14:21:42Z" },
  { op: "ETL pipeline run", result: "success", detail: "0 rows dropped — region fields validated", ts: "2026-05-28T08:11:03Z" },
  { op: "BI export: retention_cohorts.csv", result: "success", detail: "12 rows", ts: "2026-05-27T16:04:22Z" },
];

const MANIFEST_COLUMNS = [
  { name: "id", type: "string" },
  { name: "agent_id", type: "string" },
  { name: "agent_name", type: "string" },
  { name: "customer_region", type: "string" },
  { name: "issue_type", type: "string" },
  { name: "duration_seconds", type: "integer" },
  { name: "resolution_status", type: "string" },
  { name: "started_at", type: "datetime" },
  { name: "skill_rating", type: "number" },
];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 py-1.5 last:border-0 md:border-0">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-foreground">{value}</dd>
    </div>
  );
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
