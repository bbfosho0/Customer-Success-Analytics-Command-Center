import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Chip,
  EmptyState,
  ErrorState,
  InsightItem,
  KpiCard,
  LoadingState,
  SectionCard,
  StatusBadge,
} from "./primitives";

const meta = {
  title: "Design System/Primitives",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const KpiCards: Story = {
  render: () => (
    <div className="grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Active customers" value="12,842" delta={8.4} hint="vs previous period" />
      <KpiCard label="At-risk ARR" value="$841,000" delta={42} hint="requires attention" />
      <KpiCard label="Resolution rate" value="94.8" unit="%" delta={0} />
      <KpiCard label="Extremely long enterprise metric label" value="$987,492,830.42" delta={128.74} hint="Stress test for long labels and large values" />
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="resolved" />
      <StatusBadge status="escalated" />
      <StatusBadge status="open" />
      <StatusBadge status="pending" />
    </div>
  ),
};

export const Chips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip>Inactive filter</Chip>
      <Chip active>Active filter</Chip>
      <Chip active>Region: North America</Chip>
    </div>
  ),
};

export const SectionCards: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SectionCard title="Customer health" description="Canonical bordered content surface" action={<button className="text-xs text-muted-foreground">View all</button>}>
        <p className="text-sm text-foreground">Content area for tables, charts, insights, or supporting detail.</p>
      </SectionCard>
    </div>
  ),
};

export const FeedbackStates: Story = {
  render: () => (
    <div className="grid max-w-5xl gap-3 md:grid-cols-3">
      <SectionCard><LoadingState label="Loading customer analytics" /></SectionCard>
      <SectionCard><EmptyState title="No customers match" body="Try broadening the current filters." /></SectionCard>
      <SectionCard><ErrorState body="The analytics service returned an error." retry={() => undefined} /></SectionCard>
    </div>
  ),
};

export const InsightSeverities: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-2">
      <InsightItem severity="info" title="Expansion signal" body="Healthy adoption and usage support an expansion conversation." />
      <InsightItem severity="warn" title="Renewal watch" body="Engagement has declined over the most recent period." />
      <InsightItem severity="critical" title="Critical churn risk" body="Payment failure and low product adoption require immediate follow-up." />
    </div>
  ),
};
