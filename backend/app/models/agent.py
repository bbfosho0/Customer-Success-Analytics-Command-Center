"""Agent leaderboard aggregates."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class AgentStats(BaseModel):
    """Summaries consumed by the frontend agents view."""

    model_config = ConfigDict(extra="forbid")

    agent_id: str
    name: str
    region: str
    skill_rating: float = Field(ge=0)
    avg_rating: float = Field(ge=0)
    total_calls: int = Field(ge=0)
    avg_resolution_seconds: int = Field(ge=0)
    resolved_rate: float = Field(ge=0, le=100)
    escalated_calls: int = Field(ge=0)
