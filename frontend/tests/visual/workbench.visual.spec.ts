import { expect, test } from "@playwright/test";

import { openStory } from "../helpers/storybook";

const STORY_ID = "canonical-reference-pre-redesign-workbench--all-patterns";

test.describe("pre-redesign workbench", () => {
  test("renders the full pattern catalog in dark theme", async ({ page }) => {
    await openStory(page, STORY_ID, { theme: "dark", viewport: { width: 1280, height: 900 } });
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByText("Redesign workbench")).toBeVisible();
    await expect(page.getByText("Call volume")).toBeVisible();
    await expect(page.getByText("Latest calls")).toBeVisible();
  });

  test("propagates the light theme without changing the frozen reference surface contract", async ({ page }) => {
    await openStory(page, STORY_ID, { theme: "dark", viewport: { width: 1280, height: 900 } });
    await expect(page.locator("html")).toHaveClass(/dark/);

    await openStory(page, STORY_ID, { theme: "light", viewport: { width: 1280, height: 900 } });
    await expect(page.locator("html")).toHaveClass(/light/);
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.getByText("Redesign workbench")).toBeVisible();
    await expect(page.getByText("Call volume")).toBeVisible();
    await expect(page.getByText("Latest calls")).toBeVisible();
  });

  test("keeps the mobile-density story renderable at the canonical mobile width", async ({ page }) => {
    await openStory(page, "canonical-reference-pre-redesign-workbench--mobile-density", {
      theme: "dark",
      viewport: { width: 390, height: 844 },
    });
    await expect(page.getByText("Priority insights")).toBeVisible();
    await expect(page.getByText("Latest calls")).toBeVisible();
  });
});
