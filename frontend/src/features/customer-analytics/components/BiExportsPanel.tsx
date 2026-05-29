import type { BiExport } from "../types";

export function BiExportsPanel({ rows }: { rows: BiExport[] }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-surface p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.3rem] text-muted-foreground">BI exports</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.name} className="rounded-xl bg-surface-strong/70 p-4 text-sm">
            <p className="font-medium">{row.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{row.path}</p>
            <p className="mt-2 text-xs text-muted-foreground">{row.rows} rows · {row.size_bytes.toLocaleString()} bytes</p>
          </div>
        ))}
      </div>
    </section>
  );
}
