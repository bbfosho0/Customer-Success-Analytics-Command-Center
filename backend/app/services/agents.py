"""Agent leaderboard helpers."""

from __future__ import annotations

from collections import defaultdict

from ..models import AgentStats
from .data_access import load_call_rows, resolve_repo_path

import csv


def _to_int(value: object) -> int:
    if isinstance(value, int | float):
        return int(value)
    if isinstance(value, str):
        return int(value or "0")
    return 0


def _agent_directory() -> dict[str, dict[str, str]]:
    with resolve_repo_path("data/agents.csv").open(newline="", encoding="utf-8") as handle:
        return {row["agent_id"]: row for row in csv.DictReader(handle)}


def list_agent_stats() -> list[AgentStats]:
    """Aggregate call data into agent leaderboard metrics."""

    rows = load_call_rows()
    grouped: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in rows:
        grouped[str(row["agent_id"])].append(row)

    directory = _agent_directory()
    stats: list[AgentStats] = []
    for agent_id, agent in directory.items():
        agent_rows = grouped.get(agent_id, [])
        total = len(agent_rows)
        durations = [_to_int(row.get("duration_seconds", 0)) for row in agent_rows]
        resolved = sum(1 for row in agent_rows if str(row.get("resolution_status", "")).lower() == "resolved")
        escalated = sum(1 for row in agent_rows if str(row.get("resolution_status", "")).lower() == "escalated")
        skill_rating = float(agent.get("skill_rating", 0) or 0)
        stats.append(
            AgentStats(
                agent_id=agent_id,
                name=agent.get("name", agent_id),
                region=agent.get("region", "unknown"),
                skill_rating=skill_rating,
                avg_rating=skill_rating,
                total_calls=total,
                avg_resolution_seconds=round(sum(durations) / total) if total else 0,
                resolved_rate=round((resolved / total) * 100, 1) if total else 0,
                escalated_calls=escalated,
            )
        )
    return sorted(stats, key=lambda stat: (stat.total_calls, stat.skill_rating), reverse=True)
