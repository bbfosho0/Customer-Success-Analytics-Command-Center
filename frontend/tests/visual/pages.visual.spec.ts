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
  ["dashboard", "canonical-pages-dashboard--normal"],
  ["calls", "canonical-pages-calls--normal"],
  ["call-detail", "canonical-pages-call-detail--normal"],
  ["agents", "canonical-pages-agents--normal"],
  ["metrics", "canonical-pages-metrics--normal"],
  ["customer-analytics", "canonical-pages-customer-360--normal"],
  ["settings", "canonical-pages-settings--default"],
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
  { name: "dashboard-sparse-dark-1280", storyId: "canonical-pages-dashboard--sparse", theme: "dark", width: 1280, height: 900 },
  { name: "dashboard-high-risk-dark-1280", storyId: "canonical-pages-dashboard--high-risk", theme: "dark", width: 1280, height: 900 },
  { name: "dashboard-empty-dark-1280", storyId: "canonical-pages-dashboard--empty", theme: "dark", width: 1280, height: 900 },
  { name: "dashboard-error-dark-1280", storyId: "canonical-pages-dashboard--error", theme: "dark", width: 1280, height: 900 },
  { name: "calls-long-content-dark-390", storyId: "canonical-pages-calls--long-content", theme: "dark", width: 390, height: 844 },
  { name: "calls-empty-dark-1280", storyId: "canonical-pages-calls--empty", theme: "dark", width: 1280, height: 900 },
  { name: "calls-error-dark-1280", storyId: "canonical-pages-calls--error", theme: "dark", width: 1280, height: 900 },
  { name: "call-detail-long-content-dark-390", storyId: "canonical-pages-call-detail--long-content", theme: "dark", width: 390, height: 844 },
  { name: "call-detail-not-found-dark-1280", storyId: "canonical-pages-call-detail--not-found", theme: "dark", width: 1280, height: 900 },
  { name: "call-detail-error-dark-1280", storyId: "canonical-pages-call-detail--error", theme: "dark", width: 1280, height: 900 },
  { name: "agents-mixed-performance-dark-1280", storyId: "canonical-pages-agents--mixed-performance", theme: "dark", width: 1280, height: 900 },
  { name: "agents-empty-dark-1280", storyId: "canonical-pages-agents--empty", theme: "dark", width: 1280, height: 900 },
  { name: "agents-error-dark-1280", storyId: "canonical-pages-agents--error", theme: "dark", width: 1280, height: 900 },
  { name: "metrics-sparse-dark-1280", storyId: "canonical-pages-metrics--sparse", theme: "dark", width: 1280, height: 900 },
  { name: "metrics-zero-heavy-dark-1280", storyId: "canonical-pages-metrics--zero-heavy", theme: "dark", width: 1280, height: 900 },
  { name: "metrics-extreme-numeric-dark-390", storyId: "canonical-pages-metrics--extreme-numeric", theme: "dark", width: 390, height: 844 },
  { name: "metrics-error-dark-1280", storyId: "canonical-pages-metrics--error", theme: "dark", width: 1280, height: 900 },
  { name: "customer-analytics-high-risk-dark-1280", storyId: "canonical-pages-customer-360--high-risk", theme: "dark", width: 1280, height: 900 },
  { name: "customer-analytics-no-risk-dark-1280", storyId: "canonical-pages-customer-360--no-risk", theme: "dark", width: 1280, height: 900 },
  { name: "customer-analytics-sparse-dark-1280", storyId: "canonical-pages-customer-360--sparse", theme: "dark", width: 1280, height: 900 },
  { name: "customer-analytics-empty-dark-1280", storyId: "canonical-pages-customer-360--empty", theme: "dark", width: 1280, height: 900 },
  { name: "customer-analytics-error-dark-1280", storyId: "canonical-pages-customer-360--error", theme: "dark", width: 1280, height: 900 },
  { name: "settings-live-dark-1280", storyId: "canonical-pages-settings--live", theme: "dark", width: 1280, height: 900 },
  { name: "settings-error-dark-1280", storyId: "canonical-pages-settings--error", theme: "dark", width: 1280, height: 900 },
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
