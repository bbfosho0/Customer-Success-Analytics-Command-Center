# Parallel Storybook Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the approved parallel Storybook redesign from isolated foundations through all 13 responsive page/view rows and final promotion readiness while preserving the canonical production UI.

**Architecture:** The implementation is split into four ordered subplans because the approved spec spans Storybook catalog isolation, a new component/design-system layer, four core product pages, nine analytics/settings views, and final visual/accessibility/CI gates. This roadmap defines the shared test harness and cross-plan contracts, then delegates detailed implementation to the four subplans in strict order.

**Tech Stack:** Next.js 14.2.7, React 18.3.1, TypeScript 5.6.3, Tailwind CSS 3.4.13, Storybook 10.5, shadcn/ui, Radix, TanStack Table, Recharts 3.8.1, React Query, MSW, Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-21-parallel-storybook-redesign-design.md`

## Global Constraints

- Keep canonical production-backed visual source under `frontend/src/figma`.
- Put all new visual implementation under `frontend/src/redesign`.
- Canonical code must not import redesign visual components.
- Use top-level Storybook trees `Canonical/*` and `Redesign/*`, not a custom manager tab.
- Keep Next.js 14.2.7, React 18.3.1, TypeScript 5.6.3, Tailwind CSS 3.4.13, Recharts 3.8.1, and Storybook 10.5.
- Do not migrate framework versions or chart libraries.
- Scope `Command Graphite` under `.redesign-theme` and `.redesign-theme.dark`; do not change canonical `:root` or `.dark` values during exploration.
- Use shadcn/ui selectively and TanStack Table only where the page contract needs a real data grid.
- Theme is a global state. Do not duplicate page implementations for light and dark.
- Implement responsive recomposition at desktop `>=1280`, compact desktop `1024..1279`, tablet `768..1023`, phone shell `<=767`; explicitly QA 640..767.
- Preserve canonical screenshot baselines unless a separate intentional canonical change is approved.
- Keep PR #13 draft and unmerged through final redesign review.

---

### Task 0: Establish the Shared Redesign Test Harness

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/vitest.config.ts`
- Create: `frontend/src/redesign/test/render-with-providers.tsx`
- Create: `frontend/src/redesign/test/setup.ts`
- Create: `frontend/src/redesign/test/render-with-providers.test.tsx`

**Interfaces:**
- Produces:

```ts
export function renderWithProviders(
  ui: React.ReactElement,
  options?: { theme?: "light" | "dark" },
): ReturnType<typeof render>;
```

- Unit tests use the same default MSW `handlers` exported from `frontend/src/mocks/handlers` as Storybook.
- Individual tests may call `server.use(...)` with existing `visualStates` handlers when testing sparse, error, high-risk, or other deterministic states.
- All redesign unit test files that use React Testing Library import exactly:

```ts
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { renderWithProviders } from "@/redesign/test/render-with-providers";
```

Only import `userEvent` or `vi` when the specific test uses them.

- [ ] **Step 1: Add the React testing dependencies**

Run from `frontend/`:

```bash
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Change only the Vitest `unit` project to a DOM environment and add the redesign setup file**

In `frontend/vitest.config.ts`, change the current unit project from:

```ts
{
  test: {
    name: "unit",
    include: ["src/tests/**/*.test.{ts,tsx}"],
    environment: "node",
  },
},
```

to:

```ts
{
  test: {
    name: "unit",
    include: [
      "src/tests/**/*.test.{ts,tsx}",
      "src/redesign/**/*.test.{ts,tsx}",
    ],
    environment: "jsdom",
    setupFiles: ["./src/redesign/test/setup.ts"],
  },
},
```

Do not change the Storybook browser project.

- [ ] **Step 3: Create the unit setup file with jest-dom and MSW lifecycle**

`frontend/src/redesign/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";

import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";

import { handlers } from "@/mocks/handlers";

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`onUnhandledRequest: "error"` is intentional. A redesign unit test must fail if a page starts making an unmocked network request.

- [ ] **Step 4: Run the existing unit suite before adding redesign React tests**

```bash
cd frontend && npm test
```

Expected: existing `src/tests/**/*.test.*` tests still pass under jsdom. If an existing test depends on pure Node globals in a way jsdom breaks, keep that test in a separate Node project instead of weakening the redesign DOM/MSW project.

- [ ] **Step 5: Create the provider helper immediately after the foundation plan creates `RedesignTheme`**

