# Full Product Responsive Wireframe System Plan

**Status:** Proposed. Awaiting user approval before Whimsical implementation.

**Branch:** `storybook-playwright-redesign-foundation`

**Whimsical board:** https://whimsical.com/QUqGyjEEkwewz3C39CZbKJ

## Goal

Turn the existing Dashboard wireframe work into a complete responsive redesign blueprint for every meaningful production screen and major tabbed view in Support Analytics.

The wireframes are not style comps. They define information architecture, responsive composition, visual priority, density, and component geometry before production UI implementation begins.

The core rule is **responsive recomposition, not mechanical stacking**. Each breakpoint must behave like an intentionally designed interface for that width.

## Scope and frame count

The board will use four canonical responsive columns:

1. **Desktop >=1280** — full labeled sidebar.
2. **Compact Desktop 1024–1279** — persistent 56–64px icon rail.
3. **Tablet 768–1023** — drawer navigation, no persistent rail.
4. **Mobile 360–639** — phone-native composition.

Meaningful screen/view rows:

1. Dashboard
2. Calls
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

**Total target:** 13 rows × 4 responsive widths = **52 canonical wireframes**.

The Dashboard row already contains four redesigned responsive frames, leaving **48 new wireframes** to create.

Dark and light themes will not be duplicated as separate low-fidelity Whimsical frames because the geometry is theme-neutral. Theme parity remains a Storybook and implementation acceptance requirement.

## Board organization

Reorganize the Whimsical board as a matrix rather than an unstructured canvas.

### Columns

- Desktop >=1280
- Compact Desktop 1024–1279
- Tablet 768–1023
- Mobile 360–639

### Rows

Each of the 13 screen/view states gets one complete row.

Add a board legend above the matrix containing:

- breakpoint rules
- shell behavior
- grid/spacing rules
- table transformation rules
- KPI rules
- chart hierarchy rules
- labels explaining that these are redesign targets, not current-state captures

The existing Dashboard frames become row 1 and remain the geometry reference for the shared shell.

## Shared geometry system

Before generating screen-specific frames, lock a common responsive geometry language.

### Desktop >=1280

- 200–220px full sidebar.
- Compact topbar.
- 12-column analytical content grid.
- 24px page gutters and approximately 12–16px module gaps.
- Major analytical surfaces may span 8/4 or 7/5 columns.
- Tables receive full-width priority when comparison is the primary task.

### Compact Desktop 1024–1279

- 56–64px icon rail.
- 12-column content grid with reduced gutters.
- Keep analytical side-by-side relationships when labels remain readable.
- Do not behave like a tablet merely because the full sidebar disappears.

### Tablet 768–1023

- No persistent navigation.
- Overlay drawer triggered from topbar.
- 8-column analytical grid.
- Preserve useful 2:1 and 1:1 relationships instead of stacking every module.
- Use four-across compact KPI rows where four metrics can remain legible.
- Reduced-column tables are preferred over immediately converting to cards.

### Mobile 360–639

- 4-column grid.
- 14–16px outer padding and 8–14px module gaps.
- Two-up KPI or summary cards where readable.
- Prioritize one dominant analytical/task surface per screen.
- Convert dense tables to compact row cards only when comparison would otherwise be unusable.
- Secondary content may collapse into summaries with drill-in actions rather than creating extremely long vertical pages.

## Global redesign rules

1. **One dominant job per screen.** Every screen must have a visually obvious primary task or analytical surface.
2. **No arbitrary equal-weight card grids.** Module width reflects information priority.
3. **No vertical KPI stacks on phone/tablet when a readable matrix fits.**
4. **No orphan cards.** KPI counts and column geometry must resolve cleanly at every breakpoint.
5. **Tables remain tables where comparison is the job.** Tablet gets reduced columns; phone gets a purpose-built condensed list only where required.
6. **Filters collapse intelligently.** Keep date/high-frequency controls visible; move lower-frequency filters into a compact Filters action/drawer.
7. **Tabs remain meaningful.** Tablet/mobile may scroll tabs horizontally instead of squeezing or wrapping them into unusable labels.
8. **First viewport matters.** The highest-value content must appear before secondary exports, audit data, and drill-down material.
9. **Avoid decorative empty space and avoid content walls.** Density should feel deliberate.
10. **All geometry must map back to real production data and actions.** Do not invent disconnected features simply to fill space.

