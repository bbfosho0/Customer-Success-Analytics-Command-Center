"""Metrics API router."""

from __future__ import annotations

from fastapi import APIRouter

from ..schemas import MetricsResponse
from ..services import metrics as metrics_service

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("", response_model=MetricsResponse)
async def get_metrics() -> MetricsResponse:
    """Return dashboard KPI and breakdown aggregates."""

    return metrics_service.get_metrics()
