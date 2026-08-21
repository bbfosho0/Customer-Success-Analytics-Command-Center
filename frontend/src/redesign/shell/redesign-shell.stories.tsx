import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MetricCard } from "../patterns/patterns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/primitives";
import { RedesignPageHeader, RedesignShell } from "./redesign-shell";

const meta = {
  title: "Redesign/Shell/Application Shell",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ShellDemo() {
  return (
    <RedesignShell route="dashboard">
      <div className="space-y-4">
        <RedesignPageHeader title="Overview" eyebrow="Operations" description="Responsive shell geometry before page-specific redesign work." />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Interactions" value="12,842" comparison="last 7 days" />
          <MetricCard label="Resolution" value="91.4%" comparison="target 90%" />
          <MetricCard label="Escalations" value="143" tone="warning" />
          <MetricCard label="Active regions" value="6" />
        </div>
        <Card>
          <CardHeader><CardTitle>Workspace surface</CardTitle></CardHeader>
          <CardContent><div className="h-72 rounded-md border border-dashed border-border bg-muted/20" /></CardContent>
        </Card>
      </div>
    </RedesignShell>
  );
}

export const Desktop: Story = { render: () => <ShellDemo /> };
export const CompactDesktop: Story = { parameters: { viewport: { defaultViewport: "tablet" } }, render: () => <ShellDemo /> };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile" } }, render: () => <ShellDemo /> };
