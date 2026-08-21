import { expect, test } from "@playwright/test";

import { openStory } from "../helpers/storybook";

const STORY_ID = "redesign-workbench-patterns--all-patterns";

async function renderedBackground(page: Parameters<typeof openStory>[0]) {
  return page.locator("[data-storybook-root]").evaluate((element) => getComputedStyle(element).backgroundColor);
}

test.describe("redesign workbench", () => {
  test("renders the full pattern catalog in dark theme", async ({ page }) => {
    await openStory(page, STORY_ID, { theme: "dark", viewport: { width: 1280, height: 900 } });
    await expect(page.getByText("Redesign workbench")).toBeVisible();
    await expect(page.getByText("Call volume")).toBeVisible();
    await expect(page.getByText("Latest calls")).toBeVisible();
  });

  test("renders the same catalog in light theme with a distinct theme surface", async ({ page }) => {
    await openStory(page, STORY_ID, { theme: "dark", viewport: { width: 1280, height: 900 } });
    const darkBackground = await renderedBackground(page);

    await openStory(page, STORY_ID, { theme: "light", viewport: { width: 1280, height: 900 } });
    const lightBackground = await renderedBackground(page);

    await expect(page.getByText("Redesign workbench")).toBeVisible();
    expect(lightBackground).not.toBe(darkBackground);
  });

  test("keeps the mobile-density story renderable at the canonical mobile width", async ({ page }) => {
    await openStory(page, "redesign-workbench-patterns--mobile-density", {
      theme: "dark",
      viewport: { width: 390, height: 844 },
    });
    await expect(page.getByText("Priority insights")).toBeVisible();
    await expect(page.getByText("Latest calls")).toBeVisible();
  });
});
