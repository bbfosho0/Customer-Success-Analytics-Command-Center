import { AlertTriangle, Loader2 } from "lucide-react";

import { Button, EmptyState } from "../ui/primitives";

export type RedesignDataState = "normal" | "loading" | "empty" | "error";

export function RedesignStateSurface({ state, label }: { state: Exclude<RedesignDataState, "normal">; label: string }) {
  if (state === "loading") {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-card">
        <div className="text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium">Loading {label}</p>
          <p className="mt-1 text-xs text-muted-foreground">Fetching the deterministic analytics state.</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/[0.03] px-6 text-center">
        <div>
          <AlertTriangle className="mx-auto h-5 w-5 text-rose-400" />
          <p className="mt-3 text-sm font-medium">{label} could not be loaded</p>
          <p className="mt-1 text-xs text-muted-foreground">The visual state intentionally represents an API failure.</p>
          <Button variant="outline" size="sm" className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return <EmptyState title={`No ${label} match`} description="Broaden the current filters or select another time window." />;
}
