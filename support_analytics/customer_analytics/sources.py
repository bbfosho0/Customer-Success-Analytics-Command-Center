"""Source loading and validation for customer analytics ETL."""

from __future__ import annotations

import polars as pl

from .config import CustomerAnalyticsPaths, DATE_COLUMNS, REQUIRED_COLUMNS


def read_csv(paths: CustomerAnalyticsPaths, name: str) -> pl.DataFrame:
    path = paths.raw_dir / f"{name}.csv"
    frame = pl.read_csv(path, infer_schema_length=500, try_parse_dates=False)
    missing = sorted(REQUIRED_COLUMNS[name] - set(frame.columns))
    if missing:
        raise ValueError(f"{path} is missing required columns: {', '.join(missing)}")
    for column in DATE_COLUMNS[name]:
        frame = frame.with_columns(pl.col(column).str.strptime(pl.Date, strict=False))
    return frame


def load_datasets(paths: CustomerAnalyticsPaths) -> dict[str, pl.DataFrame]:
    return {name: read_csv(paths, name) for name in REQUIRED_COLUMNS}


def standardize_dimensions(
    accounts: pl.DataFrame,
    subscriptions: pl.DataFrame,
) -> tuple[pl.DataFrame, pl.DataFrame]:
    accounts = accounts.with_columns(
        pl.col("region")
        .replace(
            {
                "NA": "North America",
                "EU": "Europe",
                "APAC": "Asia Pacific",
                "LATAM": "Latin America",
            }
        )
        .str.to_titlecase(),
        pl.col("segment")
        .str.replace_all("_", " ")
        .str.to_titlecase()
        .replace({"Smb": "SMB"}),
        pl.col("restaurant_type").str.to_titlecase(),
    )
    subscriptions = subscriptions.with_columns(
        pl.col("plan_tier").str.to_titlecase(),
        pl.col("status").str.to_lowercase(),
        pl.col("mrr").cast(pl.Float64),
    )
    invalid_statuses = set(subscriptions["status"].to_list()) - {
        "active",
        "churned",
        "paused",
        "trial",
    }
    if invalid_statuses:
        raise ValueError(
            f"subscriptions.csv contains invalid statuses: {sorted(invalid_statuses)}"
        )
    return accounts, subscriptions


def load_support_summary(
    paths: CustomerAnalyticsPaths,
    accounts: pl.DataFrame,
) -> pl.DataFrame:
    if paths.cleaned_calls_path.exists():
        calls = pl.read_parquet(paths.cleaned_calls_path)
    else:
        calls = (
            pl.read_json(paths.sample_calls_path)
            if paths.sample_calls_path.exists()
            else pl.DataFrame()
        )

    if calls.is_empty() or "customer_region" not in calls.columns:
        return accounts.select("account_id").with_columns(
            pl.lit(0).alias("support_calls"),
            pl.lit(0).alias("escalated_calls"),
            pl.lit(0.0).alias("avg_support_duration_seconds"),
            pl.lit(100.0).alias("support_resolution_rate"),
        )

    calls = calls.with_columns(
        pl.col("customer_region")
        .cast(pl.String)
        .replace(
            {
                "NA": "North America",
                "EU": "Europe",
                "APAC": "Asia Pacific",
                "LATAM": "Latin America",
            }
        )
        .str.to_titlecase()
        .alias("region"),
        (
            pl.col("resolution_status").cast(pl.String).str.to_lowercase()
            == "escalated"
        )
        .cast(pl.Int64)
        .alias("is_escalated"),
        (
            pl.col("resolution_status").cast(pl.String).str.to_lowercase()
            == "resolved"
        )
        .cast(pl.Int64)
        .alias("is_resolved"),
    )
    regional = calls.group_by("region").agg(
        pl.len().alias("region_support_calls"),
        pl.sum("is_escalated").alias("region_escalated_calls"),
        pl.mean("duration_seconds").alias("avg_support_duration_seconds"),
        (pl.mean("is_resolved") * 100).alias("support_resolution_rate"),
    )
    return (
        accounts.select("account_id", "region")
        .join(regional, on="region", how="left")
        .with_columns(
            pl.col("region_support_calls").fill_null(0).alias("support_calls"),
            pl.col("region_escalated_calls").fill_null(0).alias("escalated_calls"),
            pl.col("avg_support_duration_seconds").fill_null(0),
            pl.col("support_resolution_rate").fill_null(100),
        )
        .drop("region", "region_support_calls", "region_escalated_calls")
    )

