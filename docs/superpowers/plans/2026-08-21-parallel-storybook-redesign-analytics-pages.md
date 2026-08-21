# Parallel Storybook Redesign Analytics Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the remaining nine approved redesign views, Metrics Overview/Volume/Breakdown/Regions, Customer 360 Overview/Churn Risk/Retention/LTV, and Settings Manifest, with distinct analytical hierarchy and responsive recomposition.

**Architecture:** Metrics and Customer 360 remain single feature implementations with controlled view/tab state rather than duplicated page logic. Each view is separately addressable in Storybook so the full 13-row wireframe matrix can be reviewed. Settings represents only the real runtime, manifest, schema, refresh, and audit capabilities already present in the canonical implementation.

**Tech Stack:** Next.js 14.2.7, React 18.3.1, TypeScript 5.6.3, Tailwind CSS 3.4.13, shadcn/ui, TanStack Table, Recharts 3.8.1, React Query, MSW, Storybook 10.5, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-21-parallel-storybook-redesign-design.md`

## Dependencies

Complete and review both:

```text
docs/superpowers/plans/2026-08-21-parallel-storybook-redesign-foundation.md
docs/superpowers/plans/2026-08-21-parallel-storybook-redesign-core-pages.md
```

before starting this plan.

## Global Constraints

- Do not modify canonical visual behavior under `frontend/src/figma`.
- Reuse the existing Metrics, Customer Analytics, and Settings API hooks and MSW state handlers.
- Metrics must expose four visually distinct views, not one generic layout with renamed headings.
- Customer 360 must expose four visually distinct views, not duplicated card grids.
- Recharts remains the only chart library.
- Use TanStack Table for churn-risk, expansion-opportunity, schema, and audit data grids where desktop scanning benefits from it.
- Phone layouts must replace wide tables with compact rows or purpose-built compact representations where appropriate.
- Do not invent unsupported Settings controls.
- Light/dark is a Storybook global, not duplicate page implementation.
- Preserve canonical visual baselines and keep PR #13 draft and unmerged.

---

## File Structure Locked by This Plan

Create:

```text
frontend/src/redesign/pages/metrics/metrics-page.tsx
frontend/src/redesign/pages/metrics/metrics-overview.tsx
frontend/src/redesign/pages/metrics/metrics-volume.tsx
frontend/src/redesign/pages/metrics/metrics-breakdown.tsx
frontend/src/redesign/pages/metrics/metrics-regions.tsx
frontend/src/redesign/pages/metrics/metrics-page.test.tsx
frontend/src/redesign/pages/metrics/metrics-page.stories.tsx
frontend/src/redesign/pages/customer-360/customer-360-page.tsx
frontend/src/redesign/pages/customer-360/customer-overview.tsx
frontend/src/redesign/pages/customer-360/customer-churn-risk.tsx
frontend/src/redesign/pages/customer-360/customer-retention.tsx
frontend/src/redesign/pages/customer-360/customer-ltv.tsx
frontend/src/redesign/pages/customer-360/customer-360-page.test.tsx
frontend/src/redesign/pages/customer-360/customer-360-page.stories.tsx
frontend/src/redesign/pages/settings/settings-manifest-page.tsx
frontend/src/redesign/pages/settings/settings-manifest-page.test.tsx
frontend/src/redesign/pages/settings/settings-manifest-page.stories.tsx
frontend/tests/visual/redesign-analytics-pages.visual.spec.ts
```

---

### Task 1: Build the Metrics Feature Shell and View Contract

**Files:**
- Create: `frontend/src/redesign/pages/metrics/metrics-page.tsx`
- Create: `frontend/src/redesign/pages/metrics/metrics-page.test.tsx`
- Create: `frontend/src/redesign/pages/metrics/metrics-page.stories.tsx`

**Interfaces:**
- Produces:

```ts
export type MetricsView = "overview" | "volume" | "breakdown" | "regions";

export type RedesignMetricsPageProps = {
  initialView?: MetricsView;
};

