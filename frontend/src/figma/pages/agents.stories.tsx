import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { visualStates } from "../../mocks/fixtures/visual-states";
import { AgentsPage } from "./agents";

const meta = {
  title: "Pages/Agents",
  component: AgentsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AgentsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Loading: Story = { parameters: { msw: { handlers: visualStates.agents.loading } } };
export const Empty: Story = { parameters: { msw: { handlers: visualStates.agents.empty } } };
export const Error: Story = { parameters: { msw: { handlers: visualStates.agents.error } } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
