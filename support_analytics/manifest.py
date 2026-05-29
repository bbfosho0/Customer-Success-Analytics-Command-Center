"""Utilities for inspecting ETL manifest artifacts."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(slots=True)
class ManifestRecord:
    """Lightweight representation of the local Parquet manifest contract."""

    dataset: str
    path: str
    source: str
    hash: str
    row_count: int
    generated_at: str
    notes: str
    size_bytes: int = 0


def load_manifest(manifest_path: Path) -> ManifestRecord:
    """Load a manifest JSON file and normalize optional legacy fields."""

    if manifest_path.exists():
        content = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        content = {}

    artifact_path = Path(content.get("path", "data/cleaned_calls.parquet"))
    if not artifact_path.is_absolute():
        artifact_path = manifest_path.parent.parent / artifact_path

    normalized: dict[str, Any] = {
        "dataset": content.get("dataset", "cleaned_calls"),
        "path": content.get("path", "data/cleaned_calls.parquet"),
        "source": content.get("source", "local-simulation"),
        "hash": content.get("hash", "missing"),
        "row_count": int(content.get("row_count", 0)),
        "generated_at": content.get("generated_at", "unknown"),
        "notes": content.get("notes", "Manifest has not been generated yet."),
        "size_bytes": int(content.get("size_bytes", artifact_path.stat().st_size if artifact_path.exists() else 0)),
    }
    return ManifestRecord(**normalized)
