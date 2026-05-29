"""Read generated Customer 360 marts for API responses."""

from __future__ import annotations

from collections import Counter
from functools import lru_cache
from pathlib import Path
from typing import Any, TypeVar

import polars as pl
from fastapi import HTTPException, status
from pydantic import BaseModel

from ..schemas.customer_analytics import (
    BiExport,
    ChurnRiskAccount,
    CustomerAccountDetail,
    CustomerAnalyticsOverview,
    CustomerHealthScore,
    CustomerKpi,
    ExpansionOpportunity,
    HealthBand,
    LtvSegment,
    RetentionCohortRow,
    SegmentPerformance,
    SupportImpactRow,
)
from .data_access import resolve_repo_path

T = TypeVar("T", bound=BaseModel)

MARTS_DIR = resolve_repo_path("data/marts")
BI_EXPORTS_DIR = resolve_repo_path("data/bi_exports")


def _clean_value(value: object) -> object:
    if hasattr(value, "isoformat"):
        return value.isoformat()  # dates from Polars
    return value


def _rows(frame: pl.DataFrame) -> list[dict[str, Any]]:
    return [{key: _clean_value(value) for key, value in row.items()} for row in frame.to_dicts()]


@lru_cache(maxsize=16)
def _read_mart(name: str) -> pl.DataFrame:
    path = MARTS_DIR / f"{name}.parquet"
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Customer analytics mart is missing: {path.relative_to(resolve_repo_path('.'))}",
        )
    return pl.read_parquet(path)


def _as_models(frame: pl.DataFrame, schema: type[T]) -> list[T]:
    return [schema.model_validate(row) for row in _rows(frame)]


def get_overview() -> CustomerAnalyticsOverview:
    customer_360 = _read_mart("customer_360")
    health = _read_mart("customer_health_scores")
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
            CustomerKpi(label="At-risk MRR", value=f"${float(at_risk['current_mrr'].sum()):,.0f}", delta=None),
        ],
        health_distribution=_as_models(health_distribution, HealthBand),
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


def list_churn_risk(risk_level: str | None = None, segment: str | None = None, region: str | None = None, plan_tier: str | None = None, minimum_mrr: float | None = None) -> list[ChurnRiskAccount]:
    frame = _read_mart("churn_risk_accounts")
    if risk_level:
        frame = frame.filter(pl.col("risk_level") == risk_level)
    if segment:
        frame = frame.filter(pl.col("segment") == segment)
    if region:
        frame = frame.filter(pl.col("region") == region)
    if plan_tier:
        frame = frame.filter(pl.col("plan_tier") == plan_tier)
    if minimum_mrr is not None:
        frame = frame.filter(pl.col("mrr") >= minimum_mrr)
    return _as_models(frame.sort(["priority_rank", "mrr"], descending=[False, True]), ChurnRiskAccount)


def list_retention_cohorts() -> list[RetentionCohortRow]:
    return _as_models(_read_mart("retention_cohorts"), RetentionCohortRow)


def list_ltv() -> list[LtvSegment]:
    return _as_models(_read_mart("ltv_by_segment"), LtvSegment)


def list_segments() -> list[SegmentPerformance]:
    return _as_models(_read_mart("segment_performance"), SegmentPerformance)


def list_health() -> list[CustomerHealthScore]:
    return _as_models(_read_mart("customer_health_scores"), CustomerHealthScore)


def list_expansion_opportunities() -> list[ExpansionOpportunity]:
    return _as_models(_read_mart("expansion_opportunities"), ExpansionOpportunity)


def list_support_impact() -> list[SupportImpactRow]:
    return _as_models(_read_mart("support_impact_on_churn"), SupportImpactRow)


def list_bi_exports() -> list[BiExport]:
    exports: list[BiExport] = []
    for path in sorted(BI_EXPORTS_DIR.glob("*.csv")):
        rows = max(0, sum(1 for _ in path.open(encoding="utf-8")) - 1)
        exports.append(BiExport(name=path.stem, path=str(path.relative_to(resolve_repo_path("."))), rows=rows, size_bytes=path.stat().st_size))
    return exports


def get_account_detail(account_id: str) -> CustomerAccountDetail:
    frame = _read_mart("customer_360").filter(pl.col("account_id") == account_id)
    if frame.is_empty():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer account not found: {account_id}")
    fields = list(CustomerAccountDetail.model_fields)
    return CustomerAccountDetail.model_validate(_rows(frame.select(fields))[0])
