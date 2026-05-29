"""Manual refresh hooks for local ETL artifacts."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from support_analytics.etl import generate_parquet


def trigger_refresh(script_path: Path) -> dict[str, Any]:
    """Regenerate local Parquet artifacts using the documented data paths."""

    repo_root = script_path.parents[1]
    return generate_parquet(
        input_path=repo_root / "data" / "sample_calls.json",
        agents_path=repo_root / "data" / "agents.csv",
        output_path=repo_root / "data" / "cleaned_calls.parquet",
        manifest_path=repo_root / "data" / "manifest.json",
    )
