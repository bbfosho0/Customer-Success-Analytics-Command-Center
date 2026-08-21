# Responsive Breakpoint Specification

Status: **Target responsive behavior derived from the audited baseline.**

This document defines the responsive layout contract for the Support Analytics interface. It is a design and implementation specification only. It does not implement production UI changes.

Whimsical wireframes: https://whimsical.com/KgTGe19twcLzdRDrgBwVgS

## Goals

- Preserve the dense operational dashboard character without compressing content beyond useful reading widths.
- Make navigation consume progressively less permanent horizontal space as the viewport narrows.
- Remove the current five-KPI `4 + 1` orphan layout around 1280 to 1440px.
- Keep charts, filters, region summaries, insights, and call data usable at the existing Playwright mobile widths.
- Define explicit transition widths so Storybook and Playwright can test behavior rather than relying on incidental wrapping.

## Baseline observations

The current shell switches from a 240px mobile drawer to a persistent sidebar at `md` (768px), with the expanded sidebar at 220px and collapsed state at 56px. The global search also becomes visible at `md`. The dashboard currently uses a two-column KPI grid by default, four columns at `md`, and seven columns at `2xl`, while rendering five KPI cards. At 1280 to 1440px this creates a visually unbalanced four-card first row plus one orphan card.

The main dashboard already has useful responsive primitives that should be retained where appropriate:

- Primary charts stack below `lg`, then become a 2:1 split at `lg` and above.
- Region performance uses 1 column by default, 2 at `sm`, 3 at `lg`, and 6 at `xl`.
- Insights and Latest Calls stack below `lg`, then become a 1:2 split at `lg` and above.
- Latest Calls already preserves the full operational table with horizontal overflow instead of crushing every column.

## Canonical breakpoint matrix

Use the standard Tailwind breakpoint values as the implementation contract.

| Tier | Width | Navigation | Main layout intent | Content padding |
| --- | --- | --- | --- | --- |
| Base | `< 640px` | Off-canvas drawer | Phone, single-column flow | 16px, may reduce to 14px at 360px |
| `sm` | `640–767px` | Off-canvas drawer | Large phone / narrow tablet | 16px |
| `md` | `768–1023px` | Off-canvas drawer | Tablet, two-column secondary grids | 20–24px |
| `lg` | `1024–1279px` | Persistent compact rail, ~56–64px | Compact desktop | 24px |
| `xl` | `1280–1535px` | Persistent full sidebar, ~200–220px | Full desktop | 24px |
| `2xl` | `>= 1536px` | Persistent full sidebar | Wide desktop | 24–32px; cap useful content width if needed |

### Why navigation changes at `lg`, not `md`

At 768 to 1023px, a persistent 220px sidebar consumes too much of the working area for charts and tables. Tablet should therefore continue using the overlay drawer. A compact icon rail becomes appropriate at 1024px, where persistent navigation can return without dominating the viewport. Full navigation labels return at 1280px.

## Application shell behavior

### Base and `sm`: phone

- No persistent sidebar.
- Topbar contains menu trigger, product/title context, and essential utilities only.
- Navigation opens as a left-side overlay drawer.
- Drawer width: approximately 240–280px, never wider than 85vw.
- Global jump/search control is hidden from the topbar; expose search through a command action or menu if required.
- Live/Demo mode control may collapse to a compact single control when horizontal space is constrained.
- Minimum interactive target on touch layouts: 40px, preferably 44px.

### `md`: tablet

- Continue using the overlay drawer rather than the current persistent sidebar.
- Breadcrumbs may remain hidden or be replaced by a concise page title.
- Global search remains hidden from the permanent topbar unless there is at least ~220px of uncontested space.
- Preserve all content width for analytical modules.

### `lg`: compact desktop

- Show persistent 56–64px icon rail.
- Show breadcrumbs.
- Show a compact global search, approximately 180–220px.
- Keep navigation labels in tooltips rather than consuming permanent width.
- User can optionally expand the rail, but expanded state must not be the default for this tier.

### `xl` and above: full desktop

- Show full persistent navigation, approximately 200–220px.
- Show breadcrumbs and 240–260px global search.
- Keep utility controls and user avatar visible in the topbar.
- At very wide widths, avoid allowing chart/table modules to become indefinitely wide. A centered content cap around 1600px is acceptable if visual inspection confirms better reading density.

## Dashboard module contract

### Page header and filters

| Tier | Behavior |
| --- | --- |
| Base | Title/description full width. Filters wrap into two-up controls when possible, otherwise stack. Search/filter text must not truncate critical selected values. |
| `sm` | Two-up filter rows are preferred. |
| `md` | Two-by-two filter arrangement or fluid wrapping. |
| `lg+` | Single horizontal filter row when available width permits. |

Do not rely on accidental flex wrapping. Each control group must have an intentional minimum width.

### KPI cards

There are currently five dashboard KPI cards. The grid should be based on the actual item count rather than seven theoretical columns.

| Tier | Target columns |
| --- | ---: |
| Base | 2 |
| `sm` | 2 |
| `md` | 2 or 3 based on tested minimum card width; prefer balanced rows |
| `lg` | 3, allowing `3 + 2` with the final two spanning or centering as a deliberate composition |
| `xl` | 5 |
| `2xl` | 5 |

