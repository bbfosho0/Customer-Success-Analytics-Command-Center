"""Local data access layer for sample JSON/CSV and generated Parquet files."""

from __future__ import annotations

import csv
import json
from functools import lru_cache
from pathlib import Path
from typing import Any, cast

import pandas as pd

from ..core.config import settings


_REPO_ROOT = Path(__file__).resolve().parents[3]


def resolve_repo_path(value: str | Path) -> Path:
    """Resolve a repository-relative config path to an absolute path."""

    path = Path(value)
    return path if path.is_absolute() else _REPO_ROOT / path


def _load_agents(agents_path: Path) -> dict[str, dict[str, Any]]:
    with agents_path.open(newline="", encoding="utf-8") as handle:
        return {row["agent_id"]: row for row in csv.DictReader(handle)}


def _load_sample_records() -> list[dict[str, Any]]:
    calls_path = resolve_repo_path("data/sample_calls.json")
    agents = _load_agents(resolve_repo_path("data/agents.csv"))
    raw_records = json.loads(calls_path.read_text(encoding="utf-8"))
    records: list[dict[str, Any]] = []
    for record in raw_records:
        agent = agents.get(record["agent_id"], {})
        records.append(
            {
                **record,
                "agent_name": agent.get("agent_name") or "Unknown agent",
                "skill_rating": float(agent.get("skill_rating", 0) or 0),
            }
        )
    return records


@lru_cache(maxsize=1)
def load_call_rows() -> list[dict[str, Any]]:
    """Load generated Parquet rows, falling back to JSON fixtures before ETL runs."""

    parquet_path = resolve_repo_path(settings.parquet_path)
    if parquet_path.exists():
        frame = pd.read_parquet(parquet_path)
        return cast(list[dict[str, Any]], frame.to_dict(orient="records"))
    return _load_sample_records()


def clear_data_cache() -> None:
    """Invalidate cached rows after a local refresh."""

    load_call_rows.cache_clear()


def load_calls_frame() -> str:
    """Return a concise data-source description for diagnostics."""

    parquet_path = resolve_repo_path(settings.parquet_path)
    source = parquet_path if parquet_path.exists() else resolve_repo_path("data/sample_calls.json")
    return f"Loaded support calls from {source}"
