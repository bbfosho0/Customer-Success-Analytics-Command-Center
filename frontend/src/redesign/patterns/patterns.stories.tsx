import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RedesignTheme } from "../foundations/redesign-theme";
import { ChartPanel, FilterBar, InsightPanel, MetricCard, MobileDataRow, RankingRow, StatusBadge, StatusTimeline } from "./patterns";

const meta = {
  title: "Redesign/Patterns/Core",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Catalog() {
  return (
    <RedesignTheme theme="dark" className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <FilterBar activeCount={3} summary="Last 7 days · 6 regions · 842 records" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Interactions" value="12,842" delta={8.4} comparison="vs previous window" />
          <MetricCard label="Avg handle time" value="6m 12s" delta={-3.1} comparison="42s faster" tone="success" />
          <MetricCard label="Resolution rate" value="91.4%" delta={1.8} comparison="target 90%" />
          <MetricCard label="Escalations" value="143" delta={12.0} comparison="above target" tone="danger" />
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <ChartPanel title="Call volume" description="Dominant analytical surface" className="lg:col-span-2">
            <div className="flex h-56 items-end gap-2 rounded-md border border-dashed border-border p-4">
              {[42, 56, 49, 68, 61, 82, 75, 91, 66, 84, 78, 94].map((height, index) => <div key={index} className="flex-1 rounded-sm bg-[var(--chart-1)]/70" style={{ height: `${height}%` }} />)}
            </div>
          </ChartPanel>
          <InsightPanel items={[
            { title: "Authentication escalation pressure", detail: "us-west-2 is materially above the rolling baseline.", tone: "danger" },
            { title: "Resolution quality improving", detail: "FCR improved while volume increased.", tone: "success" },
          ]} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <MobileDataRow title="CALL_12841" subtitle="Acme Systems · Authentication" status={<StatusBadge status="Escalated" />} meta={["8m 02s", "us-west-2", "Mia Torres"]} />
            <RankingRow rank={1} name="Mia Torres" primary="96.4" secondary="Resolution quality" trend="up" />
          </div>
          <ChartPanel title="Lifecycle" description="Operational status timeline">
            <StatusTimeline items={[
              { label: "Call received", detail: "14:32:18", state: "done" },
              { label: "First response", detail: "14:32:46 · 28s", state: "done" },
              { label: "Escalation review", detail: "Authentication specialist engaged", state: "active" },
              { label: "Resolved", detail: "Pending", state: "pending" },
            ]} />
          </ChartPanel>
        </div>
      </div>
    </RedesignTheme>
  );
}

export const CatalogDark: Story = { render: () => <Catalog /> };
export const MobileDensity: Story = { parameters: { viewport: { defaultViewport: "mobile" } }, render: () => <Catalog /> };
