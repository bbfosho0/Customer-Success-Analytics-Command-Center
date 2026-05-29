"""Generate Customer 360 curated datasets, DuckDB SQL marts, and BI CSV exports."""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable

import duckdb
import polars as pl


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
CURATED_DIR = ROOT / "data" / "curated"
MARTS_DIR = ROOT / "data" / "marts"
BI_EXPORTS_DIR = ROOT / "data" / "bi_exports"
SQL_DIR = ROOT / "sql"
MANIFEST_PATH = ROOT / "data" / "customer_analytics_manifest.json"

GROSS_MARGIN = 0.75
SNAPSHOT_DATE = datetime(2025, 4, 30, tzinfo=UTC)

REQUIRED_COLUMNS = {
    "accounts": {
        "account_id",
        "account_name",
        "restaurant_type",
        "region",
        "segment",
        "signup_date",
        "account_owner",
        "customer_success_manager",
    },
    "subscriptions": {"subscription_id", "account_id", "plan_tier", "mrr", "start_date", "end_date", "status"},
    "product_usage": {
        "usage_id",
        "account_id",
        "usage_month",
        "active_days",
        "orders_processed",
        "staff_logins",
        "features_used_count",
        "last_login_date",
    },
    "invoices": {"invoice_id", "account_id", "invoice_month", "amount", "paid", "payment_failed", "payment_date"},
    "opportunities": {"opportunity_id", "account_id", "opportunity_type", "stage", "amount", "close_date", "probability"},
    "customer_success_touches": {"touch_id", "account_id", "touch_type", "touch_date", "outcome", "notes_category"},
}

DATE_COLUMNS = {
    "accounts": ["signup_date"],
    "subscriptions": ["start_date", "end_date"],
    "product_usage": ["usage_month", "last_login_date"],
    "invoices": ["invoice_month", "payment_date"],
    "opportunities": ["close_date"],
    "customer_success_touches": ["touch_date"],
}


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_csv(name: str) -> pl.DataFrame:
    path = RAW_DIR / f"{name}.csv"
    frame = pl.read_csv(path, infer_schema_length=500, try_parse_dates=False)
    missing = sorted(REQUIRED_COLUMNS[name] - set(frame.columns))
    if missing:
        raise ValueError(f"{path} is missing required columns: {', '.join(missing)}")
    for column in DATE_COLUMNS[name]:
        frame = frame.with_columns(pl.col(column).str.strptime(pl.Date, strict=False))
    return frame


def _standardize_dimensions(accounts: pl.DataFrame, subscriptions: pl.DataFrame) -> tuple[pl.DataFrame, pl.DataFrame]:
    accounts = accounts.with_columns(
        pl.col("region")
        .replace({"NA": "North America", "EU": "Europe", "APAC": "Asia Pacific", "LATAM": "Latin America"})
        .str.to_titlecase(),
        pl.col("segment").str.replace_all("_", " ").str.to_titlecase().replace({"Smb": "SMB"}),
        pl.col("restaurant_type").str.to_titlecase(),
    )
    subscriptions = subscriptions.with_columns(
        pl.col("plan_tier").str.to_titlecase(),
        pl.col("status").str.to_lowercase(),
        pl.col("mrr").cast(pl.Float64),
    )
    invalid_statuses = set(subscriptions["status"].to_list()) - {"active", "churned", "paused", "trial"}
    if invalid_statuses:
        raise ValueError(f"subscriptions.csv contains invalid statuses: {sorted(invalid_statuses)}")
    return accounts, subscriptions


def _load_support_summary(accounts: pl.DataFrame) -> pl.DataFrame:
    parquet_path = ROOT / "data" / "cleaned_calls.parquet"
    if parquet_path.exists():
        calls = pl.read_parquet(parquet_path)
    else:
        source = ROOT / "data" / "sample_calls.json"
        calls = pl.read_json(source) if source.exists() else pl.DataFrame()

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
        .replace({"NA": "North America", "EU": "Europe", "APAC": "Asia Pacific", "LATAM": "Latin America"})
        .str.to_titlecase()
        .alias("region"),
        (pl.col("resolution_status").cast(pl.String).str.to_lowercase() == "escalated").cast(pl.Int64).alias("is_escalated"),
        (pl.col("resolution_status").cast(pl.String).str.to_lowercase() == "resolved").cast(pl.Int64).alias("is_resolved"),
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


