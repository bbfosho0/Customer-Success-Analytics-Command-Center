import { SectionCard } from "../../../components/ui/figma-primitives";
import type { BiExport } from "../types";

export function BiExportsPanel({ rows }: { rows: BiExport[] }) {
  return (
    <SectionCard title="BI exports" description="Tableau and CRM Analytics-ready extracts">
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.name} className="rounded-md border border-border bg-muted p-3 text-sm">
            <p className="font-medium">{row.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{row.path}</p>
            <p className="mt-2 text-xs text-muted-foreground">{row.rows} rows · {row.size_bytes.toLocaleString()} bytes</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
