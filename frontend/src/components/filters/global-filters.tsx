"use client";

import { useMemo } from "react";

import {
  intentOptions,
  regionOptions,
  timeRangeOptions,
  useDemoFilters,
} from "../../lib/state/demoFilters";
import { buildFilterSummary } from "../../lib/utils/callFiltering";

interface GlobalFiltersProps {
  activeCount?: number;
  totalCount?: number;
  sourceLabel?: string;
}

export function GlobalFilters({ activeCount, totalCount, sourceLabel = "Typed API" }: GlobalFiltersProps) {
  const { selection, setWindow, setRegion, setIntent, reset } = useDemoFilters((state) => ({
    selection: state.selection,
    setWindow: state.setWindow,
    setRegion: state.setRegion,
    setIntent: state.setIntent,
    reset: state.reset,
  }));

  const summary = useMemo(() => buildFilterSummary(selection), [selection]);
  const activeLabel = useMemo(() => {
    if (activeCount == null && totalCount == null) {
      return "Live filtered sample";
    }

    const resolvedActive = activeCount ?? totalCount ?? 0;
    const resolvedTotal = totalCount ?? resolvedActive;

    if (resolvedActive === resolvedTotal) {
      return `${resolvedActive.toLocaleString()} calls`;
    }

    return `${resolvedActive.toLocaleString()} of ${resolvedTotal.toLocaleString()} calls`;
  }, [activeCount, totalCount]);

  return (
    <section className="rounded-[32px] border border-border/60 bg-gradient-to-br from-surface via-surface-strong to-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Filters</p>
          <p className="text-sm text-muted-foreground">Dial in the preview that best matches your briefing.</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-border/60 px-4 py-1.5 text-xs font-semibold text-foreground hover:border-foreground"
        >
          Reset
        </button>
      </div>
      <div className="grid gap-6 px-6 py-6 md:grid-cols-3">
        <FilterGroup
          label="Window"
          options={timeRangeOptions}
          active={selection.window}
          onSelect={setWindow}
        />
        <FilterGroup
          label="Region"
          options={regionOptions}
          active={selection.region}
          onSelect={setRegion}
        />
        <FilterGroup
          label="Intent"
          options={intentOptions}
          active={selection.intent}
          onSelect={setIntent}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 px-6 py-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success" />
          {activeLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Now showing" value={summary} />
          <StatusBadge label="Source" value={sourceLabel} />
        </div>
      </div>
    </section>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: readonly T[];
  active: T;
  onSelect: (option: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.4rem] text-muted-foreground">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={
              option === active
                ? "rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-glow"
                : "rounded-full border border-border/50 px-4 py-1.5 text-xs text-muted-foreground hover:border-accent/60"
            }
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </span>
  );
}
