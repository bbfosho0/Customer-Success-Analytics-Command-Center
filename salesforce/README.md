# Salesforce Analytics Workspace

This folder is the single Salesforce workspace for the project. It versions both the CRM Analytics metadata layer and the Salesforce-native LWC app layer. The CSV exports under `data/salesforce_crma/` remain the generated sample-data boundary consumed by this workspace.

The metadata uses API version 66.0 and is designed for a CRM Analytics-enabled Developer Edition org. It demonstrates deployable dashboard and extended metadata assets; it is not a production connector, scheduled synchronization process, or managed package.

## Workspace map

- `force-app/main/default/wave/`: deployable Wave dashboards, app metadata, and XMD
- `force-app/main/default/lwc/`: surfaced Salesforce dashboard app pages
- `force-app/main/default/classes/`: Apex controllers and server-side sample-data parsing
- `force-app/main/default/staticresources/`: packaged sample-data payloads for the LWC app
- `manifest/`: scoped deploy manifests
- `scripts/`: Salesforce-specific metadata builders, sample-data packaging, and upload helpers
- `design/`: style system, dashboard inventory tools, validators, and layout plans
- `docs/`: subsystem documentation, QA notes, and BI mapping material
- `tests/`: Salesforce-specific pytest coverage
- `output/`: local generated audit reports and temporary styled `.wdash` variants

## Current surfaced app

The current user-facing Salesforce experience is a custom Lightning app, `Customer Success Command Center`, with four LWC pages:

- `Command Center`
- `At-Risk Drilldown`
- `Expansion Pipeline`
- `Retention Cohorts`

Those pages are powered by `CustomerSuccessDashboardController`, which reads packaged sample data from the static resource `CustomerSuccessDashboardSampleData`. The payload is generated from the checked-in CSV exports under `data/salesforce_crma/`.

## Experience Cloud site

The repo now includes a working public Experience Cloud surface:

- all four dashboard LWCs expose `lightningCommunity__Page`
- `force-app/main/default/settings/Communities.settings-meta.xml` enables Digital Experiences metadata through source control
- `customerSuccessExperienceHost` is the public LWC app shell for brand, active top navigation, and `?page=` routing
- the public LWR site reuses the existing four dashboard LWCs and the same Apex plus packaged sample-data runtime
- the seeded site metadata is versioned under:
  - `force-app/main/default/digitalExperiences/site/Customer_Success_Portfolio1/`
  - `force-app/main/default/digitalExperienceConfigs/`
  - `force-app/main/default/sites/`
  - `force-app/main/default/profiles/Customer Success Portfolio Profile.profile-meta.xml`

The target org has a seeded Experience site at:

`https://notapplicable-22b-dev-ed.develop.my.site.com/csccportfolio/?page=command-center`

Current runtime status:

- the anonymous public route renders all four custom LWC dashboards
- the Experience shell, styling, Apex access, and packaged sample-data runtime are deployed
- top-nav clicks update the active LWC page immediately without requiring a manual browser refresh
- the verified public route format is:
  - `...?page=command-center`
  - `...?page=at-risk-drilldown`
  - `...?page=expansion-pipeline`
  - `...?page=retention-cohorts`
- the Experience nav and command-center CTAs use that same URL model so public sharing stays consistent

GitHub Pages remains the public web app. The Experience site is the Salesforce-hosted companion surface.

## Versioned metadata

- `Customer_Success_Command_Center` Wave application
- `Landing_Page` command center dashboard
- `At_Risk_Account_Dashboard` drilldown
- `Expansion_Pipeline_Dashboard` drilldown
- `Retention_Cohort_Dashboard` drilldown
- Six matching WaveXmd datasets

Dashboard JSON is generated from the checked-in metadata with:

```powershell
python salesforce/scripts/build_salesforce_crma_metadata.py
```

Treat `salesforce/design/` as the source of truth for presentation rules and
dashboard QA. Do not scatter one-off edits across generated `.wdash` files
unless you are intentionally changing the metadata baseline itself.

For a command-center-only refresh that leaves the three drilldowns and all XMD
assets untouched, use:

```powershell
python salesforce/scripts/build_salesforce_crma_metadata.py --landing-only
```

For an Executive Overview refresh that preserves the other five internal
`Landing_Page` pages as well as all drilldowns and XMD assets, use:

```powershell
python salesforce/scripts/build_salesforce_crma_metadata.py --overview-only
```

## Refresh data and deploy

