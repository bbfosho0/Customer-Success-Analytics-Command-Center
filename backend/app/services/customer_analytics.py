"""Stable facade for customer analytics service helpers.

Routers should keep importing from this module even though the implementation
now lives under ``backend.app.services.customer_analytics_core``.
"""

from __future__ import annotations

from .customer_analytics_core import (
    get_account_detail,
    get_overview,
    list_bi_exports,
    list_churn_risk,
    list_expansion_opportunities,
    list_health,
    list_ltv,
    list_retention_cohorts,
    list_segments,
    list_support_impact,
)

__all__ = [
    "get_account_detail",
    "get_overview",
    "list_bi_exports",
    "list_churn_risk",
    "list_expansion_opportunities",
    "list_health",
    "list_ltv",
    "list_retention_cohorts",
    "list_segments",
    "list_support_impact",
]
