"""List/detail readers for customer analytics marts and exports."""

from __future__ import annotations

from pathlib import Path

import polars as pl
from fastapi import HTTPException, status

from ...schemas.customer_analytics import (
    BiExport,
    ChurnRiskAccount,
    CustomerAccountDetail,
    CustomerHealthScore,
    ExpansionOpportunity,
    LtvSegment,
    RetentionCohortRow,
    SegmentPerformance,
    SupportImpactRow,
)
from ..data_access import resolve_repo_path
from .cache import BI_EXPORTS_DIR, read_mart
from .utils import as_models, rows


def list_churn_risk(
    risk_level: str | None = None,
    segment: str | None = None,
    region: str | None = None,
    plan_tier: str | None = None,
    minimum_mrr: float | None = None,
) -> list[ChurnRiskAccount]:
    frame = read_mart("churn_risk_accounts")
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
    return as_models(
        frame.sort(["priority_rank", "mrr"], descending=[False, True]),
        ChurnRiskAccount,
    )


def list_retention_cohorts() -> list[RetentionCohortRow]:
    return as_models(read_mart("retention_cohorts"), RetentionCohortRow)


def list_ltv() -> list[LtvSegment]:
    return as_models(read_mart("ltv_by_segment"), LtvSegment)


def list_segments() -> list[SegmentPerformance]:
    return as_models(read_mart("segment_performance"), SegmentPerformance)


def list_health() -> list[CustomerHealthScore]:
    return as_models(read_mart("customer_health_scores"), CustomerHealthScore)


def list_expansion_opportunities() -> list[ExpansionOpportunity]:
    return as_models(read_mart("expansion_opportunities"), ExpansionOpportunity)


def list_support_impact() -> list[SupportImpactRow]:
    return as_models(read_mart("support_impact_on_churn"), SupportImpactRow)


def list_bi_exports() -> list[BiExport]:
    exports: list[BiExport] = []
    for path in sorted(BI_EXPORTS_DIR.glob("*.csv")):
        rows_count = max(0, sum(1 for _ in path.open(encoding="utf-8")) - 1)
        exports.append(
            BiExport(
                name=path.stem,
                path=str(path.relative_to(resolve_repo_path("."))),
                rows=rows_count,
                size_bytes=path.stat().st_size,
            )
        )
    return exports


def get_account_detail(account_id: str) -> CustomerAccountDetail:
    frame = read_mart("customer_360").filter(pl.col("account_id") == account_id)
    if frame.is_empty():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer account not found: {account_id}",
        )
    fields = list(CustomerAccountDetail.model_fields)
    return CustomerAccountDetail.model_validate(rows(frame.select(fields))[0])

