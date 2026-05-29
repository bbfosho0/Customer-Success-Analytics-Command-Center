import { AppShell } from "../../components/layout/app-shell";
import { SectionCard, StatusBadge } from "../../components/ui/figma-primitives";
import { RefreshPanel } from "../../features/settings/refresh-panel";

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
        <RefreshPanel />
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
    <SectionCard title="Configuration">
      <ul className="space-y-3 text-sm">
        {toggles.map((toggle) => (
          <li key={toggle.label} className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="font-semibold text-foreground">{toggle.label}</p>
              <p className="text-xs text-muted-foreground">{toggle.detail}</p>
            </div>
            <StatusBadge status={toggle.enabled ? "Enabled" : "Disabled"} />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function AuditPanel() {
  return (
    <SectionCard title="Audit trail">
      <ul className="space-y-3 text-sm">
        {auditLog.map((entry) => (
          <li key={entry.id} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{entry.action}</p>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{entry.time}</span>
            </div>
            <p className="text-xs text-muted-foreground">{entry.actor}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
