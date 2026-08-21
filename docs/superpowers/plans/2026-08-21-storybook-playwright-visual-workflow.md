# Storybook + Playwright Visual Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a free, deterministic, code-first visual design and QA foundation where Storybook exposes the current canonical UI, MSW supplies controlled API states, Playwright captures regression and AI-review screenshots, and GitHub Actions publishes those screenshots for visual analysis before any redesign begins.

**Architecture:** The existing Next.js application remains the source of truth. Storybook reproduces the app's global CSS, theme, routing assumptions, and React Query environment while isolating query state between stories. MSW intercepts the same HTTP requests the application already makes. Playwright Test drives Storybook for exhaustive visual coverage and the real Next.js app for a smaller integration suite; `@playwright/cli` is installed for agent-driven interactive inspection. GitHub Actions extends the existing frontend CI job and uploads Storybook, visual evidence, Playwright reports, diffs, and traces.

**Tech Stack:** Next.js 14.2.7, React 18.3.1, TypeScript 5.6.3, Tailwind CSS 3.4.13, Recharts 3.8.1, TanStack React Query 5, next-themes 0.4.6, Vitest 4, Storybook 10.x with `@storybook/nextjs-vite`, MSW 2.x with `msw-storybook-addon`, Storybook a11y/Vitest/MCP addons, `@playwright/test`, `@playwright/cli`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-21-storybook-playwright-visual-workflow-design.md`

## Global Constraints

- Work only on branch `storybook-playwright-redesign-foundation` for this foundation.
- Baseline `main` SHA: `f955a6e5598300a702d0517ab9a7eba3a569c209`.
- Do not redesign the UI in this plan.
- Preserve application behavior, routes, API contracts, and business logic.
- Do not migrate Next.js, React, Tailwind, Recharts, or the App Router.
- Do not delete or broadly refactor `frontend/src/figma` during foundation work.
- Do not introduce Figma, Penpot, Chromatic, or a paid visual-testing dependency.
- Storybook must import the existing `frontend/src/styles/globals.css` rather than recreating styles.
- Reuse the existing `ThemeProvider`; do not create a competing theme implementation.
- Storybook must create an isolated `QueryClient` per story render rather than using the application singleton from `frontend/src/lib/state/queryClient.ts`.
- MSW handlers must match the application's existing network contracts and typed/static fixtures.
- Storybook is the exhaustive visual-state target. The live Next.js app gets a smaller critical-flow suite.
- Chromium is the canonical visual-regression renderer.
- Generated Storybook builds, reports, traces, screenshots, and AI-review evidence are CI artifacts and remain ignored locally.
- Playwright `toHaveScreenshot()` baseline PNGs are committed test expectations and must not be ignored.
- GitHub Actions must upload evidence with `if: always()` so failures remain inspectable.
- Accessibility findings are surfaced from the start, but only become a hard blocking gate after the initial existing-UI baseline is documented.
- Follow the repository's existing `AGENTS.md` restrictions for generated OpenAPI and data artifacts.

---

## Locked File Layout

```text
frontend/
  .storybook/
    main.ts
    preview.tsx
    test.setup.ts              # only when required by installed Storybook/Vitest integration
  src/
    storybook/
      story-providers.tsx
      viewports.ts
    mocks/
      handlers.ts
      handlers/
        core-api.ts
        customer-analytics.ts
      fixtures/
        visual-states.ts
    figma/
      *.stories.tsx
      pages/
        *.stories.tsx
  tests/
    helpers/
      storybook.ts
      visual-evidence.ts
    visual/
      primitives.visual.spec.ts
      pages.visual.spec.ts
      evidence-manifest.ts
    e2e/
      app-smoke.spec.ts
  playwright.config.ts
```

Generated and ignored:

```text
frontend/storybook-static/
frontend/playwright-report/
frontend/test-results/
frontend/visual-evidence/
frontend/.playwright-cli/
```

Canonical visual QA dimensions:

```text
Desktop XL   1440 x 1000
Desktop      1280 x 900
Tablet       1024 x 768
Mobile       390 x 844
Small Mobile 360 x 800
```

---

### Task 1: Install and lock the visual tooling

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces npm scripts used by every later task: `storybook`, `storybook:build`, `storybook:test`, `playwright:version`, `playwright:cli:version`, `test:visual`, `test:visual:update`, `test:e2e`.

- [ ] **Step 1: Prove the branch is green before dependency changes**

```bash
npm --prefix frontend ci
npm --prefix frontend run test
npm --prefix frontend run build
```

Expected: all three commands pass. If a command already fails, record its exact output before making dependency changes and do not misattribute it to Storybook.

- [ ] **Step 2: Install only the required packages**

Run from `frontend/`:

```bash
npm install --save-dev \
  storybook@latest \
  @storybook/nextjs-vite@latest \
  @storybook/addon-docs@latest \
  @storybook/addon-a11y@latest \
  @storybook/addon-vitest@latest \
  @storybook/addon-mcp@latest \
  msw@^2 \
  msw-storybook-addon@latest \
  @playwright/test@latest \
  @playwright/cli@latest