def _score_customer_360(
    accounts: pl.DataFrame,
    subscriptions: pl.DataFrame,
    usage: pl.DataFrame,
    invoices: pl.DataFrame,
    opportunities: pl.DataFrame,
    touches: pl.DataFrame,
) -> pl.DataFrame:
    subscription_current = subscriptions.sort(["account_id", "start_date"]).group_by("account_id").tail(1)
    usage_summary = usage.group_by("account_id").agg(
        pl.mean("active_days").alias("avg_active_days"),
        pl.sum("orders_processed").alias("orders_processed"),
        pl.sum("staff_logins").alias("staff_logins"),
        pl.mean("features_used_count").alias("avg_features_used"),
        pl.max("last_login_date").alias("last_login_date"),
    )
    invoice_summary = invoices.group_by("account_id").agg(
        pl.sum("amount").alias("total_invoiced"),
        pl.col("paid").cast(pl.Int64).mean().alias("paid_invoice_rate"),
        pl.col("payment_failed").cast(pl.Int64).sum().alias("failed_payments"),
        pl.max("payment_date").alias("last_payment_date"),
    )
    opportunity_summary = opportunities.group_by("account_id").agg(
        pl.sum("amount").alias("open_pipeline_amount"),
        (pl.col("amount") * pl.col("probability")).sum().alias("weighted_pipeline_amount"),
        pl.max("close_date").alias("next_close_date"),
    )
    touch_summary = touches.group_by("account_id").agg(
        pl.len().alias("cs_touch_count"),
        (pl.col("notes_category").str.to_lowercase() == "risk").cast(pl.Int64).sum().alias("risk_touch_count"),
        (pl.col("notes_category").str.to_lowercase() == "positive").cast(pl.Int64).sum().alias("positive_touch_count"),
        pl.max("touch_date").alias("last_touch_date"),
    )
    support_summary = _load_support_summary(accounts)

    customer_360 = (
        accounts.join(subscription_current, on="account_id", how="left")
        .join(usage_summary, on="account_id", how="left")
        .join(invoice_summary, on="account_id", how="left")
        .join(opportunity_summary, on="account_id", how="left")
        .join(touch_summary, on="account_id", how="left")
        .join(support_summary, on="account_id", how="left")
        .with_columns(
            pl.col("mrr").fill_null(0),
            pl.col("avg_active_days").fill_null(0),
            pl.col("orders_processed").fill_null(0),
            pl.col("staff_logins").fill_null(0),
            pl.col("avg_features_used").fill_null(0),
            pl.col("total_invoiced").fill_null(0),
            pl.col("paid_invoice_rate").fill_null(0),
            pl.col("failed_payments").fill_null(0),
            pl.col("open_pipeline_amount").fill_null(0),
            pl.col("weighted_pipeline_amount").fill_null(0),
            pl.col("cs_touch_count").fill_null(0),
            pl.col("risk_touch_count").fill_null(0),
            pl.col("positive_touch_count").fill_null(0),
            pl.col("support_calls").fill_null(0),
            pl.col("escalated_calls").fill_null(0),
            pl.col("avg_support_duration_seconds").fill_null(0),
            pl.col("support_resolution_rate").fill_null(100),
        )
        .with_columns(
            pl.min_horizontal(pl.lit(100), (pl.col("avg_active_days") / 28 * 55) + (pl.col("avg_features_used") / 12 * 25) + (pl.col("staff_logins") / 400 * 20)).alias("product_usage_score"),
            pl.max_horizontal(pl.lit(0), (pl.col("paid_invoice_rate") * 100) - (pl.col("failed_payments") * 35)).alias("payment_health_score"),
            pl.max_horizontal(pl.lit(0), pl.col("support_resolution_rate") - (pl.col("escalated_calls") * 12)).alias("support_experience_score"),
            pl.min_horizontal(pl.lit(100), (pl.col("cs_touch_count") * 22) + (pl.col("positive_touch_count") * 12) - (pl.col("risk_touch_count") * 10)).alias("customer_success_engagement_score"),
        )
        .with_columns(
            (
                (pl.col("product_usage_score") * 0.35)
                + (pl.col("payment_health_score") * 0.20)
                + (pl.col("support_experience_score") * 0.25)
                + (pl.col("customer_success_engagement_score") * 0.20)
            )
            .round(1)
            .alias("health_score"),
            (pl.col("status") == "churned").alias("is_churned"),
            pl.when(pl.col("status") == "churned")
            .then(pl.lit(0.0))
            .otherwise(pl.col("mrr"))
            .alias("current_mrr"),
        )
        .with_columns(
            pl.when((pl.col("health_score") < 40) | ((pl.col("failed_payments") > 0) & (pl.col("avg_active_days") < 5)))
            .then(pl.lit("Critical"))
            .when(pl.col("health_score") < 60)
            .then(pl.lit("At Risk"))
            .when(pl.col("health_score") < 80)
            .then(pl.lit("Watch"))
            .otherwise(pl.lit("Healthy"))
            .alias("risk_level"),
            pl.when(pl.col("failed_payments") > 0)
            .then(pl.lit("Payment failure"))
            .when(pl.col("avg_active_days") < 10)
            .then(pl.lit("Low product adoption"))
            .when(pl.col("escalated_calls") > 0)
            .then(pl.lit("Escalated support experience"))
            .when(pl.col("risk_touch_count") > 0)
            .then(pl.lit("CSM risk note"))
            .otherwise(pl.lit("Healthy usage and engagement"))
            .alias("main_risk_driver"),
            pl.when(pl.col("health_score") < 60)
            .then(pl.lit("Schedule CSM risk review and adoption plan"))
            .when(pl.col("weighted_pipeline_amount") > 10000)
            .then(pl.lit("Advance expansion opportunity"))
            .otherwise(pl.lit("Continue regular success cadence"))
            .alias("recommended_action"),
        )
        .with_columns(pl.col("health_score").clip(0, 100))
    )
    return customer_360


