import { expect, test } from "@playwright/test";

import { openStory } from "../helpers/storybook";

const primitiveStories = [
  ["kpi-cards", "canonical-design-system-primitives--kpi-cards"],
  ["status-badges", "canonical-design-system-primitives--status-badges"],
  ["chips", "canonical-design-system-primitives--chips"],
  ["section-cards", "canonical-design-system-primitives--section-cards"],
  ["feedback-states", "canonical-design-system-primitives--feedback-states"],
  ["insight-severities", "canonical-design-system-primitives--insight-severities"],
] as const;

for (const [name, storyId] of primitiveStories) {
  test(`${name} baseline`, async ({ page }) => {
    await openStory(page, storyId, { theme: "dark", viewport: { width: 1280, height: 900 } });
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
