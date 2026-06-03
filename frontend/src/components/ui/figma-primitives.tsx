import { AlertOctagon, AlertTriangle, ArrowDown, ArrowUp, Inbox, Info, Loader2, Minus } from "lucide-react";
import type React from "react";

import { cn } from "../../lib/utils/cn";

export function FigmaKpiCard({
  label,
  value,
  delta,
  hint,
  unit,
}: {
  label: string;
  value: string | number;
  delta?: number | null;
  hint?: string;
  unit?: string;
}) {
  const normalizedDelta = delta ?? undefined;
  const dir = normalizedDelta === undefined ? null : normalizedDelta > 0 ? "up" : normalizedDelta < 0 ? "down" : "flat";
  const dirColor = dir === "up" ? "text-emerald-600 dark:text-emerald-400" : dir === "down" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground";
  const DirIcon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus;

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
        <span className="min-w-0 break-words text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {normalizedDelta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 text-[11px] tabular-nums", dirColor)}>
            <DirIcon className="h-3 w-3" />
            {Math.abs(normalizedDelta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-1 flex min-w-0 items-baseline gap-1">
        <span className="text-[22px] tracking-tight text-foreground tabular-nums">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-card", className)}>
      {(title || action) && (
        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="min-w-0">
            {title && <h3 className="break-words text-[13px] font-medium leading-snug text-foreground">{title}</h3>}
            {description && <p className="break-words text-xs leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          <div className="shrink-0">{action}</div>
        </div>
      )}
      <div className="min-w-0 p-4">{children}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const palette =
    normalized.includes("resolved") || normalized.includes("healthy") || normalized.includes("success")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
      : normalized.includes("critical") || normalized.includes("escalated") || normalized.includes("failed")
        ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
        : normalized.includes("risk") || normalized.includes("watch") || normalized.includes("pending")
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
          : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
  return <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px]", palette)}>{status}</span>;
}

export function EmptyState({ title, body, icon: Icon = Inbox }: { title: string; body?: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="rounded-full border border-border bg-muted p-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm text-foreground">{title}</p>
      {body && <p className="max-w-sm break-words text-xs leading-relaxed text-muted-foreground">{body}</p>}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> {label}...
    </div>
  );
}

export function ErrorState({ title = "Couldn't load data", body, retry }: { title?: string; body?: string; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
        <AlertOctagon className="h-4 w-4" />
      </div>
      <p className="text-sm text-foreground">{title}</p>
      {body && <p className="max-w-sm text-xs text-muted-foreground">{body}</p>}
      {retry && (
        <button onClick={retry} className="mt-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs hover:bg-muted">
          Retry
        </button>
      )}
    </div>
  );
}

export function InsightItem({ severity, title, body }: { severity: "info" | "warn" | "critical"; title: string; body: string }) {
  const map = {
    info: { Icon: Info, cls: "text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/30" },
    warn: { Icon: AlertTriangle, cls: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30" },
    critical: { Icon: AlertOctagon, cls: "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30" },
  } as const;
  const { Icon, cls } = map[severity];
  return (
    <div className={cn("flex gap-2.5 rounded-md border px-3 py-2.5", cls)}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0">
        <p className="break-words text-[13px] leading-snug text-foreground">{title}</p>
        <p className="mt-0.5 break-words text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
