# Parallel Storybook Redesign Design

Date: 2026-08-21
Repository: `bbfosho0/Customer-Success-Analytics-Command-Center`
Branch: `storybook-playwright-redesign-foundation`
Related PR: `#13`
Status: approved architecture, implementation not started

## Purpose

Build the visual redesign as a parallel, executable Storybook system while preserving the current production UI as a stable canonical reference.

The redesign must not overwrite, restyle, or gradually mutate the existing production-backed Storybook surfaces during exploration. Instead, Storybook will expose two clearly separated top-level trees:

```text
Canonical/
Redesign/
```

`Canonical` is the current production/reference system. `Redesign` is the new design system and page implementation built against the approved responsive wireframes.

The redesign is promoted into production only after all 13 approved page/view rows have passed visual review, deterministic Storybook state coverage, accessibility checks, and Playwright visual QA.

## Approved architectural decision

Use a parallel redesign system.

Do not refactor the canonical UI into shadcn in place. Do not fork a complete 21st.dev dashboard template. Do not use Storybook as a disconnected mock design source.

The current React implementation remains the source of truth for production behavior. Storybook remains the executable design and visual QA environment.

## Repository constraints

The existing frontend stack remains in place:

- Next.js 14.2.7
- React 18.3.1
- TypeScript 5.6.3
- Tailwind CSS 3.4.13
- Recharts 3.8.1
- Lucide React
- next-themes
- React Query
- Zustand
- Storybook 10.5
- MSW
- Vitest
- Playwright

There is no framework migration in this redesign.

Do not migrate to Tailwind 4, a newer Next.js major version, another charting library, or a different application router architecture as part of the visual redesign.

## Current baseline

Current canonical visual source lives primarily under:

```text
frontend/src/figma/
```

Existing Storybook groups include:

```text
Design System/*
Pages/*
Redesign Workbench/*
```

The current production stories already provide deterministic MSW states and meaningful visual stress coverage including normal, sparse, high-risk, loading, empty, error, mobile, and selected light-theme variants.

The redesign must preserve that baseline before creating new visual surfaces.

## Storybook information architecture

### Canonical tree

All existing production-backed stories move under one top-level category without changing component behavior.

```text
Canonical/
  Design System/
    Primitives
    Global Filters
    Application Shell
  Reference/
    Pre-redesign Workbench
  Pages/
    Dashboard
    Calls
    Call Detail
    Agents
    Metrics
    Customer 360
    Settings
```

Canonical story labels preserve current production terminology. The existing production page remains `Agents`. `Agent Intelligence` is the redesign page name and must not be used to imply that the canonical production route was already renamed.

The existing `Redesign Workbench/Patterns` story is not the new redesign system. During the Storybook organization phase it becomes `Canonical/Reference/Pre-redesign Workbench`. It may be removed after equivalent `Redesign/Patterns/*` stories exist and no test depends on it.

No third top-level Storybook category should remain for product UI work.

### Redesign tree

```text
Redesign/
  Foundations/
    Theme
    Typography
    Color
    Spacing and Radius
    Elevation
    Status and Data Colors
  Components/
    Button
    Badge
    Card
    Tabs
    Tooltip
    Popover
    Dropdown Menu
    Sheet
    Drawer
    Command
    Separator
    Scroll Area
    Skeleton
    Empty State
    Table
    Chart Frame
  Patterns/
    KPI Card
    Filter Bar
    Data Table
    Mobile Data Row
    Chart Panel
    Insight Panel
    Ranking Row
    Status Timeline
    Page Header
  Shell/
    Desktop
    Compact Desktop
    Tablet
    Mobile
  Pages/
    Dashboard
    Calls
    Call Detail
    Agent Intelligence
    Metrics/
      Overview
      Volume
      Breakdown
      Regions
    Customer 360/
      Overview
      Churn Risk
      Retention
      LTV
    Settings/
      Manifest
```

Story titles, not a custom Storybook manager extension, provide this separation. A custom Storybook manager tab is out of scope because the native hierarchy gives the required isolation with less maintenance and fewer testing implications.

## Source code isolation

Canonical source remains in place:

```text
frontend/src/figma/
```

New visual implementation goes under:

```text
frontend/src/redesign/
  foundations/
  ui/
  patterns/
  shell/
  pages/
  lib/
```

Recommended responsibility split:

