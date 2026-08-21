import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RedesignDashboardPage } from "./dashboard-page";

const meta = {
  title: "Redesign/Pages/Dashboard",
  component: RedesignDashboardPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RedesignDashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Loading: Story = { args: { state: "loading" } };
export const Empty: Story = { args: { state: "empty" } };
export const Error: Story = { args: { state: "error" } };
export const Mobile390: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
export const Mobile360: Story = { parameters: { viewport: { defaultViewport: "smallMobile" } } };
