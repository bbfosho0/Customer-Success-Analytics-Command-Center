"""Schemas powering the /api/calls endpoints."""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from ..models import CallRecord

ResolutionStatus = Literal["resolved", "pending", "escalated"]
SortField = Literal["started_at", "duration_seconds", "issue_type", "customer_region"]
SortDirection = Literal["asc", "desc"]


class CallFilters(BaseModel):
    """Filter options accepted by the calls router."""

    model_config = ConfigDict(extra="forbid")

    page: Annotated[int, Field(ge=1)] = 1
    per_page: Annotated[int, Field(ge=1, le=200)] = 50
    region: str | None = None
    issue_type: str | None = None
    status: ResolutionStatus | None = None
    agent_id: str | None = None
    q: Annotated[str | None, Field(min_length=2, max_length=80)] = None
    started_from: str | None = None
    started_to: str | None = None
    min_duration_seconds: Annotated[int | None, Field(ge=0)] = None
    max_duration_seconds: Annotated[int | None, Field(ge=0)] = None
    sort: SortField = "started_at"
    direction: SortDirection = "desc"

    @field_validator("region", "issue_type", "agent_id", "started_from", "started_to", mode="before")
    @classmethod
    def _blank_to_none(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value

    @field_validator("status", mode="before")
    @classmethod
    def _normalize_status(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped.lower() if stripped else None
        return value

    @model_validator(mode="after")
    def _validate_ranges(self) -> "CallFilters":
        if self.min_duration_seconds is not None and self.max_duration_seconds is not None:
            if self.min_duration_seconds > self.max_duration_seconds:
                raise ValueError("min_duration_seconds cannot be greater than max_duration_seconds")
        if self.started_from and self.started_to and self.started_from > self.started_to:
            raise ValueError("started_from cannot be later than started_to")
        if self.q and len(self.q.strip()) < 2:
            raise ValueError("q must contain at least two non-space characters")
        return self


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


class CallDetailResponse(BaseModel):
    """Envelope returned for one call record."""

    data: CallRecord
