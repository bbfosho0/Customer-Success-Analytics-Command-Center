# Parallel Storybook Redesign Core Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first four redesigned page families, Dashboard, Calls, Call Detail, and Agent Intelligence, against the approved responsive wireframes while leaving canonical pages untouched.

**Architecture:** Every redesign page uses the isolated redesign shell and patterns from the foundation plan, but reuses canonical API hooks, transformers, domain types, and MSW handlers. Desktop and mobile are separate compositions driven by the same domain data, not separate page implementations. Every page lands in Storybook first and gains deterministic visual states before any production route migration.

**Tech Stack:** Next.js 14.2.7, React 18.3.1, TypeScript 5.6.3, Tailwind CSS 3.4.13, shadcn/ui, TanStack Table, Recharts 3.8.1, React Query, MSW, Storybook 10.5, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-21-parallel-storybook-redesign-design.md`

## Dependency

Complete and review:

`docs/superpowers/plans/2026-08-21-parallel-storybook-redesign-foundation.md`

before starting this plan.

## Global Constraints

- Do not modify the visual implementation under `frontend/src/figma/pages` except when shared nonvisual behavior must be extracted without changing canonical rendering.
- Do not migrate frameworks or chart libraries.
- Reuse existing MSW network handlers rather than hard-coding page-only demo objects.
- Use TanStack Table for desktop operational tables, shadcn for visual primitives, and Recharts for charts.
- Use one page implementation per feature. Responsive behavior is CSS/component recomposition, not duplicated dark/light/mobile page files.
- Implement exact approved layout modes: desktop `>=1280`, compact desktop `1024..1279`, tablet `768..1023`, phone shell `<=767`.
- Preserve canonical visual baselines.
- Keep PR #13 draft and unmerged.

---

## File Structure Locked by This Plan

Create:

```text
frontend/src/redesign/pages/dashboard/dashboard-page.tsx
frontend/src/redesign/pages/dashboard/dashboard-page.stories.tsx
frontend/src/redesign/pages/dashboard/dashboard-page.test.tsx
frontend/src/redesign/pages/calls/calls-page.tsx
frontend/src/redesign/pages/calls/calls-columns.tsx
frontend/src/redesign/pages/calls/calls-page.stories.tsx
frontend/src/redesign/pages/calls/calls-page.test.tsx
frontend/src/redesign/pages/call-detail/call-detail-page.tsx
frontend/src/redesign/pages/call-detail/call-detail-page.stories.tsx
frontend/src/redesign/pages/call-detail/call-detail-page.test.tsx
frontend/src/redesign/pages/agent-intelligence/agent-intelligence-page.tsx
frontend/src/redesign/pages/agent-intelligence/agent-intelligence-columns.tsx
frontend/src/redesign/pages/agent-intelligence/agent-intelligence-page.stories.tsx
frontend/src/redesign/pages/agent-intelligence/agent-intelligence-page.test.tsx
frontend/tests/visual/redesign-core-pages.visual.spec.ts
```

Modify dependency manifests only if TanStack Table is not already installed.

---

### Task 1: Redesign Dashboard

**Files:**
- Create: `frontend/src/redesign/pages/dashboard/dashboard-page.tsx`
- Create: `frontend/src/redesign/pages/dashboard/dashboard-page.test.tsx`
- Create: `frontend/src/redesign/pages/dashboard/dashboard-page.stories.tsx`
- Reuse: `frontend/src/lib/api/hooks.ts` or current hook exports
- Reuse: `frontend/src/lib/viz/transformers.ts`
- Reuse: `frontend/src/mocks/fixtures/visual-states.ts`

**Interfaces:**
- Produces:

```ts
export type RedesignDashboardPageProps = {
  onOpenCall: (id: string) => void;
  onAllCalls: () => void;
};

export function RedesignDashboardPage(props: RedesignDashboardPageProps): JSX.Element;
```

- Consumes existing calls and metrics hooks used by canonical Dashboard.
- Uses `MetricCard`, `FilterBar`, `ChartPanel`, `InsightPanel`, and `MobileDataRow` from the redesign pattern layer.

- [ ] **Step 1: Write failing semantic tests for the approved dashboard hierarchy**

```tsx
it("renders the four primary KPI labels", async () => {
  renderWithProviders(<RedesignDashboardPage onOpenCall={() => undefined} onAllCalls={() => undefined} />);
  expect(await screen.findByText("Total interactions")).toBeVisible();
  expect(screen.getByText("Avg handle time")).toBeVisible();
  expect(screen.getByText("Resolution rate")).toBeVisible();
  expect(screen.getByText("Escalations")).toBeVisible();
});