---

# Screen-by-screen implementation plan

## Phase 1 — Calls

### Current production responsibilities

- SLA compliance, Avg CSAT, and FCR summary.
- Longest-running call and most-escalated-customer alerts.
- Global filters plus agent, duration, and sort controls.
- Paginated operational call table.
- Export and refresh actions.

### Redesign direction

**Desktop / compact desktop**
- Page header with Export and Refresh in one compact action cluster.
- Three summary metrics in one clean row.
- Operational alerts become a narrow two-up intervention strip instead of competing with the table.
- Consolidate filters into a primary filter bar plus secondary advanced-filter action.
- Calls table is the dominant surface and receives the majority of page height.

**Tablet**
- Three metrics remain across one row when readable.
- Alerts stay two-up.
- Primary filters stay visible; advanced controls collapse.
- Reduced-column table retains Call, Agent, Issue, Duration, Status with secondary metadata in-row.

**Mobile**
- Compact three-metric summary or 2+1 arrangement based on readability.
- One-line priority alert carousel/stack.
- Search/date/filter actions above content.
- Calls become compact operational rows with Call ID/customer, issue, duration, status, and chevron.
- Pagination becomes compact previous/next controls.

Acceptance: the screen reads primarily as a high-density call operations workspace, not a dashboard of cards.

## Phase 2 — Call Detail

### Current production responsibilities

- Call ID + summary + actions.
- CSAT, duration, first response, and region metrics.
- Status/issue/service/priority/sentiment metadata.
- Lifecycle timeline.
- Timing details.
- Agent context.
- Regional issue distribution.
- Similar calls.

### Redesign direction

**Desktop / compact desktop**
- Strong case-detail header with status and primary actions.
- Four key metrics across.
- Metadata condensed into a horizontal facts strip.
- Timeline gets full-width visual priority directly under core facts.
- Lower analytical row uses Timing / Agent / Regional Issue Distribution with intentional unequal spans where useful.
- Similar Calls remains a full-width comparison surface.

**Tablet**
- Four metrics across or 2×2 only if actual label width requires it.
- Timeline remains horizontal.
- Agent and timing share one row; regional issue distribution receives its own wider row if necessary.
- Similar calls remains reduced-column table.

**Mobile**
- Back + call ID + status first.
- 2×2 metrics.
- Metadata becomes compact key/value pairs.
- Timeline becomes a vertical stepper.
- Agent becomes a compact identity card.
- Regional issue distribution becomes a short ranked breakdown.
- Similar calls becomes a concise related-call list.

Acceptance: mobile must feel like a case-detail workflow, not a desktop report squeezed into a phone.

## Phase 3 — Agent Intelligence

### Current production responsibilities

- Top-three spotlight agents.
- CSAT, SLA, Calls, AHT per spotlight agent.
- Full leaderboard with region, performance, and coaching focus.

### Redesign direction

**Desktop / compact desktop**
- Leaderboard becomes the dominant surface.
- Spotlight becomes a compact top-performer strip rather than three oversized equal cards.
- Preserve comparative CSAT/SLA signals and coaching focus.

**Tablet**
- Spotlight becomes a three-across compact strip or horizontally scrollable trio only if required.
- Leaderboard remains a reduced-column comparison table.

**Mobile**
- Top performer presented as one hero summary followed by compact rank #2/#3 rows.
- Leaderboard becomes ranked agent rows with CSAT/SLA micro-bars and coaching focus drill-in.
- Avoid a long stack of full metric cards for each agent.

