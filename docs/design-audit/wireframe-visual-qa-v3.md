# V3 Responsive Wireframe Visual QA

Status: **Revision pass complete, pending user review before production UI implementation.**

Whimsical board: https://whimsical.com/7qfTKyGnvSoxzLe8hsUjvS

Date: 2026-08-21

## Scope

The audit covers the full v3 responsive wireframe matrix, 13 canonical screen/view rows across four representative responsive tiers, for 52 compositions total:

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

Representative columns are Desktop >=1280, Compact Desktop 1024-1279, Tablet 768-1023, and Mobile 360-639.

## QA rubric

Every row was reviewed for:

- application-shell consistency and navigation behavior
- hierarchy and primary-vs-secondary information weight
- responsive recomposition rather than mechanical stacking
- preservation of high-value information as width decreases
- table-to-list transformation on narrow screens
- density, readable grouping, and scan order
- consistency of KPI meaning across related analytical views
- consistency with the repository's existing product semantics
- implementation specificity, avoiding ambiguous wireframe placeholders where structure matters
- mobile prioritization, especially whether important actions or risk signals disappeared entirely

## Revision summary

### Board-level presentation

**Revised.** The board title had become a narrow vertical block that competed with the first row label. It is now a single horizontal title across the matrix. Responsive tier labels were widened and centered over their actual columns.

### 01 Dashboard / Overview

**Pass.**

- Four primary KPIs remain Interactions, Avg Handle Time, Resolution Rate, and Escalations.
- Call Volume remains the dominant analytical surface.
- Issue Mix is subordinate.
- Region Performance and Priority Insight remain clearly secondary.
- Latest Calls remains full-width at tablet/desktop and becomes a compact Recent Calls surface on mobile.
- Mobile keeps the intentional 2x2 KPI geometry rather than a vertical stack.

No structural revision required.

### 02 Calls / Operations

**Pass.**

- Desktop retains the operational table and comparison density.
- Tablet reduces columns instead of crushing them.
- Mobile converts the table into individually scannable call rows with the highest-value metadata.
- Search/filter affordances remain visible without consuming the full viewport.

No structural revision required.

### 03 Call Detail

**Pass.**

- Desktop and compact desktop preserve KPI, lifecycle, agent, region, and similar-call context.
- Tablet reduces simultaneous columns while keeping the same reading hierarchy.
- Mobile correctly changes the lifecycle into a vertical timeline and compresses agent, region, and similar-call context into short drill-in surfaces.

No structural revision required.

### 04 Agent Intelligence

**Pass.**

- Desktop/compact preserve ranking, filters, coaching priorities, and team distribution.
- Tablet drops lower-value columns while retaining leaderboard comparability.
- Mobile converts the table to a ranked agent list and preserves coaching focus separately.

No structural revision required.

### 05 Metrics / Overview

**Revised, high-impact.**

The initial composition inherited too much operational-dashboard content. It used Avg CSAT as one of the four top KPIs and used Latest Calls/Priority Insights where the Metrics product surface is more strongly defined by analytical drilldowns.

Changes:

- Replaced Avg CSAT in the primary four with **Escalations**, producing a consistent analytical set: Calls, Resolution, Escalations, Avg Handle Time.
- Replaced Priority Insights with **Duration Trend**.
- Replaced Latest Calls with **Rolling SLA by issue**.
- Tablet now pairs Region Performance with Rolling SLA rather than operational call activity.
- Mobile keeps the strongest three analytical layers: Call Volume, Issue Mix, and Duration Trend.
- Repaired the compact-desktop composition after the board-wide render exposed an obstructed/blank content layer. The compact geometry was restored explicitly above the obstructing layer and verified at object level.

This now aligns the overview with the repository's existing Metrics semantics: volume, breakdown, duration/SLA movement, and region analysis.

### 06 Metrics / Volume

**Pass.**

- Daily Call Volume remains the hero surface at every tier.
- Resolution movement and channel mix remain secondary on larger widths.
- Mobile collapses those details into a concise peak-demand/channel summary rather than stacking multiple large charts.

