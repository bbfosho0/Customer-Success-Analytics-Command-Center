# Responsive Breakpoint Specification

Status: **Wireframe contract complete. The full 52-composition v3 responsive matrix completed a thorough visual QA and revision pass on 2026-08-21. Production UI changes have not yet been implemented.**

This document defines the responsive layout contract for the Support Analytics redesign. It is a design specification only. Production UI changes have not yet been implemented.

Whimsical wireframes v3: https://whimsical.com/7qfTKyGnvSoxzLe8hsUjvS

Detailed QA record: `docs/design-audit/wireframe-visual-qa.md`

## Full-product wireframe matrix

The v3 board contains all 13 canonical screen/view rows across four representative responsive tiers, totaling 52 compositions:

1. Dashboard / Overview
2. Calls / Operations
3. Call Detail
4. Agent Intelligence
5. Metrics / Overview
6. Metrics / Volume
7. Metrics / Breakdown
8. Metrics / Regions
9. Customer 360 / Overview
10. Customer 360 / Churn Risk
11. Customer 360 / Retention
12. Customer 360 / LTV
13. Settings / Manifest

Representative composition columns are Desktop >=1280, Compact Desktop 1024-1279, Tablet 768-1023, and Mobile 360-639. The `sm` 640-767 tier follows the mobile shell contract and is validated separately during implementation and visual regression.

Wireframe phase status: **complete after visual QA and revision, pending user review before production redesign implementation.**

## Visual QA revision checkpoint

The completed v3 matrix was reviewed row-by-row and tier-by-tier against the responsive contract, visual baseline, and current application surfaces. The revision pass corrected:

- missing mobile Dashboard filter/context hierarchy
- Metrics tab/navigation continuity across all responsive tiers
- Metrics surfaces that did not match current application capabilities
- unsupported cost analytics in Metrics Breakdown
- Customer 360 overview KPI and recommended-action semantics
- missing Churn Risk risk-level filtering
- missing larger-tier LTV summary KPIs
- unsupported Settings pipeline controls and missing mobile schema information
- centered dense-data treatments that weakened scan behavior
- hidden duplicate Whimsical objects and a Metrics header/KPI overlap

The detailed finding matrix and implementation watchouts are recorded in `docs/design-audit/wireframe-visual-qa.md`.

## Core redesign decisions

- Dashboard hierarchy uses **four primary KPIs**: Interactions, Avg Handle Time, Resolution Rate, and Escalations.
- **Active Regions is contextual metadata**, not a fifth KPI card.
- Responsive design is a **recomposition**, not a desktop layout that mechanically stacks as width decreases.
- Call Volume is the dominant analytical surface.
- Issue Mix is subordinate to Call Volume.
- Region Performance is a compact comparative surface, not six equally weighted tiles.
- Latest Calls remains table-first on desktop/tablet and becomes a compact recent-call summary on phone.
- Tablet keeps overlay navigation. Persistent navigation returns at 1024px as a compact rail. Full labeled navigation starts at 1280px.
- Filters collapse into a compact date + Filters control instead of permanently consuming a full toolbar at every width.

## Canonical breakpoint matrix

| Tier | Width | Navigation | Dashboard composition | Content padding |
| --- | --- | --- | --- | --- |
| Base | `< 640px` | Off-canvas drawer | Phone-native compact dashboard | 14-16px |
| `sm` | `640-767px` | Off-canvas drawer | Large phone / narrow tablet | 16px |
| `md` | `768-1023px` | Off-canvas drawer | Tablet analytical canvas | 18-24px |
| `lg` | `1024-1279px` | Persistent compact rail, 56-64px | Compact desktop | 20-24px |
| `xl` | `1280-1535px` | Persistent full sidebar, 200-220px | Full desktop | 24px |
| `2xl` | `>= 1536px` | Persistent full sidebar | Wide desktop with useful content-width cap | 24-32px |

## Application shell

### Base through `md`

- No persistent sidebar.
- Topbar contains menu trigger, product context, runtime state, and theme control.
- Navigation opens as an overlay drawer no wider than 85vw.
- Global jump/search is not permanently mounted on phone/tablet.
- Touch targets should be at least 40px, preferably 44px.

### `lg`

- Persistent 56-64px icon rail.
- Compact global jump/search may return.
- Navigation labels use tooltips rather than permanent width.

### `xl+`

- Full labeled sidebar, approximately 200-220px.
- Breadcrumb/page context, jump/search, runtime status, and theme control remain visible.
- Cap content width when extra width no longer improves analytical readability.

## Dashboard geometry contract

### Header and filters

- Phone: compact header, title/context, date range, Filters action.
- Tablet: date + Filters + context summary in one compact row.
- Compact/full desktop: date, Filters, active-region/filter summary, reset when dirty.
- Do not restore four permanent selects simply because horizontal space exists.

### Primary KPI matrix

Exactly four primary KPI cards are shown.

| Tier | Geometry |
| --- | --- |
| Base / `sm` | **2 x 2** compact matrix |
| `md` | **4 across** |
| `lg+` | **4 across** |

The phone layout must use two explicit rows of two cards. It must never collapse into a full vertical KPI stack. Tablet has enough width for four compact cards across and should use it.

### Primary analytics