Acceptance: the hierarchy should communicate ranking and intervention opportunities immediately.

## Phase 4 — Metrics / Overview

### Current production responsibilities

- Seven metric KPIs.
- Tab switcher.
- Call-volume analysis.
- Issue breakdown.
- Duration trend.
- SLA analysis and additional operational comparisons.

### Redesign direction

The existing seven equal KPI cards are too dense for a hierarchy-first redesign.

- Promote four primary metrics: Total Interactions, Avg Handle Time, Resolution Rate, Escalations.
- Move SLA Compliance, Avg CSAT, and FCR into a compact secondary-stat strip.

**Desktop / compact desktop**
- Four primary KPIs across.
- Three secondary stats in a narrow context row.
- Dominant volume chart full or 2/3 width depending on supporting context.
- Issue Breakdown + Duration Trend form a balanced analytical row.
- SLA analysis receives its own compact full-width surface.

**Tablet**
- Four KPIs across.
- Three secondary stats across.
- Volume chart remains dominant.
- Issue/Duration use a useful 1:1 split when readable.

**Mobile**
- 2×2 primary KPIs.
- Three secondary stats as compact chips/mini-stat row.
- Horizontally scrollable Metrics tabs.
- Dominant chart followed by compact secondary analysis summaries.

## Phase 5 — Metrics / Volume

Create a distinct responsive view for the actual Volume tab rather than assuming the Overview frame covers it.

- Volume trend is the hero surface.
- Resolved / Escalated / All series hierarchy remains visible.
- Supporting SLA/channel/volume context is placed below or alongside based on width.
- Mobile prioritizes trend readability and reduces axis/tick density before shrinking typography.

## Phase 6 — Metrics / Breakdown

- Issue/category breakdown becomes the dominant analysis.
- Supporting duration/context surfaces become secondary.
- Desktop uses side-by-side comparison only when it helps interpretation.
- Mobile uses ranked horizontal bars and compact issue rows rather than a squeezed desktop chart.

## Phase 7 — Metrics / Regions

- Region performance becomes the dominant comparison surface.
- Desktop/compact desktop use a rich comparison table/ranked matrix.
- Tablet uses reduced columns while preserving region, volume, SLA, CSAT, and escalation signal.
- Mobile uses ranked region rows with high-signal metrics and a drill-in affordance.
- Do not invent a map unless production data/interaction later justifies one.

## Phase 8 — Customer 360 / Overview

### Current production responsibilities

- Total Accounts, Avg Health, At-risk MRR, Churn Risk.
- Health distribution.
- Churn risk queue.
- Recommended actions.
- BI export availability.

### Redesign direction

**Desktop / compact desktop**
- Four KPIs across.
- Churn Risk Queue is the dominant operational surface.
- Health Distribution is supporting context rather than equal-weight filler.
- Recommended Actions receives intervention priority.
- BI Exports move lower in hierarchy.

**Tablet**
- Four KPIs across.
- Health Distribution + compact risk summary may share a row.
- Churn queue gets full width.
- Actions + exports can share lower row if readable.

**Mobile**
- 2×2 KPIs.
- Risk summary replaces a large donut as the first health visualization.
- Churn queue becomes prioritized account cards.
- Recommended actions follow.
- BI exports become compact utility rows near the bottom.

## Phase 9 — Customer 360 / Churn Risk

- Risk-level filters become a compact segmented/filter control.
- The at-risk account list/table is the primary surface.
- Desktop preserves high-density comparison fields.
- Tablet reduces fields but keeps Account, MRR/LTV, Health, Risk Driver, CSM.
- Mobile uses prioritized account cards with risk, MRR, health, driver, CSM, and recommended action.
- Critical/At Risk accounts must be visually scannable without relying on large card stacks.

## Phase 10 — Customer 360 / Retention

