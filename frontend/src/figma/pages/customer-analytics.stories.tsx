import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { visualStates } from "../../mocks/fixtures/visual-states";
import { CustomerAnalyticsPage } from "./customer-analytics";

const meta = {
  title: "Canonical/Pages/Customer 360",
  component: CustomerAnalyticsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CustomerAnalyticsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { initialTab: "overview" } };
export const Overview: Story = { args: { initialTab: "overview" } };
export const ChurnRisk: Story = { args: { initialTab: "churn-risk" } };
export const Retention: Story = { args: { initialTab: "retention" } };
export const Ltv: Story = { args: { initialTab: "ltv" } };
export const Loading: Story = {
  args: { initialTab: "overview" },
  parameters: { msw: { handlers: visualStates.customerAnalytics.loading } },
};
export const Sparse: Story = {
  args: { initialTab: "overview" },
  parameters: { msw: { handlers: visualStates.customerAnalytics.sparse } },
};
export const Empty: Story = {
  args: { initialTab: "overview" },
  parameters: { msw: { handlers: visualStates.customerAnalytics.empty } },
};
export const Error: Story = {
  args: { initialTab: "overview" },
  parameters: { msw: { handlers: visualStates.customerAnalytics.error } },
};
export const HighRisk: Story = {
  args: { initialTab: "overview" },
  parameters: { msw: { handlers: visualStates.customerAnalytics.highRisk } },
};
export const NoRisk: Story = {
  args: { initialTab: "overview" },
  parameters: { msw: { handlers: visualStates.customerAnalytics.noRisk } },
};
export const Mobile: Story = {
  args: { initialTab: "overview" },
  parameters: { viewport: { defaultViewport: "mobile" } },
};
export const Light: Story = { args: { initialTab: "overview" }, globals: { theme: "light" } };
