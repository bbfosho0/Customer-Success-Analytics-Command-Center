# Wireframe Visual QA and Revision Pass

Status: **Complete for the v3 wireframe review gate. Production UI implementation has not started.**

Whimsical board: https://whimsical.com/7qfTKyGnvSoxzLe8hsUjvS

Date: 2026-08-21

## Scope

This pass reviews the complete 52-composition responsive wireframe matrix across 13 canonical product views and four representative tiers:

- Desktop >=1280
- Compact Desktop 1024-1279
- Tablet 768-1023
- Mobile 360-639

The review was performed against:

- `docs/design-audit/responsive-breakpoint-spec.md`
- `docs/design-audit/visual-baseline.md`
- the current Storybook-oriented page implementations under `frontend/src/figma/pages/`
- the actual Whimsical v3 board, inspected by row and responsive tier using rendered board snapshots

This was not a cosmetic-only review. It checked information architecture, responsive recomposition, feature truthfulness, hierarchy, density, scan behavior, and implementation feasibility.

## Result

The v3 board remains a 13 x 4 matrix, 52 compositions total. The revision pass corrected structural and product-model issues without creating a replacement concept board.

The wireframe is now suitable for user review before production redesign implementation.

## Severity summary

### P0, structural correctness

Resolved:

1. **Mobile Dashboard lost filter context.**
   - Added a dedicated phone filter/context row above the 2 x 2 KPI matrix.
   - The phone hierarchy is now: topbar, date/filter context, four KPIs, dominant call-volume surface, secondary signals, priority insight, recent calls.

2. **Metrics did not preserve its real internal navigation model.**
   - Added an explicit Overview / Volume / Breakdown / Regions tab treatment across all four responsive tiers.
   - This keeps Metrics as one drill-down workspace rather than four visually unrelated pages.

3. **Metrics Overview contained dashboard-specific or unsupported surfaces.**
   - Removed the conceptual dependence on Dashboard-only priority-insight/latest-call modules.
   - Reframed the overview around the real metrics model: four primary operational KPIs, call volume, issue breakdown, duration trend, service quality, and regional comparison.

4. **Metrics Breakdown included unsupported cost analytics.**
   - Replaced invented handling-cost and cost-per-call surfaces with current product capabilities: issue breakdown, duration trend, FCR, and Automation Pilot.

5. **Customer 360 Overview KPI model did not match the implemented product.**
   - Replaced expansion/general MRR cards with the implemented overview KPIs: account count, average health, at-risk MRR, and churn risk.
   - Replaced generic risk-signal treatment with recommended actions, matching the actual Customer 360 workflow.

6. **Customer 360 Churn Risk lacked its primary filter interaction.**
   - Replaced redundant derived KPI strips with the real risk filter model: All, Critical, At Risk, Watch, Healthy.
   - Added the same filter context on tablet and phone.

7. **Customer 360 LTV omitted the segment-level summary KPIs on larger layouts.**
   - Added Enterprise, Mid-market, and SMB average-LTV cards on desktop, compact desktop, and tablet.
   - Mobile retains the more space-efficient LTV ranking treatment.

8. **Settings represented unsupported operational controls.**
   - Removed conceptual Run ETL / Export BI / Validate Schema / Sync Types controls from the Settings wireframe.
   - Replaced them with the implemented Settings model: Runtime Mode, Refresh Manifest, Dataset Manifest, Columns, and Audit Trail.
   - Added Columns to the mobile composition rather than silently dropping schema information.

### P1, visual hierarchy and scan behavior

Resolved:

1. **Dense operational surfaces were centered like presentation cards.**
   - Left-aligned the highest-density tables/lists in Calls, Agent Intelligence, Metrics regional comparison, Customer 360 queues/cohorts, LTV opportunities, and Settings audit/schema surfaces.
   - This does not prescribe final table styling, but it establishes the correct scan direction and information hierarchy.

2. **Metrics primary KPI order was inconsistent with the redesign contract.**
   - Normalized the four principal metrics to Interactions, Avg Handle Time, Resolution Rate, and Escalations.
   - Mobile uses an explicit 2 x 2 matrix.

3. **Metrics region semantics were ambiguous.**
   - Renamed the dominant Regions visualization to `Region comparison, resolved vs escalated`, aligning the wireframe with the actual chart behavior.

4. **Settings mobile dropped meaningful content.**
   - Added the analytics-contract Columns summary between manifest details and recent pipeline events.

### P2, board quality and maintainability

Resolved:

1. **Hidden duplicate objects existed in Metrics / Overview compact desktop.**
   - Removed stacked duplicate header/KPI objects that visually appeared correct at a glance but would make future board editing error-prone.
   - A second duplicate Escalations object was found during spatial overlap QA and removed.

2. **Two-line Metrics headers initially collided with the KPI row.**
   - Reduced header typography and constrained the header block to restore clear vertical separation.
   - A final spatial overlap check confirmed the revised header/KPI region no longer overlaps.

## Screen-by-screen QA

