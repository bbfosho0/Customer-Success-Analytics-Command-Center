"use client";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Search, SlidersHorizontal } from "lucide-react";

import { cn } from "../lib/utils";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "../ui/primitives";

export type MetricCardProps = {
  label: string;
  value: string | number;
  comparison?: string;
  delta?: number;
  tone?: "default" | "success" | "warning" | "danger";
  detail?: ReactNode;
};

export function MetricCard({ label, value, comparison, delta, tone = "default", detail }: MetricCardProps) {
  const positive = typeof delta === "number" && delta > 0;
  const negative = typeof delta === "number" && delta < 0;
  return (
    <Card className="min-h-[126px] overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
          {typeof delta === "number" ? (
            <span className={cn("inline-flex items-center gap-0.5 text-[11px] tabular-nums", positive && "text-emerald-400", negative && "text-rose-400", !positive && !negative && "text-muted-foreground")}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : negative ? <ArrowDownRight className="h-3 w-3" /> : null}
              {Math.abs(delta).toFixed(1)}%
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-semibold tracking-tight tabular-nums", tone === "success" && "text-emerald-400", tone === "warning" && "text-amber-400", tone === "danger" && "text-rose-400")}>{value}</div>
        {comparison ? <p className="mt-1 text-[11px] text-muted-foreground">{comparison}</p> : null}
        {detail ? <div className="mt-3">{detail}</div> : null}
      </CardContent>
    </Card>
  );
}

export type FilterBarProps = {
  search?: string;
  onSearch?: (value: string) => void;
  summary?: string;
  activeCount?: number;
  actions?: ReactNode;
};

export function FilterBar({ search = "", onSearch, summary = "Last 7 days · All regions", activeCount = 0, actions }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2.5 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search" value={search} onChange={(event) => onSearch?.(event.target.value)} placeholder="Search calls, accounts, agents…" className="pl-8" />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:justify-end">
        <span className="min-w-0 truncate text-[11px] text-muted-foreground">{summary}</span>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters{activeCount ? ` ${activeCount}` : ""}
        </Button>
        {actions}
      </div>
    </div>
  );
}

export type ChartPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ChartPanel({ title, description, action, children, className, contentClassName }: ChartPanelProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export function InsightPanel({ title = "Priority intelligence", items }: { title?: string; items: Array<{ title: string; detail: string; tone?: "info" | "warning" | "danger" | "success" }> }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={`${item.title}-${item.detail}`} className="rounded-md border border-border bg-muted/25 p-3">
            <div className="flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full bg-indigo-400", item.tone === "warning" && "bg-amber-400", item.tone === "danger" && "bg-rose-400", item.tone === "success" && "bg-emerald-400")} />
              <p className="text-xs font-medium">{item.title}</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export type MobileDataRowProps = {
  title: string;
  status?: ReactNode;
  subtitle?: string;
  meta?: Array<string | undefined | null>;
  onClick?: () => void;
};

export function MobileDataRow({ title, status, subtitle, meta = [], onClick }: MobileDataRowProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          {subtitle ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">{status}<ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
      </div>
      {meta.filter(Boolean).length ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">{meta.filter(Boolean).map((item) => <span key={item as string}>{item}</span>)}</div> : null}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="w-full rounded-lg border border-border bg-card p-3 text-left outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-[var(--ring)]">{content}</button>
  ) : (
    <div className="rounded-lg border border-border bg-card p-3">{content}</div>
  );
}

export type RankingRowProps = {
  rank: number;
  name: string;
  primary: string;
  secondary?: string;
  trend?: "up" | "down" | "flat";
};

export function RankingRow({ rank, name, primary, secondary, trend = "flat" }: RankingRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums">{rank}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {secondary ? <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{secondary}</p> : null}
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">{primary}</p>
        <p className={cn("text-[10px] text-muted-foreground", trend === "up" && "text-emerald-400", trend === "down" && "text-rose-400")}>{trend === "up" ? "Improving" : trend === "down" ? "Needs attention" : "Stable"}</p>
      </div>
    </div>
  );
}

export type StatusTimelineProps = {
  items: Array<{ label: string; detail?: string; state?: "done" | "active" | "pending" }>;
};

export function StatusTimeline({ items }: StatusTimelineProps) {
  return (
    <ol className="space-y-0">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 ? <span className="absolute left-[7px] top-4 h-[calc(100%-4px)] w-px bg-border" /> : null}
          <span className={cn("relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-card", item.state === "done" && "border-emerald-400 bg-emerald-400", item.state === "active" && "border-indigo-400 bg-indigo-400 shadow-[0_0_0_4px_rgba(129,140,248,0.12)]")} />
          <div className="min-w-0">
            <p className="text-xs font-medium">{item.label}</p>
            {item.detail ? <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function TabBar<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: Array<{ value: T; label: string }> }) {
  return (
    <div role="tablist" className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 [scrollbar-width:none]">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn("min-h-10 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors sm:min-h-0", value === item.value ? "bg-muted text-foreground" : "hover:text-foreground")}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = normalized.includes("resolved") || normalized.includes("healthy") || normalized.includes("ready") ? "success" : normalized.includes("escalat") || normalized.includes("critical") || normalized.includes("error") ? "danger" : normalized.includes("risk") || normalized.includes("watch") || normalized.includes("pending") ? "warning" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
