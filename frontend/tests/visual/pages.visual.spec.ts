import { expect, test } from "@playwright/test";

import { captureEvidence, writeEvidenceManifest } from "../helpers/visual-evidence";
import { openStory, type StoryTheme } from "../helpers/storybook";
import { evidenceManifest } from "./evidence-manifest";

type RegressionEntry = {
  name: string;
  storyId: string;
  theme: StoryTheme;
  width: number;
  height: number;
};

const normalSurfaces = [
  ["dashboard", "pages-dashboard--normal"],
  ["calls", "pages-calls--normal"],
  ["call-detail", "pages-call-detail--normal"],
  ["agents", "pages-agents--normal"],
  ["metrics", "pages-metrics--normal"],
  ["customer-analytics", "pages-customer-analytics--normal"],
  ["settings", "pages-settings--default"],
] as const;

const canonicalViewports = [
  ["1440", 1440, 1000],
  ["1280", 1280, 900],
  ["1024", 1024, 768],
  ["390", 390, 844],
  ["360", 360, 800],
] as const;

const regressionStories: RegressionEntry[] = [];

for (const [surface, storyId] of normalSurfaces) {
  for (const [viewportName, width, height] of canonicalViewports) {
    regressionStories.push({
      name: `${surface}-normal-dark-${viewportName}`,
      storyId,
      theme: "dark",
      width,
      height,
    });
  }
  regressionStories.push({
    name: `${surface}-normal-light-1280`,
    storyId,
    theme: "light",
    width: 1280,
    height: 900,
  });
  regressionStories.push({
    name: `${surface}-normal-light-390`,
    storyId,
    theme: "light",
    width: 390,
    height: 844,
  });
}

regressionStories.push(
  { name: "dashboard-sparse-dark-1280", storyId: "pages-dashboard--sparse", theme: "dark", width: 1280, height: 900 },
  { name: "dashboard-high-risk-dark-1280", storyId: "pages-dashboard--high-risk", theme: "dark", width: 1280, height: 900 },
  { name: "dashboard-empty-dark-1280", storyId: "pages-dashboard--empty", theme: "dark", width: 1280, height: 900 },
  { name: "dashboard-error-dark-1280", storyId: "pages-dashboard--error", theme: "dark", width: 1280, height: 900 },
  { name: "calls-long-content-dark-390", storyId: "pages-calls--long-content", theme: "dark", width: 390, height: 844 },
  { name: "calls-empty-dark-1280", storyId: "pages-calls--empty", theme: "dark", width: 1280, height: 900 },
  { name: "calls-error-dark-1280", storyId: "pages-calls--error", theme: "dark", width: 1280, height: 900 },
  { name: "call-detail-long-content-dark-390", storyId: "pages-call-detail--long-content", theme: "dark", width: 390, height: 844 },
  { name: "call-detail-not-found-dark-1280", storyId: "pages-call-detail--not-found", theme: "dark", width: 1280, height: 900 },
  { name: "call-detail-error-dark-1280", storyId: "pages-call-detail--error", theme: "dark", width: 1280, height: 900 },
  { name: "agents-mixed-performance-dark-1280", storyId: "pages-agents--mixed-performance", theme: "dark", width: 1280, height: 900 },
  { name: "agents-empty-dark-1280", storyId: "pages-agents--empty", theme: "dark", width: 1280, height: 900 },
  { name: "agents-error-dark-1280", storyId: "pages-agents--error", theme: "dark", width: 1280, height: 900 },
  { name: "metrics-sparse-dark-1280", storyId: "pages-metrics--sparse", theme: "dark", width: 1280, height: 900 },
  { name: "metrics-zero-heavy-dark-1280", storyId: "pages-metrics--zero-heavy", theme: "dark", width: 1280, height: 900 },
  { name: "metrics-extreme-numeric-dark-390", storyId: "pages-metrics--extreme-numeric", theme: "dark", width: 390, height: 844 },
  { name: "metrics-error-dark-1280", storyId: "pages-metrics--error", theme: "dark", width: 1280, height: 900 },
  { name: "customer-analytics-high-risk-dark-1280", storyId: "pages-customer-analytics--high-risk", theme: "dark", width: 1280, height: 900 },
  { name: "customer-analytics-no-risk-dark-1280", storyId: "pages-customer-analytics--no-risk", theme: "dark", width: 1280, height: 900 },
  { name: "customer-analytics-sparse-dark-1280", storyId: "pages-customer-analytics--sparse", theme: "dark", width: 1280, height: 900 },
  { name: "customer-analytics-empty-dark-1280", storyId: "pages-customer-analytics--empty", theme: "dark", width: 1280, height: 900 },
  { name: "customer-analytics-error-dark-1280", storyId: "pages-customer-analytics--error", theme: "dark", width: 1280, height: 900 },
  { name: "settings-live-dark-1280", storyId: "pages-settings--live", theme: "dark", width: 1280, height: 900 },
  { name: "settings-error-dark-1280", storyId: "pages-settings--error", theme: "dark", width: 1280, height: 900 },
);

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