Run these commands from the repository root. The metadata builder and upload
helper now live inside `salesforce/`; the dataset export remains a root script
because it writes the shared `data/salesforce_crma/` artifacts.

```powershell
python scripts/generate_customer_portfolio_sample.py --accounts 100
python scripts/generate_customer_analytics.py
python scripts/export_salesforce_crma.py
python salesforce/scripts/build_dashboard_sample_resources.py
python salesforce/scripts/build_salesforce_crma_metadata.py
python -m pytest salesforce/tests
npm --prefix salesforce run verify:experience
```

Stable compatibility wrappers also exist at:

```powershell
python scripts/build_salesforce_crma_metadata.py
python scripts/upload_salesforce_crma.py
```

Those root paths delegate to the maintained implementations inside
`salesforce/scripts/`.

Before metadata deployment, overwrite the `Churn_Risk_Accounts` and `Expansion_Opportunities` datasets. Both now include `Customer_Success_Manager__c`, which is referenced by dashboard selectors and tables. Preserve the six dataset API names listed in `manifest/package.xml`.

For an org where those aliases already exist, the authenticated Salesforce CLI helper performs the overwrite and waits for processing:

```powershell
python salesforce/scripts/upload_salesforce_crma.py --target-org <org-alias>
```

The helper derives External Data metadata from the checked-in schema JSON and stores no credentials or org IDs. Analytics Studio remains the fallback for an initial upload.

Then `cd salesforce` and validate or deploy the metadata in place:

```powershell
sf project deploy start --target-org <org-alias> --manifest manifest/package.xml --dry-run --wait 30
sf project deploy start --target-org <org-alias> --manifest manifest/package.xml --wait 30
sf community publish --name "Customer Success Portfolio" --target-org <org-alias>
```

To validate or deploy only the command center:

```powershell
sf project deploy start --target-org <org-alias> --manifest manifest/landing-page.xml --dry-run --wait 30
sf project deploy start --target-org <org-alias> --manifest manifest/landing-page.xml --wait 30
```

Use `sf project retrieve start --target-org <org-alias> --manifest manifest/package.xml` only when intentionally refreshing the Git baseline from an org. A retrieve can replace local dashboard JSON.

## Public Experience routes

The public Experience site exposes these query-param routes:

1. `...?page=command-center`
2. `...?page=at-risk-drilldown`
3. `...?page=expansion-pipeline`
4. `...?page=retention-cohorts`

One-time org-side prerequisites that are not fully source-managed:

- Digital Experiences must be enabled in the org.
- The Experience domain must already be set.
- The Experience Network sender address must be configured in the site's Administration settings because Salesforce requires it to match the target org.
- The site must be published after deploy.
- The Experience guest profile must retain Apex access to `CustomerSuccessDashboardController`.

Verify the published public site with:

```powershell
npm --prefix salesforce run verify:experience
```

Use `EXPERIENCE_BASE_URL` to point the verifier at another published site:

```powershell
$env:EXPERIENCE_BASE_URL = "https://example.my.site.com/csccportfolio/"
npm --prefix salesforce run verify:experience
```

## Design workflow

Use the files under `salesforce/design/` as the only hand-maintained design surface.

1. Inspect metadata in `force-app/main/default/wave/`.
2. Inventory the dashboard JSON with `salesforce/design/inventory_crma_dashboard.py`.
3. Apply style or layout transforms into `salesforce/output/`.
4. Validate that functional JSON did not change with `salesforce/design/validate_crma_dashboard.py`.
5. Regenerate `Landing_Page` through `salesforce/scripts/build_salesforce_crma_metadata.py --overview-only` or `--landing-only`.
6. Keep generated reports, screenshots, and temporary styled outputs under `salesforce/output/`.
7. Deploy with the scoped manifest under `manifest/`.

## Design and data notes

- Desktop layouts use a 48-column, 1600px canvas; mobile layouts use 12 columns.
- The checked-in sample contains 100 deterministic customer accounts while retaining the original 12 named anchor accounts.
- Current ARR is `Current_MRR__c * 12`. At-risk ARR includes only Critical and At Risk current revenue.
- Risk KPIs use `Churn_Risk_Accounts`; churned accounts do not inflate current revenue.
- The support dataset stores resolution rate in percentage points, so its XMD scale is `1`.
- Historical dates are labeled as an illustrative 2025 portfolio snapshot.

Authentication state belongs in the Salesforce CLI keychain and local `.sf/` or `.sfdx/` directories. Do not commit org credentials, access tokens, org IDs, usernames, or user-specific sharing entries.
