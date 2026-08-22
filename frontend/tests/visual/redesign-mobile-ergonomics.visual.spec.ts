import { expect, test, type Locator } from "@playwright/test";

import { openStory } from "../helpers/storybook";

async function expectMinTouchHeight(locator: Locator) {
  const height = await locator.evaluate((element: HTMLElement) => element.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(40);
}

test("mobile operational controls meet the 40px touch target minimum", async ({ page }) => {
  await openStory(page, "redesign-pages-calls--normal", {
    theme: "dark",
    viewport: { width: 390, height: 844 },
  });

  await expectMinTouchHeight(page.getByPlaceholder("Search calls, accounts, agents..."));
  await expectMinTouchHeight(page.getByRole("button", { name: /Filters/ }));
  await expectMinTouchHeight(page.getByRole("combobox"));
  await expectMinTouchHeight(page.getByRole("button", { name: "Sort" }));

  await openStory(page, "redesign-pages-dashboard--normal", {
    theme: "dark",
    viewport: { width: 390, height: 844 },
  });

  await expectMinTouchHeight(page.getByRole("button", { name: "Export snapshot" }));
  await expectMinTouchHeight(page.getByPlaceholder("Search calls, accounts, agents..."));
});
