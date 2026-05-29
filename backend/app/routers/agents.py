"""Agents API router."""

from __future__ import annotations

from fastapi import APIRouter

from ..models import AgentStats
from ..services import agents as agent_service

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=list[AgentStats])
async def list_agents() -> list[AgentStats]:
    """Expose agent performance aggregates."""

    return agent_service.list_agent_stats()