export function RedesignMetricsPage({ initialView = "overview" }: RedesignMetricsPageProps): JSX.Element;
```

- Produces one shared filter/KPI context and renders one of four view components.

- [ ] **Step 1: Write failing tab/view tests**

```tsx
it("starts on the requested metrics view", async () => {
  renderWithProviders(<RedesignMetricsPage initialView="regions" />);
  expect(await screen.findByRole("tab", { name: "Regions" })).toHaveAttribute("aria-selected", "true");
});

it("switches views without remounting the feature shell", async () => {
  const user = userEvent.setup();
  renderWithProviders(<RedesignMetricsPage />);
  await user.click(await screen.findByRole("tab", { name: "Breakdown" }));
  expect(screen.getByRole("tab", { name: "Breakdown" })).toHaveAttribute("aria-selected", "true");
});
```

- [ ] **Step 2: Run and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/metrics/metrics-page.test.tsx
```

- [ ] **Step 3: Implement the shared Metrics shell**

Use shadcn `Tabs`, shared `FilterBar`, four primary KPI cards, and view-specific content slots. On phone, the tabs must remain reachable without forcing page-level horizontal overflow. A horizontally scrollable `TabsList` is acceptable if it is visibly intentional and retains touch targets.

- [ ] **Step 4: Add Storybook view entries**

Create titles/stories that generate stable IDs for:

```text
Redesign/Pages/Metrics/Overview
Redesign/Pages/Metrics/Volume
Redesign/Pages/Metrics/Breakdown
Redesign/Pages/Metrics/Regions
```

Each story renders the same `RedesignMetricsPage` with a different `initialView`.

- [ ] **Step 5: Run tests and commit the shell**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/metrics/metrics-page.test.tsx
npm run storybook:build
```

```bash
git add frontend/src/redesign/pages/metrics
git commit -m "feat: add redesign metrics view shell"
```

---

### Task 2: Implement Metrics Overview

**Files:**
- Create: `frontend/src/redesign/pages/metrics/metrics-overview.tsx`
- Modify: `frontend/src/redesign/pages/metrics/metrics-page.test.tsx`
- Modify: `frontend/src/redesign/pages/metrics/metrics-page.stories.tsx`

**Interfaces:**
- Consumes shared calculated KPI, series, issue breakdown, region, service-quality data from the Metrics feature shell or a focused hook helper.
- Produces `MetricsOverview`.

- [ ] **Step 1: Add failing hierarchy assertions**

```tsx
it("renders overview with one dominant call-volume surface", async () => {
  renderWithProviders(<RedesignMetricsPage initialView="overview" />);
  expect(await screen.findByRole("heading", { name: /call volume/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /issue type breakdown/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /service quality/i })).toBeVisible();
});
```

- [ ] **Step 2: Verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/metrics/metrics-page.test.tsx
```

- [ ] **Step 3: Implement approved layout**

Desktop:

```text
4 KPI cards
Call Volume dominant 2/3
Issue Type Breakdown + Duration Trend stacked 1/3
Service Quality
Region Comparison
```

Tablet:

```text
2x2 KPI grid
Call Volume full width
Issue Breakdown + Duration Trend
Service Quality + Region Comparison
```

Phone:

```text
2x2 KPI grid
Call Volume
Issue Breakdown
Service Quality summary
Region comparison summary
```

Avoid seven equal KPI cards even if the canonical implementation calculates seven metrics. Secondary metrics belong inside supporting panels.

- [ ] **Step 4: Add MSW states**

Overview Storybook coverage:

```text
Normal
Sparse
ZeroHeavy
ExtremeNumeric
Error
Mobile390
Mobile360
```

Reuse `visualStates.metrics.*`.

