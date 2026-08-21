# Visual Baseline

## Status

The repository is in baseline-capture mode. Storybook, MSW, Storybook browser tests, Playwright Test, Playwright CLI, and GitHub Actions are the visual QA foundation. No redesign changes are included in this baseline.

The first fully green permanent visual pipeline is now the reference baseline:

- PR: `#13` (`storybook-playwright-redesign-foundation`)
- Reference commit: `951c0af41771e1a4ff92cd1d0fdf675c7d51c913`
- GitHub Actions run: `#56` (`32482784137`)
- Result: backend, frontend, Salesforce, Storybook browser/accessibility, Playwright visual regression, and Next.js app smoke jobs all passed
- `visual-evidence` artifact: `9446933134`
- Artifact digest: `sha256:4a51b47aa53b890c64ff4a850521b02694aafe5c0a714bb9c002e1c45af72088`
- Evidence manifest: 20 curated screenshots across desktop, tablet, and mobile

## Canonical renderers

- Chromium is the canonical screenshot renderer.
- Storybook is the exhaustive deterministic component/page renderer.
- The Next.js app receives a smaller smoke suite for critical routes.
- Storybook visual states use MSW. `NEXT_PUBLIC_STATIC_DEMO=true` is restricted to the Next.js E2E server so it cannot bypass Storybook MSW handlers.

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

Reference run #56 captured these evidence families:

- Dashboard: normal dark desktop, normal light desktop, sparse dark desktop, high-risk dark desktop, normal dark mobile
- Calls: normal dark desktop, long-content dark mobile
- Call detail: normal dark desktop, long-content dark mobile
- Agents: normal dark desktop, mixed-performance dark desktop
- Metrics: normal dark desktop, zero-heavy dark desktop, extreme-numeric dark mobile
- Customer analytics: normal dark desktop, high-risk dark desktop, no-risk dark desktop, normal light mobile
- Settings: default dark tablet, error dark desktop

## Baseline audit findings

These are observations for later redesign work, not changes included in this foundation PR.

1. **Deterministic stress states are functioning correctly.** Dashboard normal, sparse, and high-risk renders are visibly different. Customer Analytics high-risk and no-risk renders are also materially different, confirming that MSW state overrides are now being exercised rather than bypassed by static-demo data.
2. **Dark-theme chart legibility is the clearest visual weakness.** Several chart fills, axes, tick labels, and bar labels sit very close to the near-black background. The issue is most visible on Dashboard and Customer Analytics and should be treated as a contrast/readability target in the redesign phase.
3. **Desktop KPI composition leaves uneven vertical space.** Dashboard renders four KPI cards on the first row and a single `Active Regions` card on a second row, producing a large unused area before the chart section. This is stable and intentional for the baseline, but it weakens density and visual balance.
4. **Mobile layouts are functionally responsive but very tall and table-dense.** The 390px Dashboard and 360px Customer Analytics evidence avoid obvious horizontal page overflow, but dense tabular content wraps aggressively and creates long scanning paths. Mobile table treatment should be revisited during redesign rather than solved in this baseline PR.
5. **Extreme numeric values are contained but expose formatting pressure.** The Metrics extreme-numeric mobile state keeps content inside its cards, but very large handle-time values become unwieldy and wrap into visually noisy multi-line strings. Numeric abbreviation or bounded formatting should be addressed later.
6. **Customer Analytics empty/no-risk composition is stable.** The no-risk state correctly produces an empty churn queue and recommended-actions region while retaining export availability, giving the redesign phase a reliable empty-state reference.
7. **Settings at 1024px is structurally stable.** The tablet evidence keeps runtime mode, manifest metadata, schema columns, and audit history within the viewport without an obvious horizontal overflow failure.
8. **Light-theme structure is intact.** Dashboard desktop light and Customer Analytics mobile light preserve hierarchy and layout. Color/contrast tuning remains a redesign concern, but the baseline renderer is stable enough for regression use.

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

Run #56 is the reference visual baseline for this document and PR. Any future intentional visual change should be compared against these committed Chromium baselines and the corresponding Storybook state before snapshots are updated.
