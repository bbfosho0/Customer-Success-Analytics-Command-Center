"""Local ETL helpers that convert JSON/CSV fixtures into Parquet artifacts."""

from __future__ import annotations

import csv
import hashlib
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterable, cast


@dataclass(slots=True)
class EtlInput:
    """Declarative description of the ETL inputs used by the local simulation."""

    calls_path: Path
    agents_path: Path
    manifest_path: Path


def _read_calls(calls_path: Path) -> list[dict[str, Any]]:
    records = cast(object, json.loads(calls_path.read_text(encoding="utf-8")))
    if not isinstance(records, list):
        raise ValueError(f"Expected {calls_path} to contain a JSON array")
    calls: list[dict[str, Any]] = []
    for record in cast(list[object], records):
        if not isinstance(record, dict):
            raise ValueError(f"Expected every item in {calls_path} to be an object")
        calls.append(dict(cast(dict[str, Any], record)))
    return calls


def _read_agents(agents_path: Path) -> dict[str, dict[str, Any]]:
    with agents_path.open(newline="", encoding="utf-8") as handle:
        return {row["agent_id"]: row for row in csv.DictReader(handle)}


def _enrich_calls(calls: list[dict[str, Any]], agents: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    enriched: list[dict[str, Any]] = []
    for call in calls:
        agent = agents.get(str(call.get("agent_id", "")), {})
        row: dict[str, Any] = {
            "id": str(call["id"]),
            "agent_id": str(call["agent_id"]),
            "agent_name": str(agent.get("name", call["agent_id"])),
            "customer_region": str(call["customer_region"]),
            "issue_type": str(call["issue_type"]),
            "duration_seconds": int(call["duration_seconds"]),
            "resolution_status": str(call["resolution_status"]),
            "started_at": str(call.get("started_at", "")),
            "skill_rating": float(agent.get("skill_rating", 0) or 0),
        }
        enriched.append(row)
    return enriched


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_local_parquet(inputs: EtlInput) -> Path:
    """Build the conventional local Parquet artifact and companion manifest."""

    output_path = inputs.manifest_path.with_name("cleaned_calls.parquet")
    generate_parquet(inputs.calls_path, inputs.agents_path, output_path, inputs.manifest_path)
    return output_path


def generate_parquet(
    input_path: Path,
    agents_path: Path,
    output_path: Path,
    manifest_path: Path | None = None,
) -> dict[str, Any]:
    """Create a typed Parquet dataset and manifest from local sample files."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path = manifest_path or output_path.with_name("manifest.json")

    calls = _read_calls(input_path)
    agents = _read_agents(agents_path)
    records = _enrich_calls(calls, agents)
    import pandas as pd

    frame = pd.DataFrame.from_records(records)
    frame.to_parquet(output_path, index=False)

    manifest: dict[str, Any] = {
        "dataset": "cleaned_calls",
        "path": str(output_path.relative_to(Path.cwd()) if output_path.is_absolute() else output_path),
        "source": "local-simulation",
        "hash": _sha256(output_path),
        "row_count": len(records),
        "generated_at": datetime.now(UTC).isoformat(),
        "size_bytes": output_path.stat().st_size,
        "columns": [str(column) for column in cast(Iterable[object], frame.columns)],
        "notes": "Generated from data/sample_calls.json and data/agents.csv for local API/UI development.",
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def infer_inputs(root: Path) -> EtlInput:
    """Return the conventional input locations documented in README.md."""

    calls = root / "data" / "sample_calls.json"
    agents = root / "data" / "agents.csv"
    manifest = root / "data" / "manifest.json"
    return EtlInput(calls_path=calls, agents_path=agents, manifest_path=manifest)


def refresh_artifacts(paths: Iterable[Path]) -> None:
    """Delete stale generated artifacts so the next run recreates them."""

    for path in paths:
        if path.exists():
            path.unlink()
