import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { visualStates } from "../../mocks/fixtures/visual-states";
import { SettingsPage } from "./settings";

const meta = {
  title: "Pages/Settings",
  component: SettingsPage,
  args: { mode: "demo", refreshDisabled: false },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Demo: Story = {};
export const Live: Story = { args: { mode: "live" } };
export const Loading: Story = { parameters: { msw: { handlers: visualStates.settings.loading } } };
export const Error: Story = { parameters: { msw: { handlers: visualStates.settings.error } } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
export const Light: Story = { globals: { theme: "light" } };
