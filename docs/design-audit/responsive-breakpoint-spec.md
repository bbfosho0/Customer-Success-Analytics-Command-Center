# Responsive Breakpoint Specification

Status: **Redesign target derived from the audited baseline and responsive wireframes v2.**

This document defines the responsive layout contract for the Support Analytics redesign. It is a design specification only. Production UI changes have not yet been implemented.

Whimsical v2 wireframes: https://whimsical.com/QUqGyjEEkwewz3C39CZbKJ

## Core redesign decisions

- Dashboard hierarchy uses **four primary KPIs**: Interactions, Avg Handle Time, Resolution Rate, and Escalations.
- **Active Regions is contextual metadata**, not a fifth KPI card. It appears with filters and Region Performance.
- Call Volume is the dominant analytical surface.
- Issue Mix is secondary and visually subordinate to Call Volume.
- Region Performance becomes a compact comparative module rather than six equally weighted dashboard tiles.
- Latest Calls remains table-first on desktop. Mobile uses a compact recent-call list because forcing the full comparison table into the dashboard is not useful at phone widths.
- Tablet keeps overlay navigation. Persistent navigation returns at 1024px as a compact rail. Full labeled navigation starts at 1280px.
- Desktop filters are intentionally reduced to a date control plus a compact **Filters** action and active-filter/context summary. The full existing filter surface remains available as a Storybook redesign-workbench reference while the redesign interaction is finalized.

## Canonical breakpoint matrix

Use the standard Tailwind breakpoint values as the implementation contract.

| Tier | Width | Navigation | Dashboard composition | Content padding |
| --- | --- | --- | --- | --- |
| Base | `< 640px` | Off-canvas drawer | Phone, single-column analytical flow | 14–16px |
| `sm` | `640–767px` | Off-canvas drawer | Large phone / narrow tablet | 16px |
| `md` | `768–1023px` | Off-canvas drawer | Tablet, two-column KPI grid; analytical modules stacked | 18–24px |
| `lg` | `1024–1279px` | Persistent compact rail, 56–64px | Compact desktop, 2:1 charts, full operational density | 20–24px |
| `xl` | `1280–1535px` | Persistent full sidebar, 200–220px | Full desktop | 24px |
| `2xl` | `>= 1536px` | Persistent full sidebar | Wide desktop with useful content-width cap | 24–32px |

## Application shell

### Base through `md`

- No persistent sidebar.
- Topbar contains menu trigger, product context, runtime state, and theme control.
- Navigation opens as an overlay drawer no wider than 85vw.
- Global jump/search is not permanently mounted in the topbar on phone/tablet.
- Touch targets should be at least 40px, preferably 44px.

### `lg`: compact desktop

- Persistent 56–64px icon rail.
- Compact global jump/search may return.
- Navigation labels use tooltips rather than consuming permanent width.
- Expanded navigation is optional, not default.

### `xl+`: full desktop

- Full labeled sidebar, approximately 200–220px.
- Breadcrumb/page context, global jump/search, runtime status, and theme control remain visible.
- Cap content width when additional width stops improving analytical readability.

## Dashboard module contract

### Header and filtering

- Phone: title/description, date range, and compact Filters action.
- Tablet: same controls in a single compact row when width allows.
- Compact/full desktop: date range, Filters action, active-region/filter summary, reset action when dirty.
- Do not render four permanent select boxes simply because space exists. The redesign should reduce toolbar noise while preserving access to all filtering capability.

### Primary KPI grid

Exactly four primary KPI cards are shown on the dashboard target.

| Tier | Columns |
| --- | ---: |
| Base | 2 |
| `sm` | 2 |
| `md` | 2 |
| `lg+` | 4 |

This removes the audited `4 + 1` orphan problem entirely instead of solving it with a five-column desktop grid.

### Primary analytics

- Below `lg`: Call Volume and Issue Mix stack vertically.
- `lg+`: Call Volume occupies two-thirds of the row and Issue Mix one-third.
- Reduce tick density before reducing chart-label font size.
- Chart text must remain readable in both themes.

