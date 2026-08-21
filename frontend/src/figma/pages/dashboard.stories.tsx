import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { visualStates } from "../../mocks/fixtures/visual-states";
import { DashboardPage } from "./dashboard";

const meta = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  args: {
    onOpenCall: () => undefined,
    onAllCalls: () => undefined,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Sparse: Story = { parameters: { msw: { handlers: visualStates.dashboard.sparse } } };
export const HighRisk: Story = { parameters: { msw: { handlers: visualStates.dashboard.highRisk } } };
export const Loading: Story = { parameters: { msw: { handlers: visualStates.dashboard.loading } } };
export const Empty: Story = { parameters: { msw: { handlers: visualStates.dashboard.empty } } };
export const Error: Story = { parameters: { msw: { handlers: visualStates.dashboard.error } } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
export const Light: Story = { globals: { theme: "light" } };