- Base / `sm`: Call Volume is full width. Issue Mix and Region Watch may form a compact **2-up secondary row** when labels remain readable.
- `md+`: Call Volume occupies approximately **two-thirds** of the analytical row and Issue Mix approximately **one-third**.
- Reduce tick density before shrinking chart-label typography.
- Chart text must remain readable in both themes.

### Region performance + priority insight

- Base / `sm`: Region Watch becomes a compact high-signal summary; Priority Insight is a short full-width intervention surface.
- `md+`: Region Performance and Priority Insights share a row at roughly **2:1** width.
- Active-region count belongs with Region Performance/filter context, not the KPI matrix.

### Latest calls

- `md+`: Latest Calls receives a **full-width lower row** so comparison is not squeezed beside another major module.
- Phone: compact Recent Calls summary/list with only the highest-value fields and a route to the dedicated Calls view.
- The dedicated Calls page remains the full operational table and may use intentional horizontal scrolling on narrow screens.

## Canonical frame geometry

### Desktop >=1280

1. Full sidebar + compact topbar.
2. Header/filter strip.
3. Four KPI cards across.
4. Call Volume / Issue Mix at approximately 2:1.
5. Region Performance / Priority Insights at approximately 2:1.
6. Latest Calls full width.

### Compact Desktop 1024-1279

1. Compact icon rail.
2. Header/filter strip.
3. Four KPI cards across.
4. Call Volume / Issue Mix at approximately 2:1.
5. Region Performance / Priority Insights at approximately 2:1.
6. Latest Calls full width.

### Tablet 768-1023

1. Drawer navigation, no persistent rail.
2. Compact filter/context row.
3. **Four KPI cards across**, not 2 x 2 and not stacked.
4. Call Volume / Issue Mix at approximately 2:1.
5. Region Performance / Priority Insights at approximately 2:1.
6. Latest Calls full width with reduced columns.

### Mobile 360-639

1. Compact topbar and title/context.
2. Date + Filters controls side by side.
3. **2 x 2 KPI matrix**.
4. Call Volume full width.
5. Issue Mix + Region Watch in a compact 2-up row.
6. One Priority Insight surface.
7. Compact Recent Calls surface.

The phone frame is intentionally dense enough to communicate dashboard hierarchy within one viewport. Lower-detail content belongs behind drill-in navigation rather than producing a giant stack of full-width rectangles.

## Storybook redesign workbench alignment

The Storybook redesign workbench mirrors the geometry rules that matter during visual iteration:

- KPI matrix is 2 x 2 on phone and four across from tablet upward.
- Call Volume / Issue Mix becomes a 2:1 analytical split from tablet upward.
- Mobile-density stories include the chart hierarchy instead of testing only stacked cards/tables.
- Global dark/light theme control continues to wrap the actual application theme provider.

## Mobile density rules

At 360 and 390px:

- No page-level horizontal overflow outside intentionally scrollable modules.
- Two-column KPI cards must retain readable values/labels.
- Avoid full-width stacking when two compact modules can remain legible side by side.
- Long labels may wrap, but badges and controls must not collapse to illegible widths.
- Use compact 8-14px module gaps.
- Drawers and overlays must remain dismissible and independently scrollable.

## Other canonical pages

The same shell tiers apply to Dashboard, Calls, Call Detail, Agents, Metrics, Customer Analytics, and Settings.

- Calls / Agents / Metrics: preserve comparative tables; use intentional horizontal overflow where needed.
- Call Detail: collapse multi-column metadata and analytics into a vertical reading flow below `lg`.
- Customer Analytics: allow horizontal tab scrolling or a compact control instead of squeezing all tabs.
- Settings: stack sections/actions without forcing page overflow.
- Metrics: preserve Overview / Volume / Breakdown / Regions navigation and keep the views aligned to current product capabilities.
- Customer 360 Churn Risk: preserve risk-level filtering at every tier.
- Customer 360 LTV: preserve segment-level LTV summary context before the primary chart from tablet upward.

## Visual QA widths

Canonical widths:

- 360
- 390
- 640
- 768
- 1024
- 1280
- 1440
- 1536 or 1600

At structural transitions, also test both sides when practical: 767/768, 1023/1024, and 1279/1280.

## Acceptance criteria for implementation

1. No page-level horizontal overflow at canonical widths.
2. Persistent navigation does not appear below 1024px.
3. Full labeled sidebar is not the default below 1280px.
4. Dashboard has four primary KPI cards with no orphan or vertical-stack composition.
5. Phone KPI geometry is explicitly 2 x 2.
6. Tablet KPI geometry is four across.
7. Call Volume remains dominant and forms a 2:1 analytics row from tablet upward.
8. Region Performance + Priority Insights form an intentional 2:1 row from tablet upward.
9. Latest Calls receives full-width lower-row priority on tablet/desktop.
10. Both light and dark themes remain first-class throughout redesign work.
11. Storybook states and Playwright regression coverage are updated together with each production redesign slice.
12. Metrics retains its four-view navigation and does not introduce analytics unsupported by the current data/product model without an explicit scope change.
13. Customer 360 preserves risk filtering, retention comparisons, LTV summary context, and expansion drill-down across responsive recompositions.
14. Settings represents runtime, refresh, manifest, schema/columns, and audit capabilities without implying unsupported pipeline mutation controls.

## Implementation boundary

These wireframes, the breakpoint contract, the visual QA record, and the Storybook redesign workbench define the target and QA surface. They do not themselves modify the production dashboard.