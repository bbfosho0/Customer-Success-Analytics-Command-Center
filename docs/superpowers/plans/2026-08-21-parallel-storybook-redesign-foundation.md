# Parallel Storybook Redesign Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the isolated `Canonical/*` and `Redesign/*` Storybook architecture, shadcn-based redesign primitives, scoped `Command Graphite` theme, reusable redesign patterns, and responsive redesign shell without changing production UI behavior.

**Architecture:** Existing production-backed source under `frontend/src/figma` remains canonical and visually frozen. New visual work is created under `frontend/src/redesign`, shares only stable data/domain utilities, and renders inside a redesign-scoped theme wrapper. Storybook exposes native top-level `Canonical` and `Redesign` trees, with no custom manager tab and no third product-UI tree.

**Tech Stack:** Next.js 14.2.7, React 18.3.1, TypeScript 5.6.3, Tailwind CSS 3.4.13, Storybook 10.5, shadcn/ui with Radix primitives, Lucide React, Recharts 3.8.1, MSW, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-21-parallel-storybook-redesign-design.md`

## Global Constraints

- Keep Next.js 14.2.7, React 18.3.1, TypeScript 5.6.3, Tailwind CSS 3.4.13, Recharts 3.8.1, Storybook 10.5, MSW, Vitest, and Playwright.
- Do not migrate to Tailwind 4, another Next.js major version, another chart library, or another router architecture.
- Canonical source remains under `frontend/src/figma` and must not import from `frontend/src/redesign`.
- New visual implementation lives under `frontend/src/redesign`.
- Redesign code may reuse stable API hooks, domain types, data transformers, MSW handlers, and nonvisual utilities.
- Recharts remains the only chart library.
- Use shadcn/ui selectively as source code, not as an application rewrite.
- Add TanStack Table only in the page plans that need operational data-grid behavior.
- `Command Graphite` is scoped to `.redesign-theme` and `.redesign-theme.dark`; do not change canonical `:root` or `.dark` values during exploration.
- Do not create duplicate light and dark page implementations. Theme remains a Storybook global.
- Storybook separation uses story title hierarchy, not a custom manager tab.
- Keep PR #13 draft and unmerged during redesign development.
- Do not update Playwright screenshots only to make tests green. Screenshot updates require intentional visual review.

---

## File Structure Locked by This Plan

Create:

```text
frontend/components.json
frontend/src/redesign/foundations/redesign-theme.tsx
frontend/src/redesign/foundations/redesign-theme.stories.tsx
frontend/src/redesign/ui/*
frontend/src/redesign/patterns/metric-card.tsx
frontend/src/redesign/patterns/filter-bar.tsx
frontend/src/redesign/patterns/chart-panel.tsx
frontend/src/redesign/patterns/insight-panel.tsx
frontend/src/redesign/patterns/mobile-data-row.tsx
frontend/src/redesign/patterns/ranking-row.tsx
frontend/src/redesign/patterns/status-timeline.tsx
frontend/src/redesign/patterns/patterns.stories.tsx
frontend/src/redesign/shell/redesign-shell.tsx
frontend/src/redesign/shell/redesign-page-header.tsx
frontend/src/redesign/shell/redesign-shell.stories.tsx
frontend/tests/visual/redesign-foundation.visual.spec.ts
```

Modify:

```text
frontend/tsconfig.json
frontend/tailwind.config.ts
frontend/src/styles/themes.css
frontend/.storybook/preview.tsx
frontend/src/figma/*.stories.tsx
frontend/src/figma/pages/*.stories.tsx
frontend/tests/visual/pages.visual.spec.ts
frontend/tests/visual/primitives.visual.spec.ts
frontend/tests/visual/workbench.visual.spec.ts
```

The shadcn CLI may create additional primitive files under `frontend/src/redesign/ui`; keep only the approved initial set used by the shell and patterns.

---

### Task 1: Move Existing Storybook Surfaces Under `Canonical/*`

**Files:**
- Modify: `frontend/src/figma/primitives.stories.tsx`
- Modify: `frontend/src/figma/filters.stories.tsx`
- Modify: `frontend/src/figma/shell.stories.tsx`
- Modify: `frontend/src/figma/redesign-workbench.stories.tsx`
- Modify: `frontend/src/figma/pages/dashboard.stories.tsx`
- Modify: `frontend/src/figma/pages/calls.stories.tsx`
- Modify: `frontend/src/figma/pages/call-detail.stories.tsx`
- Modify: `frontend/src/figma/pages/agents.stories.tsx`
- Modify: `frontend/src/figma/pages/metrics.stories.tsx`
- Modify: `frontend/src/figma/pages/customer-analytics.stories.tsx`
- Modify: `frontend/src/figma/pages/settings.stories.tsx`
- Modify: `frontend/tests/visual/pages.visual.spec.ts`
- Modify: `frontend/tests/visual/primitives.visual.spec.ts`
- Modify: `frontend/tests/visual/workbench.visual.spec.ts`

**Interfaces:**
- Consumes: existing canonical React components and MSW stories unchanged.
- Produces: stable Storybook IDs prefixed with `canonical-`, for example `canonical-pages-dashboard--normal`.

- [ ] **Step 1: Change one Playwright story reference first so the test fails**

In `frontend/tests/visual/pages.visual.spec.ts`, change only the Dashboard normal story ID:

```ts
const normalSurfaces = [
  ["dashboard", "canonical-pages-dashboard--normal"],
  ["calls", "pages-calls--normal"],
  ["call-detail", "pages-call-detail--normal"],
  ["agents", "pages-agents--normal"],
  ["metrics", "pages-metrics--normal"],
  ["customer-analytics", "pages-customer-analytics--normal"],
  ["settings", "pages-settings--default"],
] as const;
```

- [ ] **Step 2: Run the focused visual test and verify it fails because the new Storybook ID does not exist**

Run:

```bash
npm --prefix frontend run test:visual -- --grep "dashboard-normal-dark-1440"
```

Expected: FAIL while opening `canonical-pages-dashboard--normal`.

- [ ] **Step 3: Rename the Dashboard story hierarchy**

Change:

```ts
title: "Pages/Dashboard",
```

to:

```ts
title: "Canonical/Pages/Dashboard",
```

- [ ] **Step 4: Run the focused visual test again**

Run:

```bash
npm --prefix frontend run test:visual -- --grep "dashboard-normal-dark-1440"
```

Expected: PASS with the existing screenshot baseline, because only the Storybook catalog location changed.

- [ ] **Step 5: Rename all remaining canonical story titles**

Use this exact mapping:

```text
Design System/Primitives                  -> Canonical/Design System/Primitives
Design System/Global Filters              -> Canonical/Design System/Global Filters
Design System/Application Shell           -> Canonical/Design System/Application Shell
Redesign Workbench/Patterns               -> Canonical/Reference/Pre-redesign Workbench
Pages/Dashboard                           -> Canonical/Pages/Dashboard
Pages/Calls                               -> Canonical/Pages/Calls
Pages/Call Detail                         -> Canonical/Pages/Call Detail
Pages/Agents                              -> Canonical/Pages/Agents
Pages/Metrics                             -> Canonical/Pages/Metrics
Pages/Customer Analytics                  -> Canonical/Pages/Customer 360
Pages/Settings                            -> Canonical/Pages/Settings
```

Do not rename the canonical React component `AgentsPage`; only the Storybook navigation title remains `Agents`.

- [ ] **Step 6: Update all Playwright story IDs to the corresponding `canonical-*` IDs**

For example:

```ts
["calls", "canonical-pages-calls--normal"],
["call-detail", "canonical-pages-call-detail--normal"],
["agents", "canonical-pages-agents--normal"],
["metrics", "canonical-pages-metrics--normal"],
["customer-analytics", "canonical-pages-customer-360--normal"],
["settings", "canonical-pages-settings--default"],
```

Update primitive and pre-redesign workbench test IDs the same way.

- [ ] **Step 7: Build Storybook and run all canonical visual tests**

Run:

```bash
npm --prefix frontend run storybook:build
npm --prefix frontend run test:visual
```

Expected: Storybook builds and every existing screenshot passes without visual baseline updates.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/figma frontend/tests/visual
git commit -m "refactor: separate canonical storybook catalog"
```

---

### Task 2: Initialize shadcn for the Isolated Redesign Layer

**Files:**
- Create: `frontend/components.json`
- Modify: `frontend/tsconfig.json`
- Create/modify from shadcn: `frontend/src/redesign/ui/*`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

**Interfaces:**
- Consumes: existing Tailwind 3 pipeline and `frontend/src/figma/ui/utils.ts` `cn` behavior as reference only.
- Produces: `@/redesign/ui/*` imports and the initial shadcn primitive layer.

- [ ] **Step 1: Add the TypeScript alias required by generated redesign imports**

Add to `compilerOptions` in `frontend/tsconfig.json`:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

- [ ] **Step 2: Run TypeScript before adding shadcn and verify no existing import is broken**

Run:

```bash
cd frontend && npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Initialize shadcn in preview mode using the existing npm package runner**

Run from `frontend/`:

```bash
npx shadcn@latest init
```

Configure it to preserve Tailwind 3 and route generated UI files to `src/redesign/ui`. Use Radix primitives. Do not accept a framework migration or global theme overwrite.

- [ ] **Step 4: Inspect the generated `components.json` before adding components**

It must resolve aliases into the redesign layer, conceptually:

```json
{
  "aliases": {
    "components": "@/redesign",
    "ui": "@/redesign/ui",
    "utils": "@/redesign/lib/utils"
  }
}
```

If the CLI created or rewrote global CSS values, revert those visual value changes before continuing.

- [ ] **Step 5: Search and inspect the exact shadcn components before installing**

Run:

```bash
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest docs button card badge tabs tooltip popover dropdown-menu sheet drawer command separator scroll-area skeleton table chart
```

- [ ] **Step 6: Add only the foundation primitives needed by this plan**

Run:

```bash
npx shadcn@latest add button card badge tabs tooltip popover dropdown-menu sheet drawer command separator scroll-area skeleton table chart
```

Do not add an entire registry or template.

- [ ] **Step 7: Verify generated imports and icon library**

Every generated file must use the project alias and `lucide-react`. Fix any hardcoded third-party registry alias before proceeding.

- [ ] **Step 8: Run typecheck and Storybook build**

```bash
cd frontend && npx tsc --noEmit
npm run storybook:build
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add frontend/components.json frontend/tsconfig.json frontend/package.json frontend/package-lock.json frontend/src/redesign/ui
git commit -m "feat: add isolated shadcn redesign primitives"
```

---

### Task 3: Add the Scoped `Command Graphite` Theme

**Files:**
- Create: `frontend/src/redesign/foundations/redesign-theme.tsx`
- Create: `frontend/src/redesign/foundations/redesign-theme.test.tsx`
- Create: `frontend/src/redesign/foundations/redesign-theme.stories.tsx`
- Modify: `frontend/src/styles/themes.css`
- Modify: `frontend/.storybook/preview.tsx`

**Interfaces:**
- Produces: `RedesignTheme({ children, theme }: { children: React.ReactNode; theme?: "light" | "dark" })`.
- Produces CSS scope: `.redesign-theme` and `.redesign-theme.dark`.

- [ ] **Step 1: Write the failing theme wrapper test**

```tsx
import { render } from "@testing-library/react";
import { RedesignTheme } from "./redesign-theme";

it("scopes redesign tokens without applying canonical dark class globally", () => {
  const { getByTestId } = render(
    <RedesignTheme theme="dark">
      <div data-testid="content" />
    </RedesignTheme>,
  );

  const root = getByTestId("redesign-theme");
  expect(root.className).toContain("redesign-theme");
  expect(root.className).toContain("dark");
  expect(document.documentElement.classList.contains("redesign-theme")).toBe(false);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/foundations/redesign-theme.test.tsx
```

Expected: FAIL because `RedesignTheme` does not exist.

- [ ] **Step 3: Implement the wrapper**

```tsx
import { cn } from "@/redesign/lib/utils";

export function RedesignTheme({
  children,
  theme = "dark",
}: {
  children: React.ReactNode;
  theme?: "light" | "dark";
}) {
  return (
    <div data-testid="redesign-theme" className={cn("redesign-theme min-h-screen bg-background text-foreground", theme === "dark" && "dark")}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Add scoped token blocks to `themes.css` without altering canonical blocks**

Add `.redesign-theme` with the approved light values and `.redesign-theme.dark` with the approved dark values from the design spec. Include chart roles and sidebar-related variables required by shadcn Sidebar. Do not modify existing `:root` or `.dark` values.

- [ ] **Step 5: Add Storybook foundation stories**

Use title:

```ts
title: "Redesign/Foundations/Theme"
```

Render token swatches, typography samples, five chart roles, semantic status colors, borders, and radius examples inside `RedesignTheme`.

- [ ] **Step 6: Run test and Storybook build**

```bash
cd frontend && npx vitest run --project=unit src/redesign/foundations/redesign-theme.test.tsx
npm run storybook:build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/redesign/foundations frontend/src/styles/themes.css frontend/.storybook/preview.tsx frontend/src/redesign/lib
git commit -m "feat: add scoped command graphite theme"
```

---

### Task 4: Build the Core Redesign Patterns

**Files:**
- Create: `frontend/src/redesign/patterns/metric-card.tsx`
- Create: `frontend/src/redesign/patterns/filter-bar.tsx`
- Create: `frontend/src/redesign/patterns/chart-panel.tsx`
- Create: `frontend/src/redesign/patterns/insight-panel.tsx`
- Create: `frontend/src/redesign/patterns/mobile-data-row.tsx`
- Create: `frontend/src/redesign/patterns/ranking-row.tsx`
- Create: `frontend/src/redesign/patterns/status-timeline.tsx`
- Create: `frontend/src/redesign/patterns/patterns.test.tsx`
- Create: `frontend/src/redesign/patterns/patterns.stories.tsx`

**Interfaces:**
- Produces `MetricCardProps`, `FilterBarProps`, `ChartPanelProps`, `MobileDataRowProps`, `RankingRowProps`, and `StatusTimelineProps` for later page plans.
- Uses shadcn `Card`, `Badge`, `Button`, `Popover`, `Sheet`, `Separator`, and existing Recharts only through children passed to `ChartPanel`.

- [ ] **Step 1: Write failing semantic rendering tests**

Use representative assertions:

```tsx
it("renders one dominant metric value with comparison context", () => {
  render(<MetricCard label="Resolution rate" value="91.4%" comparison="+1.8 pts vs prior" tone="positive" />);
  expect(screen.getByText("91.4%")).toBeVisible();
  expect(screen.getByText("+1.8 pts vs prior")).toBeVisible();
});

it("renders mobile rows with primary identity before metadata", () => {
  render(<MobileDataRow title="C-12841" status="Escalated" metadata={["Acme", "Authentication", "8m02s"]} />);
  expect(screen.getByText("C-12841")).toBeVisible();
  expect(screen.getByText("Escalated")).toBeVisible();
});
```

- [ ] **Step 2: Run tests and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/patterns/patterns.test.tsx
```

Expected: FAIL due to missing components.

- [ ] **Step 3: Implement the patterns with shadcn composition**

Rules:

```text
MetricCard: one dominant value, optional comparison, optional microtrend slot
FilterBar: search/date/filter summary, desktop inline, mobile Sheet trigger
ChartPanel: Card composition with title, description, optional legend/action, chart child
InsightPanel: semantic Alert or Card composition, no decorative glass
MobileDataRow: title/status first, metadata second, action affordance last
RankingRow: rank, identity, primary metric, trend
StatusTimeline: ordered steps with current/completed state
```

Use semantic Tailwind tokens only. No raw `dark:` color overrides in redesign UI components.

- [ ] **Step 4: Add Storybook pattern matrices**

Use separate titles under:

```text
Redesign/Patterns/KPI Card
Redesign/Patterns/Filter Bar
Redesign/Patterns/Chart Panel
Redesign/Patterns/Insight Panel
Redesign/Patterns/Mobile Data Row
Redesign/Patterns/Ranking Row
Redesign/Patterns/Status Timeline
```

Include normal, long-content, loading where relevant, extreme-number, and mobile-width examples.

- [ ] **Step 5: Run unit tests and Storybook browser tests**

```bash
cd frontend && npx vitest run --project=unit src/redesign/patterns/patterns.test.tsx
npm run storybook:test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/redesign/patterns
git commit -m "feat: add redesign analytics patterns"
```

---

### Task 5: Build the Responsive Redesign Shell

**Files:**
- Create: `frontend/src/redesign/shell/redesign-shell.tsx`
- Create: `frontend/src/redesign/shell/redesign-page-header.tsx`
- Create: `frontend/src/redesign/shell/redesign-shell.test.tsx`
- Create: `frontend/src/redesign/shell/redesign-shell.stories.tsx`

**Interfaces:**
- Produces `RedesignRoute = "dashboard" | "calls" | "call-detail" | "agent-intelligence" | "metrics" | "customer-360" | "settings"`.
- Produces `RedesignShell({ route, navigate, children })`.
- Uses shadcn `Sidebar` for desktop/compact desktop and `Sheet` for phone/tablet navigation.

- [ ] **Step 1: Write failing navigation tests**

```tsx
it("marks the current redesign route active", () => {
  render(<RedesignShell route="metrics" navigate={() => undefined}><div>workspace</div></RedesignShell>);
  expect(screen.getByRole("link", { name: "Metrics" })).toHaveAttribute("aria-current", "page");
});

it("exposes mobile navigation through an accessible trigger", () => {
  render(<RedesignShell route="dashboard" navigate={() => undefined}><div>workspace</div></RedesignShell>);
  expect(screen.getByRole("button", { name: /open navigation/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused unit tests and verify failure**

```bash
cd frontend && npx vitest run --project=unit src/redesign/shell/redesign-shell.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement shell geometry**

Desktop `>=1280`:

```text
collapsible left sidebar
independently scrolling workspace
compact top context/header
```

Compact desktop `1024..1279`:

```text
narrower sidebar or icon-forward collapsed rail
workspace retains analytical width
```

Tablet `768..1023`:

```text
no persistent full sidebar
header navigation trigger opens Sheet
```

Phone `<=767`, including the 640..767 QA range:

```text
phone shell
Sheet navigation
single-column page flow
```

- [ ] **Step 4: Add exact Storybook shell stories**

Use title:

```ts
title: "Redesign/Shell/Application Shell"
```

Stories:

```text
Desktop1440
Desktop1280
Compact1024
Tablet768
Mobile390
Mobile360
```

Set viewport parameters explicitly for each story.

- [ ] **Step 5: Add foundation Playwright snapshots**

Create `frontend/tests/visual/redesign-foundation.visual.spec.ts`:

```ts
const shellStories = [
  ["redesign-shell-1440", "redesign-shell-application-shell--desktop-1440", 1440, 1000],
  ["redesign-shell-1280", "redesign-shell-application-shell--desktop-1280", 1280, 900],
  ["redesign-shell-1024", "redesign-shell-application-shell--compact-1024", 1024, 768],
  ["redesign-shell-768", "redesign-shell-application-shell--tablet-768", 768, 900],
  ["redesign-shell-390", "redesign-shell-application-shell--mobile-390", 390, 844],
  ["redesign-shell-360", "redesign-shell-application-shell--mobile-360", 360, 800],
] as const;
```

For each, call `openStory()` and `expect(page).toHaveScreenshot()`.

- [ ] **Step 6: Run unit, Storybook, and visual tests**

```bash
cd frontend && npx vitest run --project=unit src/redesign/shell/redesign-shell.test.tsx
npm run storybook:test
npm run test:visual -- --grep "redesign-shell"
```

Expected: PASS after intentional first baselines are reviewed.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/redesign/shell frontend/tests/visual/redesign-foundation.visual.spec.ts frontend/tests/visual/__screenshots__
git commit -m "feat: add responsive redesign shell"
```

---

### Task 6: Foundation Visual QA Gate

**Files:**
- Modify as required by observed defects only: `frontend/src/redesign/**`
- Do not modify canonical visual implementation.

**Interfaces:**
- Consumes: all foundation stories from Tasks 1 through 5.
- Produces: reviewed redesign foundation ready for page implementation.

- [ ] **Step 1: Build Storybook and run all Storybook browser tests**

```bash
npm --prefix frontend run storybook:build
npm --prefix frontend run storybook:test
```

Expected: PASS.

- [ ] **Step 2: Run the complete visual suite**

```bash
npm --prefix frontend run test:visual
```

Expected: canonical baselines still pass, redesign foundation baselines pass.

- [ ] **Step 3: Inspect screenshots at all six redesign shell sizes**

Check specifically:

```text
navigation width and hierarchy
workspace max-width and gutters
no horizontal overflow
Sheet trigger placement
theme contrast
focus visibility
KPI number containment
long labels
chart panel legend wrapping
mobile touch target size
```

- [ ] **Step 4: Fix only evidence-backed defects and rerun the focused tests after each fix**

Do not make speculative page-level redesign changes in this task.

- [ ] **Step 5: Run canonical regression one final time**

```bash
npm --prefix frontend run test:visual -- --grep "dashboard-normal-dark-1440|calls-normal-dark-1280|settings-normal-dark-1024"
```

Expected: PASS with unchanged canonical screenshots.

- [ ] **Step 6: Commit the QA corrections**

```bash
git add frontend/src/redesign frontend/tests/visual
git commit -m "fix: complete redesign foundation visual qa"
```

## Completion Gate

This plan is complete only when:

```text
Canonical and Redesign are the only product UI top-level Storybook trees.
Canonical screenshots remain visually unchanged.
Command Graphite is scoped to redesign stories only.
Approved shadcn primitives compile under Tailwind 3.
Redesign patterns have browser-test coverage.
The shell passes 1440, 1280, 1024, 768, 390, and 360 visual review.
No production page has been replaced.
PR #13 remains draft and unmerged.
```
