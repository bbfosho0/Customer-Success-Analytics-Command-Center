import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { visualStates } from "../../mocks/fixtures/visual-states";
import { CallDetailPage } from "./call-detail";

const meta = {
  title: "Canonical/Pages/Call Detail",
  component: CallDetailPage,
  args: {
    id: "CALL_0001",
    onBack: () => undefined,
    onOpen: () => undefined,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CallDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Loading: Story = { parameters: { msw: { handlers: visualStates.callDetail.loading } } };
export const LongContent: Story = { parameters: { msw: { handlers: visualStates.callDetail.longContent } } };
export const NotFound: Story = { parameters: { msw: { handlers: visualStates.callDetail.notFound } } };
export const Error: Story = { parameters: { msw: { handlers: visualStates.callDetail.error } } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
