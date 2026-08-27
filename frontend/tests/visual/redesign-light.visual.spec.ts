import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

import { openStory } from "../helpers/storybook";

const surfaces = [
  ["dashboard", "redesign-pages-dashboard--normal"],
  ["calls", "redesign-pages-calls--normal"],
  ["call-detail", "redesign-pages-call-detail--normal"],
  ["agent-intelligence", "redesign-pages-agent-intelligence--normal"],
  ["metrics-overview", "redesign-pages-metrics-overview--normal"],
  ["metrics-volume", "redesign-pages-metrics-volume--normal"],
  ["metrics-breakdown", "redesign-pages-metrics-breakdown--normal"],
  ["metrics-regions", "redesign-pages-metrics-regions--normal"],
  ["customer-360-overview", "redesign-pages-customer-360-overview--normal"],
  ["customer-360-churn-risk", "redesign-pages-customer-360-churn-risk--normal"],
  ["customer-360-retention", "redesign-pages-customer-360-retention--normal"],
  ["customer-360-ltv", "redesign-pages-customer-360-ltv--normal"],
  ["settings-manifest", "redesign-pages-settings-manifest--normal"],
] as const;

const viewports = [
  ["desktop", 1280, 900],
  ["mobile", 390, 844],
] as const;

const evidenceRoot = path.resolve(process.cwd(), "visual-evidence", "redesign", "light");

for (const [surface, storyId] of surfaces) {
  test(`${surface} light theme renders at desktop and mobile`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    for (const [viewportName, width, height] of viewports) {
      await openStory(page, storyId, { theme: "light", viewport: { width, height } });
      const redesignRoot = page.locator("[data-redesign-theme]").first();
      await expect(redesignRoot).toBeVisible();
      await expect(page.locator("html")).toHaveClass(/light/);

      const dimensions = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
      }));
      expect(Math.max(dimensions.documentWidth, dimensions.bodyWidth)).toBeLessThanOrEqual(dimensions.innerWidth + 1);

      const directory = path.join(evidenceRoot, viewportName);
      mkdirSync(directory, { recursive: true });
      await page.screenshot({
        path: path.join(directory, `${surface}-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
    }

    expect(pageErrors, `light-theme page errors for ${surface}`).toEqual([]);
    expect(consoleErrors, `light-theme console errors for ${surface}`).toEqual([]);
  });
}
