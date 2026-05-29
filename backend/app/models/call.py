"""Call record model matching the ETL contract."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CallRecord(BaseModel):
    """Canonical schema for tabular support-call data."""

    model_config = ConfigDict(extra="forbid")

    id: str
    agent_id: str
    agent_name: str | None = None
    customer_region: str
    issue_type: str
    duration_seconds: int = Field(ge=0)
    resolution_status: str
    started_at: str | None = None
    skill_rating: float | None = None
