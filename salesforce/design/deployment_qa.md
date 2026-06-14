# Executive Overview Deployment QA

## Deployment

- Target org: `YoshiRGG`
- Dashboard: `Landing_Page`
- Dashboard ID: `0FKg80000007fo1GAA`
- API version: `66.0`
- Dry-run deployment ID: `0Afg8000006ExeHCAS`
- Deployment ID: `0Afg8000006ExftCAC`
- Deployment completed: `2026-06-14T08:29:11Z`
- Pre-deployment history candidate: `0Rmg8000000MU5tCAG`
- Pre-style local SHA-256: `DB4885AC92FFFB21C6F4741D62A5586F1AC9681802BA49D55BC2FA3BB78FCEEA`
- Deployed local SHA-256: `F9488385FEB3773BDE52D930C50C4DD25EDB2937759B140ACC9B8E431F15D371`

The dry run and deployment each succeeded for exactly one metadata component:
`WaveDashboard:Landing_Page`.

## Metadata Validation

- Scoped validator: PASS
- Approved style changes: 142
- Layout changes: 0
- Forbidden changes: 0
- Warnings: 0
- Python tests: 47 passed
- Desktop layouts: 6 pages, all widget placements within the 48-column grid
- Mobile layouts: 6 pages, all widget placements within the 12-column grid
- Mobile dashboard support remains enabled
- All widget step references resolve
- Every grain ordering field is selected
- Overview action menus remain disabled
- Desktop and mobile risk queues retain explicit compact columns

The deployed REST state confirms:

- Masthead background: `#0B1F3A`
- Navigation background: `#172033`
- Navigation text: `#FFFFFF`
- Current ARR card background: `#FFFFFF`
- Mobile table header size: `11`
- Risk Queue target: `At_Risk_Account_Dashboard`
- Retention Cohorts target: `Retention_Cohort_Dashboard`
- Expansion Pipeline target: `Expansion_Pipeline_Dashboard`

## Live Data Check

No datasets were deployed. Read-only Analytics SQL queries against the existing
org data returned:

- Customers: 100
- Current ARR: $7,232,016
- Average health: 71.986
- At-risk ARR for At Risk and Critical accounts: $1,174,284
- Open expansion pipeline: $2,705,900
- Risk mix: 39 Healthy, 30 Watch, 19 At Risk, 12 Critical

These values differ from the earlier 12-account screenshots because the
connected org already contains the regenerated 100-account portfolio.

## Visual QA Limitation

Automated screenshots could not be captured because neither the authenticated
in-app browser nor Windows Computer Use helper was available in this session.
The dashboard was therefore verified through the deployed Analytics REST state,
metadata validation, and live Analytics queries. No history revert was run.
