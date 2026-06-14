"""Artifact writing and manifest helpers for customer analytics ETL."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable

import polars as pl

from .config import CustomerAnalyticsPaths, GROSS_MARGIN, SNAPSHOT_DATE


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_parquet(frame: pl.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    frame.write_parquet(path)


def build_manifest(
    paths: CustomerAnalyticsPaths,
    source_files: Iterable[Path],
    curated_outputs: Iterable[Path],
    mart_and_bi_outputs: Iterable[Path],
) -> dict[str, object]:
    source_files = list(source_files)
    curated_outputs = list(curated_outputs)
    mart_and_bi_outputs = list(mart_and_bi_outputs)
    all_outputs = curated_outputs + mart_and_bi_outputs
    row_counts: dict[str, int] = {}
    for output in all_outputs:
        relative = output.relative_to(paths.root).as_posix()
        if output.suffix == ".parquet":
            row_counts[relative] = pl.read_parquet(output).height
        elif output.suffix == ".csv":
            row_counts[relative] = max(
                0,
                sum(1 for _ in output.open(encoding="utf-8")) - 1,
            )

    def rel(path: Path) -> str:
        return path.relative_to(paths.root).as_posix()

    return {
        "dataset_name": "customer_analytics",
        "generated_at": datetime.now(UTC).isoformat(),
        "source_files": [rel(path) for path in source_files],
        "curated_outputs": [rel(path) for path in curated_outputs],
        "mart_outputs": [
            rel(path) for path in mart_and_bi_outputs if path.parent == paths.marts_dir
        ],
        "bi_exports": [
            rel(path)
            for path in mart_and_bi_outputs
            if path.parent == paths.bi_exports_dir
        ],
        "row_counts": row_counts,
        "hashes": {rel(path): sha256(path) for path in source_files + all_outputs},
        "warnings": [],
        "assumptions": {
            "gross_margin": GROSS_MARGIN,
            "snapshot_date": SNAPSHOT_DATE.date().isoformat(),
        },
    }

