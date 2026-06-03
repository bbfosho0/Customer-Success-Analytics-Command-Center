"""Business logic for call queries."""

from __future__ import annotations

from ..models import CallRecord
from ..schemas import CallFilters
from .data_access import load_call_rows


def _matches_text(record: dict[str, object], query: str) -> bool:
    needle = query.lower()
    fields = ["id", "agent_id", "agent_name", "customer_region", "issue_type", "resolution_status"]
    return any(needle in str(record.get(field, "")).lower() for field in fields)


def filter_call_rows(filters: CallFilters) -> list[dict[str, object]]:
    """Apply supported filters without mutating cached source records."""

    rows: list[dict[str, object]] = [dict(row) for row in load_call_rows()]
    if filters.region:
        rows = [row for row in rows if str(row.get("customer_region", "")).lower() == filters.region.lower()]
    if filters.issue_type:
        rows = [row for row in rows if str(row.get("issue_type", "")).lower() == filters.issue_type.lower()]
    if filters.status:
        rows = [row for row in rows if str(row.get("resolution_status", "")).lower() == filters.status]
    if filters.agent_id:
        rows = [row for row in rows if str(row.get("agent_id", "")).lower() == filters.agent_id.lower()]
    if filters.started_from:
        rows = [row for row in rows if str(row.get("started_at", "")) >= filters.started_from]
    if filters.started_to:
        rows = [row for row in rows if str(row.get("started_at", "")) <= filters.started_to]
    if filters.min_duration_seconds is not None:
        rows = [row for row in rows if int(row.get("duration_seconds", 0) or 0) >= filters.min_duration_seconds]
    if filters.max_duration_seconds is not None:
        rows = [row for row in rows if int(row.get("duration_seconds", 0) or 0) <= filters.max_duration_seconds]
    if filters.q:
        rows = [row for row in rows if _matches_text(row, filters.q)]

    reverse = filters.direction == "desc"
    return sorted(rows, key=lambda row: row.get(filters.sort) or "", reverse=reverse)


async def list_calls(filters: CallFilters) -> tuple[list[CallRecord], int]:
    """Return one page of call records and the filtered total."""

    rows = filter_call_rows(filters)
    start = (filters.page - 1) * filters.per_page
    end = start + filters.per_page
    return [CallRecord.model_validate(row) for row in rows[start:end]], len(rows)


async def get_call(call_id: str) -> CallRecord | None:
    """Find a single call by ID."""

    needle = call_id.lower()
    for row in load_call_rows():
        if str(row.get("id", "")).lower() == needle:
            return CallRecord.model_validate(row)
    return None
