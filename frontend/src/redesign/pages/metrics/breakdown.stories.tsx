import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RedesignMetricsPage } from "./metrics-page";
const meta = { title: "Redesign/Pages/Metrics/Breakdown", component: RedesignMetricsPage, args: { initialView: "breakdown" }, parameters: { layout: "fullscreen" } } satisfies Meta<typeof RedesignMetricsPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Normal: Story = {};
export const Mobile390: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