- [ ] **Step 5: Run unit and Storybook tests**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/metrics/metrics-page.test.tsx
npm run storybook:test
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/redesign/pages/metrics
git commit -m "feat: redesign metrics overview"
```

---

### Task 3: Implement Metrics Volume

**Files:**
- Create: `frontend/src/redesign/pages/metrics/metrics-volume.tsx`
- Modify: metrics test/story files

**Interfaces:**
- Produces `MetricsVolume` using the same volume series and SLA calculations as canonical Metrics.

- [ ] **Step 1: Add failing assertions**

```tsx
it("renders volume view with trend and SLA context", async () => {
  renderWithProviders(<RedesignMetricsPage initialView="volume" />);
  expect(await screen.findByRole("heading", { name: /daily call volume/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /rolling sla/i })).toBeVisible();
  expect(screen.getByText(/current window/i)).toBeVisible();
});
```

- [ ] **Step 2: Run and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/metrics/metrics-page.test.tsx
```

- [ ] **Step 3: Implement approved geometry**

Use a full-width hero trend chart, then Rolling SLA and Current Window supporting panels. Preserve resolved/escalated/all comparison in the chart, with legends simplifying before they wrap badly on phone.

- [ ] **Step 4: Add Storybook `Normal`, `Sparse`, `Mobile390`, and `Mobile360` states for the Volume story**

- [ ] **Step 5: Run tests and commit**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/metrics/metrics-page.test.tsx
npm run storybook:test
```

```bash
git add frontend/src/redesign/pages/metrics
git commit -m "feat: redesign metrics volume"
```

---

### Task 4: Implement Metrics Breakdown

**Files:**
- Create: `frontend/src/redesign/pages/metrics/metrics-breakdown.tsx`
- Modify: metrics test/story files

**Interfaces:**
- Produces `MetricsBreakdown` using issue breakdown, duration data, and current automation-pilot content.

- [ ] **Step 1: Add failing assertions**

```tsx
it("renders issue pressure and automation pilot surfaces", async () => {
  renderWithProviders(<RedesignMetricsPage initialView="breakdown" />);
  expect(await screen.findByRole("heading", { name: /issue type breakdown/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /duration trend/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /automation pilot/i })).toBeVisible();
});
```

- [ ] **Step 2: Run and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/metrics/metrics-page.test.tsx
```

- [ ] **Step 3: Implement approved breakdown composition**

Desktop/tablet:

```text
Top issue + duration/FCR summary
Issue Type Breakdown
Duration Trend
Automation Pilot full-width operational table/list
```

Phone:

```text
condensed top issue summary
horizontal bars for issue mix
duration summary
automation status summary/list
```

- [ ] **Step 4: Run tests and commit**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/metrics/metrics-page.test.tsx
npm run storybook:test
```

```bash
git add frontend/src/redesign/pages/metrics
git commit -m "feat: redesign metrics breakdown"
```

---

### Task 5: Implement Metrics Regions

**Files:**
- Create: `frontend/src/redesign/pages/metrics/metrics-regions.tsx`
- Modify: metrics test/story files

**Interfaces:**
- Produces `MetricsRegions` using existing region calculations.

- [ ] **Step 1: Add failing assertions**

```tsx
it("renders regional comparison and ranking", async () => {
  renderWithProviders(<RedesignMetricsPage initialView="regions" />);
  expect(await screen.findByRole("heading", { name: /region comparison/i })).toBeVisible();
  expect(screen.getByText(/regional health/i)).toBeVisible();
});
```

- [ ] **Step 2: Run and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/metrics/metrics-page.test.tsx
```

- [ ] **Step 3: Implement approved comparison geometry**

Desktop:

```text
Resolved vs escalated comparison chart 2/3
Regional health ranking 1/3
Detailed region comparison full-width
```

Phone:

```text
Regional health ranking
compact compare-regions list
no desktop table overflow
```

