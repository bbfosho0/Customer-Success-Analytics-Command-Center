# Tablet Layout Plan

## 1. Current CRMA layout support

The current dashboard JSON appears to support:

- one desktop layout: `gridLayouts[0]` with `name = "Default"` and selector `minWidth(600)`
- one mobile layout: `gridLayouts[1]` with `name = "Mobile"` and selector `maxWidth(599)`

Verified from:

- `salesforce/force-app/main/default/wave/Landing_Page.wdash`

The current JSON does **not** show an explicit tablet-specific layout, page variant, or third breakpoint layout.

Observed evidence:

- `gridLayouts` length is `2`
- top-level `layouts` is empty
- each layout contains the same six pages
- no tablet-only selector is present in the repo snapshot

Conclusion:

- Separate mobile layout support is verified.
- Separate tablet layout support is **not** verified from the repo files.

## 2. Recommended implementation method

Recommended method:

1. Do **not** assume CRM Analytics supports a third tablet breakpoint layout.
2. Treat tablet as an extension proposal, not as an immediately safe JSON rewrite.
3. If a future schema review proves additional `gridLayouts[*].selectors` patterns are supported, implement a dedicated tablet layout as a third layout variant.
4. If that support cannot be proven, keep the current `Default` layout as the tablet fallback and make only conservative spacing and width decisions that still behave acceptably at intermediate widths.

Recommended engineering path:

- Phase 1: `audit` and document tablet targets only.
- Phase 2: verify whether an additional selector-based layout is accepted by the real schema and deployment path.
- Phase 3: only then introduce tablet placement overrides.

## 3. Recommended widget order

This is the recommended tablet reading order for the main `cscc-overview` page:

1. Header container
2. Dashboard title
3. Primary navigation links
4. Filter block
5. KPI row one: ARR, Customers
6. KPI row two: Health Score, At-Risk ARR
7. KPI row three: Expansion Pipeline
8. Portfolio Health Mix
9. Current MRR Exposure by Risk Band
10. Revenue Requiring Attention by Owner
11. Priority Risk Queue table

Recommended tablet order for the other five internal pages:

- `cscc-risk`
  - header, filters, KPIs, risk summary chart, risk driver chart, queue table
- `cscc-retention`
  - header, cohort filter, retention trend, retention heatmap, LTV chart
- `cscc-expansion`
  - header, filters, KPIs, readiness chart, timeline chart, expansion table
- `cscc-support`
  - header, reset/toolbar, support note, churn chart, health chart, support table
- `cscc-guide`
  - header, toolbar/reset, metric cards stacked vertically

## 4. Recommended widget sizing

Because tablet-specific layout support is not yet verified, these should be treated as target proportions rather than approved JSON edits.

### Overview page target sizing

- Header block: full width
- Filter row: 2 filters per row where possible
- KPI cards: 2 columns
- `overview_chart_arr_risk`: full width if labels tighten; otherwise first in chart stack
- `overview_health_container`: full width above or below the ARR exposure chart
- `overview_chart_owner_attention`: full width
- `overview_table_risk`: full width at lower priority

### Suggested tablet proportions

- 2-column KPI cards
- 1-column charts when category labels or axis labels risk becoming cramped
- no side-by-side table plus chart row unless actual rendered labels remain readable

## 5. Spacing

Use the design-system tablet spacing targets:

- outer padding: `14px`
- section gap: `14px`
- card gap: `14px`
- card padding: `14px`

Additional tablet spacing rules:

- avoid rows with more than 2 dense widgets
- keep at least one row gap between major sections
- keep chart title-to-plot spacing readable
- preserve enough left padding for horizontal bar labels

## 6. Lower-priority widgets on tablet

The following should sit lower on tablet because they are denser or less essential than the summary view:

- `overview_table_risk`
- `risk_table_queue`
- `exp_table_queue`
- `support_table_detail`
- all metric guide cards after the first few definition cards

Medium-priority rather than low-priority:

- `overview_chart_owner_attention`
- `retention_chart_heatmap` if the heatmap becomes visually compressed

## 7. Risks

- The repo does not prove tablet-specific layout support.
- Adding a third layout variant without schema confirmation may produce invalid metadata or ignored configuration.
- Reusing `Default` for tablet may keep some desktop pairings too dense at intermediate widths.
- The overview page currently uses a 48-column desktop structure with several deliberate side-by-side relationships; blindly collapsing them could reduce the executive scan pattern.
- Heatmaps and horizontal bar charts are the most likely charts to suffer first at tablet widths.

## 8. Validation strategy

Validation should happen in two stages.

### Stage 1: static validation

- confirm whether any new tablet layout keys actually exist in the accepted schema
- run JSON parse validation
- diff-check that only layout paths changed
- confirm no changes to:
  - datasets
  - steps
  - queries
  - bindings
  - filters
  - measures
  - selections
  - interactions

### Stage 2: visual QA

Test at an intermediate tablet width and confirm:

- filters are near the top
- KPI cards are readable in 2 columns
- no tiny chart labels
- no cramped side-by-side charts
- tables appear below summary and charts
- navigation remains visible and readable
- no widget overlap or clipping
- no unexpected fallback to the desktop composition that breaks readability

## 9. Recommended safe next step

Do not apply tablet JSON changes yet.

The safe next step is:

1. verify whether an additional selector-based layout is actually supported by the deployed CRM Analytics metadata shape
2. if not proven, keep tablet as a documented target and continue with mobile-only layout work, where explicit support already exists
