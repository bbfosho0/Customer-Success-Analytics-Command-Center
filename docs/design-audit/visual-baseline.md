# Visual Baseline

## Status

The repository is in baseline-capture mode. Storybook, MSW, Storybook browser tests, Playwright Test, Playwright CLI, and GitHub Actions are the visual QA foundation. No redesign changes are included in this baseline.

## Canonical renderers

- Chromium is the canonical screenshot renderer.
- Storybook is the exhaustive deterministic component/page renderer.
- The Next.js app receives a smaller smoke suite for critical routes.

## Canonical viewports

- 1440x1000 desktop
- 1280x900 desktop
- 1024x768 tablet
- 390x844 mobile
- 360x800 mobile

## Evidence outputs

CI publishes these artifacts when the visual pipeline is active:

- `storybook-static`
- `visual-evidence`
- `playwright-report`
- `playwright-test-results`
- `visual-diffs`

`visual-evidence/manifest.json` maps each clean AI-review screenshot to its Storybook story, theme, viewport, and surface.

## Baseline policy

Playwright `toHaveScreenshot()` files are committed regression baselines. Update them only when the visual change is intentional and reviewed. AI-review screenshots are generated artifacts and are not committed.

Accessibility checks are intentionally configured as `todo` during the first baseline so existing issues can be inventoried without blocking foundation work. Promotion to a blocking accessibility gate happens after the baseline audit.

## Required workflow for future UI changes

1. Inspect the current Storybook story before editing UI code.
2. Update or add the deterministic story state alongside the component change.
3. Run unit tests and Storybook browser tests.
4. Render in Chromium and run Playwright visual regression tests.
5. Inspect actual screenshots, diffs, and responsive evidence.
6. Update screenshot baselines only for approved intentional changes.

The first successful visual CI run after baseline snapshots are committed becomes the reference run for this document and PR.
