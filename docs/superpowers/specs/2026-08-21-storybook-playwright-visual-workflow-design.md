# Storybook + Playwright Visual Workflow Design

Date: 2026-08-21
Repository: `bbfosho0/Customer-Success-Analytics-Command-Center`
Branch: `storybook-playwright-redesign-foundation`
Baseline `main` SHA: `f955a6e5598300a702d0517ab9a7eba3a569c209`

## Purpose

Establish a free, code-first visual design and QA workflow for the Customer Success Analytics Command Center. The rendered React application remains the source of truth. Storybook becomes the executable design environment, MSW provides deterministic data states, Playwright provides browser and screenshot evidence, and GitHub Actions produces repeatable artifacts for visual analysis.

This foundation must exist before redesign work begins.

## Core principles

1. Do not redesign the UI while building this foundation.
2. Preserve existing behavior and business logic.
3. Do not migrate the framework stack.
4. Do not introduce a second design source of truth.
5. Do not require Figma, Penpot, Chromatic, or paid visual QA services.
6. Use canonical React components and stories as the design surface.
7. Use deterministic mocked network states for visual testing.
8. Use Playwright screenshots as visual evidence, not intuition from source code.
9. Keep visual test evidence easy for humans and AI agents to retrieve from GitHub Actions.
10. Extend the existing CI pipeline instead of creating an unrelated parallel system.

## Current frontend baseline

The frontend currently uses:

- Next.js 14.2.7
- React 18.3.1
- TypeScript 5.6.3
- Tailwind CSS 3.4.13
- Recharts 3.8.1
- next-themes 0.4.6
- Vitest 4.x
- React Query
- Zustand
- Lucide React

The current visual implementation is concentrated under `frontend/src/figma`, including primitives, filters, shell/navigation, and feature-level pages.

The existing `frontend/src/figma/primitives.tsx` already contains reusable UI candidates including:

- `KpiCard`
- `StatusBadge`
- `Chip`
- `SectionCard`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `InsightItem`

Major feature pages include:

- Dashboard
- Calls
- Call Detail
- Agents
- Metrics
- Customer Analytics
- Settings

These existing rendered surfaces are the initial baseline and must be exposed in Storybook before visual redesign begins.

## Target architecture

```text
React / Next.js source
        |
        v
     Storybook
  executable UI lab
        |
        +--> MSW fixtures and handlers
        |    deterministic states
        |
        +--> accessibility + component tests
        |
        v
     Playwright
 interaction + screenshots
        |
        v
   GitHub Actions
        |
        +--> visual-evidence artifact
        +--> visual diffs
        +--> Playwright report
        +--> traces/test results
        |
        v
   AI visual analysis
        |
        v
 redesign proposal / code iteration
```

## Storybook role

Storybook is the canonical workbench for visual design and component inspection.

### Framework integration

Use the current Storybook release compatible with the existing Next.js application, with the Next.js Vite framework integration where supported by the repository's exact dependency constraints.

### Required capabilities

Configure Storybook to faithfully reproduce application rendering with:

- global Tailwind styles
- application CSS
- fonts
- light theme
- dark theme
- Next.js routing assumptions
- React Query provider where required
- other application providers only when necessary for faithful rendering
- deterministic viewport presets

### Canonical viewports

Use these standard visual QA dimensions:

- Desktop XL: 1440 x 1000
- Desktop: 1280 x 900
- Tablet: 1024 x 768
- Mobile: 390 x 844
- Small Mobile: 360 x 800

These become shared viewport definitions for Storybook and Playwright where practical.

## Storybook addons and integrations

Add and configure:

- Storybook accessibility addon
- Storybook Vitest integration
- Storybook MCP addon, if compatible with the selected Storybook version and React setup
- MSW Storybook integration

Storybook MCP is an AI development aid, not a required CI dependency. The visual workflow must continue functioning if the MCP layer is unavailable.

## MSW architecture

MSW supplies deterministic API responses so canonical stories do not depend on a live FastAPI backend.

Suggested structure:

```text
frontend/src/mocks/
  browser.ts
  handlers/
    dashboard.ts
    calls.ts
    agents.ts
    metrics.ts
    customer-analytics.ts
  fixtures/
    normal.ts
    empty.ts
    sparse.ts
    extreme.ts
    error.ts
```

Handlers should follow the application's actual request contracts. Mocking must happen at the network boundary rather than replacing component internals with fake presentation-only props when the real component normally performs network requests.

### Required state families

Important analytical surfaces should support representative stories for:

- normal data
- loading
- empty data
- API failure
- sparse data
- large data sets where useful
- extremely long labels or names
- very large numeric values
- zero values
- negative or declining values
- many critical or at-risk customers
- no critical customers
- mixed statuses
- light theme
- dark theme

Not every primitive needs every state. Coverage should match meaningful risk for that component.