- [ ] **Step 4: Run tests and commit**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/metrics/metrics-page.test.tsx
npm run storybook:test
```

```bash
git add frontend/src/redesign/pages/metrics
git commit -m "feat: redesign metrics regions"
```

---

### Task 6: Build the Customer 360 Feature Shell and Overview

**Files:**
- Create: `frontend/src/redesign/pages/customer-360/customer-360-page.tsx`
- Create: `frontend/src/redesign/pages/customer-360/customer-overview.tsx`
- Create: `frontend/src/redesign/pages/customer-360/customer-360-page.test.tsx`
- Create: `frontend/src/redesign/pages/customer-360/customer-360-page.stories.tsx`

**Interfaces:**
- Produces:

```ts
export type Customer360View = "overview" | "churn-risk" | "retention" | "ltv";

export type RedesignCustomer360PageProps = {
  initialView?: Customer360View;
};
```

- Reuses current Customer Analytics hooks for overview, churn, retention, LTV, segment performance, expansion opportunities, health, and exports.

- [ ] **Step 1: Write failing view and overview tests**

```tsx
it("starts on the requested customer 360 view", async () => {
  renderWithProviders(<RedesignCustomer360Page initialView="ltv" />);
  expect(await screen.findByRole("tab", { name: "LTV" })).toHaveAttribute("aria-selected", "true");
});

it("renders overview health, risk queue, and actions", async () => {
  renderWithProviders(<RedesignCustomer360Page initialView="overview" />);
  expect(await screen.findByText("Avg health score")).toBeVisible();
  expect(screen.getByRole("heading", { name: /churn risk queue/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /recommended actions/i })).toBeVisible();
});
```

- [ ] **Step 2: Run and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/customer-360/customer-360-page.test.tsx
```

- [ ] **Step 3: Implement tab shell and overview**

Desktop:

```text
4 KPI cards
Health Distribution 2/3 + Recommended Actions 1/3
Churn Risk Queue 2/3 + BI Exports 1/3
```

Phone:

```text
2x2 KPI grid
Health Distribution summary
Risk Queue compact rows
recommended actions progressively disclosed through row actions
```

- [ ] **Step 4: Add Overview Storybook states**

```text
Normal
HighRisk
NoRisk
Sparse
Empty
Error
Mobile390
Mobile360
```

Reuse existing Customer Analytics MSW handlers.

- [ ] **Step 5: Run tests and commit**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/customer-360/customer-360-page.test.tsx
npm run storybook:test
```

```bash
git add frontend/src/redesign/pages/customer-360
git commit -m "feat: redesign customer 360 overview"
```

---

### Task 7: Implement Customer 360 Churn Risk

**Files:**
- Create: `frontend/src/redesign/pages/customer-360/customer-churn-risk.tsx`
- Modify: Customer 360 test/story files

**Interfaces:**
- Produces a filterable churn-risk grid using the existing churn account contract.

- [ ] **Step 1: Add failing risk-filter test**

```tsx
it("filters churn accounts by risk band", async () => {
  const user = userEvent.setup();
  renderWithProviders(<RedesignCustomer360Page initialView="churn-risk" />);
  await user.click(await screen.findByRole("button", { name: /critical/i }));
  expect(screen.getByText(/risk accounts/i)).toBeVisible();
});
```

- [ ] **Step 2: Verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/customer-360/customer-360-page.test.tsx
```

- [ ] **Step 3: Implement desktop/tablet TanStack grid**

Columns:

```text
Account
Segment
Plan
MRR
Est. LTV
Health
Risk driver
CSM
Action
```

Use risk-band ToggleGroup or suitable accessible filter controls for All, Critical, At Risk, Watch, Healthy.

- [ ] **Step 4: Implement phone rows**

Each row prioritizes:

```text
Account + health/risk
MRR
risk driver
recommended action
```

Do not force all nine desktop columns into phone.

