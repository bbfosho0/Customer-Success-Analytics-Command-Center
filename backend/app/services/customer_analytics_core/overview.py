"""Overview KPI assembly for customer analytics."""

from __future__ import annotations

from collections import Counter

import polars as pl

from ...schemas.customer_analytics import (
    CustomerAnalyticsOverview,
    CustomerKpi,
    HealthBand,
)
from .cache import read_mart
from .utils import as_models


def get_overview() -> CustomerAnalyticsOverview:
    customer_360 = read_mart("customer_360")
    health = read_mart("customer_health_scores")
    active = customer_360.filter(pl.col("status") != "churned")
    total_customers = customer_360.height
    active_customers = active.height
    current_mrr = float(customer_360["current_mrr"].sum())
    at_risk = customer_360.filter(pl.col("risk_level").is_in(["Critical", "At Risk"]))
    churn_rate = (total_customers - active_customers) / max(total_customers, 1)
    retention_rate = active_customers / max(total_customers, 1)

    health_distribution = (
        customer_360.group_by("risk_level")
        .agg(pl.len().alias("customers"), pl.sum("current_mrr").alias("mrr"))
        .sort("mrr", descending=True)
    )
    driver_counts = Counter(str(row["main_risk_driver"]) for row in health.to_dicts())

    return CustomerAnalyticsOverview(
        kpis=[
            CustomerKpi(label="Active customers", value=str(active_customers), delta=None),
            CustomerKpi(label="Current MRR", value=f"${current_mrr:,.0f}", delta=None),
            CustomerKpi(label="Churn rate", value=f"{churn_rate * 100:.1f}%", delta=None),
            CustomerKpi(label="Retention rate", value=f"{retention_rate * 100:.1f}%", delta=None),
            CustomerKpi(label="At-risk accounts", value=str(at_risk.height), delta=None),
            CustomerKpi(
                label="At-risk MRR",
                value=f"${float(at_risk['current_mrr'].sum()):,.0f}",
                delta=None,
            ),
        ],
        health_distribution=as_models(health_distribution, HealthBand),
        top_churn_drivers=[
            HealthBand(risk_level=driver, customers=count, mrr=0)
            for driver, count in driver_counts.most_common(5)
        ],
        recommended_actions=[
            "Prioritize Critical and At Risk accounts with failed payments or low active days.",
            "Advance expansion opportunities only when health score and adoption are strong.",
            "Use support escalation and CSM touch history as context for renewal planning.",
        ],
    )