## Canonical component inventory

Before adding broad story coverage, perform a component census and classify visually meaningful elements.

### Foundations

- colors
- typography
- spacing
- radii
- borders
- surfaces
- shadows/elevation
- icons
- motion tokens if they already exist

### Primitives

Examples:

- buttons
- icon buttons
- badges
- chips
- cards
- fields
- selects
- switches

### Data display

Examples:

- KPI cards
- metric values
- trend indicators
- status badges
- tables
- chart containers
- legends
- tooltips

### Feedback

- loading states
- empty states
- error states
- insight or alert items

### Patterns

Examples:

- filter bars
- metric grids
- page headers
- toolbars
- insight panels

### Navigation

- application shell
- sidebar/navigation
- mobile navigation

### Charts

Catalog every reusable Recharts-based visual rather than treating chart markup embedded in feature pages as invisible implementation detail.

### Feature compositions

Create screen-level or composition-level stories for:

- Dashboard
- Calls
- Call Detail
- Agents
- Metrics
- Customer Analytics
- Settings

Do not create stories for arbitrary internal helpers that have no visual or design significance.

## Story coverage strategy

Stories serve as executable design cases.

For a component such as `KpiCard`, representative cases may include:

- default
- positive change
- negative change
- neutral change
- long label
- huge value
- missing delta
- narrow container
- light theme
- dark theme

Feature-level compositions should include data-state stories such as:

- normal
- sparse
- high risk
- loading
- empty
- error

Responsive visual coverage should be performed through shared viewport presets rather than duplicating every story solely to encode a viewport.

## Accessibility and component testing

Storybook must support automated component validation.

Use:

- Storybook accessibility checks based on axe
- Vitest-backed Storybook/component tests where appropriate
- interaction tests for meaningful behavior

Accessibility failures should be capable of failing CI for canonical components once the initial baseline is understood and intentional exceptions, if any, are documented.

A passing Storybook component test is not a substitute for rendered visual QA.

## Playwright architecture

Use both agent-facing Playwright CLI capabilities and Playwright Test.

### Playwright CLI

Use the CLI for efficient browser interaction during AI-assisted design and inspection. It is primarily a development and investigation tool.

### Playwright Test

Use `@playwright/test` for deterministic CI automation, including:

- screenshot assertions
- responsive projects
- critical end-to-end checks
- traces
- reports

Suggested visual test organization:

```text
frontend/tests/visual/
  primitives.visual.spec.ts
  charts.visual.spec.ts
  patterns.visual.spec.ts
  dashboard.visual.spec.ts
  calls.visual.spec.ts
  agents.visual.spec.ts
  metrics.visual.spec.ts
  customer-analytics.visual.spec.ts
  settings.visual.spec.ts
```

The exact file grouping may change after the component census, but the separation between primitives, reusable visualization systems, and feature compositions should remain clear.

## Screenshot model

Maintain two complementary screenshot outputs.

### Playwright regression baselines

Use Playwright screenshot assertions for regression detection.

Purpose:

- compare expected and actual rendering
- surface accidental visual changes
- create visual diffs on failure

### AI-review visual evidence

Also produce clean, predictably named screenshots intended for manual and AI inspection.

Example structure:

```text
visual-evidence/
  desktop/
    dashboard-dark.png
    dashboard-light.png
    calls-dark.png
  tablet/
  mobile/
```

Do not make AI review depend on deciphering internal Playwright artifact names.

## Visual evidence manifest

Generate a machine-readable manifest for visual evidence.

Each record should identify at least:

- surface or component
- story/state
- theme
- viewport
- output file

Example:

```json
{
  "surface": "dashboard",
  "story": "high-risk",
  "theme": "dark",
  "viewport": "1440x1000",
  "file": "desktop/dashboard-high-risk-dark.png"
}
```

The manifest should be deterministic and committed only if it represents configuration. Generated screenshot output should remain CI artifacts unless there is a deliberate reason to version a baseline image.

## Storybook-first visual coverage

Storybook is the primary screenshot target for exhaustive visual states because it provides deterministic combinations of:

- component
- props
- network state
- theme
- viewport

The real Next.js application should maintain a smaller set of critical end-to-end visual and interaction checks to verify composition, routing, and provider integration.

Policy:

- Storybook visual coverage: broad and state-rich
- Application E2E visual coverage: focused on critical flows

## GitHub Actions integration

Extend the existing `.github/workflows/ci.yml` rather than introducing an unrelated second CI architecture unless isolation is needed for maintainability or runtime limits.

The visual pipeline should include these logical stages:

```text
backend generation/tests
        |
        v
frontend quality gates
  - schema drift
  - lint
  - unit tests
  - production build
        |
        v
Storybook build/test
        |
        v
Playwright visual tests
        |
        +--> visual evidence
        +--> visual diffs
        +--> report
        +--> traces/test results
```