```text
frontend/src/redesign/foundations/
  tokens.ts
  theme.ts

frontend/src/redesign/ui/
  shadcn-derived primitives

frontend/src/redesign/patterns/
  metric-card.tsx
  filter-bar.tsx
  data-table.tsx
  mobile-data-row.tsx
  chart-panel.tsx
  insight-panel.tsx
  status-timeline.tsx

frontend/src/redesign/shell/
  redesign-shell.tsx
  redesign-sidebar.tsx
  redesign-mobile-nav.tsx
  redesign-page-header.tsx

frontend/src/redesign/pages/
  dashboard.tsx
  calls.tsx
  call-detail.tsx
  agent-intelligence.tsx
  metrics.tsx
  customer-360.tsx
  settings.tsx
```

Stories should be colocated with redesign components/pages when practical.

Canonical files must not import from `src/redesign`. Redesign code may reuse stable nonvisual data hooks, API clients, domain types, MSW handlers, query transformers, and existing application utilities when those dependencies do not impose canonical visual primitives.

## shadcn/ui strategy

The repository is not currently initialized as a standard shadcn project. The redesign should add shadcn as a source-code primitive layer, not as an application rewrite.

### Initialization rules

1. Add a single `frontend/components.json` for shadcn tooling.
2. Add a TypeScript alias `@/* -> ./src/*` if needed by the shadcn CLI. Existing canonical imports do not need to be rewritten.
3. Configure generated UI source to land under `frontend/src/redesign/ui`.
4. Use the Radix-based shadcn component family for mature accessibility and predictable component APIs.
5. Keep Tailwind 3 and the existing PostCSS pipeline.
6. Preview shadcn CLI changes with dry-run/diff before modifying an existing file.
7. Never use `--overwrite` without explicit approval.

### Initial shadcn component set

Adopt only primitives that directly support the approved product design:

- Sidebar
- Button
- Card
- Badge
- Tabs
- Tooltip
- Popover
- Dropdown Menu
- Sheet
- Drawer
- Command
- Separator
- Scroll Area
- Skeleton
- Empty
- Table
- Chart wrapper

Do not install a giant component bundle.

### Table architecture

Add TanStack Table as the behavior layer for operational data grids.

Use it for:

- Calls
- Agent Intelligence rankings
- Customer 360 churn-risk account tables
- Customer 360 expansion opportunities
- Settings schema fields
- Settings audit trail

The visual layer remains shadcn/redesign-owned. TanStack handles sorting, filtering, pagination, column visibility, selection, and later virtualization if data volume requires it.

Do not adopt a second table framework.

### Chart architecture

Recharts remains the only chart library.

The shadcn chart wrapper may be used for consistent legend, tooltip, tokens, and container behavior, but it must continue to render through Recharts. Any 21st.dev component that requires a second chart library is reference-only.

## Theme direction

Create one custom redesign theme, internally named `Command Graphite`.

It is influenced by three current 21st.dev shadcn theme families:

- Graphite, structural neutral foundation
- Indigo Mono, primary identity and precise signal color
- Darkmatter, dark-surface depth and contrast reference

Do not copy one community theme verbatim.

### Visual character

The target is a premium operational analytics workspace:

- near-black graphite/navy dark shell
- neutral graphite surfaces
- electric but restrained indigo primary
- teal secondary analytical signal
- semantic emerald, amber, rose status colors
- limited elevation
- crisp borders
- small to medium radii
- dense but readable spacing
- tabular numeric typography
- no decorative glassmorphism
- no neon cyberpunk treatment
- no large gradient hero effects

### Initial token targets

These are implementation starting values and may be tuned during visual QA while preserving their semantic roles.

Light mode:

```text
background: #F6F7FB
foreground: #111827
card: #FFFFFF
muted: #EEF1F6
muted-foreground: #667085
border: #E2E7EF
primary: #4F46E5
primary-foreground: #FFFFFF
accent: #0F766E
accent-foreground: #FFFFFF
destructive: #DC2626
```

Dark mode:

```text
background: #090B10
foreground: #E8ECF3
card: #10151F
popover: #121925
muted: #171E2B
muted-foreground: #8D99AA
border: #222B3A
primary: #818CF8
primary-foreground: #090B10
accent: #2DD4BF
accent-foreground: #07110F
destructive: #FB7185
```

Chart roles:

```text
chart-1: indigo, primary series
chart-2: teal, secondary/positive analytical series
chart-3: amber, warning or attention series
chart-4: cool blue, neutral comparison series
chart-5: rose, negative/escalation series
```

Status color semantics are fixed and may not be reassigned by chart-series position.

### Theme isolation

Canonical `:root` and `.dark` variables currently serve production UI. The redesign must not alter their values during exploration.

Redesign tokens must be scoped under a redesign wrapper, for example:

```text
.redesign-theme
.redesign-theme.dark
```

Storybook Redesign stories render inside this wrapper. Canonical stories continue using the existing global theme variables.

When redesign is formally promoted, the token strategy can be consolidated in a separate production migration step.

## 21st.dev inspiration inventory

21st.dev is a source of composition patterns and selected component anatomy, not a source of application architecture.

### Shell references

#### Dashboard with Collapsible Sidebar, Sonu Kumar

Use:

- collapsible desktop navigation behavior
- fixed shell with independently scrolling main workspace
- clear active-navigation state
- responsive transition from sidebar to mobile overlay/drawer

Do not copy:

- its product-specific content
- direct theme implementation
- any global CSS assumptions

Reference:
https://21st.dev/@uniquesonu/components/dashboard-with-collapsible-sidebar

#### Dashboard Sidebar, Arun Dass

Use:

- narrower navigation proportion
- compact icon/text rhythm
- restrained sidebar density

Reference through the 21st dashboard/sidebar catalog.

#### Efferd Dashboard 2

Use:

- panel spacing
- macro density
- shell-to-content visual proportions

Reference only. Do not adopt its full page composition.

### Metric references

#### Progress Metric Card, Mak VieSAinte

Use:

- one dominant number
- explicit comparison context
- fixed card height through loading and populated states
- optional microtrend only when it explains the KPI
- tabular numerals

Do not place a chart behind every KPI. The chart is optional and should appear only where trend context is important.

Reference:
https://21st.dev/community/components/makviesainte/progress-metric-card/default

### Analytics layout references

#### Analytics Bento, Jatin Yadav

Use:

- unequal panel sizes
- one dominant analytical surface
- supporting diagnostic panels with lower visual weight
- responsive reflow based on importance rather than equal-card symmetry

This is a geometry reference, not a direct component dependency.

### Table references

#### Project Data Table, Ravi Katiyar

Use:

- clean row density
- compact status presentation
- integrated search/filter affordance placement
- hierarchy between primary row identity and secondary metadata

Do not take its Framer Motion row animation dependency.

Reference:
https://21st.dev/community/components/ravikatiyar/project-data-table/default

#### Resizable Table, Isaiah

Use only as a future interaction reference for:

- column resizing
- sorting
- pagination
- export affordances

Do not add `framer-motion` or `react-resizable` in the first redesign phase merely to reproduce this component.

Reference:
https://21st.dev/community/components/isaiahbjork/resizable-table

### Template references

The verified 21st.dev templates are whole-app references only.

#### Shadcn Dashboard and Landing

Useful for:

- shadcn visual consistency across shell, content, and theme
- observing how a complete dashboard keeps primitive styling coherent

Do not import the template into this repository.

Reference:
https://21st.dev/@shadcnstore/templates/shadcn-dashboard-landing

#### Next Shadcn Admin Dashboard

Useful for:

- multiple dashboard layouts
- data-table integration
- theme preset behavior
- admin navigation conventions

Do not import its application structure, auth stack, routing, or page files.

Reference:
https://21st.dev/@arhamkhnz/templates/next-shadcn-admin-dashboard

## Responsive layout contract

The redesign implements the approved v3 wireframe geometry for all 13 screen rows.

Canonical visual QA presets remain:

```text
Desktop XL: 1440 x 1000
Desktop:    1280 x 900
Tablet QA:  1024 x 768
Mobile:      390 x 844
Small:       360 x 800
```

The `Tablet QA` label is retained because the existing Playwright/Storybook baseline uses that name. It is a test-preset name, not the layout-mode boundary.

Implementation behavior follows four layout modes:

```text
Desktop:         >= 1280
Compact desktop: 1024 to 1279
Tablet:           768 to 1023
Mobile:           360 to 639
```

Therefore a 1024px-wide screenshot uses compact-desktop layout behavior even though the existing QA preset is named `Tablet`. This distinction must be preserved in code comments/test naming so the breakpoint contract is unambiguous.

