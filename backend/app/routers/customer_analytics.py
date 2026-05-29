"""Customer Success analytics API router."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..schemas.customer_analytics import (
    BiExport,
    ChurnRiskAccount,
    CustomerAccountDetail,
    CustomerAnalyticsOverview,
    CustomerHealthScore,
    ExpansionOpportunity,
    LtvSegment,
    RetentionCohortRow,
    SegmentPerformance,
    SupportImpactRow,
)
from ..services import customer_analytics as service

router = APIRouter(prefix="/api/customer-analytics", tags=["customer-analytics"])


@router.get("/overview", response_model=CustomerAnalyticsOverview)
async def get_overview() -> CustomerAnalyticsOverview:
    return service.get_overview()


@router.get("/churn-risk", response_model=list[ChurnRiskAccount])
async def get_churn_risk(
    risk_level: str | None = None,
    segment: str | None = None,
    region: str | None = None,
    plan_tier: str | None = None,
    minimum_mrr: float | None = Query(default=None, ge=0),
) -> list[ChurnRiskAccount]:
    return service.list_churn_risk(risk_level, segment, region, plan_tier, minimum_mrr)


@router.get("/retention-cohorts", response_model=list[RetentionCohortRow])
async def get_retention_cohorts() -> list[RetentionCohortRow]:
    return service.list_retention_cohorts()


@router.get("/ltv", response_model=list[LtvSegment])
async def get_ltv() -> list[LtvSegment]:
    return service.list_ltv()


@router.get("/segments", response_model=list[SegmentPerformance])
async def get_segments() -> list[SegmentPerformance]:
    return service.list_segments()


@router.get("/health", response_model=list[CustomerHealthScore])
async def get_health() -> list[CustomerHealthScore]:
    return service.list_health()


@router.get("/expansion-opportunities", response_model=list[ExpansionOpportunity])
async def get_expansion_opportunities() -> list[ExpansionOpportunity]:
    return service.list_expansion_opportunities()


@router.get("/support-impact", response_model=list[SupportImpactRow])
async def get_support_impact() -> list[SupportImpactRow]:
    return service.list_support_impact()


@router.get("/bi-exports", response_model=list[BiExport])
async def get_bi_exports() -> list[BiExport]:
    return service.list_bi_exports()


@router.get("/accounts/{account_id}", response_model=CustomerAccountDetail)
async def get_account_detail(account_id: str) -> CustomerAccountDetail:
    return service.get_account_detail(account_id)
