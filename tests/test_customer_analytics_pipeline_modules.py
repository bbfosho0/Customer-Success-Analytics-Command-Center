from __future__ import annotations

from datetime import date

import polars as pl
import pytest

from support_analytics.customer_analytics.artifacts import build_manifest
from support_analytics.customer_analytics.config import build_paths
from support_analytics.customer_analytics.sources import standardize_dimensions


def test_standardize_dimensions_normalizes_values_and_validates_status() -> None:
    accounts = pl.DataFrame(
        {
            "account_id": ["acct_001"],
            "account_name": ["Northwind Cafe"],
            "restaurant_type": ["fast casual"],
            "region": ["APAC"],
            "segment": ["mid_market"],
            "signup_date": [date(2025, 1, 1)],
            "account_owner": ["Owner"],
            "customer_success_manager": ["CSM"],
        }
    )
    subscriptions = pl.DataFrame(
        {
            "subscription_id": ["sub_001"],
            "account_id": ["acct_001"],
            "plan_tier": ["enterprise"],
            "mrr": [1000],
            "start_date": [date(2025, 1, 1)],
            "end_date": [None],
            "status": ["ACTIVE"],
        }
    )

    normalized_accounts, normalized_subscriptions = standardize_dimensions(
        accounts, subscriptions
    )

    assert normalized_accounts["region"].to_list() == ["Asia Pacific"]
    assert normalized_accounts["segment"].to_list() == ["Mid Market"]
    assert normalized_subscriptions["plan_tier"].to_list() == ["Enterprise"]
    assert normalized_subscriptions["status"].to_list() == ["active"]

    invalid = subscriptions.with_columns(pl.lit("bad_state").alias("status"))
    with pytest.raises(ValueError):
        standardize_dimensions(accounts, invalid)


def test_build_manifest_separates_curated_marts_and_bi_exports(tmp_path) -> None:
    paths = build_paths(tmp_path)
    paths.curated_dir.mkdir(parents=True)
    paths.marts_dir.mkdir(parents=True)
    paths.bi_exports_dir.mkdir(parents=True)
    paths.raw_dir.mkdir(parents=True)

    source = paths.raw_dir / "accounts.csv"
    source.write_text("account_id\nacct_001\n", encoding="utf-8")

    curated = paths.curated_dir / "customer_360.parquet"
    pl.DataFrame({"account_id": ["acct_001"]}).write_parquet(curated)

    mart = paths.marts_dir / "customer_360.parquet"
    pl.DataFrame({"account_id": ["acct_001"]}).write_parquet(mart)

    export = paths.bi_exports_dir / "customer_360.csv"
    export.write_text("account_id\nacct_001\n", encoding="utf-8")

    manifest = build_manifest(
        paths,
        source_files=[source],
        curated_outputs=[curated],
        mart_and_bi_outputs=[mart, export],
    )

    assert manifest["curated_outputs"] == ["data/curated/customer_360.parquet"]
    assert manifest["mart_outputs"] == ["data/marts/customer_360.parquet"]
    assert manifest["bi_exports"] == ["data/bi_exports/customer_360.csv"]
    assert manifest["row_counts"]["data/curated/customer_360.parquet"] == 1
    assert manifest["row_counts"]["data/bi_exports/customer_360.csv"] == 1
