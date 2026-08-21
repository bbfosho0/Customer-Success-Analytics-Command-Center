import type { Page } from "@playwright/test";

export type StoryTheme = "dark" | "light";

export type StoryViewport = {
  width: number;
  height: number;
};

export function storyUrl(storyId: string, theme: StoryTheme = "dark") {
  const params = new URLSearchParams({
    id: storyId,
    viewMode: "story",
    globals: `theme:${theme}`,
  });
  return `/iframe.html?${params.toString()}`;
}

export async function openStory(
  page: Page,
  storyId: string,
  options: { theme?: StoryTheme; viewport?: StoryViewport } = {},
) {
  if (options.viewport) {
    await page.setViewportSize(options.viewport);
  }
  await page.goto(storyUrl(storyId, options.theme));
  await page.locator("[data-storybook-root]").waitFor({ state: "visible" });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
    `,
  });
  await page.waitForTimeout(100);
}