No structural revision required.

### 07 Metrics / Breakdown

**Pass.**

- Top issue and highest-cost signals are surfaced before deeper breakdown.
- Issue Mix remains the primary comparison surface.
- Handling cost and escalation pressure retain enough context on desktop/tablet.
- Mobile reduces the table-like analysis to a compact cost-and-pressure summary.

No structural revision required.

### 08 Metrics / Regions

**Pass.**

- Region KPI summaries remain concise.
- Regional volume/quality is dominant.
- Regional health is secondary.
- The comparison module progressively removes columns rather than shrinking text.
- Mobile retains ranking and comparison rather than collapsing into isolated region cards only.

No structural revision required.

### 09 Customer 360 / Overview

**Pass.**

- Four account-health KPIs remain available at every representative tier.
- Health distribution remains primary context.
- Risk Signals are visible where space permits.
- Mobile correctly prioritizes Health Distribution and the Churn Risk Queue over lower-value export metadata.

No structural revision required.

### 10 Customer 360 / Churn Risk

**Revised.**

The first mobile wireframe dropped the **Critical Accounts** count, even though desktop/tablet consistently presented Portfolio Risk, Critical Accounts, and MRR at Risk as the primary risk summary.

Changes:

- Mobile now presents three compact KPI cards: **16% Risk**, **3 Critical**, and **$28k MRR Risk**.
- The risk-account list remains immediately below them.

This preserves the risk triage hierarchy without materially increasing vertical depth.

### 11 Customer 360 / Retention

**Revised.**

The initial mobile composition preserved Retention Cohorts but replaced the more actionable Segment Performance analysis with an LTV-only ranking. That removed health/churn context from the Retention screen.

Changes:

- Replaced the mobile LTV-only ranking with **Segment Performance**.
- Mobile now retains Enterprise, Mid-market, and SMB health, churn, and LTV context beneath Retention Cohorts.

LTV remains available on its dedicated tab, so this version better preserves the purpose of Retention.

### 12 Customer 360 / LTV

**Pass.**

- Desktop/tablet retain the grouped LTV-by-segment-and-plan surface plus expansion opportunities.
- Mobile converts the chart to a simple LTV ranking and presents expansion opportunities as tappable account cards.
- The strongest opportunity is intentionally more prominent than subsequent rows.

No structural revision required.

### 13 Settings / Manifest

**Revised.**

The initial mobile composition retained runtime mode, freshness, manifest, and recent events but dropped **Pipeline Operations** entirely. That removed the page's main actions.

Changes:

- Mobile now explicitly exposes **Run ETL, Export BI, Validate, and Sync Types**.
- Recent pipeline events remain in the same compact lower surface.
- Runtime mode, freshness, and manifest remain separate scan blocks.

This preserves both inspection and action capability on narrow screens.

## Visual hierarchy result

The matrix now has a consistent cross-product rhythm:

1. page context and filters
2. primary KPI or state summary
3. dominant analysis/work surface
4. secondary comparison/context
5. drill-in or supporting operational detail

Mobile variants are not miniature desktop screens. Tables become lists, multi-column metadata becomes short reading flows, and lower-priority information is summarized or deferred rather than merely squeezed.

## Remaining implementation-time checks

These are intentionally deferred to Storybook and Playwright because a structural wireframe cannot validate them precisely:

- actual text truncation and line wrapping at 360 and 390px
- 40-44px touch-target behavior
- horizontal overflow at 360, 390, 640, 768, 1024, 1280, 1440, and 1536/1600
- exact chart tick density and label readability
- drawer focus trapping and independent scrolling
- light/dark contrast and visual-regression parity
- breakpoint edge checks at 767/768, 1023/1024, and 1279/1280
- loading, empty, error, stress, and long-content states

## Implementation boundary

This revision pass modifies the wireframe target and documentation only. It does **not** authorize or implement production UI changes. PR #13 should remain draft and unmerged until the user approves the revised wireframe direction.