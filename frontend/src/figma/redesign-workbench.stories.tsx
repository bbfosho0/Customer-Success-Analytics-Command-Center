import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DEFAULT_FILTERS, GlobalFilters, type FilterState } from "./filters";
import {
  EmptyState,
  ErrorState,
  InsightItem,
  KpiCard,
  LoadingState,
  SectionCard,
  StatusBadge,
} from "./primitives";
import { PageHeader } from "./shell";

const meta = {
  title: "Redesign Workbench/Patterns",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const kpis = [
  { label: "Interactions", value: "12,842", delta: 8.4, hint: "vs prior period" },
  { label: "Avg handle time", value: "6m 12s", delta: -3.1, hint: "vs prior period" },
  { label: "Resolution rate", value: "91.4%", delta: 1.8, hint: "percentage-point lift" },
  { label: "Escalations", value: "143", delta: -12, hint: "vs prior period" },
];

const calls = [
  ["C-12842", "Northstar Inc", "us-east-1", "Billing", "5m 14s", "resolved"],
  ["C-12841", "Acme Systems", "eu-west-1", "Authentication", "8m 02s", "escalated"],
  ["C-12840", "Nimbus Labs", "us-west-2", "Connectivity", "4m 37s", "open"],
  ["C-12839", "Atlas Corp", "us-east-1", "Permissions", "6m 10s", "resolved"],
] as const;

function Frame({ children, width = "100%" }: { children: React.ReactNode; width?: string }) {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto space-y-6" style={{ width, maxWidth: "1440px" }}>{children}</div>
    </div>
  );
}

function FilterWorkbench() {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    region: "us-east-1",
    status: "resolved",
  });
  return <GlobalFilters value={filters} onChange={setFilters} count={128} total={842} />;
}

function KpiMatrix() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
    </div>
  );
}

function ChartPatterns() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <SectionCard title="Call volume" description="Dominant trend surface" className="md:col-span-2">
        <div className="flex h-[220px] items-end gap-2 rounded-md border border-dashed border-border p-4">
          {[38, 52, 46, 70, 61, 82, 66, 78, 58, 88, 72, 92].map((height, index) => (
            <div key={index} className="flex-1 rounded-sm bg-accent/70" style={{ height: `${height}%` }} />
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Issue mix" description="Secondary category comparison">
        <div className="space-y-3 pt-2">
          {[["Login / auth", 82], ["Billing", 61], ["Connectivity", 48], ["Permissions", 36]].map(([label, value]) => (
            <div key={String(label)} className="space-y-1">
              <div className="flex justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{value}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent" style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function RegionPattern() {
  return (
    <SectionCard title="Region performance" description="Compact comparative density">
      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full text-xs">
          <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border"><th className="py-2">Region</th><th>Volume</th><th>SLA</th><th>CSAT</th><th>Escalations</th></tr>
          </thead>
          <tbody>
            {["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"].map((region, index) => (
              <tr key={region} className="border-b border-border last:border-0">
                <td className="py-2 font-medium">{region}</td><td>{3842 - index * 603}</td><td>{96 - index * 2}%</td><td>{(4.7 - index * 0.1).toFixed(1)}</td><td>{28 + index * 3}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function DenseTable() {
  return (
    <SectionCard title="Latest calls" description="Operational table density">
      <div className="-m-4 overflow-x-auto">
        <table className="min-w-[820px] w-full text-xs">
          <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border"><th className="px-4 py-2">Call ID</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Region</th><th className="px-4 py-2">Issue</th><th className="px-4 py-2">Duration</th><th className="px-4 py-2">Status</th></tr>
          </thead>
          <tbody>
            {calls.map(([id, customer, region, issue, duration, status]) => (
              <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/60">
                <td className="px-4 py-2 font-medium">{id}</td><td className="px-4 py-2">{customer}</td><td className="px-4 py-2 text-muted-foreground">{region}</td><td className="px-4 py-2">{issue}</td><td className="px-4 py-2 tabular-nums">{duration}</td><td className="px-4 py-2"><StatusBadge status={status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function Signals() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <SectionCard title="Priority insights" description="Severity and information hierarchy">
        <div className="space-y-2">
          <InsightItem severity="critical" title="Authentication escalations rising" body="us-west-2 has crossed the critical intervention threshold." />
          <InsightItem severity="warn" title="Billing handle time trending up" body="Median handle time is materially above the previous period." />
          <InsightItem severity="info" title="Resolution improving" body="Resolution quality improved while total volume increased." />
        </div>
      </SectionCard>
      <SectionCard title="Feedback states" description="Loading, empty, and error treatments">
        <div className="grid gap-3 md:grid-cols-3">
          <LoadingState label="Loading analytics" />
          <EmptyState title="No matching calls" body="Broaden the active filters." />
          <ErrorState body="Analytics could not be loaded." retry={() => undefined} />
        </div>
      </SectionCard>
    </div>
  );
}

function AllPatternsView() {
  return (
    <Frame>
      <PageHeader title="Redesign workbench" description="Isolated visual patterns used to redesign the production dashboard without losing full-page context." />
      <FilterWorkbench />
      <KpiMatrix />
      <ChartPatterns />
      <RegionPattern />
      <Signals />
      <DenseTable />
    </Frame>
  );
}

export const AllPatterns: Story = { render: () => <AllPatternsView /> };
export const FiltersAndControls: Story = { render: () => <Frame><FilterWorkbench /></Frame> };
export const MetricsAndCharts: Story = { render: () => <Frame><KpiMatrix /><ChartPatterns /><RegionPattern /></Frame> };
export const TablesAndSignals: Story = { render: () => <Frame><Signals /><DenseTable /></Frame> };
export const MobileDensity: Story = {
  parameters: { viewport: { defaultViewport: "mobile" } },
  render: () => <Frame width="100%"><KpiMatrix /><ChartPatterns /><Signals /><DenseTable /></Frame>,
};
export const AllPatternsLight: Story = { globals: { theme: "light" }, render: () => <AllPatternsView /> };