- [ ] **Step 5: Run tests and commit**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/customer-360/customer-360-page.test.tsx
npm run storybook:test
```

```bash
git add frontend/src/redesign/pages/customer-360
git commit -m "feat: redesign customer churn risk"
```

---

### Task 8: Implement Customer 360 Retention

**Files:**
- Create: `frontend/src/redesign/pages/customer-360/customer-retention.tsx`
- Modify: Customer 360 test/story files

**Interfaces:**
- Produces retention cohort heat display, LTV-by-segment support chart, and segment-performance summary.

- [ ] **Step 1: Add failing cohort assertions**

```tsx
it("renders retention cohort milestones", async () => {
  renderWithProviders(<RedesignCustomer360Page initialView="retention" />);
  expect(await screen.findByRole("heading", { name: /retention cohorts/i })).toBeVisible();
  expect(screen.getByText("M1")).toBeVisible();
  expect(screen.getByText("M12")).toBeVisible();
});
```

- [ ] **Step 2: Verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/customer-360/customer-360-page.test.tsx
```

- [ ] **Step 3: Implement responsive cohort representation**

Desktop/tablet may use a compact heat table. Phone must use a readable compact cohort list or horizontally constrained heat layout with deliberate scrolling inside the panel only, never page-level overflow.

- [ ] **Step 4: Add Segment Performance below the cohort/LTV pair**

Use three comparative segment cards/rows with MRR, avg health, churn risk, and avg LTV.

- [ ] **Step 5: Run tests and commit**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/customer-360/customer-360-page.test.tsx
npm run storybook:test
```

```bash
git add frontend/src/redesign/pages/customer-360
git commit -m "feat: redesign customer retention"
```

---

### Task 9: Implement Customer 360 LTV

**Files:**
- Create: `frontend/src/redesign/pages/customer-360/customer-ltv.tsx`
- Modify: Customer 360 test/story files

**Interfaces:**
- Produces segment LTV summary, grouped LTV/MRR comparison, and expansion-opportunity grid/list.

- [ ] **Step 1: Add failing LTV assertions**

```tsx
it("renders segment LTV and expansion opportunities", async () => {
  renderWithProviders(<RedesignCustomer360Page initialView="ltv" />);
  expect(await screen.findByText(/enterprise.*avg ltv/i)).toBeVisible();
  expect(screen.getByRole("heading", { name: /expansion opportunities/i })).toBeVisible();
});
```

- [ ] **Step 2: Verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/customer-360/customer-360-page.test.tsx
```

- [ ] **Step 3: Implement approved layout**

Desktop/tablet:

```text
3 segment LTV summaries
LTV by segment and plan hero chart
Expansion Opportunities table
```

Phone:

```text
LTV ranking
expansion opportunity compact rows
```

Keep large monetary values tabular and abbreviated using existing formatting rules.

- [ ] **Step 4: Run tests and commit**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/customer-360/customer-360-page.test.tsx
npm run storybook:test
```

```bash
git add frontend/src/redesign/pages/customer-360
git commit -m "feat: redesign customer ltv"
```

---

### Task 10: Redesign Settings / Manifest

**Files:**
- Create: `frontend/src/redesign/pages/settings/settings-manifest-page.tsx`
- Create: `frontend/src/redesign/pages/settings/settings-manifest-page.test.tsx`
- Create: `frontend/src/redesign/pages/settings/settings-manifest-page.stories.tsx`

**Interfaces:**
- Produces:

```ts
export type RedesignSettingsManifestPageProps = {
  mode: "live" | "demo";
  refreshDisabled?: boolean;
};
```

- Reuses `useManifest()` and `useRefreshManifest()`.
- Represents only Runtime Mode, Refresh Manifest, Dataset Manifest, Columns, and Audit Trail.

- [ ] **Step 1: Write failing capability tests**

```tsx
it("renders only supported settings capability groups", async () => {
  renderWithProviders(<RedesignSettingsManifestPage mode="live" />);
  expect(await screen.findByRole("heading", { name: /runtime mode/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /refresh manifest/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /dataset manifest/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /columns/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /audit trail/i })).toBeVisible();
});

it("disables refresh in read-only demo mode", async () => {
  renderWithProviders(<RedesignSettingsManifestPage mode="demo" refreshDisabled />);
  expect(await screen.findByRole("button", { name: /refresh now/i })).toBeDisabled();
});
```

- [ ] **Step 2: Run and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/settings/settings-manifest-page.test.tsx
```

