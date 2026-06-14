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
