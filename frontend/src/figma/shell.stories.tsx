import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KpiCard, SectionCard } from "./primitives";
import { AppShell, PageHeader, type Route } from "./shell";

const meta = {
  title: "Canonical/Design System/Application Shell",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ShellHarness({ initialRoute }: { initialRoute: Route }) {
  const [route, setRoute] = useState<Route>(initialRoute);
  const [mode, setMode] = useState<"live" | "demo">("demo");

  return (
    <AppShell route={route} navigate={setRoute} mode={mode} setMode={setMode}>
      <PageHeader
        title={route.name === "call" ? "Call detail" : "Customer Success Analytics"}
        description="Canonical shell baseline for responsive visual review"
        actions={<button className="rounded-md border border-border px-2 py-1 text-xs">Export</button>}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <KpiCard label="Active customers" value="12,842" delta={8.4} />
        <KpiCard label="At-risk ARR" value="$841K" delta={-4.1} />
        <KpiCard label="Retention" value="94.2" unit="%" delta={1.8} />
      </div>
      <div className="mt-3">
        <SectionCard title="Workspace surface" description="Representative content inside the canonical application shell.">
          <div className="h-48 rounded-md border border-dashed border-border bg-muted/30" />
        </SectionCard>
      </div>
    </AppShell>
  );
}

export const DashboardRoute: Story = {
  render: () => <ShellHarness initialRoute={{ name: "dashboard" }} />,
};

export const CallDetailBreadcrumb: Story = {
  render: () => <ShellHarness initialRoute={{ name: "call", id: "call_001" }} />,
};