### GitHub Actions artifact policy

Upload, where applicable:

- `storybook-static`
- `visual-evidence`
- `playwright-report`
- `playwright-test-results`
- visual diffs or failed screenshots

Evidence should upload even on visual test failure when possible so failures remain inspectable.

### Pull request policy

For pull requests:

- build Storybook
- run component tests
- run accessibility checks
- run Chromium visual tests
- upload evidence and failure artifacts

### Main branch policy

On main:

- run the full visual suite
- use Chromium as the canonical screenshot renderer
- optionally run Firefox and WebKit for selected critical E2E flows

Do not multiply every Storybook screenshot across all browser engines unless a concrete compatibility risk justifies the cost.

## AI visual analysis workflow

After CI produces visual artifacts:

1. Retrieve the latest visual evidence artifact from the relevant GitHub Actions run.
2. Inspect screenshots against the manifest.
3. Audit geometry, hierarchy, spacing, density, typography, contrast, component consistency, responsive behavior, chart readability, KPI hierarchy, navigation dominance, empty/error states, and theme coherence.
4. Trace visual defects back to owning components or tokens.
5. Produce a structured redesign proposal with evidence.
6. Do not start redesign implementation until that proposal is approved.

## Redesign sequence after foundation approval

Once baseline evidence is trustworthy, redesign in this order:

1. design tokens
2. typography
3. geometry and spacing
4. surfaces and borders
5. core controls
6. KPI system
7. chart system
8. tables
9. filters
10. navigation
11. reusable dashboard patterns
12. Dashboard
13. Calls
14. Call Detail
15. Metrics
16. Agents
17. Customer Analytics
18. Settings
19. responsive polish
20. motion and micro-interactions

Redesign reusable systems before feature pages so the application does not drift into page-specific visual rules.

## Repository organization direction

The existing `frontend/src/figma` structure should not be deleted during foundation work. The component census should identify which elements are true reusable design-system components and which are feature-specific compositions.

A future migration may move canonical UI toward a structure such as:

```text
frontend/src/
  design-system/
    tokens/
    primitives/
    navigation/
    data-display/
    charts/
    feedback/
  patterns/
  features/
```

This is a redesign-stage architectural cleanup, not a prerequisite for installing Storybook and Playwright.

## AGENTS.md guidance

Extend repository agent guidance so AI coding agents are instructed to:

- consult existing Storybook stories before changing canonical UI components
- add or update relevant stories with visual component changes
- preserve MSW-backed deterministic states
- run relevant Storybook/component checks
- run Playwright visual tests for affected canonical surfaces
- use rendered evidence before claiming visual correctness

Do not make Storybook MCP availability mandatory for repository correctness.

## Error handling and reliability

The workflow should fail clearly when:

- Storybook cannot build
- a canonical story throws during render
- an MSW handler is missing for a required request
- accessibility checks fail
- visual comparisons fail
- a Playwright browser cannot start
- required screenshots are missing from the evidence manifest

GitHub Actions should retain enough failure artifacts to diagnose the problem without rerunning locally whenever practical.

## Out of scope for foundation phase

The following are explicitly out of scope until baseline setup and evidence are complete:

- changing the visual design language
- replacing Tailwind
- replacing Recharts
- migrating Next.js or React
- broad business-logic refactors
- deleting `frontend/src/figma`
- introducing Figma as a required source of truth
- introducing Penpot as a required source of truth
- adding paid visual testing infrastructure
- redesigning full pages before reusable systems are understood

## Acceptance criteria for foundation phase

The foundation is complete when all of the following are true:

1. Storybook builds from the repository in CI.
2. Existing canonical primitives and major feature compositions have Storybook coverage sufficient for baseline inspection.
3. MSW supplies deterministic data states for network-dependent canonical stories.
4. Shared light/dark theme and viewport controls work in Storybook.
5. Accessibility checks are wired into the Storybook test workflow.
6. Playwright Test is configured for canonical visual screenshots.
7. Playwright CLI is available for agent-facing inspection workflows.
8. GitHub Actions generates clean visual evidence at desktop, tablet, and mobile sizes for selected canonical surfaces.
9. GitHub Actions uploads visual evidence, reports, and useful failure artifacts.
10. A visual evidence manifest maps screenshots to surface, state, theme, and viewport.
11. The existing application behavior remains intact.
12. No intentional redesign has been introduced during foundation work.
13. Baseline screenshots are suitable for a subsequent evidence-based redesign audit.

## Final operating loop

```text
code
  -> Storybook story
  -> MSW state
  -> rendered browser
  -> Playwright screenshot
  -> GitHub Actions artifact
  -> AI visual analysis
  -> approved design change
  -> code update
  -> repeat
```

The goal is to make visual design iterative, testable, code-native, and reproducible without depending on paid design tooling or design-to-code synchronization.
