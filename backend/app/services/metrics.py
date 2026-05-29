"""Metrics aggregation for dashboard APIs."""

from __future__ import annotations

from collections import Counter

from ..schemas import BreakdownMetric, KpiMetric, MetricsResponse
from .data_access import load_call_rows


def _breakdown(rows: list[dict[str, object]], key: str) -> list[BreakdownMetric]:
    counts = Counter(str(row.get(key, "Unknown")) for row in rows)
    return [BreakdownMetric(label=label, value=float(value)) for label, value in counts.most_common()]


def get_metrics() -> MetricsResponse:
    """Compute KPI, region, and issue summaries from the local call dataset."""

    rows = load_call_rows()
    total = len(rows)
    resolved = sum(1 for row in rows if str(row.get("resolution_status", "")).lower() == "resolved")
    escalated = sum(1 for row in rows if str(row.get("resolution_status", "")).lower() == "escalated")
    total_duration = sum(int(row.get("duration_seconds", 0) or 0) for row in rows)
    sample_size = max(total, 1)

    return MetricsResponse(
        kpis=[
            KpiMetric(label="Total interactions", value=str(total), delta=0, trend="flat"),
            KpiMetric(label="Avg handle time", value=f"{round(total_duration / sample_size / 60, 1)}m", delta=0, trend="flat"),
            KpiMetric(label="Resolution rate", value=f"{round((resolved / sample_size) * 100, 1)}%", delta=0, trend="flat"),
            KpiMetric(label="Escalations", value=str(escalated), delta=0, trend="flat"),
        ],
        issue_breakdown=_breakdown(rows, "issue_type"),
        region_breakdown=_breakdown(rows, "customer_region"),
    )
