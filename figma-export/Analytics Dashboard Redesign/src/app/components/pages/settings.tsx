import { RefreshCw, Database, Wifi, CheckCircle2, Copy, FileText } from "lucide-react";
import { useState } from "react";
import { MANIFEST, fmtBytes } from "../data";
import { SectionCard } from "../primitives";
import { PageHeader } from "../shell";
import { cn } from "../ui/utils";

export function SettingsPage({
  mode,
  refreshDisabled = false,
}: {
  mode: "live" | "demo";
  refreshDisabled?: boolean;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const refresh = () => {
    if (refreshDisabled || refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastRefreshed(new Date().toLocaleString());
    }, 900);
  };

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
              disabled={refreshDisabled || refreshing}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
                refreshDisabled
                  ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                  : "border-border bg-card hover:bg-muted",
              )}
              title={refreshDisabled ? "Disabled by config (read-only demo mode)" : undefined}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing" : "Refresh now"}
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

      <SectionCard title="Dataset manifest" description={MANIFEST.datasetName}>
        <dl className="grid grid-cols-1 gap-y-2 text-xs md:grid-cols-2">
          <Row label="Name" value={<span className="font-mono">{MANIFEST.datasetName}</span>} />
          <Row label="Rows" value={<span className="tabular-nums">{MANIFEST.rowCount.toLocaleString()}</span>} />
          <Row
            label="Path"
            value={
              <span className="flex items-center gap-1.5">
                <span className="truncate font-mono text-[11px]">{MANIFEST.path}</span>
                <button className="rounded p-0.5 text-muted-foreground hover:bg-muted" onClick={() => navigator.clipboard?.writeText(MANIFEST.path)}>
                  <Copy className="h-3 w-3" />
                </button>
              </span>
            }
          />
          <Row label="Size" value={fmtBytes(MANIFEST.sizeBytes)} />
          <Row
            label="Hash"
            value={
              <span className="flex items-center gap-1.5">
                <span className="truncate font-mono text-[11px]">{MANIFEST.hash}</span>
                <button className="rounded p-0.5 text-muted-foreground hover:bg-muted" onClick={() => navigator.clipboard?.writeText(MANIFEST.hash)}>
                  <Copy className="h-3 w-3" />
                </button>
              </span>
            }
          />
          <Row label="Generated" value={new Date(MANIFEST.generatedAt).toLocaleString()} />
        </dl>
      </SectionCard>

      <SectionCard
        title="Columns"
        description={`${MANIFEST.columns.length} fields in the analytics contract`}
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
              {MANIFEST.columns.map((c) => (
                <tr key={c.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono text-[12px]">{c.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 py-1.5 last:border-0 md:border-0">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-foreground">{value}</dd>
    </div>
  );
}
