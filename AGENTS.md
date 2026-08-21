# Repo Agent Notes

Keep changes inside the correct subsystem.

- `frontend/` is the local Next.js app and Figma-backed route UI.
- `salesforce/` is the full CRM Analytics workspace: metadata, design tooling, tests, manifests, and deploy docs.
- `data/` contains checked-in generated artifacts used by the demo and dashboard flows.

Prefer stable commands over ad hoc scripts:

```powershell
python scripts/generate_customer_analytics.py
python scripts/export_salesforce_crma.py
python salesforce/scripts/build_salesforce_crma_metadata.py
python -m pytest salesforce/tests
sf project deploy start --target-org <alias> --manifest salesforce/manifest/landing-page.xml --dry-run --wait 30
```

Do not casually edit these by hand:

- `openapi.json`
- `frontend/src/lib/api/generated/schema.ts`
- checked-in generated data under `data/curated/`, `data/marts/`, `data/bi_exports/`, and `data/salesforce_crma/`
- Salesforce dashboard steps, bindings, filters, dataset references, and drill targets inside `.wdash` metadata

Preferred Salesforce workflow:

1. change tokens or rules under `salesforce/design/`
2. generate dashboard metadata through `salesforce/scripts/`
3. validate with the Salesforce-local tests and dashboard validator
4. dry-run deploy with a scoped manifest before any real deployment

For `Landing_Page` visual work, prefer live QA in the authenticated Chrome session before trusting metadata-only output. Use the deployed dashboard as the visual source of truth; keep validators and tests as safety gates.

Do not spread temporary dashboard outputs or QA artifacts back into source folders. Keep them under `salesforce/output/`.

## Frontend visual workflow

The React/Next.js implementation is the source of truth for frontend design. Storybook is the executable design workbench for isolated components, states, themes, and responsive compositions.

Before changing frontend visuals:

1. Inspect the relevant existing Storybook stories and native component source.
2. Reuse the existing component API. Do not paste large external component libraries into Storybook or create duplicate JSX/TSX variants.
3. Add or update a story for every visually meaningful component/state change.
4. Use MSW at the network boundary for deterministic API states instead of hard-coding page-only fake data.
5. Render the result in a real browser. Source inspection alone is not visual QA.
6. Run Storybook browser tests and Playwright visual tests before treating a visual task as complete.
7. Inspect screenshot artifacts and diffs at the canonical desktop, tablet, and mobile viewports.

Useful frontend commands:

```powershell
npm --prefix frontend run storybook
npm --prefix frontend run storybook:build
npm --prefix frontend run storybook:test
npm --prefix frontend run test:visual
npm --prefix frontend run test:e2e
```

When Storybook is running locally, compatible agents can consult its MCP endpoint at `http://localhost:6006/mcp` for component manifests and story context.

Committed Playwright snapshots under `frontend/tests/visual/__screenshots__/` are reviewed baselines. Do not update them simply to make a failing test green. Generated `frontend/visual-evidence/`, reports, traces, and diffs are CI/local artifacts and must stay out of source control.
