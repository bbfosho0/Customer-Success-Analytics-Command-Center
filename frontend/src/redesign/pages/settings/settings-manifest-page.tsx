"use client";

import { Clock3, Database, FileText, RefreshCw, Wifi } from "lucide-react";

import { MobileDataRow, StatusBadge } from "../../patterns/patterns";
import { RedesignPageHeader, RedesignShell } from "../../shell/redesign-shell";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/primitives";
import { redesignCalls, redesignManifest } from "../demo-data";
import { type RedesignDataState, RedesignStateSurface } from "../page-state";

const columns = Object.keys(redesignCalls[0] ?? {}).map((name) => ({ name, type: name.includes("seconds") ? "integer" : name === "skill_rating" ? "number" : name.endsWith("_at") ? "datetime" : "string" }));

const auditEntries = [
  { op: "ETL pipeline run", result: "success", detail: `${redesignManifest.row_count} rows available in the current manifest`, timestamp: redesignManifest.generated_at },
  { op: "Customer analytics generated", result: "success", detail: "Customer 360 marts and BI exports prepared", timestamp: redesignManifest.generated_at },
  { op: "Schema validation", result: "success", detail: `${columns.length} frontend-visible call fields validated`, timestamp: redesignManifest.generated_at },
  { op: "OpenAPI contract", result: "success", detail: "Generated API types checked for drift in CI", timestamp: redesignManifest.generated_at },
];

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function RedesignSettingsManifestPage({ state = "normal", mode = "demo" }: { state?: RedesignDataState; mode?: "demo" | "live" }) {
  return (
    <RedesignShell route="settings">
      <div className="space-y-4 md:space-y-5">
        <RedesignPageHeader eyebrow="System" title="Settings · Manifest" description="Runtime mode, dataset manifest, schema contract, refresh state, and recent pipeline evidence." />

        {state !== "normal" ? <RedesignStateSurface state={state} label="settings manifest" /> : (
          <>
            <section className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Runtime mode</CardTitle><CardDescription className="mt-1">How the frontend is sourcing analytics data</CardDescription></CardHeader>
                <CardContent><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-md bg-muted p-2">{mode === "live" ? <Wifi className="h-4 w-4 text-emerald-400" /> : <Database className="h-4 w-4 text-amber-400" />}</div><div><p className="text-sm font-medium">{mode === "live" ? "Live API" : "Static demo"}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{mode === "live" ? "Reading current API responses." : "Bundled deterministic dataset, read-only."}</p></div></div><StatusBadge status="Operational" /></div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle>Refresh manifest</CardTitle><CardDescription className="mt-1">Re-pull the latest analytics metadata</CardDescription></div><Button variant="outline" size="sm" disabled={mode === "demo"}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button></CardHeader>
                <CardContent><p className="text-xs leading-relaxed text-muted-foreground">{mode === "demo" ? "Refresh is disabled in static demo mode. The checked-in manifest remains the deterministic source for visual QA." : "Refresh is available in live mode and revalidates the current manifest."}</p></CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader><CardTitle>Dataset manifest</CardTitle><CardDescription className="mt-1">{redesignManifest.dataset}</CardDescription></CardHeader>
              <CardContent><dl className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 xl:grid-cols-3">{[
                ["Dataset", redesignManifest.dataset], ["Rows", redesignManifest.row_count.toLocaleString()], ["Source", redesignManifest.source], ["Path", redesignManifest.path], ["Size", formatBytes(redesignManifest.size_bytes)], ["Generated", new Date(redesignManifest.generated_at).toLocaleString()],
              ].map(([label,value]) => <div key={label} className="min-w-0 bg-card p-3.5"><dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt><dd className="mt-1.5 break-all text-xs font-medium">{value}</dd></div>)}</dl></CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle>Schema columns</CardTitle><CardDescription className="mt-1">{columns.length} fields in the support call contract</CardDescription></div><FileText className="h-5 w-5 text-primary" /></CardHeader>
              <CardContent>
                <div className="hidden overflow-x-auto sm:block"><table className="w-full text-xs"><thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="pb-2.5">Column</th><th className="pb-2.5">Type</th><th className="pb-2.5">Role</th></tr></thead><tbody>{columns.map((column)=><tr key={column.name} className="border-b border-border/70 last:border-0"><td className="py-2.5 font-mono text-[11px]">{column.name}</td><td className="py-2.5 text-muted-foreground">{column.type}</td><td className="py-2.5 text-muted-foreground">{column.name === "id" ? "Primary identity" : column.name.includes("status") ? "Operational state" : column.name.includes("duration") || column.name.includes("rating") ? "Metric" : "Dimension"}</td></tr>)}</tbody></table></div>
                <div className="space-y-2 sm:hidden">{columns.map((column)=><MobileDataRow key={column.name} title={column.name} subtitle={column.type} meta={[column.name === "id" ? "Primary identity" : column.name.includes("status") ? "Operational state" : column.name.includes("duration") || column.name.includes("rating") ? "Metric" : "Dimension"]} />)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle>Audit trail</CardTitle><CardDescription className="mt-1">Recent deterministic pipeline and contract checks</CardDescription></div><span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Clock3 className="h-3 w-3" /> current manifest</span></CardHeader>
              <CardContent><div className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">{auditEntries.map((entry)=><div key={entry.op} className="bg-card p-3.5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium">{entry.op}</p><StatusBadge status={entry.result} /></div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{entry.detail}</p><p className="mt-2 text-[10px] tabular-nums text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</p></div>)}</div></CardContent>
            </Card>
          </>
        )}
      </div>
    </RedesignShell>
  );
}
