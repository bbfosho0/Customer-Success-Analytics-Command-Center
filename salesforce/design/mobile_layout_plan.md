# Mobile Layout Plan

## 1. Current CRMA layout support

The current dashboard JSON **does** appear to support a separate mobile layout.

Verified from:

- `salesforce/force-app/main/default/wave/Landing_Page.wdash`

Observed evidence:

- `gridLayouts[1].name = "Mobile"`
- `gridLayouts[1].selectors = ["maxWidth(599)"]`
- `gridLayouts[1].numColumns = 12`
- the mobile layout contains all six internal pages with dedicated placement entries

Conclusion:

- Mobile-specific placement support is present in the repo files.
- Mobile planning can target a real existing layout surface instead of a hypothetical schema extension.

## 2. Recommended implementation method

Recommended method:

1. Update only the existing `Mobile` layout inside `gridLayouts`.
2. Leave the `Default` layout unchanged.
3. Keep widget definitions, steps, bindings, and navigation untouched.
4. Reorder only mobile placement blocks under `gridLayouts[*].pages[*].widgets[*]`.
5. Preserve the current 12-column mobile grid and use single-column stacking as the default.

This is safer than trying to invent a new mobile layout surface because the repo already proves that the mobile layout exists.

## 3. Recommended widget order

### `cscc-overview`

Recommended mobile order:

1. `overview_header_container`
2. `overview_title_mobile`
3. `overview_nav_risk`
4. `overview_nav_retention`
5. `overview_nav_expansion`
6. `overview_filter_container`
7. `overview_selector_csm`
8. `overview_selector_segment`
9. `overview_selector_region`
10. `overview_selector_plan`
11. `overview_reset`
12. `overview_kpi_arr_number`
13. `overview_kpi_customers_number`
14. `overview_kpi_health_number`
15. `overview_kpi_risk_number`
16. `overview_kpi_expansion_number`
17. `overview_chart_owner_attention`
18. `overview_chart_arr_risk`
19. `overview_health_container`
20. `overview_health_heading`
21. `overview_health_healthy`
22. `overview_health_watch`
23. `overview_health_at_risk`
24. `overview_health_critical`
25. `overview_queue_heading`
26. `overview_table_risk_mobile`

Recommended rationale:

- header first
- filters near top
- KPI cards immediately after filters
- owner/trend signal before the denser risk table
- table lower on the page

### `cscc-risk`

1. header
2. filters
3. KPIs
4. `risk_chart_summary`
5. `risk_chart_driver`
6. `risk_table_queue`

### `cscc-retention`

1. header
2. cohort filter
3. reset
4. `retention_chart_trend`
5. `retention_chart_heatmap`
6. `retention_chart_ltv`

Reason:

- the trend chart is easier to scan first on a narrow phone
- the heatmap is still useful, but denser

### `cscc-expansion`

1. header
2. filters
3. KPIs
4. `exp_chart_timeline`
5. `exp_chart_readiness`
6. `exp_table_queue`

Reason:

- trend or time-based chart first
- dense table last

### `cscc-support`

1. header
2. toolbar/reset
3. support note
4. `support_chart_health`
5. `support_chart_churn`
6. `support_table_detail`

### `cscc-guide`

1. header
2. toolbar/reset
3. guide cards stacked vertically

## 4. Recommended widget sizing

### Core rule

Use a single-column 12-column stack for nearly everything on mobile.

### Overview page target sizing

- header container: full width
- nav links: full width or evenly split only if text remains readable
- filters: full width
- reset button: full width
- ARR KPI: full width
- other KPI cards: full width, or 2-up only if font size remains readable
- charts: full width
- health mix tiles: either a 2x2 mini-grid inside the container or full-width stacked KPI tiles
- table: full width, lowest in reading order

### Other pages

- filters: full width
- KPIs: full width
- charts: full width
- tables: full width and lower priority

## 5. Spacing

Use the design-system mobile spacing targets:

- outer padding: `12px`
- section gap: `12px`
- card gap: `12px`
- card padding: `12px`

Additional mobile spacing rules:

- no dense back-to-back chart rows without clear section spacing
- enough vertical breathing room between filters and KPI cards
- preserve readable title-to-plot spacing
- avoid narrow side-by-side cards except possibly for the small health mix tiles

## 6. Lower-priority widgets on mobile

These should be deliberately lower in the mobile reading flow:

- `overview_table_risk_mobile`
- `risk_table_queue`
- `exp_table_queue`
- `support_table_detail`
- `retention_chart_heatmap`
- all metric guide cards after the most important first cards

Secondary navigation is also lower priority than summary metrics and charts.

## 7. Risks

- Some existing mobile placements already encode a design intent; reordering them too aggressively could weaken familiar executive scanning patterns.
- Tables remain the most likely source of horizontal scrolling even if moved lower.
- Dense chart labels may still require chart-specific styling changes, not just movement.
- Navigation links placed side-by-side may become cramped depending on actual device width.
- The retention heatmap is inherently denser than the retention trend and may still need style-level simplification in addition to placement changes.

## 8. Validation strategy

### Stage 1: static validation

- modify only the existing `Mobile` layout placement entries
- run recursive diff validation
- require zero changes to:
  - datasets
  - steps
  - queries
  - bindings
  - filters
  - measures
  - selections
  - interactions
- require no widget additions or deletions

### Stage 2: visual QA

Validate on the real mobile layout and confirm:

- header appears first
- filters are near the top
- KPI cards are readable
- the first major chart is readable without zooming
- no side-by-side charts remain in cramped widths
- tables are lower on the page
- no excessive horizontal scrolling
- font sizes remain readable
- no widget overlap or clipping

## 9. Recommended safe next step

The safe next implementation target is the existing `Mobile` layout only.

Recommended execution approach:

1. use `layout-mobile` mode against the current `Landing_Page.wdash`
2. restrict edits to `gridLayouts[Mobile].pages[*].widgets[*]`
3. validate against the original file before any deployment
