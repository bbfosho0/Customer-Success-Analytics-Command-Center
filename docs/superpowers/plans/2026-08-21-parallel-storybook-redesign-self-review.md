# Parallel Storybook Redesign Plan Self-Review

Date: 2026-08-21

This document records the required self-review corrections for the implementation roadmap and four ordered subplans. These corrections are mandatory during execution and supersede any conflicting shorthand in an individual subplan.

## 1. Spec coverage

The plan set covers every requirement in `docs/superpowers/specs/2026-08-21-parallel-storybook-redesign-design.md`:

```text
Canonical vs Redesign Storybook isolation
source-code isolation under src/figma and src/redesign
scoped Command Graphite light/dark tokens
selective shadcn source-code primitive layer
TanStack Table for operational grids
Recharts-only chart architecture
21st.dev as inspiration, not application architecture
responsive shell contract including 640..767 QA
Dashboard
Calls
Call Detail
Agent Intelligence
Metrics Overview
Metrics Volume
Metrics Breakdown
Metrics Regions
Customer 360 Overview
Customer 360 Churn Risk
Customer 360 Retention
Customer 360 LTV
Settings Manifest
deterministic MSW story states
light/dark through Storybook globals
Playwright visual regression
accessibility gate
CI evidence
final user approval before production promotion
```

No spec requirement is intentionally deferred beyond the final production replacement, which is explicitly outside these plans until a separate user approval.

## 2. Mandatory shadcn correction

The foundation plan searches for Sidebar but its install command omitted it.

When executing Foundation Task 2, the approved initial shadcn set is exactly:

```bash
npx shadcn@latest add sidebar button card badge tabs tooltip popover dropdown-menu sheet drawer command separator scroll-area skeleton table chart
```

Do not execute the shorter command in the first draft of the foundation subplan.

Before the add command, run:

```bash
npx shadcn@latest docs sidebar button card badge tabs tooltip popover dropdown-menu sheet drawer command separator scroll-area skeleton table chart
```

The Sidebar is required by `RedesignShell` and is not optional.

## 3. Mandatory unit-test import contract

Vitest globals are not enabled by the current repository configuration. Every redesign unit test file must import the symbols it uses.

Minimum noninteractive test import block:

```ts
import { screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { renderWithProviders } from "@/redesign/test/render-with-providers";
```

Interactive test import block:

```ts
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { renderWithProviders } from "@/redesign/test/render-with-providers";
```

Import `vi` only when mocks/spies are used. Theme-wrapper tests that run before `renderWithProviders` exists may import `render` directly from `@testing-library/react`.

## 4. Mandatory Vitest and MSW harness contract

The current `frontend/vitest.config.ts` unit project uses `environment: "node"` and only includes `src/tests/**/*.test.{ts,tsx}`. The roadmap correction is authoritative:

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

`frontend/src/redesign/test/setup.ts` must start the default MSW Node server using the existing exported `handlers` and use:

```ts
server.listen({ onUnhandledRequest: "error" });
```

This prevents redesign tests from silently hitting unmocked network requests.

## 5. Shared page test provider

All page tests consume the helper defined by the roadmap:

```ts
renderWithProviders(ui, { theme?: "light" | "dark" })
```

It must provide:

```text
ThemeProvider
QueryClientProvider with retry disabled
RedesignTheme
```

Do not create page-specific query/test providers unless a page has a genuinely different provider dependency.

## 6. TanStack Table dependency timing

Install `@tanstack/react-table` once, before implementing Calls. If it is already installed by then, do not reinstall or change its version merely because later pages also use it.

Calls, Agent Intelligence, Customer 360 Churn Risk, Customer 360 Expansion Opportunities, Settings Columns, and Settings Audit Trail may share a redesign-owned table pattern, but each owns its own `ColumnDef<T>` definitions.

## 7. Metrics data boundary

To remove ambiguity from the analytics subplan, create:

```text
frontend/src/redesign/pages/metrics/metrics-model.ts
```

It produces a single redesign view model from the existing calls/API data and existing transformer utilities.

Use this interface:

```ts
export type RedesignMetricsModel = {
  kpis: Array<{
    label: string;
    value: string;
    comparison?: string;
  }>;
  series: Array<Record<string, string | number>>;
  issueBreakdown: Array<Record<string, string | number>>;
  regions: Array<Record<string, string | number>>;
  channelMetrics: Array<Record<string, string | number>>;
};

export function useRedesignMetricsModel(): RedesignMetricsModel;
```

The four Metrics view components consume this shared model. Do not duplicate calculations independently across Overview, Volume, Breakdown, and Regions.

If the existing canonical transformer already exports a strongly typed equivalent that contains all required values, use that existing type/function instead and do not create a redundant wrapper.

## 8. Customer 360 data boundary

To remove ambiguity from the Customer 360 subplan, create:

```text
frontend/src/redesign/pages/customer-360/customer-360-model.ts
```

It owns only derived presentation data shared by multiple Customer 360 views, such as health summary, LTV formatting, segment performance shaping, and risk filtering helpers. API fetching remains in the existing feature hooks.

Do not copy API response objects into a second fake domain model.

## 9. Storybook ID verification

Story IDs written in the plans are expected IDs derived from titles, but Storybook is the authority.

After each new story file is built:

1. inspect the Storybook catalog/static metadata,
2. confirm the generated ID,
3. use that exact ID in Playwright.

Do not rename an approved story title solely to make a guessed test ID match.

## 10. No theme-duplicate pages

The following patterns are prohibited:

```text
DashboardLight.tsx
DashboardDark.tsx
*-light.tsx
*-dark.tsx
LightDashboard story that imports a different page component
DarkDashboard story that imports a different page component
```

Light/dark screenshot entries must call the same Storybook story ID with different theme globals.

## 11. 21st.dev usage boundary

21st.dev references in the design spec are composition and anatomy inspiration. Do not copy an entire dashboard template, routing structure, authentication layer, global theme setup, chart library, or Motion dependency into the repository.

Specific allowed inspiration remains:

```text
collapsible sidebar behavior
compact sidebar rhythm
metric-card anatomy
unequal analytics bento hierarchy
data-table density/status treatment
```

shadcn owns the primitive implementation and the project owns the final composition.

## 12. Placeholder scan

The plan set intentionally contains no `TBD`, `TODO`, `implement later`, or `write tests for the above` steps.

Where a command says to inspect generated shadcn output or Storybook IDs, that inspection is necessary because those tools generate version-dependent source and identifiers. It is not an implementation placeholder.

## 13. Stable cross-plan names

These names are locked unless changed everywhere in one commit:

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

## 14. Execution order

Execute in this order:

```text
0. Roadmap Task 0 Steps 1-4
1. Foundation Tasks 1-3
2. Roadmap Task 0 Steps 5-8
3. Foundation Tasks 4-6
4. Core Pages plan
5. Analytics Pages plan
6. QA and Promotion Readiness plan
7. Stop for final user approval
```

Production route replacement and PR merge are not part of this execution sequence.
