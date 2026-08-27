import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RedesignTheme } from "./redesign-theme";

const meta = {
  title: "Redesign/Foundations/Theme",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const swatches = [
  ["Primary", "var(--primary)"],
  ["Accent", "var(--accent)"],
  ["Chart 1", "var(--chart-1)"],
  ["Chart 2", "var(--chart-2)"],
  ["Chart 3", "var(--chart-3)"],
  ["Chart 4", "var(--chart-4)"],
  ["Chart 5", "var(--chart-5)"],
] as const;

function ThemeCatalog({ theme }: { theme: "light" | "dark" }) {
  return (
    <RedesignTheme theme={theme} className="p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Command Graphite</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Operational analytics, without dashboard noise.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Graphite structure, indigo identity, teal analytical signal, restrained semantic status colors.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {swatches.map(([label, value]) => (
            <div key={label} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="h-20" style={{ background: value }} />
              <div className="p-3">
                <p className="text-xs font-medium">{label}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Typography</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight">12,842 interactions</p>
            <p className="mt-1 text-sm text-muted-foreground">Tabular values are prominent, labels stay compact, descriptions explain operational context.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Surface stack</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-md border border-border bg-background p-3 text-xs">Workspace background</div>
              <div className="rounded-md border border-border bg-card p-3 text-xs">Primary card</div>
              <div className="rounded-md border border-border bg-muted p-3 text-xs">Muted diagnostic surface</div>
            </div>
          </div>
        </div>
      </div>
    </RedesignTheme>
  );
}

export const Dark: Story = { render: () => <ThemeCatalog theme="dark" /> };
export const Light: Story = { render: () => <ThemeCatalog theme="light" /> };