`frontend/src/redesign/test/render-with-providers.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

import { ThemeProvider } from "@/providers/theme-provider";
import { RedesignTheme } from "@/redesign/foundations/redesign-theme";

export function renderWithProviders(
  ui: React.ReactElement,
  { theme = "dark" }: { theme?: "light" | "dark" } = {},
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });

  return render(
    <ThemeProvider forcedTheme={theme}>
      <QueryClientProvider client={client}>
        <RedesignTheme theme={theme}>{ui}</RedesignTheme>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}
```

- [ ] **Step 6: Add a helper smoke test**

`frontend/src/redesign/test/render-with-providers.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { renderWithProviders } from "./render-with-providers";

it("renders redesign content inside query and theme providers", () => {
  renderWithProviders(<div>redesign test</div>);
  expect(screen.getByText("redesign test")).toBeVisible();
});
```

- [ ] **Step 7: Run the focused redesign test harness**

```bash
cd frontend && npx vitest run --project=unit src/redesign/test
```

Expected: PASS.

- [ ] **Step 8: Commit the shared harness with the foundation changes that first consume it**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/src/redesign/test
git commit -m "test: add redesign react test harness"
```

---

## Execution Order

### Phase 1: Storybook Isolation, Theme, Patterns, Shell

Execute:

`docs/superpowers/plans/2026-08-21-parallel-storybook-redesign-foundation.md`

Execution detail: perform Task 0 Steps 1 through 4 from this roadmap before foundation Task 3. After foundation Task 3 creates `RedesignTheme`, perform Task 0 Steps 5 through 8 before foundation Task 4.

Required result before continuing:

```text
Canonical and Redesign Storybook trees are isolated.
Canonical screenshots remain unchanged.
Command Graphite is scoped.
shadcn primitives compile under Tailwind 3.
Reusable patterns and responsive shell are visually approved.
```

### Phase 2: Core Product Pages

Execute:

`docs/superpowers/plans/2026-08-21-parallel-storybook-redesign-core-pages.md`

Every test snippet that calls `renderWithProviders` consumes the Task 0 helper and default MSW server from this roadmap.

Required result before continuing:

```text
Dashboard
Calls
Call Detail
Agent Intelligence
```

all pass deterministic Storybook, unit, and visual review while canonical equivalents remain unchanged.

### Phase 3: Analytics and Settings Pages

Execute:

`docs/superpowers/plans/2026-08-21-parallel-storybook-redesign-analytics-pages.md`

Every test snippet that calls `renderWithProviders` consumes the Task 0 helper and default MSW server from this roadmap.

Required result before continuing:

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

all pass their page-level review gates. At this point all 13 approved wireframe rows are implemented in the Redesign tree.

### Phase 4: Final QA and Promotion Readiness

Execute:

`docs/superpowers/plans/2026-08-21-parallel-storybook-redesign-qa-promotion.md`

Required final state:

```text
13-row Storybook catalog locked
full responsive visual matrix green
767/768 and 1023/1024 boundary tests green
640..767 phone-shell tests green
redesign accessibility blocking and green
canonical regressions green
curated redesign evidence published
REDESIGN_REVIEW.md written
production replacement not performed
PR #13 still draft and unmerged
```

---

## Cross-Plan Interface Contract

The following names are stable across all subplans:

```ts
RedesignTheme
renderWithProviders
MetricCard
FilterBar
ChartPanel
InsightPanel
MobileDataRow
RankingRow
StatusTimeline
RedesignShell
RedesignRoute
RedesignDashboardPage
RedesignCallsPage
RedesignCallDetailPage
RedesignAgentIntelligencePage
RedesignMetricsPage
MetricsView
RedesignCustomer360Page
Customer360View
RedesignSettingsManifestPage
```

Do not rename one of these in a later phase without updating every consuming task and Storybook story in the same commit.

The redesign page Storybook hierarchy is fixed to:

```text
Redesign/Pages/Dashboard
Redesign/Pages/Calls
Redesign/Pages/Call Detail
Redesign/Pages/Agent Intelligence
Redesign/Pages/Metrics/Overview
Redesign/Pages/Metrics/Volume
Redesign/Pages/Metrics/Breakdown
Redesign/Pages/Metrics/Regions
Redesign/Pages/Customer 360/Overview
Redesign/Pages/Customer 360/Churn Risk
Redesign/Pages/Customer 360/Retention
Redesign/Pages/Customer 360/LTV
Redesign/Pages/Settings/Manifest
```

## Final Verification Command Set

After every subplan completes, run the relevant focused tests. Before final review, run the complete set:

```bash
npm --prefix frontend run test
npm --prefix frontend run storybook:build
npm --prefix frontend run storybook:test
npm --prefix frontend run test:visual
npm --prefix frontend run test:e2e
npm --prefix frontend run build
```

No production migration begins until the final QA subplan stops and the user explicitly approves promotion.
