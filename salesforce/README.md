# CRM Analytics Metadata

This Salesforce DX project versions the portfolio-safe CRM Analytics app that consumes the CSV exports under `data/salesforce_crma/`.

The metadata is designed for a CRM Analytics-enabled Developer Edition org. It demonstrates deployable dashboard and extended metadata assets; it is not a production connector, scheduled synchronization process, or managed package.

## Retrieve the current org state

```powershell
sf project retrieve start --target-org <org-alias> --manifest manifest/package.xml
```

## Validate and deploy

```powershell
sf project deploy start --target-org <org-alias> --manifest manifest/package.xml --dry-run --wait 30
sf project deploy start --target-org <org-alias> --manifest manifest/package.xml --wait 30
```

Authentication state belongs in the Salesforce CLI keychain and local `.sf/` or `.sfdx/` directories. Do not commit org credentials, access tokens, org IDs, usernames, or user-specific sharing entries.
