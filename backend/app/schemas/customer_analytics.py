"""Schemas for Customer Success analytics endpoints."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class CustomerKpi(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    value: str
    delta: float | None = None
    trend: str = "flat"


class HealthBand(BaseModel):
    model_config = ConfigDict(extra="forbid")

    risk_level: str
    customers: int
    mrr: float


class CustomerAnalyticsOverview(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kpis: list[CustomerKpi]
    health_distribution: list[HealthBand]
    top_churn_drivers: list[HealthBand]
    recommended_actions: list[str]


class ChurnRiskAccount(BaseModel):
    model_config = ConfigDict(extra="forbid")

    account_id: str
    account_name: str
    segment: str
    region: str
    plan_tier: str
    mrr: float
    health_score: float
    risk_level: str
    main_risk_driver: str
    recommended_action: str
    customer_success_manager: str
    priority_rank: int


class RetentionCohortRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cohort_month: str
    cohort_quarter: str | None = None
    month_number: int
    month_since_acquisition: str | None = None
    cohort_size: int
    retained_customers: int
    retention_rate: float | None


class LtvSegment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    segment: str
    plan_tier: str
    customers: int
    average_mrr: float
    assumed_monthly_churn_rate: float
    estimated_ltv: float


class SegmentPerformance(BaseModel):
    model_config = ConfigDict(extra="forbid")

    segment: str
    region: str
    plan_tier: str
    customers: int
    current_mrr: float
    avg_health_score: float
    avg_active_days: float
    avg_support_calls: float
    churn_rate: float
    weighted_pipeline_amount: float


class CustomerHealthScore(BaseModel):
    model_config = ConfigDict(extra="forbid")

    account_id: str
    account_name: str
    segment: str
    region: str
    plan_tier: str
    mrr: float
    product_usage_score: float
    payment_health_score: float
    support_experience_score: float
    customer_success_engagement_score: float
    health_score: float
    risk_level: str
    main_risk_driver: str


class ExpansionOpportunity(BaseModel):
    model_config = ConfigDict(extra="forbid")

    account_id: str
    account_name: str
    segment: str
    region: str
    plan_tier: str
    mrr: float
    health_score: float
    weighted_pipeline_amount: float
    open_pipeline_amount: float
    next_close_date: str | None
    close_month: str | None = None
    customer_success_manager: str
    expansion_readiness: str


class SupportImpactRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    segment: str
    plan_tier: str
    customers: int
    avg_support_calls: float
    avg_escalated_calls: float
    avg_resolution_rate: float
    avg_health_score: float
    churn_rate: float


class BiExport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    path: str
    rows: int
    size_bytes: int


class CustomerAccountDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")

    account_id: str
    account_name: str
    restaurant_type: str
    region: str
    segment: str
    plan_tier: str
    status: str
    current_mrr: float
    health_score: float
    risk_level: str
    main_risk_driver: str
    recommended_action: str
    customer_success_manager: str
    avg_active_days: float
    orders_processed: float
    support_calls: float
    failed_payments: float
    weighted_pipeline_amount: float