Preferred desktop implementation: five equal columns from `xl` upward. This directly removes the audited `4 + 1` orphan at 1280 and 1440px. If KPI count becomes dynamic, use an auto-fit/minmax strategy with a tested minimum card width rather than fixed seven-column assumptions.

### Primary charts

- Below `lg`: Call Volume and Issue Breakdown stack vertically at full width.
- `lg` and above: 3-column parent with Call Volume spanning 2 columns and Issue Breakdown spanning 1.
- Preserve approximately 200–240px plot height.
- Axis and tick labels must remain legible without shrinking below the current already-small chart typography.
- Narrow layouts should reduce tick count before reducing font size.

### Region performance

Retain the current responsive shape unless implementation testing reveals a conflict:

- Base: 1 column.
- `sm`: 2 columns.
- `lg`: 3 columns.
- `xl+`: 6 columns.

Each region tile must preserve metric hierarchy and must not depend on a fixed region name length.

### Insights and Latest Calls

- Below `lg`: stack Insights first, Latest Calls second.
- `lg+`: 1:2 width ratio.
- Insight copy may wrap naturally.
- Latest Calls must prioritize data legibility over fitting every column into the viewport.

### Operational tables

For Calls, Latest Calls, Agents, Metrics, and other dense tabular surfaces:

- Preserve semantic tables where the information is inherently comparative.
- Below desktop widths, use horizontal scrolling rather than aggressively wrapping every cell.
- Give the table an explicit minimum content width appropriate to its columns.
- IDs, statuses, durations, and compact numeric metrics should remain non-wrapping where possible.
- Customer/issue descriptive text can wrap.
- Provide a visible horizontal-scroll affordance on touch layouts, such as edge fade, short helper copy, or another discoverable indicator.
- Do not convert a comparative table into cards unless the mobile UX is specifically redesigned and validated as a separate pattern.

## Mobile density rules

At 360 and 390px:

- No horizontal page overflow outside intentionally scrollable modules.
- Charts occupy the full content width.
- Two-column KPI cards are allowed only if both cards retain readable labels and values; otherwise drop to one column.
- Long region names, issue labels, and customer names may wrap, but controls and badges should not collapse to illegible widths.
- Page-level vertical rhythm should stay compact, using roughly 10–16px module gaps rather than desktop-sized empty areas.
- Fixed overlays and drawers must remain dismissible and independently scrollable on short-height screens.

## Responsive behavior for other canonical pages

The same shell tiers apply to Dashboard, Calls, Call Detail, Agents, Metrics, Customer Analytics, and Settings.

- Calls/Agents/Metrics: retain table comparison and horizontal overflow at narrow widths.
- Call Detail: move multi-column metadata/analytics groups into a single vertical reading flow below `lg`.
- Customer Analytics: tab/navigation controls may scroll horizontally or wrap into a compact control rather than squeezing all tabs.
- Settings: stack form sections and actions; no fixed-width panel may force horizontal page overflow.

## Wireframes

The editable Whimsical board contains these target frames:

1. **Dashboard Desktop >=1280**: full sidebar, five-column KPI row, 2:1 charts, six region tiles, 1:2 Insights/Latest Calls.
2. **Dashboard Tablet 768–1023**: drawer navigation, wrapped filters/KPIs, stacked charts, two-column region tiles, stacked lower modules.
3. **Dashboard Mobile 360–639**: compact topbar and drawer, two-up compact controls/KPIs where viable, fully stacked analytical modules, mobile table overflow treatment.
4. **Dashboard Compact Desktop 1024–1279**: icon navigation rail, compact global search, analytical desktop composition without the full sidebar penalty.

Board: https://whimsical.com/KgTGe19twcLzdRDrgBwVgS

## Visual QA matrix

The existing baseline already covers 360, 390, 1024, 1280, and 1440px widths. Add transition-specific widths so regressions are caught at the actual breakpoint boundaries.

Recommended canonical widths:

- 360px
- 390px
- 640px
- 768px
- 1024px
- 1280px
- 1440px
- 1536px or 1600px

For breakpoint-specific tests, capture both sides of structural transitions when practical, for example 767/768, 1023/1024, and 1279/1280.

## Acceptance criteria for implementation

1. No page-level horizontal overflow at 360, 390, 640, 768, 1024, 1280, 1440, or 1536px.
2. Persistent navigation does not appear below 1024px.
3. Full-width labeled sidebar does not become the default until 1280px.
4. The five dashboard KPI cards do not render as an accidental `4 + 1` composition at 1280 or 1440px.
5. Primary charts stack below 1024px and use the intended 2:1 composition at 1024px and above.
6. Region tiles follow the 1 / 2 / 3 / 6 column progression.
7. Dense tables remain readable and intentionally scrollable on narrow screens.
8. Touch controls on mobile/tablet meet the minimum target size requirement.
9. Drawer, modal, dropdown, and tooltip behavior remains usable at all canonical widths.
10. Storybook states and Playwright visual regressions are updated together when the responsive implementation lands.

## Implementation boundary

This specification and its Whimsical wireframes establish the target responsive contract only. Production component, shell, token, or layout changes should be implemented in the subsequent redesign phase and verified against the existing Storybook/MSW/Playwright foundation.