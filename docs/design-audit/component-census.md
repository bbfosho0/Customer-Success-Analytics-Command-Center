# Frontend Component Census

## Purpose

This census defines the canonical UI surfaces that Storybook and visual QA must cover before any redesign work begins. It inventories the existing application rather than introducing replacement components.

## Foundations

- Theme tokens and CSS variables in `frontend/src/styles/`
- Tailwind configuration in `frontend/tailwind.config.ts`
- App theme provider and query provider
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

Storybook coverage: `frontend/src/figma/shell.stories.tsx` plus full page stories.

## Filters and Controls

Source: `frontend/src/figma/filters.tsx`.

- global search
- region, issue, status, and date filters
- active filter/count states

Storybook coverage: `frontend/src/figma/filters.stories.tsx`, including an interaction test for search input state.

## Data Display and Charts

Charts currently live inside the canonical page compositions instead of a separate chart-component package. They remain source-of-truth page elements until a future redesign proves that extraction improves reuse.

Covered through page stories:

- KPI grids
- call tables and issue breakdowns
- agent performance display
- volume, region, retention, LTV, churn-risk, and health visualizations
- manifest metadata

## Feature Compositions and Pages

Canonical page modules under `frontend/src/figma/pages/`:

- `DashboardPage`
- `CallsPage`
- `CallDetailPage`
- `AgentsPage`
- `MetricsPage`
- `CustomerAnalyticsPage`
- `SettingsPage`

Each page has a Storybook entry. Network-backed pages include deterministic normal, loading, empty/error, stress, theme, or viewport variants where those states are meaningful.

## Mock Boundary

MSW handlers under `frontend/src/mocks/` intercept the same FastAPI request paths used by the application. Existing typed/static fixtures are reused rather than duplicated. Story-specific overrides live in `frontend/src/mocks/fixtures/visual-states.ts`.

## Story Inclusion Rule

Add stories for components that are visually meaningful, reusable, part of the design system, a principal application state, or a full-screen composition. Do not create stories for every helper function or internal calculation.

## Redesign Boundary

This census records the existing UI. It does not authorize visual redesign, component replacement, framework migration, or copied third-party component dumps. Visual changes begin only after the baseline screenshot audit is reviewed.