it("exposes the primary analytical surface before supporting analytics", async () => {
  renderWithProviders(<RedesignDashboardPage onOpenCall={() => undefined} onAllCalls={() => undefined} />);
  expect(await screen.findByRole("heading", { name: /call volume/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /issue mix/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /region performance/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused test and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/dashboard/dashboard-page.test.tsx
```

Expected: FAIL because the redesign page does not exist.

- [ ] **Step 3: Implement the page using the approved geometry**

Desktop:

```text
Filter context
4 KPI cards
Call Volume 2/3 + Issue Mix 1/3
Region Performance
Priority Insights 1/3 + Latest Calls 2/3
```

Tablet:

```text
2x2 KPI grid
Call Volume full width
Issue Mix + Region Performance
Priority Insights
Latest Calls compact list/table based on available width
```

Phone:

```text
filter summary trigger
2-column KPI grid
Call Volume full width
Issue Mix
Region Watch
Priority signal row
Recent Calls compact list
```

Use the actual data calculations from current hooks/transformers. Do not copy canonical layout markup wholesale.

- [ ] **Step 4: Add Storybook stories under `Redesign/Pages/Dashboard`**

Stories:

```text
Normal
Sparse
HighRisk
Loading
Empty
Error
Mobile390
Mobile360
```

Reuse the same MSW state handlers as canonical Dashboard.

- [ ] **Step 5: Run unit and Storybook browser tests**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/dashboard/dashboard-page.test.tsx
npm run storybook:test
```

Expected: PASS.

- [ ] **Step 6: Add initial visual entries for 1440, 1280, 1024, 390, and 360**

Use stable Storybook ID:

```text
redesign-pages-dashboard--normal
```

Also capture `Sparse`, `HighRisk`, and `Error` at 1280, plus `Normal` at light 1280 and light 390 through the theme global.

- [ ] **Step 7: Run focused visual tests and inspect actual screenshots**

```bash
npm --prefix frontend run test:visual -- --grep "redesign-dashboard"
```

Check dominant chart hierarchy, KPI containment, chart contrast, table/list density, and mobile scan path.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/redesign/pages/dashboard frontend/tests/visual
git commit -m "feat: redesign dashboard storybook page"
```

---

### Task 2: Redesign Calls as a Real Operational Data Grid

**Files:**
- Create: `frontend/src/redesign/pages/calls/calls-page.tsx`
- Create: `frontend/src/redesign/pages/calls/calls-columns.tsx`
- Create: `frontend/src/redesign/pages/calls/calls-page.test.tsx`
- Create: `frontend/src/redesign/pages/calls/calls-page.stories.tsx`
- Modify: `frontend/package.json` and lockfile only if `@tanstack/react-table` is absent

**Interfaces:**
- Produces:

```ts
export type RedesignCallsPageProps = {
  onOpen: (id: string) => void;
};

export function RedesignCallsPage(props: RedesignCallsPageProps): JSX.Element;
```

- `calls-columns.tsx` produces `ColumnDef<UiCallRecord>[]` using the existing UI call-record transformer type.

- [ ] **Step 1: Add TanStack Table if absent**

```bash
cd frontend && npm install @tanstack/react-table
```

- [ ] **Step 2: Write failing table-behavior tests**

```tsx
it("filters calls through the search control", async () => {
  const user = userEvent.setup();
  renderWithProviders(<RedesignCallsPage onOpen={() => undefined} />);
  const search = await screen.findByRole("textbox", { name: /search calls/i });
  await user.type(search, "C-12841");
  expect(await screen.findByText("C-12841")).toBeVisible();
});

it("opens a call from its primary row action", async () => {
  const onOpen = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<RedesignCallsPage onOpen={onOpen} />);
  await user.click(await screen.findByRole("button", { name: /open C-12841/i }));
  expect(onOpen).toHaveBeenCalledWith(expect.any(String));
});
```

- [ ] **Step 3: Run focused tests and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/calls/calls-page.test.tsx
```

- [ ] **Step 4: Implement desktop/tablet table behavior**

Desktop columns:

```text
Call ID
Agent
Customer
Region
Issue
Duration
Status
Started
```

Compact desktop may hide low-priority columns through TanStack column visibility.

The filter toolbar must expose search, time range, active filter count, sort context, and pagination context without a separate giant filter panel.

- [ ] **Step 5: Implement mobile composition using `MobileDataRow`**

Do not horizontally scroll the desktop table on phone. Each row should prioritize:

```text
Call ID + status
Customer + issue
Duration + agent/region metadata
Open affordance
```

- [ ] **Step 6: Add Storybook states under `Redesign/Pages/Calls`**

```text
Normal
Loading
LongContent
Empty
Error
Mobile390
Mobile360
```

Use existing `visualStates.calls.*` handlers.

- [ ] **Step 7: Run tests and visual QA**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/calls/calls-page.test.tsx
npm run storybook:test
npm run test:visual -- --grep "redesign-calls"
```

Inspect column pressure at 1024, long labels at 390, focus/hover states, and row click affordance.

- [ ] **Step 8: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/redesign/pages/calls frontend/tests/visual
git commit -m "feat: redesign calls operations page"
```

---

### Task 3: Redesign Call Detail

**Files:**
- Create: `frontend/src/redesign/pages/call-detail/call-detail-page.tsx`
- Create: `frontend/src/redesign/pages/call-detail/call-detail-page.test.tsx`
- Create: `frontend/src/redesign/pages/call-detail/call-detail-page.stories.tsx`

**Interfaces:**
- Produces:

```ts
export type RedesignCallDetailPageProps = {
  id: string;
  onBack: () => void;
  onOpen: (id: string) => void;
};
```

- Reuses the same call-detail and related-call hooks as canonical `CallDetailPage`.
- Uses `StatusTimeline` for lifecycle state.

- [ ] **Step 1: Write failing detail tests**

```tsx
it("renders call identity and lifecycle", async () => {
  renderWithProviders(<RedesignCallDetailPage id="CALL_0001" onBack={() => undefined} onOpen={() => undefined} />);
  expect(await screen.findByText(/CALL_0001/i)).toBeVisible();
  expect(screen.getByText(/first response/i)).toBeVisible();
});

it("calls onBack from the breadcrumb action", async () => {
  const onBack = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<RedesignCallDetailPage id="CALL_0001" onBack={onBack} onOpen={() => undefined} />);
  await user.click(await screen.findByRole("button", { name: /back to calls/i }));
  expect(onBack).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/call-detail/call-detail-page.test.tsx
```

- [ ] **Step 3: Implement approved composition**

Desktop:

```text
Breadcrumb / identity header / status
compact metadata strip
lifecycle timeline
primary transcript or call-detail surface
summary/context panel
similar calls
```

Phone:

```text
back + identity + status
metadata chips/rows
vertical timeline
detail/transcript
similar-call list
```

Do not use a wide metadata table on phone.

- [ ] **Step 4: Add deterministic stories under `Redesign/Pages/Call Detail`**

```text
Normal
Loading
LongContent
NotFound
Error
Mobile390
Mobile360
```

Reuse `visualStates.callDetail.*`.

- [ ] **Step 5: Run unit, Storybook, and visual tests**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/call-detail/call-detail-page.test.tsx
npm run storybook:test
npm run test:visual -- --grep "redesign-call-detail"
```

Inspect timeline legibility, long transcript behavior, metadata wrapping, mobile vertical rhythm, and related-call affordances.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/redesign/pages/call-detail frontend/tests/visual
git commit -m "feat: redesign call detail page"
```

---

### Task 4: Redesign Agents as `Agent Intelligence`

**Files:**
- Create: `frontend/src/redesign/pages/agent-intelligence/agent-intelligence-page.tsx`
- Create: `frontend/src/redesign/pages/agent-intelligence/agent-intelligence-columns.tsx`
- Create: `frontend/src/redesign/pages/agent-intelligence/agent-intelligence-page.test.tsx`
- Create: `frontend/src/redesign/pages/agent-intelligence/agent-intelligence-page.stories.tsx`

**Interfaces:**
- Produces `RedesignAgentIntelligencePage(): JSX.Element`.
- Reuses the existing agent analytics hook/data contract.
- Storybook title is `Redesign/Pages/Agent Intelligence`, while canonical remains `Canonical/Pages/Agents`.

- [ ] **Step 1: Write failing ranking tests**

```tsx
it("renders ranked agent performance", async () => {
  renderWithProviders(<RedesignAgentIntelligencePage />);
  expect(await screen.findByRole("heading", { name: /agent intelligence/i })).toBeVisible();
  expect(screen.getByText(/coaching priorities/i)).toBeVisible();
});

it("keeps ranking identity and primary metric visible", async () => {
  renderWithProviders(<RedesignAgentIntelligencePage />);
  expect(await screen.findAllByText(/resolution|csat|handle time/i)).not.toHaveLength(0);
});
```

- [ ] **Step 2: Run test and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/agent-intelligence/agent-intelligence-page.test.tsx
```

- [ ] **Step 3: Implement desktop/tablet ranking surface**

Use TanStack Table for the full performance grid with clear rank, identity, primary performance metric, CSAT, resolution, handle time, and coaching signal columns.

Add a compact coaching-priority panel that surfaces only actionable signals, not redundant table fields.

- [ ] **Step 4: Implement phone ranking rows**

Use `RankingRow` instead of the desktop table. Show rank, agent identity, one primary performance score, and one trend/coaching cue.

- [ ] **Step 5: Add deterministic stories under `Redesign/Pages/Agent Intelligence`**

```text
Normal
Loading
MixedPerformance
Empty
Error
Mobile390
Mobile360
```

Reuse `visualStates.agents.*`.

- [ ] **Step 6: Run tests and visual QA**

```bash
cd frontend && npx vitest run --project=unit src/redesign/pages/agent-intelligence/agent-intelligence-page.test.tsx
npm run storybook:test
npm run test:visual -- --grep "redesign-agent-intelligence"
```

Inspect rank scanability, column density at 1024, coaching hierarchy, and mobile row consistency.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/redesign/pages/agent-intelligence frontend/tests/visual
git commit -m "feat: add agent intelligence redesign"
```

---

### Task 5: Core Page Family QA Gate

**Files:**
- Modify only evidence-backed defects in the four redesign page folders.
- Modify: `frontend/tests/visual/redesign-core-pages.visual.spec.ts`

**Interfaces:**
- Produces four review-ready redesign page families and stable screenshot evidence.

- [ ] **Step 1: Create the core-page visual matrix**

Include dark `Normal` for each page at:

```text
1440x1000
1280x900
1024x768
390x844
360x800
```

Also include:

```text
Dashboard Sparse and HighRisk at 1280
Calls LongContent at 390
Call Detail LongContent at 390
Agent Intelligence MixedPerformance at 1280
Normal light at 1280 and 390 for each page
```

Use theme globals, not duplicate page stories for light/dark.

- [ ] **Step 2: Run all page unit and Storybook browser tests**

```bash
npm --prefix frontend run test
npm --prefix frontend run storybook:test
```

Expected: PASS.

- [ ] **Step 3: Run core visual tests**

```bash
npm --prefix frontend run test:visual -- --grep "redesign-dashboard|redesign-calls|redesign-call-detail|redesign-agent-intelligence"
```

- [ ] **Step 4: Review every screenshot against the approved wireframe geometry**

Reject and fix:

```text
uniform shrink instead of recomposition
persistent wide tables on phone
KPI overflow
weak dominant analytical hierarchy
unreadable chart labels
sidebar taking excessive workspace width
excessive card nesting
centered dense operational text
hidden primary actions
horizontal page overflow
```

- [ ] **Step 5: Verify canonical regression still passes**

```bash
npm --prefix frontend run test:visual -- --grep "dashboard-normal-dark-1280|calls-normal-dark-1280|call-detail-normal-dark-1280|agents-normal-dark-1280"
```

Expected: PASS without canonical baseline updates.

- [ ] **Step 6: Commit only after the full four-page review passes**

```bash
git add frontend/src/redesign/pages frontend/tests/visual
git commit -m "fix: complete core redesign page qa"
```

## Completion Gate

This plan is complete only when Dashboard, Calls, Call Detail, and Agent Intelligence each:

```text
exist only under Redesign source and Storybook hierarchy
use canonical network/data contracts
pass unit and Storybook browser tests
pass dark visual QA at five canonical viewports
pass selected light visual QA through theme globals
match the approved responsive wireframe geometry
leave canonical screenshot baselines unchanged
```