| Row | View | QA outcome | Revision status |
| --- | --- | --- | --- |
| 01 | Dashboard / Overview | Strong hierarchy; phone was missing filter context | Revised |
| 02 | Calls / Operations | Responsive table-to-card strategy is sound; dense desktop/tablet content needed stronger scan direction | Revised |
| 03 | Call Detail | Strong responsive decomposition; phone timeline and metadata hierarchy remain appropriate | Approved as drawn |
| 04 | Agent Intelligence | Leaderboard hierarchy is coherent; dense ranking surfaces needed left-aligned scan behavior | Revised |
| 05 | Metrics / Overview | Major product-model mismatch and hidden duplicate layers | Substantially revised |
| 06 | Metrics / Volume | Hero trend hierarchy was strong; secondary summaries were not aligned to the actual Metrics model | Revised |
| 07 | Metrics / Breakdown | Unsupported cost analytics and weak product truthfulness | Substantially revised |
| 08 | Metrics / Regions | Strong geometry; improved tab context, chart semantics, and table scan behavior | Revised |
| 09 | Customer 360 / Overview | Geometry strong; KPI and recommended-action semantics needed correction | Revised |
| 10 | Customer 360 / Churn Risk | Risk-list recomposition strong; primary risk filter was missing | Revised |
| 11 | Customer 360 / Retention | Cohort/LTV/segment hierarchy is strong; improved dense-data scan behavior | Minor revision |
| 12 | Customer 360 / LTV | Chart/opportunity hierarchy strong; larger tiers were missing LTV summary KPIs | Revised |
| 13 | Settings / Manifest | Geometry strong; operational model was inaccurate and mobile omitted schema content | Substantially revised |

## Responsive QA conclusions

### Desktop >=1280

- Full navigation remains appropriate.
- Analytical hierarchy has enough width without turning every metric into an equal-weight tile.
- Major tables and analytical surfaces now read as operational UI rather than centered presentation blocks.
- LTV and Customer 360 summaries expose enough first-glance context before deeper charts/tables.

### Compact Desktop 1024-1279

- Compact rail remains the correct shell transition.
- Content density is still high enough for analytical work without copying the full desktop sidebar.
- Hidden duplicate-layer defects in Metrics were removed.
- Four-up KPI geometry remains viable at this tier.

### Tablet 768-1023

- No persistent navigation rail is represented.
- Four-up KPI layouts remain viable where the content is short and numeric.
- Complex tables reduce columns or become summarized comparisons rather than merely shrinking desktop content.
- Churn Risk now retains its filter context.
- LTV now retains the three segment summary KPIs.

### Mobile 360-639

- Dashboard preserves the required 2 x 2 KPI matrix.
- Dashboard now exposes date/filter context before the KPI matrix.
- Calls uses list/card recomposition rather than a squeezed desktop table.
- Call Detail becomes a vertical timeline/read-flow.
- Metrics tabs remain visible as compact navigation context.
- Churn Risk retains risk filtering rather than exposing only one derived metric.
- Customer 360 Overview uses 2 x 2 KPIs and a compact risk queue.
- LTV uses a ranking instead of forcing three large summary cards above the chart.
- Settings now retains runtime, refresh, manifest, schema, and audit information.

## Product truthfulness checks

The revision intentionally uses the current application as a constraint rather than inventing portfolio-looking features that are not supported.

### Dashboard

Validated against `frontend/src/figma/pages/dashboard.tsx`:

- Total interactions
- Avg handle time
- Resolution rate
- Escalations
- Call volume
- Issue breakdown
- Region performance
- Insights
- Latest calls

The redesign still intentionally moves Active Regions out of the primary KPI group and into context/region reporting.

### Metrics

Validated against `frontend/src/figma/pages/metrics.tsx`:

- Overview / Volume / Breakdown / Regions tabs
- Call volume by day
- Rolling SLA by issue type
- Issue type breakdown
- Duration trend
- Automation pilot
- Channel/service-quality reporting
- Region comparison

Unsupported cost-per-call analytics were removed from the wireframe target.

### Customer 360

Validated against `frontend/src/figma/pages/customer-analytics.tsx`:

- Overview / Churn Risk / Retention / LTV tabs
- account count, avg health, at-risk MRR, churn risk
- health distribution
- churn risk queue
- recommended actions
- BI export availability
- risk-level filtering
- retention cohorts
- LTV by segment
- segment performance
- expansion opportunities

### Settings

Validated against `frontend/src/figma/pages/settings.tsx`:

- runtime mode
- manifest refresh
- dataset manifest metadata
- analytics-contract columns
- audit trail

The wireframe no longer implies direct ETL/schema-operation controls that the current Settings UI does not provide.

## Implementation watchouts, not remaining wireframe blockers

These should be validated when production UI work begins:

1. **640-767 behavior**
   - The 52-board matrix uses 360-639 as its phone representative.
   - The `sm` tier still needs explicit browser QA during implementation.

2. **Breakpoint edges**
   - Test 767/768, 1023/1024, and 1279/1280 so shell transitions do not produce one-pixel discontinuities.

3. **Chart contrast**
   - The existing visual baseline identified weak dark-theme chart contrast.
   - Production redesign must validate ticks, labels, gridlines, fills, and hover/tooltip states in both themes.

4. **Extreme values**
   - Very large numeric values can still pressure KPI/chart labels.
   - Use bounded number formatting and abbreviations before reducing typography below readable sizes.

5. **Tables and mobile overflow**
   - Dedicated operational tables may use intentional internal horizontal scrolling where comparison requires it.
   - Page-level horizontal overflow remains unacceptable.

6. **Interactive state coverage**
   - The board defines normal responsive geometry, not every loading, empty, error, focus, hover, selected, dirty-filter, and long-content state.
   - Storybook remains the executable source for those state permutations.

7. **Touch and keyboard behavior**
   - Compact mobile controls must remain at least 40px, preferably 44px, in the implementation.
   - Focus visibility and drawer dismissal must be verified in browser QA.

## Review gate

The wireframe target is complete enough for design review. Do not begin production redesign implementation until the wireframe direction is approved.

After approval, production work should proceed in small Storybook-backed slices with Playwright screenshot verification at each canonical breakpoint and both themes.
