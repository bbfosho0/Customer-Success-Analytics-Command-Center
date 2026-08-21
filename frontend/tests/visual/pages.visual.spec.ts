import { expect, test } from "@playwright/test";

import { captureEvidence, writeEvidenceManifest } from "../helpers/visual-evidence";
import { openStory } from "../helpers/storybook";
import { evidenceManifest } from "./evidence-manifest";

const regressionStories = [
  { name: "dashboard-dark-1440", storyId: "pages-dashboard--normal", theme: "dark" as const, width: 1440, height: 1000 },
  { name: "calls-dark-1280", storyId: "pages-calls--normal", theme: "dark" as const, width: 1280, height: 900 },
  { name: "agents-dark-1280", storyId: "pages-agents--normal", theme: "dark" as const, width: 1280, height: 900 },
  { name: "metrics-dark-1280", storyId: "pages-metrics--normal", theme: "dark" as const, width: 1280, height: 900 },
  { name: "customer-analytics-dark-1440", storyId: "pages-customer-analytics--overview", theme: "dark" as const, width: 1440, height: 1000 },
  { name: "settings-dark-1024", storyId: "pages-settings--demo", theme: "dark" as const, width: 1024, height: 768 },
  { name: "dashboard-mobile-390", storyId: "pages-dashboard--normal", theme: "dark" as const, width: 390, height: 844 },
  { name: "customer-analytics-mobile-360", storyId: "pages-customer-analytics--overview", theme: "light" as const, width: 360, height: 800 },
];

for (const entry of regressionStories) {
  test(`${entry.name} baseline`, async ({ page }) => {
    await openStory(page, entry.storyId, {
      theme: entry.theme,
      viewport: { width: entry.width, height: entry.height },
    });
    await expect(page).toHaveScreenshot(`${entry.name}.png`, { fullPage: true });
  });
}

test("capture AI review evidence", async ({ page }) => {
  writeEvidenceManifest(evidenceManifest);
  for (const entry of evidenceManifest) {
    await captureEvidence(page, entry);
  }
});
