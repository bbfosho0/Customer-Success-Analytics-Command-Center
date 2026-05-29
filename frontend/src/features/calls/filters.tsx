"use client";

import { useMemo } from "react";

import {
  intentOptions,
  regionOptions,
  timeRangeOptions,
  useDemoFilters,
} from "../../lib/state/demoFilters";
import { buildFilterSummary } from "../../lib/utils/callFiltering";

export function CallsFilters() {
  const { selection, setWindow, setRegion, setIntent, reset } = useDemoFilters((state) => ({
    selection: state.selection,
    setWindow: state.setWindow,
    setRegion: state.setRegion,
    setIntent: state.setIntent,
    reset: state.reset,
  }));
  const summary = useMemo(() => buildFilterSummary(selection), [selection]);

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Filters</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"
        >
          Reset
        </button>
      </div>
      <div className="mt-4 space-y-4 text-sm">
        <FilterRow label="Window" options={timeRangeOptions} active={selection.window} onSelect={setWindow} />
        <FilterRow label="Region" options={regionOptions} active={selection.region} onSelect={setRegion} />
        <FilterRow label="Intent" options={intentOptions} active={selection.intent} onSelect={setIntent} />
        <div className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          <p className="uppercase tracking-wider text-muted-foreground">Current selection</p>
          <p className="mt-1 text-foreground">{summary}</p>
        </div>
      </div>
    </div>
  );
}

function FilterRow<T extends string>({
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
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={
              option === active
                ? "rounded-md bg-accent px-3 py-1.5 text-xs text-accent-foreground"
                : "rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            }
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