### Region performance

The redesign target is comparative rather than tile-heavy.

- Desktop/compact desktop: compact table or table-like comparison with Region, Volume, SLA, CSAT, and Escalations.
- Tablet: shortened comparative table showing the highest-value columns plus a View All Regions action.
- Mobile: **Region Watch** summary with a small set of high-signal regions and a route to the complete region view.
- Active-region count belongs in this context, not in the KPI row.

### Priority insights

- Desktop: compact priority panel next to Latest Calls.
- Tablet: full-width panel below region comparison.
- Mobile: emphasize the highest-priority insight first rather than stacking every insight at dashboard level.

### Latest calls

- `lg+`: semantic operational table.
- Tablet: reduced-column table that preserves comparison.
- Phone dashboard: compact recent-call list with ID/customer, issue, duration, and status.
- The dedicated Calls page remains the full operational table on all relevant widths and can use intentional horizontal scrolling where necessary.

## Mobile density rules

At 360 and 390px:

- No page-level horizontal overflow outside intentionally scrollable modules.
- Two-column KPI cards are permitted only while labels and values remain readable.
- Charts occupy full content width.
- Region Watch, Priority Insight, and Recent Calls become phone-native summaries rather than squeezed desktop modules.
- Long labels may wrap; badges and controls must not collapse to illegible widths.
- Use compact 10–16px vertical module gaps.
- Drawers and overlays must remain dismissible and independently scrollable.

## Other canonical pages

The same shell tiers apply to Dashboard, Calls, Call Detail, Agents, Metrics, Customer Analytics, and Settings.

- Calls / Agents / Metrics: preserve comparative tables; use intentional horizontal overflow where needed.
- Call Detail: collapse multi-column metadata and analytics into a vertical reading flow below `lg`.
- Customer Analytics: allow horizontal tab scrolling or a compact control instead of squeezing all tabs.
- Settings: stack sections and actions; no fixed-width panel may force page overflow.

## Whimsical v2 frames

The rebuilt board contains four responsive target frames:

1. **Desktop >=1280**: full sidebar, four-KPI row, dominant 2:1 chart hierarchy, compact Region Performance comparison, Priority Insights + Latest Calls.
2. **Compact Desktop 1024–1279**: icon rail with the same analytical hierarchy and reduced chrome.
3. **Tablet 768–1023**: drawer navigation, 2x2 KPIs, stacked analytical modules, reduced region comparison, reduced-column Latest Calls.
4. **Mobile 360–639**: compact header, date + Filters action, 2x2 KPIs, stacked charts, Region Watch, one priority insight, compact Recent Calls list.

Board: https://whimsical.com/QUqGyjEEkwewz3C39CZbKJ

## Storybook redesign workbench

Before production redesign begins, the Storybook catalog includes an explicit `Redesign Workbench/Patterns` section for:

- filter toolbar and active-filter state
- primary KPI matrix
- chart hierarchy and density
- region-comparison density
- priority insight severity
- loading / empty / error treatments
- operational table density
- mobile-density behavior

The global Storybook theme control applies the actual application theme provider to every story. Automated Playwright checks render the workbench in forced dark and forced light themes and verify that the theme surfaces are distinct.

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
4. Dashboard has four primary KPI cards with no orphan composition.
5. Call Volume remains the dominant chart and becomes a 2:1 composition at `lg+`.
6. Region Performance changes density intentionally by tier instead of mechanically wrapping six equal tiles.
7. Latest Calls changes from full table to reduced table/list only where the dashboard context benefits from it.
8. Touch controls meet minimum target size.
9. Both light and dark themes remain first-class throughout redesign work.
10. Storybook states and Playwright regression coverage are updated together with each production redesign slice.

## Implementation boundary

These wireframes, the breakpoint contract, and the Storybook redesign workbench define the target and the QA surface. They do not themselves modify the production dashboard.