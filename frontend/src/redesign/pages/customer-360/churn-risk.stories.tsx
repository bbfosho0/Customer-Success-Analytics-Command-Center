import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RedesignCustomer360Page } from "./customer-360-page";
const meta = { title: "Redesign/Pages/Customer 360/Churn Risk", component: RedesignCustomer360Page, args: { initialView: "churn-risk" }, parameters: { layout: "fullscreen" } } satisfies Meta<typeof RedesignCustomer360Page>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Normal: Story = {};
export const Mobile390: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