```

Do not install Chromatic or `@chromatic-com/storybook`.

- [ ] **Step 3: Add stable scripts to `frontend/package.json`**

```json
{
  "storybook": "storybook dev -p 6006",
  "storybook:build": "storybook build",
  "storybook:test": "vitest --project=storybook --run",
  "playwright:version": "playwright --version",
  "playwright:cli:version": "playwright-cli --version",
  "test:visual": "playwright test tests/visual",
  "test:visual:update": "playwright test tests/visual --update-snapshots",
  "test:e2e": "playwright test tests/e2e"
}
```

If the installed Storybook Vitest addon generates a different supported Storybook test command, keep the script name `storybook:test` and point it to that generated command. Do not keep two competing Storybook test commands.

- [ ] **Step 4: Ignore transient output**

Append to `.gitignore`:

```gitignore
# Frontend Storybook and Playwright generated output
frontend/storybook-static/
frontend/playwright-report/
frontend/test-results/
frontend/visual-evidence/
frontend/.playwright-cli/
```

Do not ignore Playwright snapshot directories under `frontend/tests/visual/`.

- [ ] **Step 5: Verify Playwright Test and Playwright CLI are both installed**

```bash
npm --prefix frontend run playwright:version
npm --prefix frontend run playwright:cli:version
npm --prefix frontend run test
npm --prefix frontend run build
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json .gitignore
git commit -m "chore: add Storybook MSW and Playwright tooling"
```

---

### Task 2: Configure Storybook to reproduce the real application environment

**Files:**
- Create: `frontend/.storybook/main.ts`
- Create: `frontend/.storybook/preview.tsx`
- Create: `frontend/src/storybook/story-providers.tsx`
- Create: `frontend/src/storybook/viewports.ts`
- Modify: `frontend/tsconfig.json` only if the installed Storybook/MSW tooling requires its types/config files included

**Interfaces:**
- Consumes: `frontend/src/styles/globals.css`, `frontend/src/providers/theme-provider.tsx`.
- Produces: `StoryProviders` and `canonicalViewports`.

- [ ] **Step 1: Create canonical viewport definitions**

`frontend/src/storybook/viewports.ts`:

```ts
export const canonicalViewports = {
  desktopXL: { name: "Desktop XL 1440x1000", styles: { width: "1440px", height: "1000px" } },
  desktop: { name: "Desktop 1280x900", styles: { width: "1280px", height: "900px" } },
  tablet: { name: "Tablet 1024x768", styles: { width: "1024px", height: "768px" } },
  mobile: { name: "Mobile 390x844", styles: { width: "390px", height: "844px" } },
  smallMobile: { name: "Small Mobile 360x800", styles: { width: "360px", height: "800px" } },
} as const;
```

- [ ] **Step 2: Create an isolated provider wrapper**

`frontend/src/storybook/story-providers.tsx`:

```tsx
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../providers/theme-provider";