The 640 to 767 range follows the phone-shell behavior and is included in responsive QA even though it is not a separate wireframe column.

Responsive design is recomposition, not uniform shrinking.

Examples:

- sidebar becomes overlay navigation or drawer
- dense tables become compact list rows where appropriate
- filters collapse into sheet/popover controls
- KPI grids change column count and priority
- secondary analytics move below primary surfaces
- low-value metadata is progressively disclosed
- chart labels and legends simplify before horizontal overflow is allowed

## Page implementation contract

Implement redesign pages in this exact order.

### 1. Dashboard

Composition:

- compact filter context
- four primary KPI cards
- dominant call-volume analytical surface
- secondary issue mix
- region performance
- priority insights
- latest calls

Use bento hierarchy without making every panel equal size.

### 2. Calls

Desktop/tablet:

- search and filter toolbar
- TanStack-powered data table
- sticky header where useful
- compact status badges
- pagination

Mobile:

- record rows/cards optimized for scanning
- primary identity first
- status, issue, duration, customer metadata next
- no forced wide desktop table

### 3. Call Detail

Use:

- strong call identity/header
- status and issue metadata
- lifecycle timeline
- operational summary
- transcript/detail surface
- related/similar calls

### 4. Agent Intelligence

This is the redesign name for the current Agents domain.

Use:

- performance ranking
- coaching priorities
- compact comparative metrics
- clear trend/rank change
- mobile ranking rows rather than wide tables

### 5 to 8. Metrics

Maintain four distinct views:

- Overview
- Volume
- Breakdown
- Regions

Do not render them as the same generic card grid with different labels.

Overview emphasizes system health and cross-metric comparison.

Volume emphasizes the primary time-series surface and SLA context.

Breakdown emphasizes category distribution, duration pressure, and automation pilot performance.

Regions emphasizes geographic/region comparison and rank.

### 9 to 12. Customer 360

Maintain four distinct views:

- Overview
- Churn Risk
- Retention
- LTV

Use semantic risk badges, dense account tables where scanning matters, retention heat cells, LTV hierarchy, expansion opportunity rows, and clear recommended actions.

### 13. Settings

Use shadcn-composed cards and tables around the real implementation capabilities:

- runtime mode
- refresh manifest
- dataset manifest
- schema/columns
- audit trail

Do not invent unsupported settings or pipeline operations.

## Story state strategy

### Canonical

Preserve existing deterministic states and story names unless a test-safe Storybook hierarchy rename requires metadata changes.

Existing canonical `Light` stories may remain while baseline tests depend on them. They are regression fixtures, not separate page implementations. They should not be multiplied further.

Existing canonical visual baselines remain valid until intentionally updated.

### Redesign

Each redesigned page receives meaningful deterministic states selected from:

- normal
- loading
- empty
- error
- sparse
- high-risk or critical-heavy
- zero-heavy
- extreme numeric values
- long content
- mixed statuses
- responsive viewport stories where useful

Do not create separate `Light` and `Dark` duplicate page implementations or duplicate Storybook page trees.

Theme is a Storybook global. Redesign light/dark screenshot coverage should be parameterized by Playwright or Storybook globals rather than doubling the page source.

## Accessibility contract

The redesign targets WCAG 2.2 AA for normal product use.

Required rules:

- visible keyboard focus
- no color-only status meaning
- appropriate accessible names on icon buttons
- dialog, sheet, and drawer titles
- semantic table markup for tabular data
- chart data available as a table equivalent or accessible alternate view
- touch targets appropriate for mobile
- no hover-only essential information
- reduced-motion safe behavior

Accessibility findings should become blocking before promotion to production.

## Motion policy

Do not add Framer Motion merely because many 21st.dev components use it.

Phase-one redesign motion is limited to CSS transitions and the interaction behavior supplied by existing accessible primitives.

Allowed motion:

- sidebar collapse
- sheet/drawer open/close
- tab state transition
- subtle hover/focus transitions
- chart update transitions already provided by Recharts where they do not impede testing

Avoid:

- animated KPI numbers as default behavior
- card hover lifts on dense operational tables
- gratuitous entrance animations
- looping decorative motion

A dedicated motion pass can be proposed after layout and visual hierarchy are approved.

## Data and behavior reuse

Redesign pages should reuse the same real application contracts wherever possible:

