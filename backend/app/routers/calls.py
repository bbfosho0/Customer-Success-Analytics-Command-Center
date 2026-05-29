"""Calls API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas import CallFilters, CallsMeta, PaginatedCallsResponse
from ..services import calls as call_service

router = APIRouter(prefix="/api/calls", tags=["calls"])


@router.get("", response_model=PaginatedCallsResponse)
async def list_calls(filters: CallFilters = Depends()) -> PaginatedCallsResponse:
    """Return a filtered, paginated list of call records."""

    records, total = await call_service.list_calls(filters)
    next_link = None
    if filters.page * filters.per_page < total:
        next_link = f"/api/calls?page={filters.page + 1}&per_page={filters.per_page}"

    return PaginatedCallsResponse(
        data=records,
        meta=CallsMeta(page=filters.page, per_page=filters.per_page, total=total),
        links={"next": next_link},
    )


@router.get("/{call_id}")
async def get_call(call_id: str):
    """Return one call record by ID."""

    record = await call_service.get_call(call_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
    return {"data": record}