export function StoryProviders({ children, theme }: { children: React.ReactNode; theme: "dark" | "light" }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 0,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider forcedTheme={theme}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 3: Configure Storybook**

`frontend/.storybook/main.ts`:

```ts
import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../public"],
  framework: { name: "@storybook/nextjs-vite", options: {} },
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "msw-storybook-addon",
    { name: "@storybook/addon-mcp", options: { endpoint: "/mcp" } },
  ],
};

export default config;
```

Preserve any additional version-specific Vitest configuration generated by the installed Storybook version.

- [ ] **Step 4: Configure global preview behavior**

`frontend/.storybook/preview.tsx` must:

1. import `../src/styles/globals.css`;
2. register `mswLoader()` from `msw-storybook-addon/csf3`;
3. wrap stories with `StoryProviders`;
4. expose a `theme` global with only `dark` and `light`;
5. set `nextjs.appDirectory: true` globally;
6. use `canonicalViewports`;
7. start with `a11y.test: "todo"` so existing violations are visible but do not block baseline capture.

The theme decorator must pass `forcedTheme="dark"` or `forcedTheme="light"` through the existing application `ThemeProvider`, not toggle ad hoc CSS classes itself.

- [ ] **Step 5: Smoke-test Storybook**

```bash
npm --prefix frontend run storybook:build
```

Then run Storybook locally and verify:

```bash
curl -I http://127.0.0.1:6006/mcp
```

Expected: static build succeeds and the development MCP endpoint is not a Storybook 404.

- [ ] **Step 6: Commit**

```bash
git add frontend/.storybook frontend/src/storybook frontend/tsconfig.json
git commit -m "feat: configure Storybook app runtime"
```

---

### Task 3: Add deterministic MSW fixtures using existing application contracts

**Files:**
- Create: `frontend/public/mockServiceWorker.js` through MSW CLI
- Create: `frontend/src/mocks/handlers.ts`
- Create: `frontend/src/mocks/handlers/core-api.ts`
- Create: `frontend/src/mocks/handlers/customer-analytics.ts`
- Create: `frontend/src/mocks/fixtures/visual-states.ts`
- Modify: `frontend/.storybook/preview.tsx`

**Interfaces:**
- Consumes existing request and fixture code from:
  - `frontend/src/lib/api/hooks.ts`
  - `frontend/src/lib/api/static-fixtures.ts`
  - `frontend/src/features/customer-analytics/query.ts`
  - `frontend/src/features/customer-analytics/hooks/useBiExports.ts`
  - `frontend/src/features/customer-analytics/hooks/useLtvBySegment.ts`
  - `frontend/src/features/customer-analytics/hooks/useSupportImpact.ts`
  - `frontend/src/features/customer-analytics/hooks/useCustomerHealth.ts`
  - `frontend/src/features/customer-analytics/hooks/useRetentionCohorts.ts`
  - `frontend/src/features/customer-analytics/hooks/useChurnRiskAccounts.ts`
  - `frontend/src/features/customer-analytics/hooks/useSegmentPerformance.ts`
  - `frontend/src/features/customer-analytics/hooks/useExpansionOpportunities.ts`
  - `frontend/src/features/customer-analytics/hooks/useCustomerAnalyticsOverview.ts`
- Produces `defaultHandlers` plus explicit error/loading/state overrides used by stories.

- [ ] **Step 1: Generate the MSW worker**

```bash
cd frontend
npx msw init ./public --save
```

Expected: `frontend/public/mockServiceWorker.js` exists.

- [ ] **Step 2: Lock the core API routes from the actual hooks**

`core-api.ts` must cover the literal routes already used in `frontend/src/lib/api/hooks.ts`:

```text
GET  http://localhost:8000/api/calls
GET  http://localhost:8000/api/calls/:callId
GET  http://localhost:8000/api/metrics
GET  http://localhost:8000/api/agents
GET  http://localhost:8000/api/settings/manifest
POST http://localhost:8000/api/settings/refresh
```

Use MSW 2 `http` and `HttpResponse`.

- [ ] **Step 3: Reuse existing core fixtures rather than inventing API payloads**

Import these existing exports from `frontend/src/lib/api/static-fixtures.ts`:

```ts
getStaticCalls
g etStaticCall
getStaticMetrics
getStaticAgents
staticManifest
```

When implementing, correct the accidental whitespace above so the imported identifier is exactly `getStaticCall`.

Handler behavior:

- `/api/calls`: return `getStaticCalls()` and honor URL query parameters used by `CallsQuery`.
- `/api/calls/:callId`: return `getStaticCall(callId)` when found; otherwise return status 404 with `{ detail: "Call not found" }`.
- `/api/metrics`: return `getStaticMetrics()`.
- `/api/agents`: return `getStaticAgents()`.
- `/api/settings/manifest`: return `{ data: staticManifest }` because the production hook reads `response.data`.
- `/api/settings/refresh`: return `{ data: staticManifest }` for the deterministic Storybook baseline.

- [ ] **Step 4: Extract customer-analytics routes mechanically from the existing hook files**

Run:

```bash
rg 'buildCustomerAnalyticsQuery' frontend/src/features/customer-analytics/hooks -n
```

For each call, copy the literal first `path` argument into `customer-analytics.ts`. Use the exact `staticValue` argument already passed by that same hook as the MSW success payload. This guarantees the handler payload matches the UI contract without duplicating schema definitions or fabricating fields.

After implementation, run:

```bash
rg 'buildCustomerAnalyticsQuery' frontend/src/features/customer-analytics/hooks -n > /tmp/customer-query-routes.txt
rg 'http\.(get|post)' frontend/src/mocks/handlers/customer-analytics.ts -n > /tmp/customer-msw-routes.txt
```

Review both files side by side and require one MSW handler for every customer-analytics network route used by the hooks.

- [ ] **Step 5: Add visual stress-state helpers without changing schemas**

`frontend/src/mocks/fixtures/visual-states.ts` may transform existing fixture objects only through type-safe copies. It must provide named helpers for:

```text
empty
sparse
extremeNumeric
longLabels
highRisk
noRisk
```

Rules:

- `empty` keeps the exact response object shape and empties only collections/counts that the schema allows.
- `sparse` takes the first one or two existing records rather than constructing unknown fields.
- `extremeNumeric` clones existing records and multiplies existing numeric display fields only.
- `longLabels` replaces existing string labels/names only, preserving every other field.
- `highRisk` and `noRisk` mutate only existing risk/status fields present in the customer-analytics fixture types.

Do not use `as any` to force fixtures through TypeScript.

- [ ] **Step 6: Register `defaultHandlers` globally**

`frontend/src/mocks/handlers.ts` composes `coreApiHandlers` and `customerAnalyticsHandlers`. `frontend/.storybook/preview.tsx` registers them in `parameters.msw.handlers`.

- [ ] **Step 7: Verify Storybook still builds**

```bash
npm --prefix frontend run storybook:build
```

Expected: build exits 0 with MSW enabled.

- [ ] **Step 8: Commit**

```bash
git add frontend/public/mockServiceWorker.js frontend/src/mocks frontend/.storybook/preview.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add deterministic Storybook API mocks"
```

---

### Task 4: Create the canonical component census before broad story authoring

**Files:**
- Create: `docs/design-audit/component-census.md`

**Interfaces:**
- Produces the authoritative list of what belongs in Storybook and what does not.

- [ ] **Step 1: Inventory visually meaningful exports**

Scan:

```bash
rg '^export (function|const|class)' frontend/src/figma frontend/src/features frontend/src/lib/viz -n
```

- [ ] **Step 2: Create the census table with these exact columns**

```markdown
| Surface | Source file | Export/component | Category | Reused by | Story required | Network-dependent | Baseline states |
| --- | --- | --- | --- | --- | --- | --- | --- |
```

Allowed categories:

```text
foundation
primitive
data-display
feedback
pattern
navigation
chart
feature-composition
```

At minimum include existing `KpiCard`, `StatusBadge`, `Chip`, `SectionCard`, `EmptyState`, `LoadingState`, `ErrorState`, `InsightItem`, filters, shell/navigation, every reusable chart found under `frontend/src/lib/viz`, and every major feature page.

- [ ] **Step 3: Apply the inclusion rule**

A story is required when an export is visually meaningful and at least one of these is true:

- reused by multiple screens;
- represents a design-system primitive;
- represents a reusable chart/data-display pattern;
- contains a meaningful loading/empty/error state;
- is a major page composition.

Internal pure helpers with no visual output do not get stories.

- [ ] **Step 4: Commit**

```bash
git add docs/design-audit/component-census.md
git commit -m "docs: inventory canonical frontend components"
```

---

### Task 5: Put canonical primitives and patterns into Storybook

**Files:**
- Create story files beside components identified in Task 4
- Expected initial locations include `frontend/src/figma/` and reusable visualization folders identified by the census

**Interfaces:**
- Consumes the census.
- Produces baseline stories without changing production appearance.

- [ ] **Step 1: Add typed CSF stories for `KpiCard`**

Required presentation stress cases:

```ts
const cases = {
  Default: { label: "Net Revenue Retention", value: "104.8%", delta: 2.3, hint: "Trailing 90 days" },
  Negative: { label: "At-Risk ARR", value: "$841K", delta: -12.4, hint: "Accounts above risk threshold" },
  Neutral: { label: "Open Escalations", value: 17, delta: 0 },
  LongLabel: { label: "Enterprise accounts with expansion readiness signals", value: "$12.4M", delta: 18.7 },
  HugeValue: { label: "Lifetime Contract Value", value: "$987,492,830.42", delta: 128.7 },
  NoDelta: { label: "Active Customers", value: "1,284" },
};
```

These are visual stress values only and do not represent real business metrics.

- [ ] **Step 2: Cover status and feedback primitives**

Stories must cover:

- every existing `Status` value accepted by `StatusBadge`;
- `InsightItem` severities `info`, `warn`, and `critical`;
- `EmptyState`;
- `LoadingState`;
- `ErrorState` with retry action when the component supports it.

- [ ] **Step 3: Cover filters, navigation, and reusable chart components**

For each census item, create only states its existing API supports. Use Storybook Next.js navigation parameters for pathname/router state instead of editing production routing code.

- [ ] **Step 4: Verify dark/light rendering**

Every canonical primitive must render under both global themes using the toolbar. Do not duplicate separate Dark/Light story files when the global theme control provides the same coverage.

- [ ] **Step 5: Build Storybook**

```bash
npm --prefix frontend run storybook:build
```

Expected: all primitive/pattern stories compile.

- [ ] **Step 6: Commit**

```bash
git add frontend/src docs/design-audit/component-census.md
git commit -m "test: expose canonical UI primitives in Storybook"
```

---

### Task 6: Put every major page composition into Storybook with MSW states

**Files:**
- Create: `frontend/src/figma/pages/dashboard.stories.tsx`
- Create: `frontend/src/figma/pages/calls.stories.tsx`
- Create: `frontend/src/figma/pages/call-detail.stories.tsx`
- Create: `frontend/src/figma/pages/agents.stories.tsx`
- Create: `frontend/src/figma/pages/metrics.stories.tsx`
- Create: `frontend/src/figma/pages/customer-analytics.stories.tsx`
- Create: `frontend/src/figma/pages/settings.stories.tsx`
- Modify: MSW handlers/fixture transforms only when a page reveals an uncovered real request

**Interfaces:**
- Produces deterministic screen-level stories for screenshot capture.

- [ ] **Step 1: Dashboard states**

Create stories named:

```text
Normal
Sparse
HighRisk
Loading
Empty
Error
```

Use per-story MSW overrides. `Loading` delays only that story's requests. `Error` returns status 500 with `{ detail: "Storybook forced error" }` on the exact requests the page performs.

- [ ] **Step 2: Calls states**

Create:

```text
Normal
Empty
LongContent
Error
```

`LongContent` must derive from an existing call fixture and replace only existing text/string fields.

- [ ] **Step 3: Call Detail states**

Create:

```text
Normal
LongContent
NotFound
Error
```

`NotFound` returns the same 404 envelope used by Task 3.

- [ ] **Step 4: Agents states**

Create:

```text
Normal
MixedPerformance
Empty
Error
```

Derive `MixedPerformance` by cloning existing `AgentStats` records and changing only existing numeric performance fields.

- [ ] **Step 5: Metrics states**

Create:

```text
Normal
Sparse
ZeroHeavy
ExtremeNumeric
Error
```

All transforms must begin from `getStaticMetrics()` so the response shape remains exact.

- [ ] **Step 6: Customer Analytics states**

Create:

```text
Normal
HighRisk
NoRisk
Sparse
Empty
Error
```

Use the customer-analytics static values already imported by its hooks and the Task 3 transform helpers.

- [ ] **Step 7: Settings states**

Create `Default` plus only existing toggled/interactive states exposed by the current settings component. Do not invent new settings.

- [ ] **Step 8: Verify the Storybook index contains all seven pages**

```bash
npm --prefix frontend run storybook:build
```

Serve the static output and inspect `index.json`; require entries for Dashboard, Calls, Call Detail, Agents, Metrics, Customer Analytics, and Settings.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/figma/pages frontend/src/mocks
git commit -m "test: add canonical Storybook page states"
```

---

### Task 7: Enable Storybook component tests, accessibility visibility, and MCP

**Files:**
- Modify: Storybook config/setup generated by Tasks 1-2
- Modify: selected stories with interaction tests

**Interfaces:**
- Produces runnable component/interactions tests and Storybook MCP at `/mcp`.

- [ ] **Step 1: Complete the installed Storybook Vitest integration**

Use the installed Storybook CLI/addon-generated configuration for the exact Storybook version. Do not hand-copy a configuration from a different major version when the addon can generate the supported setup.

- [ ] **Step 2: Add interaction tests only to genuinely interactive stories**

At minimum:

- one filter/chip interaction must click an accessible control and assert its visible or ARIA state changed;
- one navigation/shell interaction must activate an existing navigation control and assert the rendered/path state changed.

Do not add tests that merely call `click()` without asserting the result.

- [ ] **Step 3: Run Storybook tests**

```bash
npm --prefix frontend run storybook:test
```

Expected: Storybook component/interactions test project passes; accessibility findings are reported under the initial `todo` policy.

- [ ] **Step 4: Verify MCP**

With Storybook running:

```bash
curl -I http://127.0.0.1:6006/mcp
```

Expected: Storybook MCP responds rather than returning Storybook's not-found page.

- [ ] **Step 5: Commit**

```bash
git add frontend/.storybook frontend/src
git commit -m "test: enable Storybook interaction and accessibility checks"
```

---

### Task 8: Configure Playwright Test and local agent CLI support

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/tests/helpers/storybook.ts`

**Interfaces:**
- Produces two Playwright projects: `storybook-chromium` and `app-chromium`.

- [ ] **Step 1: Install only Chromium**

```bash
npx --prefix frontend playwright install chromium
```

- [ ] **Step 2: Configure Playwright**

Required config behavior:

```text
testDir: ./tests
outputDir: ./test-results
HTML report: ./playwright-report
trace: retain-on-failure
failure screenshot: enabled
video: off
screenshot comparison animations: disabled
screenshot comparison caret: hidden
screenshot scale: css
```

Projects:

```text
storybook-chromium
  testMatch: tests/visual/**/*.spec.ts
  baseURL: http://127.0.0.1:6006

app-chromium
  testMatch: tests/e2e/**/*.spec.ts
  baseURL: http://127.0.0.1:3000
```

Configure Playwright `webServer` entries to start Storybook on 6006 and the existing Next.js dev server on 3000. Reuse existing servers locally and start fresh in CI.

- [ ] **Step 3: Add the Storybook iframe helper**

`frontend/tests/helpers/storybook.ts`:

```ts
export function storyUrl(storyId: string, globals: Record<string, string> = {}) {
  const url = new URL("/iframe.html", "http://127.0.0.1:6006");
  url.searchParams.set("id", storyId);
  url.searchParams.set("viewMode", "story");
  const encodedGlobals = Object.entries(globals)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
  if (encodedGlobals) url.searchParams.set("globals", encodedGlobals);
  return `${url.pathname}${url.search}`;
}
```

- [ ] **Step 4: Verify CLI availability for coding agents**

```bash
npm --prefix frontend run playwright:cli:version
```

Do not commit `.playwright-cli/` session output.

- [ ] **Step 5: Commit**

```bash
git add frontend/playwright.config.ts frontend/tests/helpers/storybook.ts
git commit -m "test: configure Playwright visual projects"
```

---

### Task 9: Capture reproducible Storybook visual-regression baselines

**Files:**
- Create: `frontend/tests/visual/primitives.visual.spec.ts`
- Create: `frontend/tests/visual/pages.visual.spec.ts`
- Create/update: Playwright snapshot directories generated by `toHaveScreenshot()`

**Interfaces:**
- Consumes exact Storybook IDs from generated `index.json`.
- Produces committed visual baseline PNGs.

- [ ] **Step 1: Read actual Storybook story IDs**

Start/build Storybook and inspect:

```text
http://127.0.0.1:6006/index.json
```

Copy generated IDs into table-driven tests. Do not guess IDs from filenames.

- [ ] **Step 2: Primitive screenshot matrix**

Capture canonical data-display/feedback/navigation primitives under:

```text
dark theme, normal width
light theme, normal width
dark theme, narrow width for components with wrapping risk
```

Assert `#storybook-root` is visible before screenshotting.

- [ ] **Step 3: Page screenshot matrix**

For each page's `Normal` state:

```text
dark: 1440x1000, 1280x900, 1024x768, 390x844, 360x800
light: 1280x900, 390x844
```

For non-normal states:

```text
Sparse/HighRisk/Error/Empty: 1280x900 dark
LongContent/ExtremeNumeric: 390x844 dark when relevant
```

This is intentionally not every state multiplied by every viewport.

- [ ] **Step 4: Generate baseline snapshots intentionally**

```bash
npm --prefix frontend run test:visual:update
```

- [ ] **Step 5: Immediately prove they reproduce**

```bash
npm --prefix frontend run test:visual
```

Expected: PASS without update mode.

- [ ] **Step 6: Commit tests and snapshot PNGs**

```bash
git add frontend/tests/visual
git commit -m "test: capture baseline Storybook visual regressions"
```

---

### Task 10: Generate clean AI-review screenshots and a deterministic manifest

**Files:**
- Create: `frontend/tests/visual/evidence-manifest.ts`
- Create: `frontend/tests/helpers/visual-evidence.ts`
- Modify: `frontend/tests/visual/pages.visual.spec.ts`
- Generated only: `frontend/visual-evidence/**`

**Interfaces:**
- Produces human/AI-friendly PNGs separate from Playwright's internal report layout.

- [ ] **Step 1: Define the manifest record**

```ts
export type VisualEvidenceRecord = {
  surface: string;
  storyId: string;
  state: string;
  theme: "dark" | "light";
  viewport: string;
  width: number;
  height: number;
  file: string;
};
```

- [ ] **Step 2: Implement deterministic evidence paths**

Use:

```text
visual-evidence/<viewport>/<surface>-<state>-<theme>.png
```

Write `visual-evidence/manifest.json`. Before serializing, sort records by:

```text
surface
state
theme
viewport
```

Use `JSON.stringify(records, null, 2)`.

- [ ] **Step 3: Capture clean screenshots**

Capture the same high-value page matrix as Task 9 with `fullPage: true`. Wait for `#storybook-root` and for normal/error/empty states to reach their expected visible state before capture. Do not use arbitrary sleeps when a visible state can be awaited.

- [ ] **Step 4: Verify evidence exists and remains ignored**

```bash
rm -rf frontend/visual-evidence
npm --prefix frontend run test:visual
node -e "const m=require('./frontend/visual-evidence/manifest.json'); if(!Array.isArray(m)||m.length===0) process.exit(1); console.log(m.length)"
git status --short frontend/visual-evidence
```

Expected: non-zero manifest count and no untracked evidence files.

- [ ] **Step 5: Commit code only**

```bash
git add frontend/tests/visual frontend/tests/helpers/visual-evidence.ts
git commit -m "test: generate AI-review visual evidence manifest"
```

---

### Task 11: Add a small critical real-app E2E suite

**Files:**
- Create: `frontend/tests/e2e/app-smoke.spec.ts`

**Interfaces:**
- Verifies Storybook coverage has not diverged from real routing/provider composition.

- [ ] **Step 1: Test the existing route matrix**

```ts
const routes = [
  "/dashboard",
  "/calls",
  "/agents",
  "/metrics",
  "/customer-analytics",
  "/settings",
];
```

For each route:

1. navigate to it;
2. assert the page body contains meaningful app content;
3. assert no Next.js development error overlay is present;
4. assert one route-specific existing heading, landmark, or navigation label is visible.

Do not assert Tailwind class strings.

- [ ] **Step 2: Test one real navigation path**

Start at `/dashboard`, activate the existing Calls navigation control by accessible role/name, assert the URL becomes the Calls route, then assert meaningful Calls content is visible.

- [ ] **Step 3: Run E2E**

```bash
npm --prefix frontend run test:e2e
```

Expected: PASS in Chromium.

- [ ] **Step 4: Commit**

```bash
git add frontend/tests/e2e/app-smoke.spec.ts
git commit -m "test: add critical app Playwright smoke coverage"
```

---

### Task 12: Extend the existing GitHub Actions pipeline and publish visual evidence

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Preserves existing backend -> frontend schema/build chain.
- Produces artifacts: `storybook-static`, `visual-evidence`, `playwright-report`, `playwright-test-results`.

- [ ] **Step 1: Keep all existing frontend quality gates**

Do not remove:

```text
OpenAPI artifact download
api:check
lint
test
Next.js build
GitHub Pages publishing behavior
```

- [ ] **Step 2: Install Chromium in the frontend job**

```yaml
      - name: Install Playwright Chromium
        run: npx --prefix frontend playwright install --with-deps chromium
```

- [ ] **Step 3: Add Storybook and Playwright gates**

```yaml
      - name: Build Storybook
        run: npm --prefix frontend run storybook:build

      - name: Run Storybook component tests
        run: npm --prefix frontend run storybook:test

      - name: Run Storybook visual regression tests
        run: npm --prefix frontend run test:visual

      - name: Run critical app E2E tests
        run: npm --prefix frontend run test:e2e
```

- [ ] **Step 4: Upload Storybook and evidence even after failures**

```yaml
      - name: Upload Storybook static build
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: storybook-static
          path: frontend/storybook-static
          if-no-files-found: warn

      - name: Upload visual evidence
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: visual-evidence
          path: frontend/visual-evidence
          if-no-files-found: warn

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report
          if-no-files-found: warn

      - name: Upload Playwright test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-test-results
          path: frontend/test-results
          if-no-files-found: warn
```

- [ ] **Step 5: Run the CI-equivalent frontend sequence locally**

```bash
npm --prefix frontend ci
npm --prefix frontend run api:check
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
npm --prefix frontend run storybook:build
npm --prefix frontend run storybook:test
npx --prefix frontend playwright install chromium
npm --prefix frontend run test:visual
npm --prefix frontend run test:e2e
```

Expected: all mandatory gates pass before the workflow edit is committed.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: publish Storybook Playwright visual evidence"
```

---

### Task 13: Lock the agent workflow and first rendered baseline

**Files:**
- Modify: `AGENTS.md`
- Create: `docs/design-audit/visual-baseline.md`
- Modify: `frontend/.storybook/preview.tsx` only if accessibility can be promoted to blocking after review

**Interfaces:**
- Produces the hard boundary between foundation work and actual redesign work.

- [ ] **Step 1: Add frontend visual rules to `AGENTS.md`**

Add these rules:

```markdown
## Frontend visual workflow

- Treat rendered Storybook and Playwright screenshots as the visual source of truth for frontend redesign work.
- Before changing a canonical UI component, inspect its Storybook stories and preserve or intentionally update its state coverage.
- New visually meaningful reusable components require Storybook stories.
- Network-dependent stories use MSW at the HTTP boundary.
- Run `npm --prefix frontend run test:visual` after visual changes and inspect diffs/screenshots rather than trusting source-only reasoning.
- Run `npm --prefix frontend run test:e2e` for changes affecting routing, providers, or cross-page composition.
- Storybook MCP at `/mcp` is an optional agent accelerator; the repository must remain testable without an MCP client connected.
- Do not approve a redesign solely because builds/tests pass. Review desktop, tablet, and mobile rendered evidence.
```

- [ ] **Step 2: Push the branch and require a complete CI run**

The CI run must produce the `visual-evidence` artifact before the foundation is considered complete.

- [ ] **Step 3: Download and inspect the first evidence artifact**

Use GitHub Actions artifact tooling to retrieve `visual-evidence`. Confirm its `manifest.json` matches the actual files and inspect every major page at desktop, tablet, and mobile.

- [ ] **Step 4: Create `docs/design-audit/visual-baseline.md`**

Use these tables:

```markdown
# Visual Baseline

Branch: `storybook-playwright-redesign-foundation`
Baseline main SHA: `f955a6e5598300a702d0517ab9a7eba3a569c209`

## Evidence matrix
| Surface | State | Theme | Viewport | Artifact file | Render status |
| --- | --- | --- | --- | --- | --- |

## Existing defects observed
| ID | Surface | Viewport | Observation | Severity | Evidence file |
| --- | --- | --- | --- | --- | --- |
```

Allowed `Render status` values: `pass`, `warning`, `broken`.

Do not fix existing design defects in this task unless they prevent Storybook/Playwright from functioning. Record them as baseline evidence for the redesign phase.

- [ ] **Step 5: Decide accessibility enforcement from evidence, not by hiding violations**

If canonical stories have zero accessibility violations, change global `a11y.test` from `"todo"` to `"error"` and rerun Storybook tests.

If violations remain, keep `"todo"`, list each existing violation category in `visual-baseline.md`, and carry it into the redesign backlog. Do not globally disable axe rules merely to make CI green.

- [ ] **Step 6: Run final verification**

```bash
npm --prefix frontend run api:check
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
npm --prefix frontend run storybook:build
npm --prefix frontend run storybook:test
npm --prefix frontend run test:visual
npm --prefix frontend run test:e2e
```

- [ ] **Step 7: Verify no transient artifacts are staged**

```bash
git status --short
```

Do not stage:

```text
frontend/storybook-static/
frontend/playwright-report/
frontend/test-results/
frontend/visual-evidence/
frontend/.playwright-cli/
```

- [ ] **Step 8: Commit**

```bash
git add AGENTS.md docs/design-audit/visual-baseline.md frontend/.storybook/preview.tsx
git commit -m "docs: lock frontend visual redesign baseline"
```

---

## Completion Gate

Do not start redesign implementation until every statement below is true:

- Storybook runs on port 6006 and builds statically.
- Storybook imports the app's actual global CSS and uses the existing theme semantics.
- Storybook query state is isolated between stories.
- The canonical component census is committed.
- Every canonical reusable visual component identified by the census has appropriate story coverage.
- Dashboard, Calls, Call Detail, Agents, Metrics, Customer Analytics, and Settings have screen-level stories.
- Network-dependent stories are deterministic through MSW using existing application contracts/static fixtures.
- Dark/light themes and the five canonical viewports are available.
- Storybook interaction/component tests run.
- Accessibility findings are visible and either blocking or explicitly baselined.
- Storybook MCP responds at `/mcp` during development.
- `@playwright/cli` is available locally to coding agents.
- Playwright Test owns deterministic Chromium screenshot baselines.
- Clean AI-review PNGs and `manifest.json` are generated separately from regression snapshots.
- Real-app route/navigation smoke tests pass.
- GitHub Actions uploads Storybook, visual evidence, Playwright reports, and test results even when visual tests fail.
- `AGENTS.md` describes the visual workflow for future agents.
- `docs/design-audit/visual-baseline.md` indexes the first actual rendered evidence and records existing defects.
- No visual redesign has been implemented yet.

The next project phase begins from that frozen evidence baseline: visual audit -> redesign proposal -> token/primitives redesign -> chart/data-display redesign -> patterns/navigation -> page compositions -> responsive/motion polish -> final Playwright verification.