- API hooks
- generated API types
- React Query behavior
- MSW handlers
- fixture families
- domain transformations
- route intent

Do not maintain a second fake redesign-only data model.

If the canonical component mixes data fetching and presentation too tightly, extract a neutral nonvisual adapter or transformer that both systems can use. Do not move canonical visual code into redesign merely to reduce file count.

## QA workflow

Every implementation batch follows this sequence:

1. Inspect the approved wireframe row and current canonical Storybook surface.
2. Implement or update redesign primitives/patterns first.
3. Render the target Redesign story in a real browser.
4. Check desktop, compact desktop, tablet, 390 mobile, and 360 mobile behavior.
5. Run Storybook browser tests.
6. Run accessibility checks.
7. Run Playwright visual regression/evidence capture.
8. Inspect screenshots and diffs manually.
9. Fix visual defects before proceeding to the next page family.

Source inspection is not sufficient visual QA.

## Visual comparison policy

Canonical and Redesign coexist intentionally.

For every redesigned page, reviewers must be able to open the corresponding surfaces, for example:

```text
Canonical/Pages/Dashboard
Redesign/Pages/Dashboard
```

For the agents domain the comparison is intentionally named:

```text
Canonical/Pages/Agents
Redesign/Pages/Agent Intelligence
```

This provides a stable before/after comparison without preserving duplicate production implementations after final promotion.

## Promotion strategy

The redesign stays Storybook-isolated until all 13 page/view rows are complete and reviewed.

Promotion is a separate phase.

Promotion steps:

1. freeze the approved Redesign visual baselines
2. verify behavior parity against canonical routes
3. map production routes to redesign page components
4. consolidate theme tokens intentionally
5. update committed Playwright baselines only after visual review
6. remove obsolete canonical visual implementations only after production replacement is verified
7. keep historical screenshots/artifacts rather than permanent duplicate runtime components

No partial page-by-page production replacement occurs during initial redesign exploration unless explicitly approved later.

## Out of scope

- Tailwind 4 migration
- Next.js major upgrade
- React major upgrade
- Salesforce dashboard redesign
- new backend APIs solely for presentation
- alternate chart library
- importing a complete 21st.dev template
- paid Chromatic dependency
- decorative WebGL/shader effects
- broad motion library adoption
- production UI replacement before redesign review
- separate light and dark page implementations

## Acceptance criteria

The redesign implementation is considered complete only when all of the following are true:

1. Storybook exposes exactly two top-level product design trees: `Canonical` and `Redesign`.
2. Existing canonical production stories remain behaviorally intact.
3. Redesign code is isolated under `frontend/src/redesign`.
4. shadcn components used by redesign live in the redesign source tree.
5. Recharts remains the only chart library.
6. TanStack Table is the only new table behavior library.
7. The custom `Command Graphite` redesign theme supports both light and dark through tokens, not duplicate pages.
8. All 13 approved wireframe rows are represented in Redesign Storybook.
9. Responsive behavior is verified at the canonical viewport set and the explicit breakpoint contract.
10. Meaningful loading, empty, error, and stress states exist for each high-risk page family.
11. Storybook tests and Playwright visual tests pass for approved redesign surfaces.
12. Accessibility checks are blocking before production promotion.
13. PR #13 remains draft and unmerged during design-system/redesign exploration unless the user explicitly changes that instruction.

## Research references

21st.dev dashboard composition guide:
https://21st.dev/blog/react-dashboard-components

21st.dev dashboard library guide:
https://21st.dev/blog/dashboard-component-libraries

21st.dev community themes:
https://21st.dev/community/themes

21st.dev theme architecture article:
https://21st.dev/blog/introducing-community-themes

21st.dev verified templates:
https://21st.dev/community/templates/verified

Progress Metric Card:
https://21st.dev/community/components/makviesainte/progress-metric-card/default

Dashboard with Collapsible Sidebar:
https://21st.dev/@uniquesonu/components/dashboard-with-collapsible-sidebar

Project Data Table:
https://21st.dev/community/components/ravikatiyar/project-data-table/default

Resizable Table:
https://21st.dev/community/components/isaiahbjork/resizable-table

Shadcn Dashboard and Landing template:
https://21st.dev/@shadcnstore/templates/shadcn-dashboard-landing

Next Shadcn Admin Dashboard template:
https://21st.dev/@arhamkhnz/templates/next-shadcn-admin-dashboard
