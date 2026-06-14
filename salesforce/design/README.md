# CRM Analytics Style System

## What this does

This folder defines the structured style system and audit tooling for the Salesforce CRM Analytics dashboards.

The source of truth is:

- `salesforce/design/design-system.json`

It translates the design specification into machine-readable tokens and rules for:

- color
- typography
- card and widget styling
- KPI styling
- chart styling
- table styling
- filter styling
- desktop, tablet, and mobile layout guidance
- safety boundaries for future automation

It does not change any dashboard JSON by itself.

## How it will be used

This style system drives the controlled normalizer used by the Salesforce metadata builder and can also be run directly for focused audit and review passes.

That normalizer should:

1. Load a CRM Analytics dashboard JSON file.
2. Preserve a backup or before-state.
3. Traverse widgets and layout placements.
4. Apply tokenized visual rules by widget category and semantic role.
5. Optionally apply layout normalization only when explicitly enabled.
6. Compare before and after state.
7. Fail if forbidden functional fields changed.
8. Save only approved style or layout updates.
9. Report modified and skipped widgets.

The supported execution modes defined in `design-system.json` are:

- `audit`
- `style-only`
- `layout-normalize`
- `diff-check`

Use `--overview-only` when working on the Customer Success Command Center
Executive Overview. This limits the compiler to `overview_*` widgets and the
`cscc-overview` placements in the existing desktop and mobile layouts.

The safe overview workflow is:

```powershell
python salesforce/design/apply_crma_style.py `
  salesforce/force-app/main/default/wave/Landing_Page.wdash `
  --mode style-only --overview-only `
  --output salesforce/output/Landing_Page.overview-style.wdash

python salesforce/design/validate_crma_dashboard.py `
  salesforce/force-app/main/default/wave/Landing_Page.wdash `
  salesforce/output/Landing_Page.overview-style.wdash `
  --mode style-only --overview-only

python salesforce/design/apply_crma_style.py `
  salesforce/output/Landing_Page.overview-style.wdash `
  --mode layout-mobile --overview-only `
  --output salesforce/output/Landing_Page.overview-final.wdash
```

For the normal repo workflow, prefer:

```powershell
python salesforce/scripts/build_salesforce_crma_metadata.py --overview-only
```

That path rebuilds `Landing_Page` and reapplies the approved Executive Overview
style pass in one step.

The mobile mode uses the dashboard's existing `Mobile` layout. It does not
create a tablet layout or force mobile placements into the desktop grid.

## What it is allowed to change

The style system is designed for visual and layout-only normalization.

Allowed categories:

- widget and card background colors
- border colors, radii, and widths
- text colors, font sizes, and font weights
- KPI colors and KPI presentation
- chart fill colors, axis label styling, gridline styling, and legend visibility when meaning is unchanged
- table header and body styling
- table row height and padding
- widget placement values in optional layout-normalization mode
- device-specific layout metadata only if the dashboard schema clearly supports it
- reusable style constants and normalizer logic
- non-destructive JSON formatting

## What it must never change

The style system must not alter anything functional.

Forbidden categories:

- dataset names or dataset references
- query definitions
- SAQL, SQL, or SOQL
- step names or step logic
- measures, dimensions, filters, or limits
- filter bindings, selection bindings, interaction bindings, or faceting behavior
- navigation targets
- widget IDs or step IDs
- field names or calculated fields
- metric definitions, currency semantics, or number-formatting semantics
- joins, recipes, dataflows, security predicates, or permissions
- generated data
- business meaning of labels
- widget deletion
- new metric widgets

## Desktop, tablet, and mobile intent

The system includes separate rules for desktop, tablet, and mobile layouts.

Desktop intent:

- Moderate information density.
- One KPI row with five equal tiles.
- A split main insight row and split action row.
- Clean alignment and consistent card spacing.

Tablet intent:

- Reduced side-by-side density.
- Filters arranged two per row where possible.
- KPI cards in two or three columns.
- Charts allowed to go full-width when labels get cramped.

Mobile intent:

- Single-column reading flow by default.
- Filters near the top.
- KPI cards immediately after filters.
- Charts full-width.
- Dense tables lower in the page.
- No destructive responsive rewrite unless the dashboard JSON clearly supports device-specific layout behavior.

If responsive layout support is unclear, the intended behavior is:

- apply `style-only` safely
- avoid destructive mobile rewrites
- produce a layout proposal instead of forcing unsupported layout changes

## Safety model

Future automation using this style system should always run a before/after diff check and fail if functional categories changed.

The minimum protected categories are:

- datasets
- queries
- steps
- bindings
- measures
- dimensions
- filters
- facets
- navigation targets
- widget IDs
- step IDs
- field references
- calculated fields
- security settings
