from __future__ import annotations

import json
from pathlib import Path

import polars as pl
import pytest

from scripts.export_salesforce_crma import (
    DATASETS,
    export_datasets,
    main,
    salesforce_column_name,
)


def _write_source_marts(marts_dir: Path) -> None:
    marts_dir.mkdir(parents=True)
    common = pl.DataFrame(
        {
            "account_id": ["A-001"],
            "account_name": ["Example Account"],
            "health_score": [82.5],
            "risk_level": ["Healthy"],
            "current_mrr": [2500.0],
            "recommended_action": ["Continue regular success cadence"],
        }
    )
    for spec in DATASETS:
        common.write_parquet(marts_dir / f"{spec.source_name}.parquet")


def test_salesforce_column_name_handles_required_aliases_and_acronyms() -> None:
    assert salesforce_column_name("churn_probability") == "Churn_Probability__c"
    assert salesforce_column_name("estimated_ltv") == "Estimated_LTV__c"
    assert salesforce_column_name("mrr") == "MRR__c"


def test_export_creates_csvs_salesforce_columns_and_schema_files(tmp_path: Path) -> None:
    marts_dir = tmp_path / "marts"
    output_dir = tmp_path / "salesforce_crma"
    _write_source_marts(marts_dir)

    written = export_datasets(marts_dir, tmp_path / "curated", output_dir, root=tmp_path)

    assert len(written) == len(DATASETS) * 2
    for spec in DATASETS:
        csv_path = output_dir / f"{spec.output_name}.csv"
        schema_path = output_dir / "schemas" / f"{spec.output_name}.schema.json"
        assert csv_path.exists()
        assert schema_path.exists()

        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        assert schema["output_dataset_name"] == spec.output_name
        assert schema["source_file"] == f"marts/{spec.source_name}.parquet"
        assert all(
            {
                "field_name",
                "inferred_data_type",
                "suggested_crm_analytics_role",
                "original_source_column",
            }
            <= set(field)
            for field in schema["fields"]
        )

    customer_360 = pl.read_csv(output_dir / "Customer_360.csv")
    required_fields = {
        "Account_Id__c",
        "Account_Name__c",
        "Health_Score__c",
        "Risk_Band__c",
        "Current_MRR__c",
        "Recommended_Action__c",
    }
    assert required_fields <= set(customer_360.columns)


def test_export_uses_curated_customer_360_fallback(tmp_path: Path) -> None:
    curated_dir = tmp_path / "curated"
    curated_dir.mkdir()
    pl.DataFrame({"account_id": ["A-001"], "account_name": ["Example"]}).write_parquet(
        curated_dir / "customer_360.parquet"
    )

    output_dir = tmp_path / "salesforce_crma"
    written = export_datasets(tmp_path / "marts", curated_dir, output_dir, root=tmp_path)

    assert written == [
        output_dir / "Customer_360.csv",
        output_dir / "schemas" / "Customer_360.schema.json",
    ]


def test_main_fails_gracefully_when_source_marts_are_missing(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    exit_code = main(
        [
            "--marts-dir",
            str(tmp_path / "missing-marts"),
            "--curated-dir",
            str(tmp_path / "missing-curated"),
            "--output-dir",
            str(tmp_path / "output"),
        ]
    )

    captured = capsys.readouterr()
    assert exit_code == 1
    assert "No generated customer analytics marts were found" in captured.err
    assert "python scripts/generate_customer_analytics.py" in captured.err
    assert not (tmp_path / "output").exists()
