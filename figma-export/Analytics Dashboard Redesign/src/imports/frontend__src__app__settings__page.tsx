import { AppShell } from "../../components/layout/app-shell";
import { RefreshPanel } from "../../features/settings/refresh-panel";
import { diagnostics, refreshHistory } from "../../lib/data/settings-data";

const toggles = [
  {
    label: "Dark theme sync",
    detail: "Match VS Code / system preference",
    enabled: true,
  },
  {
    label: "Live ETL streaming",
    detail: "Auto-ingest Glue mirror every 15m",
    enabled: true,
  },
  {
    label: "Production proxy",
    detail: "Mirror AWS Support prod APIs",
    enabled: false,
  },
];

const auditLog = [
  { id: "audit_204", actor: "jchen", action: "Refreshed parquet manifest", time: "05:17 UTC" },
  { id: "audit_203", actor: "rthomas", action: "Updated automation target", time: "01:02 UTC" },
  { id: "audit_202", actor: "svc-bot", action: "Rotated API token", time: "Yesterday" },
];

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings & readiness"
      description="Diagnostics, refresh controls, and audit visibility before we hand over to AWS operations."
      actions={<></>}
    >
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <RefreshPanel diagnostics={diagnostics} history={refreshHistory} />
        <div className="space-y-6">
          <TogglePanel />
          <AuditPanel />
        </div>
      </section>
    </AppShell>
  );
}

function TogglePanel() {
  return (
    <article className="rounded-3xl border border-border/70 bg-surface p-5 shadow-card">
      <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Configuration</p>
      <ul className="mt-4 space-y-4 text-sm">
        {toggles.map((toggle) => (
          <li key={toggle.label} className="flex items-center justify-between rounded-2xl border border-border/60 p-3">
            <div>
              <p className="font-semibold text-foreground">{toggle.label}</p>
              <p className="text-xs text-muted-foreground">{toggle.detail}</p>
            </div>
            <span
              className={
                toggle.enabled
                  ? "rounded-full bg-success/20 px-3 py-1 text-xs font-semibold text-success"
                  : "rounded-full bg-border/50 px-3 py-1 text-xs text-muted-foreground"
              }
            >
              {toggle.enabled ? "Enabled" : "Disabled"}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function AuditPanel() {
  return (
    <article className="rounded-3xl border border-border/70 bg-surface p-5 shadow-card">
      <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Audit trail</p>
      <ul className="mt-4 space-y-3 text-sm">
        {auditLog.map((entry) => (
          <li key={entry.id} className="rounded-2xl border border-border/60 p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{entry.action}</p>
              <span className="text-xs uppercase tracking-[0.35rem] text-muted-foreground">{entry.time}</span>
            </div>
            <p className="text-xs text-muted-foreground">{entry.actor}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
