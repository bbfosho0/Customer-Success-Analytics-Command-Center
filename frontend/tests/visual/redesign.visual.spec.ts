import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

import { openStory } from "../helpers/storybook";

const redesignSurfaces = [
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

const matrixViewports = [
  ["desktop", 1440, 1000],
  ["compact-desktop", 1024, 768],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
] as const;

const boundaryWidths = [767, 1023, 1279, 1280] as const;
const evidenceRoot = path.resolve(process.cwd(), "visual-evidence", "redesign");

mkdirSync(evidenceRoot, { recursive: true });
writeFileSync(
  path.join(evidenceRoot, "manifest.json"),
  JSON.stringify(
    {
      version: 1,
      reference: "Whimsical v3 Support Analytics Full Product Responsive Wireframes",
      surfaces: redesignSurfaces.map(([surface, storyId]) => ({ surface, storyId })),
      viewports: matrixViewports.map(([name, width, height]) => ({ name, width, height })),
      boundaryWidths,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

function watchRuntimeErrors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  return { pageErrors, consoleErrors };
}

async function expectNoDocumentOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(Math.max(dimensions.documentWidth, dimensions.bodyWidth)).toBeLessThanOrEqual(dimensions.innerWidth + 1);
}

async function expectResponsiveShell(page: Page, width: number) {
  const desktopNav = page.getByRole("navigation", { name: "Redesign navigation" });
  const mobileMenu = page.getByRole("button", { name: "Open navigation" });
  const overviewLabel = page.locator('nav[aria-label="Redesign navigation"] button[title="Overview"] span');

  if (width < 1024) {
    await expect(desktopNav).toBeHidden();
    await expect(mobileMenu).toBeVisible();
  } else {
    await expect(desktopNav).toBeVisible();
    await expect(mobileMenu).toBeHidden();
  }

  if (width >= 1280) {
    await expect(overviewLabel).toBeVisible();
  } else {
    await expect(overviewLabel).toBeHidden();
  }
}

for (const [surface, storyId] of redesignSurfaces) {
  test(`${surface} responsive evidence matrix`, async ({ page }) => {
    const errors = watchRuntimeErrors(page);

    for (const [viewportName, width, height] of matrixViewports) {
      await openStory(page, storyId, { theme: "dark", viewport: { width, height } });
      const redesignRoot = page.locator("[data-redesign-theme]").first();
      await expect(redesignRoot).toBeVisible();
      expect((await redesignRoot.innerText()).trim().length).toBeGreaterThan(20);
      expect(await page.locator("nextjs-portal").count()).toBe(0);
      await expectNoDocumentOverflow(page);
      await expectResponsiveShell(page, width);

      const directory = path.join(evidenceRoot, viewportName);
      mkdirSync(directory, { recursive: true });
      await page.screenshot({
        path: path.join(directory, `${surface}-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
    }

    expect(errors.pageErrors, `page errors for ${surface}`).toEqual([]);
    expect(errors.consoleErrors, `console errors for ${surface}`).toEqual([]);
  });

  test(`${surface} breakpoint boundary contract`, async ({ page }) => {
    const errors = watchRuntimeErrors(page);

    for (const width of boundaryWidths) {
      const height = width < 1024 ? 900 : 800;
      await openStory(page, storyId, { theme: "dark", viewport: { width, height } });
      await expectNoDocumentOverflow(page);
      await expectResponsiveShell(page, width);

      const directory = path.join(evidenceRoot, "boundaries");
      mkdirSync(directory, { recursive: true });
      await page.screenshot({
        path: path.join(directory, `${surface}-${width}.png`),
        fullPage: false,
        animations: "disabled",
      });
    }

    expect(errors.pageErrors, `boundary page errors for ${surface}`).toEqual([]);
    expect(errors.consoleErrors, `boundary console errors for ${surface}`).toEqual([]);
  });
}

test("customer 360 tabs update the rendered redesign state", async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await openStory(page, "redesign-pages-customer-360-overview--normal", {
    theme: "dark",
    viewport: { width: 1280, height: 900 },
  });

  await page.getByRole("button", { name: "Churn Risk" }).click();
  await expect(page.getByText("Risk accounts", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Retention" }).click();
  await expect(page.getByText("Retention cohorts", { exact: true })).toBeVisible();

  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});
