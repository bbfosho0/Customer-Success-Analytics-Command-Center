"""Response schemas for dashboard metrics."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class KpiMetric(BaseModel):
    """Single KPI card metric."""

    model_config = ConfigDict(extra="forbid")

    label: str
    value: str
    delta: float
    trend: str


class BreakdownMetric(BaseModel):
    """Categorical aggregate metric."""

    model_config = ConfigDict(extra="forbid")

    label: str
    value: float


class MetricsResponse(BaseModel):
    """Dashboard-level aggregate response."""

    model_config = ConfigDict(extra="forbid")

    kpis: list[KpiMetric]
    issue_breakdown: list[BreakdownMetric]
    region_breakdown: list[BreakdownMetric]
