"""Customer scoring and enrichment for customer analytics ETL."""

from __future__ import annotations

import polars as pl

from .config import CustomerAnalyticsPaths
from .sources import load_support_summary


def score_customer_360(
    paths: CustomerAnalyticsPaths,
    *,
    accounts: pl.DataFrame,
    subscriptions: pl.DataFrame,
    usage: pl.DataFrame,
    invoices: pl.DataFrame,
    opportunities: pl.DataFrame,
    touches: pl.DataFrame,
) -> pl.DataFrame:
    subscription_current = (
        subscriptions.sort(["account_id", "start_date"]).group_by("account_id").tail(1)
    )
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
        (pl.col("amount") * pl.col("probability"))
        .sum()
        .alias("weighted_pipeline_amount"),
        pl.max("close_date").alias("next_close_date"),
    )
    touch_summary = touches.group_by("account_id").agg(
        pl.len().alias("cs_touch_count"),
        (pl.col("notes_category").str.to_lowercase() == "risk")
        .cast(pl.Int64)
        .sum()
        .alias("risk_touch_count"),
        (pl.col("notes_category").str.to_lowercase() == "positive")
        .cast(pl.Int64)
        .sum()
        .alias("positive_touch_count"),
        pl.max("touch_date").alias("last_touch_date"),
    )
    support_summary = load_support_summary(paths, accounts)

    return (
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
            pl.min_horizontal(
                pl.lit(100),
                (pl.col("avg_active_days") / 28 * 55)
                + (pl.col("avg_features_used") / 12 * 25)
                + (pl.col("staff_logins") / 400 * 20),
            ).alias("product_usage_score"),
            pl.max_horizontal(
                pl.lit(0),
                (pl.col("paid_invoice_rate") * 100)
                - (pl.col("failed_payments") * 35),
            ).alias("payment_health_score"),
            pl.max_horizontal(
                pl.lit(0),
                pl.col("support_resolution_rate") - (pl.col("escalated_calls") * 12),
            ).alias("support_experience_score"),
            pl.min_horizontal(
                pl.lit(100),
                (pl.col("cs_touch_count") * 22)
                + (pl.col("positive_touch_count") * 12)
                - (pl.col("risk_touch_count") * 10),
            ).alias("customer_success_engagement_score"),
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
            pl.when(
                (pl.col("health_score") < 40)
                | (
                    (pl.col("failed_payments") > 0)
                    & (pl.col("avg_active_days") < 5)
                )
            )
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