- [ ] **Step 3: Implement desktop/tablet layout**

```text
Runtime Mode + Refresh Manifest
Dataset Manifest + Columns
Audit Trail full width
```

Use shadcn Cards and Table/TanStack as appropriate. Preserve copy/hash affordances if supported by current data.

- [ ] **Step 4: Implement phone composition**

Stack Runtime, Refresh, Manifest, compact Columns summary/list, Recent Pipeline Events. Full schema/audit detail can remain within scrollable panel/table patterns only if usable, otherwise provide progressive disclosure through the same page.

- [ ] **Step 5: Add Storybook states**

```text
DefaultDemo
Live
Loading
Error
Mobile390
Mobile360
```

Use the same settings MSW handlers.

- [ ] **Step 6: Run tests and commit**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/settings/settings-manifest-page.test.tsx
npm run storybook:test
```

```bash
git add frontend/src/redesign/pages/settings
git commit -m "feat: redesign settings manifest"
```

---

### Task 11: Analytics Page Family Visual QA Gate

**Files:**
- Create/modify: `frontend/tests/visual/redesign-analytics-pages.visual.spec.ts`
- Modify only evidence-backed defects under `frontend/src/redesign/pages/metrics`, `customer-360`, and `settings`.

**Interfaces:**
- Produces visual evidence for all nine remaining wireframe rows.

- [ ] **Step 1: Add a dark normal screenshot for every view at five canonical widths**

For each of these Storybook view IDs:

```text
Metrics Overview
Metrics Volume
Metrics Breakdown
Metrics Regions
Customer 360 Overview
Customer 360 Churn Risk
Customer 360 Retention
Customer 360 LTV
Settings Manifest
```

capture:

```text
1440x1000
1280x900
1024x768
390x844
360x800
```

- [ ] **Step 2: Add state-specific regression entries**

Include at minimum:

```text
Metrics Sparse 1280 dark
Metrics ZeroHeavy 1280 dark
Metrics ExtremeNumeric 390 dark
Customer 360 HighRisk 1280 dark
Customer 360 NoRisk 1280 dark
Customer 360 Empty 1280 dark
Settings Live 1280 dark
Settings Error 1280 dark
```

- [ ] **Step 3: Add light-theme coverage without duplicate page stories**

For every normal view, capture 1280 and 390 with `theme: "light"` via `openStory()` options.

- [ ] **Step 4: Run unit and Storybook tests**

```bash
npm --prefix frontend run test
npm --prefix frontend run storybook:test
```

Expected: PASS.

- [ ] **Step 5: Run focused analytics visual suite**

```bash
npm --prefix frontend run test:visual -- --grep "redesign-metrics|redesign-customer-360|redesign-settings"
```

- [ ] **Step 6: Review screenshots against all nine approved wireframe rows**

Reject and revise:

```text
Metrics views that look interchangeable
Customer 360 views that collapse into one generic grid
wide phone tables
chart label collisions
extreme numeric wrapping noise
risk color ambiguity
retention heat cells with poor contrast
LTV labels unreadable on phone
Settings controls that imply unsupported behavior
page-level horizontal overflow
```

- [ ] **Step 7: Verify canonical analytics regressions**

```bash
npm --prefix frontend run test:visual -- --grep "metrics-normal-dark-1280|customer-analytics-normal-dark-1280|settings-normal-dark-1024"
```

Expected: PASS without canonical screenshot changes.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/redesign/pages frontend/tests/visual
git commit -m "fix: complete analytics redesign visual qa"
```

## Completion Gate

This plan is complete only when all 13 total redesign rows now exist across the core-page and analytics-page plans, and these nine views specifically:

```text
have distinct information hierarchy
use real API/data contracts
have deterministic states
pass unit and Storybook browser tests
pass dark visual QA at 1440, 1280, 1024, 390, and 360
pass selected light visual QA through theme globals
match the approved responsive geometry
leave canonical visual baselines unchanged
```
