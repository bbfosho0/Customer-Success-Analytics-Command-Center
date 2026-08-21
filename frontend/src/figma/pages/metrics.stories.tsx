import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { visualStates } from "../../mocks/fixtures/visual-states";
import { MetricsPage } from "./metrics";

const meta = {
  title: "Pages/Metrics",
  component: MetricsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MetricsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Loading: Story = { parameters: { msw: { handlers: visualStates.metrics.loading } } };
export const Empty: Story = { parameters: { msw: { handlers: visualStates.metrics.empty } } };
export const Error: Story = { parameters: { msw: { handlers: visualStates.metrics.error } } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
