# Frontend Component Census

## Purpose

This census defines the canonical UI surfaces Storybook and visual QA cover before production redesign work begins. It inventories the application, records the intentionally isolated redesign surfaces, and distinguishes full-page coverage from private implementation details.

## Foundations

- Theme tokens and CSS variables in `frontend/src/styles/`
- Tailwind configuration in `frontend/tailwind.config.ts`
- Actual app theme provider and query provider in Storybook
- Global Storybook theme toolbar with `dark` and `light`
- Canonical Storybook viewports: 1440x1000, 1280x900, 1024x768, 390x844, 360x800

## Primitives

Source: `frontend/src/figma/primitives.tsx`

- `KpiCard`
- `StatusBadge`
- `Chip`
- `SectionCard`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `InsightItem`

Storybook coverage: `frontend/src/figma/primitives.stories.tsx`.

## Navigation and Shell

Source: `frontend/src/figma/shell.tsx` and `frontend/src/figma/figma-shell.tsx`.

- page header
- sidebar and navigation hierarchy
- page shell/content frame
- theme/runtime controls

Storybook coverage: `frontend/src/figma/shell.stories.tsx` plus full-page stories.

## Filters and Controls

Source: `frontend/src/figma/filters.tsx`.

- global search
- region, issue, status, and date filters
- active filter/count states
- reset state

Storybook coverage: `frontend/src/figma/filters.stories.tsx`, including interaction coverage for search state, plus the redesign workbench.

## Data Display and Charts

Actual Recharts implementations currently remain inside canonical page compositions instead of being extracted into a parallel chart-component package. They remain source-of-truth page elements until the redesign proves that extraction improves reuse.

Full-page stories cover:

- KPI grids
- call tables and issue breakdowns
- agent performance display
- call volume and forecast
- region performance
- retention, LTV, churn-risk, and health visualizations
- manifest metadata

The redesign workbench supplements this with isolated **layout, hierarchy, density, severity, and table patterns**. Its chart blocks are redesign-reference surfaces inside the real `SectionCard` system; they do not pretend to be separate production Recharts components.

## Feature Compositions and Pages

Canonical page modules under `frontend/src/figma/pages/`:

- `DashboardPage`
- `CallsPage`
- `CallDetailPage`
- `AgentsPage`
- `MetricsPage`
- `CustomerAnalyticsPage`
- `SettingsPage`

All seven pages have Storybook entries. Network-backed pages include deterministic normal, loading, empty/error, stress, theme, or viewport variants where those states are meaningful.

## Redesign Workbench

Source: `frontend/src/figma/redesign-workbench.stories.tsx`.

Storybook group: `Redesign Workbench/Patterns`.

The workbench adds an intentionally isolated surface for the visually meaningful patterns we are likely to change during redesign:

- filter toolbar and active-filter state
- four-card primary KPI matrix
- dominant-vs-secondary analytics hierarchy
- compact region-comparison density
- priority insight severity and information hierarchy
- loading / empty / error treatments
- dense operational table behavior
- mobile-density behavior

Stories include:

- `AllPatterns`
- `FiltersAndControls`
- `MetricsAndCharts`
- `TablesAndSignals`
- `MobileDensity`
- `AllPatternsLight`

This is a workbench, not a replacement implementation. It reuses the actual existing primitives and controls wherever those boundaries already exist and keeps page-owned visualizations page-owned.

## Dark and Light Theme Verification

Storybook's global theme toolbar applies the real application `ThemeProvider` to every story, so all canonical stories and workbench stories can be switched between dark and light without maintaining duplicate component implementations.

`frontend/tests/visual/workbench.visual.spec.ts` adds an explicit automated check that:

- the complete workbench renders in forced dark theme
- the same workbench renders in forced light theme
- the computed theme surface actually changes between themes
- the mobile-density workbench renders at the canonical 390x844 viewport

This supplements the existing light/dark page-level visual baselines.

## Mock Boundary

MSW handlers under `frontend/src/mocks/` intercept the same FastAPI request paths used by the application. Existing typed/static fixtures are reused rather than duplicated. Story-specific overrides live in `frontend/src/mocks/fixtures/visual-states.ts`.

## Story Inclusion Rule

Storybook is expected to cover components and compositions that are visually meaningful, reusable, part of the design system, a principal application state, or a full-screen composition.

It is **not** expected to create a separate story for every private helper, calculation, hook, or implementation-only function. Page-owned charts and local compositions remain valid Storybook coverage when independent extraction would create duplicate or artificial architecture.

## Readiness Result

The redesign foundation now has:

- all seven canonical application screens in Storybook
- reusable primitives, shell, and filtering controls isolated
- deterministic page states through MSW
- a dedicated redesign workbench for high-value visual patterns
- global dark/light switching through the actual theme provider
- explicit automated dark/light workbench verification
- responsive full-page visual regression coverage at desktop, compact desktop/tablet, and phone widths

This is sufficient to begin production redesign in deliberate slices while continuing to add a dedicated story whenever a newly extracted reusable production component becomes visually significant.

## Redesign Boundary

The baseline has been captured and audited, and the redesign workbench is now established. This census does not itself alter production UI. Production visual changes should be implemented as subsequent slices and verified against Storybook, MSW, and Playwright as they land.