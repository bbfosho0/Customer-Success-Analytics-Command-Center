import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { DEFAULT_FILTERS, GlobalFilters, type FilterState } from "./filters";

const meta = {
  title: "Design System/Global Filters",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function FiltersHarness({ initial, count = 184, total = 240 }: { initial: FilterState; count?: number; total?: number }) {
  const [value, setValue] = useState(initial);
  return <GlobalFilters value={value} onChange={setValue} count={count} total={total} />;
}

export const Default: Story = {
  render: () => <FiltersHarness initial={DEFAULT_FILTERS} />,
  play: async ({ canvas, userEvent }) => {
    const search = canvas.getByRole("textbox");
    await userEvent.type(search, "billing");
    await expect(search).toHaveValue("billing");
  },
};

export const ActiveFilters: Story = {
  render: () => (
    <FiltersHarness
      initial={{
        ...DEFAULT_FILTERS,
        region: "North America" as FilterState["region"],
        status: "escalated" as FilterState["status"],
        dateRange: "30d",
      }}
      count={26}
      total={240}
    />
  ),
};

export const SearchStress: Story = {
  render: () => (
    <FiltersHarness
      initial={{
        ...DEFAULT_FILTERS,
        search: "enterprise customer with an unusually long search query",
      }}
      count={3}
      total={240}
    />
  ),
};