def _write_parquet(frame: pl.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    frame.write_parquet(path)


def _run_sql_marts() -> list[Path]:
    MARTS_DIR.mkdir(parents=True, exist_ok=True)
    BI_EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    connection = duckdb.connect()
    connection.execute(f"SET home_directory='{ROOT.as_posix()}'")
    connection.execute((SQL_DIR / "00_create_customer_views.sql").read_text(encoding="utf-8"))

    mart_map = {
        "01_customer_360.sql": "customer_360",
        "02_churn_risk_accounts.sql": "churn_risk_accounts",
        "03_retention_cohorts.sql": "retention_cohorts",
        "04_ltv_by_segment.sql": "ltv_by_segment",
        "05_customer_health_score.sql": "customer_health_scores",
        "06_support_impact_on_churn.sql": "support_impact_on_churn",
        "07_expansion_opportunities.sql": "expansion_opportunities",
        "08_segment_performance.sql": "segment_performance",
    }

    outputs: list[Path] = []
    for sql_file, output_name in mart_map.items():
        sql = (SQL_DIR / sql_file).read_text(encoding="utf-8")
        parquet_path = MARTS_DIR / f"{output_name}.parquet"
        csv_path = BI_EXPORTS_DIR / f"{output_name}.csv"
        connection.execute(f"COPY ({sql}) TO '{parquet_path.as_posix()}' (FORMAT PARQUET)")
        connection.execute(f"COPY ({sql}) TO '{csv_path.as_posix()}' (HEADER, DELIMITER ',')")
        outputs.extend([parquet_path, csv_path])
    connection.close()
    return outputs


def _manifest(source_files: Iterable[Path], curated_outputs: Iterable[Path], mart_and_bi_outputs: Iterable[Path]) -> dict[str, object]:
    source_files = list(source_files)
    curated_outputs = list(curated_outputs)
    mart_and_bi_outputs = list(mart_and_bi_outputs)
    all_outputs = curated_outputs + mart_and_bi_outputs
    row_counts: dict[str, int] = {}
    for output in all_outputs:
        if output.suffix == ".parquet":
            row_counts[output.relative_to(ROOT).as_posix()] = pl.read_parquet(output).height
        elif output.suffix == ".csv":
            row_counts[output.relative_to(ROOT).as_posix()] = max(0, sum(1 for _ in output.open(encoding="utf-8")) - 1)

    def rel(path: Path) -> str:
        return path.relative_to(ROOT).as_posix()

    return {
        "dataset_name": "customer_analytics",
        "generated_at": datetime.now(UTC).isoformat(),
        "source_files": [rel(path) for path in source_files],
        "curated_outputs": [rel(path) for path in curated_outputs],
        "mart_outputs": [rel(path) for path in mart_and_bi_outputs if path.parent == MARTS_DIR],
        "bi_exports": [rel(path) for path in mart_and_bi_outputs if path.parent == BI_EXPORTS_DIR],
        "row_counts": row_counts,
        "hashes": {rel(path): _sha256(path) for path in source_files + all_outputs},
        "warnings": [],
        "assumptions": {"gross_margin": GROSS_MARGIN, "snapshot_date": SNAPSHOT_DATE.date().isoformat()},
    }


def main() -> None:
    CURATED_DIR.mkdir(parents=True, exist_ok=True)
    datasets = {name: _read_csv(name) for name in REQUIRED_COLUMNS}
    accounts, subscriptions = _standardize_dimensions(datasets["accounts"], datasets["subscriptions"])
    datasets["accounts"] = accounts
    datasets["subscriptions"] = subscriptions

    customer_360 = _score_customer_360(
        accounts=accounts,
        subscriptions=subscriptions,
        usage=datasets["product_usage"],
        invoices=datasets["invoices"],
        opportunities=datasets["opportunities"],
        touches=datasets["customer_success_touches"],
    )

    curated_frames = {**datasets, "customer_360": customer_360}
    curated_outputs: list[Path] = []
    for name, frame in curated_frames.items():
        path = CURATED_DIR / f"{name}.parquet"
        _write_parquet(frame, path)
        curated_outputs.append(path)

    mart_and_bi_outputs = _run_sql_marts()
    source_files = [RAW_DIR / f"{name}.csv" for name in REQUIRED_COLUMNS]
    manifest = _manifest(source_files, curated_outputs, mart_and_bi_outputs)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Generated customer analytics for {customer_360.height} accounts.")


if __name__ == "__main__":
    main()
