"""Schemas powering the /api/calls endpoints."""

from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from ..models import CallRecord


class CallFilters(BaseModel):
    """Filter options accepted by the calls router."""

    model_config = ConfigDict(extra="forbid")

    page: Annotated[int, Field(ge=1)] = 1
    per_page: Annotated[int, Field(ge=1, le=200)] = 50
    region: str | None = None
    issue_type: str | None = None
    status: str | None = None
    agent_id: str | None = None
    q: str | None = None


class CallsMeta(BaseModel):
    """Pagination metadata returned with every calls collection."""

    page: int
    per_page: int
    total: int


class PaginatedCallsResponse(BaseModel):
    """Envelope matching the frontend expectations."""

    data: list[CallRecord]
    meta: CallsMeta
    links: dict[str, str | None]