- Retention cohort matrix/heatmap is the hero analytical surface.
- LTV-by-segment is supporting analysis.
- Segment performance is a lower comparison surface.
- Tablet preserves cohort comparison instead of immediately flattening the matrix.
- Mobile uses horizontally scrollable cohort columns or condensed cohort rows rather than destroying the time-series relationship.

## Phase 11 — Customer 360 / LTV

- Segment LTV summary remains compact.
- LTV by Segment + Plan chart is dominant.
- Expansion Opportunities is the primary operational follow-through surface.
- Desktop/tablet use a dense comparison table.
- Mobile uses prioritized opportunity cards with Account, MRR, LTV, Health, Segment, and CSM.

## Phase 12 — Settings / Manifest

### Current production responsibilities

- Runtime mode.
- Manifest refresh state/action.
- Dataset manifest details.
- Schema columns.
- Audit trail.

### Redesign direction

**Desktop / compact desktop**
- Runtime Mode and Refresh form a compact system-status header row.
- Dataset Manifest becomes a concise metadata panel.
- Schema Columns and Audit Trail are the two primary technical surfaces below.
- Audit Trail receives more width/visual weight than static metadata where appropriate.

**Tablet**
- Runtime + Refresh remain side by side.
- Manifest becomes a compact full-width detail band.
- Schema and Audit use stacked full-width tables or an intentional split if readable.

**Mobile**
- Runtime state is immediately visible.
- Refresh action remains reachable without consuming a whole card.
- Manifest rendered as compact key/value rows.
- Schema becomes a compact field/type list.
- Audit Trail becomes event rows with operation/result/time and expandable detail.

Acceptance: Settings should feel like a controlled operational console, not a stack of unrelated admin cards.

---

# Phase 13 — Cross-screen board audit

After all 48 new frames are created:

1. Render the entire Whimsical board as an image.
2. Check row alignment and column consistency.
3. Verify all 13 screen/view rows are present.
4. Verify all four breakpoint columns are present for every row.
5. Compare shell geometry across all screens.
6. Check that mobile frames are not excessive vertical stacks.
7. Check that tablet frames actually use tablet width.
8. Check for orphan cards, accidental empty regions, and arbitrary equal-weight modules.
9. Check tables for intentional desktop → tablet → mobile transformations.
10. Check that the first viewport of each screen communicates the screen's main task.
11. Iterate any frame that fails the geometry review before calling the board complete.

# Phase 14 — Repository design-contract sync

After the Whimsical board passes visual review, update documentation only:

- Add `docs/design-audit/full-product-wireframe-spec.md` with the final per-screen geometry contract.
- Update `docs/design-audit/responsive-breakpoint-spec.md` with route-specific responsive rules where needed.
- Add the Whimsical board link and screen matrix.
- Record the final canonical frame count and view names.

No production components/pages are changed in this phase.

# Review gate

Stop after the complete Whimsical system and documentation are produced.

The user reviews the 52-frame blueprint before any production UI redesign implementation begins.

Do **not**:

- redesign production components during wireframe creation
- reset Playwright visual baselines
- merge PR #13
- mark PR #13 ready for review
- treat a generated frame as accepted without visually auditing the board

# Definition of done

The wireframe phase is complete only when:

- 52 canonical responsive frames exist on the board.
- The existing 4 Dashboard frames remain valid or are improved if the cross-screen system exposes inconsistencies.
- Every production route has four responsive compositions.
- Metrics has separate Overview, Volume, Breakdown, and Regions rows.
- Customer 360 has separate Overview, Churn Risk, Retention, and LTV rows.
- Desktop, compact desktop, tablet, and phone behaviors are visibly different where the content requires recomposition.
- No phone/tablet frame is merely a vertically stacked desktop layout.
- The entire board has been visually inspected after generation.
- The final design-contract docs match the actual board.
- Production UI remains unchanged pending a separate explicit approval.