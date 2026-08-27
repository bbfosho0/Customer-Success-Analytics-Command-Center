# Parallel Storybook Redesign QA and Promotion Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the complete parallel redesign is stable, accessible, responsive, visually reviewed, and production-ready without replacing canonical production UI until a separate final user approval.

**Architecture:** Canonical and Redesign remain side by side through final QA. Storybook is the executable review surface, MSW supplies deterministic states, Playwright supplies browser evidence, and CI publishes redesign evidence independently from canonical regression baselines. This plan ends at a promotion-ready gate, not automatic production replacement.

**Tech Stack:** Storybook 10.5, MSW, Vitest, Storybook a11y, Playwright Test, GitHub Actions, Next.js 14.2.7, React 18.3.1, Tailwind CSS 3.4.13.

**Spec:** `docs/superpowers/specs/2026-08-21-parallel-storybook-redesign-design.md`

## Dependencies

Complete and visually review:

```text
docs/superpowers/plans/2026-08-21-parallel-storybook-redesign-foundation.md
docs/superpowers/plans/2026-08-21-parallel-storybook-redesign-core-pages.md
docs/superpowers/plans/2026-08-21-parallel-storybook-redesign-analytics-pages.md
```

before starting this plan.

## Global Constraints

- Do not replace canonical production pages in this plan.
- Do not delete canonical stories or screenshot baselines.
- Do not update a screenshot merely to make a regression pass.
- Redesign must pass all 13 approved page/view rows at the required responsive dimensions.
- The 640 to 767 range follows phone-shell behavior and must receive explicit QA even though it is not a separate wireframe column.
- Light/dark validation uses theme globals, not duplicate page implementations.
- Accessibility failures in redesigned surfaces are defects and must be fixed before promotion readiness.
- Preserve real keyboard/focus behavior for Tabs, Sidebar/Sheet, filters, tables, pagination, and interactive rows.
- CI must keep canonical regressions and redesign evidence separately identifiable.
- Keep PR #13 draft and unmerged until the user explicitly approves final production promotion.

---

## File Structure Locked by This Plan

Create:

```text
frontend/tests/visual/redesign-pages.visual.spec.ts
frontend/tests/visual/redesign-evidence-manifest.ts
frontend/tests/e2e/redesign-responsive.spec.ts
frontend/tests/e2e/redesign-accessibility.spec.ts
frontend/src/storybook/redesign-catalog.test.ts
```

Modify:

```text
frontend/tests/visual/evidence-manifest.ts or evidence helpers only if needed to support separate redesign evidence
frontend/tests/helpers/storybook.ts only if needed for stable Redesign story helpers
frontend/.storybook/preview.tsx
frontend/package.json
.github/workflows/* visual workflow file already used by PR #13
README/design-audit docs relevant to visual QA status
```

Do not modify production route files in this plan.

---

### Task 1: Add a Complete Storybook Catalog Contract

**Files:**
- Create: `frontend/src/storybook/redesign-catalog.test.ts`
- Reuse Storybook static build metadata or a small exported catalog constant if one already exists.

**Interfaces:**
- Produces an executable assertion that all required Canonical and Redesign page/view families remain discoverable.

- [ ] **Step 1: Write the failing catalog test with the exact required redesign view list**

```ts
const requiredRedesignViews = [
  "Dashboard",
  "Calls",
  "Call Detail",
  "Agent Intelligence",
  "Metrics/Overview",
  "Metrics/Volume",
  "Metrics/Breakdown",
  "Metrics/Regions",
  "Customer 360/Overview",
  "Customer 360/Churn Risk",
  "Customer 360/Retention",
  "Customer 360/LTV",
  "Settings/Manifest",
] as const;

it("keeps all thirteen redesign rows represented", () => {
  expect(REDESIGN_CATALOG).toEqual(expect.arrayContaining(requiredRedesignViews));
  expect(REDESIGN_CATALOG).toHaveLength(13);
});
```

If no catalog constant exists, create a focused `frontend/src/redesign/catalog.ts` that exports only stable page/view identifiers used by stories and tests, not component implementation details.

