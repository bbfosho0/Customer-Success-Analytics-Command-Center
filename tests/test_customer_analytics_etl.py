from __future__ import annotations

import json
from pathlib import Path

import polars as pl

from scripts.generate_customer_analytics import main


ROOT = Path(__file__).resolve().parents[1]


def test_customer_analytics_pipeline_outputs_expected_artifacts() -> None:
    main()

    customer_360_path = ROOT / "data" / "curated" / "customer_360.parquet"
    churn_path = ROOT / "data" / "marts" / "churn_risk_accounts.parquet"
    retention_path = ROOT / "data" / "marts" / "retention_cohorts.parquet"
    ltv_path = ROOT / "data" / "marts" / "ltv_by_segment.parquet"
    bi_export_path = ROOT / "data" / "bi_exports" / "customer_360.csv"
    manifest_path = ROOT / "data" / "customer_analytics_manifest.json"

    for path in [customer_360_path, churn_path, retention_path, ltv_path, bi_export_path, manifest_path]:
        assert path.exists(), f"Expected generated artifact at {path}"

    customer_360 = pl.read_parquet(customer_360_path)
    assert customer_360.height == 100
    assert customer_360["account_id"].n_unique() == customer_360.height
    assert customer_360["health_score"].min() >= 0
    assert customer_360["health_score"].max() <= 100
    assert set(customer_360["risk_level"].unique()).issubset({"Healthy", "Watch", "At Risk", "Critical"})
    assert (
        customer_360.group_by("risk_level")
        .len()
        .select(pl.col("len").min())
        .item()
        >= 10
    )

    assert pl.read_parquet(retention_path).height > 0
    assert pl.read_parquet(ltv_path)["estimated_ltv"].min() >= 0
    churn_queue = pl.read_parquet(churn_path).sort("priority_rank")
    assert churn_queue.head(8)["mrr"].min() > 0

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert "data/curated/customer_360.parquet" in manifest["curated_outputs"]
    assert "data/bi_exports/customer_360.csv" in manifest["bi_exports"]
