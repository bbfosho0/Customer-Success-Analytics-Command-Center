"""Shared path and pipeline configuration for customer analytics ETL."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path


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
    "subscriptions": {
        "subscription_id",
        "account_id",
        "plan_tier",
        "mrr",
        "start_date",
        "end_date",
        "status",
    },
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
    "invoices": {
        "invoice_id",
        "account_id",
        "invoice_month",
        "amount",
        "paid",
        "payment_failed",
        "payment_date",
    },
    "opportunities": {
        "opportunity_id",
        "account_id",
        "opportunity_type",
        "stage",
        "amount",
        "close_date",
        "probability",
    },
    "customer_success_touches": {
        "touch_id",
        "account_id",
        "touch_type",
        "touch_date",
        "outcome",
        "notes_category",
    },
}

DATE_COLUMNS = {
    "accounts": ["signup_date"],
    "subscriptions": ["start_date", "end_date"],
    "product_usage": ["usage_month", "last_login_date"],
    "invoices": ["invoice_month", "payment_date"],
    "opportunities": ["close_date"],
    "customer_success_touches": ["touch_date"],
}

MART_SQL_MAP = {
    "01_customer_360.sql": "customer_360",
    "02_churn_risk_accounts.sql": "churn_risk_accounts",
    "03_retention_cohorts.sql": "retention_cohorts",
    "04_ltv_by_segment.sql": "ltv_by_segment",
    "05_customer_health_score.sql": "customer_health_scores",
    "06_support_impact_on_churn.sql": "support_impact_on_churn",
    "07_expansion_opportunities.sql": "expansion_opportunities",
    "08_segment_performance.sql": "segment_performance",
}


@dataclass(frozen=True, slots=True)
class CustomerAnalyticsPaths:
    root: Path
    raw_dir: Path
    curated_dir: Path
    marts_dir: Path
    bi_exports_dir: Path
    sql_dir: Path
    manifest_path: Path
    cleaned_calls_path: Path
    sample_calls_path: Path


def build_paths(root: Path) -> CustomerAnalyticsPaths:
    return CustomerAnalyticsPaths(
        root=root,
        raw_dir=root / "data" / "raw",
        curated_dir=root / "data" / "curated",
        marts_dir=root / "data" / "marts",
        bi_exports_dir=root / "data" / "bi_exports",
        sql_dir=root / "sql",
        manifest_path=root / "data" / "customer_analytics_manifest.json",
        cleaned_calls_path=root / "data" / "cleaned_calls.parquet",
        sample_calls_path=root / "data" / "sample_calls.json",
    )