- [ ] **Step 2: Run and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/storybook/redesign-catalog.test.ts
```

Expected: FAIL until catalog metadata is wired.

- [ ] **Step 3: Implement the stable catalog identifiers**

Use exact values:

```ts
export const REDESIGN_CATALOG = [
  "Dashboard",
  "Calls",
  "Call Detail",
  "Agent Intelligence",
  "Metrics/Overview",
  "Metrics/Volume",
  "Metrics/Breakdown",
  "Metrics/Regions",
  "Customer 360/Overview",
  "Customer 360/Churn Risk",
  "Customer 360/Retention",
  "Customer 360/LTV",
  "Settings/Manifest",
] as const;
```

- [ ] **Step 4: Add a canonical-presence assertion**

The test must also assert the canonical page families still exist:

```text
Dashboard
Calls
Call Detail
Agents
Metrics
Customer 360
Settings
```

- [ ] **Step 5: Run test and Storybook build**

```bash
cd frontend && npx vitest run --project=unit src/storybook/redesign-catalog.test.ts
npm run storybook:build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/storybook frontend/src/redesign/catalog.ts
git commit -m "test: lock redesign storybook catalog"
```

---

### Task 2: Consolidate the Full Redesign Visual Regression Matrix

**Files:**
- Create: `frontend/tests/visual/redesign-pages.visual.spec.ts`
- Existing plan-specific visual specs may remain while this task proves the consolidated matrix.

**Interfaces:**
- Consumes stable redesign story IDs created in prior plans.
- Produces one auditable visual regression matrix across all 13 rows.

- [ ] **Step 1: Define the canonical viewport set in the new test**

```ts
const canonicalViewports = [
  ["1440", 1440, 1000],
  ["1280", 1280, 900],
  ["1024", 1024, 768],
  ["390", 390, 844],
  ["360", 360, 800],
] as const;
```

- [ ] **Step 2: Define the 13 normal redesign story IDs explicitly**

```ts
const normalRedesignSurfaces = [
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
  ["settings-manifest", "redesign-pages-settings-manifest--default-demo"],
] as const;
```

If Storybook generates a slightly different kebab-case ID from an approved title, inspect the built catalog and update this constant once to the actual stable ID. Do not rename stories solely to satisfy a guessed ID.

- [ ] **Step 3: Generate dark normal entries at all five canonical viewports**

```ts
for (const [surface, storyId] of normalRedesignSurfaces) {
  for (const [viewportName, width, height] of canonicalViewports) {
    regressionStories.push({
      name: `redesign-${surface}-normal-dark-${viewportName}`,
      storyId,
      theme: "dark",
      width,
      height,
    });
  }
}
```

- [ ] **Step 4: Add light normal entries only at 1280 and 390**

Use the same Storybook IDs with `theme: "light"`.

- [ ] **Step 5: Add all approved stress states from prior page plans**

Include sparse, high-risk, long-content, mixed-performance, zero-heavy, extreme-numeric, no-risk, empty, and error cases where defined by the prior plans.

- [ ] **Step 6: Run the consolidated visual suite**

```bash
npm --prefix frontend run test:visual -- --grep "redesign-"
```

Expected: PASS only after intentional screenshots are inspected and committed.

- [ ] **Step 7: Commit**

```bash
git add frontend/tests/visual/redesign-pages.visual.spec.ts frontend/tests/visual/__screenshots__
git commit -m "test: consolidate redesign visual regressions"
```

---

### Task 3: Add Explicit Breakpoint-Boundary Responsive Tests

**Files:**
- Create: `frontend/tests/e2e/redesign-responsive.spec.ts`

**Interfaces:**
- Verifies shell and page behavior at boundary widths that screenshot presets alone do not cover.

- [ ] **Step 1: Write a failing test for 767 and 768 shell behavior**

```ts
test("switches from phone shell at 767 to tablet shell at 768", async ({ page }) => {
  await page.setViewportSize({ width: 767, height: 900 });
  await openStory(page, "redesign-pages-dashboard--normal", { theme: "dark" });
  await expect(page.getByRole("button", { name: /open navigation/i })).toBeVisible();

  await page.setViewportSize({ width: 768, height: 900 });
  await page.reload();
  await expect(page.getByRole("button", { name: /open navigation/i })).toBeVisible();
  await expect(page.locator("[data-layout-mode='tablet']")).toBeVisible();
});
```

The shell must expose a stable `data-layout-mode` test attribute on its outer redesign workspace: `desktop`, `compact`, `tablet`, or `phone`.

- [ ] **Step 2: Add 1023 and 1024 boundary coverage**

```ts
for (const [width, expectedMode] of [[1023, "tablet"], [1024, "compact"]] as const) {
  test(`uses ${expectedMode} layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openStory(page, "redesign-pages-dashboard--normal", { theme: "dark" });
    await expect(page.locator(`[data-layout-mode='${expectedMode}']`)).toBeVisible();
  });
}
```

- [ ] **Step 3: Add explicit 640 and 767 phone-shell coverage**

Test Dashboard, Calls, Metrics Overview, Customer 360 Overview, and Settings at 640 and 767 to prove there is no untested dead zone between wireframe columns.

- [ ] **Step 4: Add page-level overflow assertions**

For each tested story:

```ts
const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
expect(hasHorizontalOverflow).toBe(false);
```

Panel-local horizontal scrolling may exist where intentionally scoped, but document-level overflow must be false.

- [ ] **Step 5: Run the responsive suite**

```bash
cd frontend && npx playwright test tests/e2e/redesign-responsive.spec.ts --project=storybook
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/tests/e2e/redesign-responsive.spec.ts frontend/src/redesign/shell
git commit -m "test: cover redesign breakpoint boundaries"
```

---

### Task 4: Promote Accessibility From Advisory to Blocking for Redesign Stories

**Files:**
- Create: `frontend/tests/e2e/redesign-accessibility.spec.ts`
- Modify: `frontend/.storybook/preview.tsx` only if redesign-specific a11y parameters are required

**Interfaces:**
- Produces a blocking a11y gate for redesigned interactive surfaces without retroactively failing canonical legacy stories.

- [ ] **Step 1: Define the interactive redesign story set**

Cover at minimum:

```text
Redesign Shell
Dashboard
Calls
Call Detail
Agent Intelligence
Metrics Overview
Customer 360 Churn Risk
Settings Manifest
```

- [ ] **Step 2: Write keyboard-navigation checks**

Example for Calls:

```ts
test("calls redesign supports keyboard navigation", async ({ page }) => {
  await openStory(page, "redesign-pages-calls--normal", { theme: "dark", viewport: { width: 1280, height: 900 } });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await expect(page.getByRole("textbox", { name: /search calls/i })).toBeVisible();
});
```

- [ ] **Step 3: Add Storybook a11y assertions for critical stories**

Use the repository's installed `@storybook/addon-a11y` and browser-test mechanism. Configure redesign stories so a11y violations fail their Storybook tests, while canonical legacy coverage remains at its existing policy until separately migrated.

- [ ] **Step 4: Verify dialogs/sheets/drawers have accessible titles**

Explicitly test the mobile navigation Sheet and filter Sheet/Popover triggers for accessible names and focus return.

- [ ] **Step 5: Run Storybook tests and the focused accessibility E2E suite**

```bash
npm --prefix frontend run storybook:test
cd frontend && npx playwright test tests/e2e/redesign-accessibility.spec.ts --project=storybook
```

Expected: PASS with zero unresolved redesign a11y violations.

- [ ] **Step 6: Commit**

```bash
git add frontend/tests/e2e/redesign-accessibility.spec.ts frontend/.storybook/preview.tsx frontend/src/redesign
git commit -m "test: make redesign accessibility blocking"
```

---

### Task 5: Build a Dedicated Redesign Evidence Manifest

**Files:**
- Create: `frontend/tests/visual/redesign-evidence-manifest.ts`
- Modify: `frontend/tests/visual/redesign-pages.visual.spec.ts`
- Modify: `frontend/tests/helpers/visual-evidence.ts` only if the existing helper cannot accept a separate manifest/output prefix.

**Interfaces:**
- Produces a curated review artifact that is separate from canonical baseline evidence.

- [ ] **Step 1: Define curated evidence entries**

Include at minimum 30 screenshots covering:

```text
all 13 normal views at a representative desktop width
all 13 normal views at mobile 390 where the geometry materially changes
Dashboard HighRisk
Calls LongContent mobile
Metrics ExtremeNumeric mobile
Customer 360 HighRisk
Settings Error
```

Use light mode selectively for Dashboard, Customer 360 Overview, and Settings to prove theme integrity.

- [ ] **Step 2: Add a manifest validation test**

```ts
it("keeps redesign evidence unique and complete", () => {
  const names = redesignEvidenceManifest.map((entry) => entry.name);
  expect(new Set(names).size).toBe(names.length);
  expect(redesignEvidenceManifest.length).toBeGreaterThanOrEqual(30);
});
```

- [ ] **Step 3: Run evidence capture locally**

```bash
npm --prefix frontend run test:visual -- --grep "capture redesign review evidence"
```

Expected: evidence output and manifest are generated separately from canonical evidence.

- [ ] **Step 4: Inspect the curated set manually**

Review cross-page consistency for:

```text
shell proportion
card radius and border language
KPI hierarchy
filter placement
chart colors
status semantics
table density
empty/loading/error patterns
mobile spacing
focus visibility
light/dark parity
```

- [ ] **Step 5: Commit manifest/test changes, not generated transient evidence folders**

```bash
git add frontend/tests/visual/redesign-evidence-manifest.ts frontend/tests/visual/redesign-pages.visual.spec.ts frontend/tests/helpers/visual-evidence.ts
git commit -m "test: add curated redesign visual evidence"
```

---

### Task 6: Extend CI Without Weakening Canonical Gates

**Files:**
- Modify: the existing GitHub Actions workflow that builds Storybook and publishes `visual-evidence`, `visual-diffs`, and Playwright reports

**Interfaces:**
- Produces separate canonical and redesign evidence artifacts or clearly separated directories within the existing visual artifact.

- [ ] **Step 1: Add redesign tests to the existing Storybook/Playwright job, not a disconnected workflow**

The job must run:

```bash
npm --prefix frontend run storybook:build
npm --prefix frontend run storybook:test
npm --prefix frontend run test:visual
```

plus the redesign responsive/accessibility tests if they are not already included by `test:visual`.

- [ ] **Step 2: Publish redesign evidence under an explicit artifact path**

Use either:

```text
visual-evidence/canonical/
visual-evidence/redesign/
```

or separate artifact names:

```text
visual-evidence-canonical
visual-evidence-redesign
```

Do not remove existing canonical artifacts.

- [ ] **Step 3: Preserve failure semantics**

Any of these must fail CI:

```text
canonical screenshot regression
redesign screenshot regression
redesign Storybook browser test
redesign accessibility gate
redesign breakpoint-boundary test
Next.js build or smoke regression already present in the workflow
```

- [ ] **Step 4: Run or observe one full CI execution**

Expected: all existing baseline jobs plus redesign gates pass and artifacts are downloadable.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows
git commit -m "ci: add parallel redesign visual gates"
```

---

### Task 7: Final Review and Promotion-Readiness Report

**Files:**
- Create: `docs/design-audit/REDESIGN_REVIEW.md`
- Modify: `docs/design-audit/README.md` if it maintains phase status

**Interfaces:**
- Produces the explicit user review gate before production migration.

- [ ] **Step 1: Run the full frontend verification suite**

```bash
npm --prefix frontend run test
npm --prefix frontend run storybook:build
npm --prefix frontend run storybook:test
npm --prefix frontend run test:visual
npm --prefix frontend run test:e2e
npm --prefix frontend run build
```

Expected: PASS.

- [ ] **Step 2: Verify the Storybook navigation contract manually**

Only product UI top-level trees should be:

```text
Canonical
Redesign
```

Supporting documentation/addon entries generated by Storybook are not product UI categories and do not violate this rule.

- [ ] **Step 3: Verify there are no separate light/dark page implementations**

Search redesign source for page filenames or exports containing duplicated `LightPage`, `DarkPage`, `*-light.tsx`, or `*-dark.tsx`. Expected: none.

- [ ] **Step 4: Compare every Redesign normal screenshot to its approved wireframe row**

Document deviations only when they are intentional implementation improvements, such as accessible control affordances or data-driven sizing that preserves the wireframe hierarchy.

- [ ] **Step 5: Write `REDESIGN_REVIEW.md` with exact results**

Required sections:

```text
Scope completed
13-row coverage table
Responsive coverage table
Story/state coverage
Accessibility status
Canonical regression status
Known limitations, if any
CI run and artifact references
Production migration recommendation
Explicit statement: production replacement not yet performed
```

Do not write `none` for known limitations unless the evidence truly supports that statement.

- [ ] **Step 6: Verify PR #13 remains draft and unmerged**

Use GitHub metadata. Expected: `draft: true`, `merged: false`.

- [ ] **Step 7: Commit review documentation**

```bash
git add docs/design-audit
git commit -m "docs: record redesign promotion readiness"
```

- [ ] **Step 8: Stop for explicit user approval**

Do not replace canonical production components, merge PR #13, or delete the parallel Redesign tree in this task.

## Completion Gate

This plan is complete only when:

```text
all 13 redesign rows are represented and reviewed
all canonical regressions still pass
all redesign visual regressions pass
767/768 and 1023/1024 boundaries pass
640..767 phone-shell behavior is explicitly tested
redesign accessibility is blocking and green
curated redesign evidence exists
CI publishes usable redesign evidence
REDESIGN_REVIEW.md records the evidence
production replacement has not occurred
PR #13 remains draft and unmerged pending final user approval
```
