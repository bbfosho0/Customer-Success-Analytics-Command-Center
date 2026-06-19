from __future__ import annotations

import json
from pathlib import Path

from salesforce.scripts.build_dashboard_sample_resources import build_payload, write_payload


def test_build_payload_includes_all_dashboard_domains() -> None:
    payload = build_payload()

    assert payload["meta"]["resourceName"] == "CustomerSuccessDashboardSampleData"
    assert {
        "customer360",
        "churnRiskAccounts",
        "expansionOpportunities",
        "retentionCohorts",
        "ltvBySegment",
    } <= set(payload["datasets"])

    assert payload["datasets"]["customer360"]
    assert payload["datasets"]["churnRiskAccounts"]
    assert payload["datasets"]["expansionOpportunities"]
    assert payload["datasets"]["retentionCohorts"]
    assert payload["datasets"]["ltvBySegment"]

    account = payload["datasets"]["customer360"][0]
    assert {
        "id",
        "accountName",
        "csm",
        "portfolio",
        "segment",
        "region",
        "riskBand",
        "healthBucket",
        "arr",
        "expansionPipeline",
        "healthScore",
        "snapshotAgeDays",
        "nextStep",
    } <= set(account)

    opportunity = payload["datasets"]["expansionOpportunities"][0]
    assert {"accountName", "owner", "stage", "weighted", "readiness", "closeWindow"} <= set(opportunity)

    cohort = payload["datasets"]["retentionCohorts"][0]
    assert {"cohortLabel", "segment", "region", "customers", "month3", "month6", "ltv", "arr", "window"} <= set(cohort)


def test_write_payload_emits_deterministic_json_resource(tmp_path: Path) -> None:
    output_path = tmp_path / "CustomerSuccessDashboardSampleData.resource"
    written_path = write_payload(output_path)

    assert written_path == output_path
    parsed = json.loads(output_path.read_text(encoding="utf-8"))
    assert parsed["meta"]["generatedBy"] == "salesforce/scripts/build_dashboard_sample_resources.py"
    assert parsed["meta"]["sourceDirectory"] == "data/salesforce_crma"
    assert len(parsed["datasets"]["customer360"]) > 0
    assert len(parsed["datasets"]["retentionCohorts"]) > 0
