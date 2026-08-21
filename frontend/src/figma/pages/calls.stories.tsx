import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { visualStates } from "../../mocks/fixtures/visual-states";
import { CallsPage } from "./calls";

const meta = {
  title: "Pages/Calls",
  component: CallsPage,
  args: { onOpen: () => undefined },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CallsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Loading: Story = { parameters: { msw: { handlers: visualStates.calls.loading } } };
export const Empty: Story = { parameters: { msw: { handlers: visualStates.calls.empty } } };
export const Error: Story = { parameters: { msw: { handlers: visualStates.calls.error } } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
export const Light: Story = { globals: { theme: "light" } };
