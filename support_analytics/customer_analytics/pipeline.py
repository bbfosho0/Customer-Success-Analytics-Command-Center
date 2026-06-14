"""Pipeline orchestration for customer analytics ETL."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import polars as pl

from .artifacts import build_manifest, write_parquet
from .config import CustomerAnalyticsPaths, REQUIRED_COLUMNS, build_paths
from .marts import run_sql_marts
from .scoring import score_customer_360
from .sources import load_datasets, standardize_dimensions


@dataclass(frozen=True, slots=True)
class PipelineResult:
    customer_360_count: int
    curated_outputs: tuple[Path, ...]
    mart_and_bi_outputs: tuple[Path, ...]
    manifest_path: Path


def run_customer_analytics_pipeline(root: Path) -> PipelineResult:
    paths = build_paths(root)
    paths.curated_dir.mkdir(parents=True, exist_ok=True)

    datasets = load_datasets(paths)
    accounts, subscriptions = standardize_dimensions(
        datasets["accounts"], datasets["subscriptions"]
    )
    datasets["accounts"] = accounts
    datasets["subscriptions"] = subscriptions

    customer_360 = score_customer_360(
        paths,
        accounts=accounts,
        subscriptions=subscriptions,
        usage=datasets["product_usage"],
        invoices=datasets["invoices"],
        opportunities=datasets["opportunities"],
        touches=datasets["customer_success_touches"],
    )

    curated_frames: dict[str, pl.DataFrame] = {**datasets, "customer_360": customer_360}
    curated_outputs: list[Path] = []
    for name, frame in curated_frames.items():
        path = paths.curated_dir / f"{name}.parquet"
        write_parquet(frame, path)
        curated_outputs.append(path)

    mart_and_bi_outputs = run_sql_marts(paths)
    source_files = [paths.raw_dir / f"{name}.csv" for name in REQUIRED_COLUMNS]
    manifest = build_manifest(
        paths,
        source_files=source_files,
        curated_outputs=curated_outputs,
        mart_and_bi_outputs=mart_and_bi_outputs,
    )
    paths.manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    return PipelineResult(
        customer_360_count=customer_360.height,
        curated_outputs=tuple(curated_outputs),
        mart_and_bi_outputs=tuple(mart_and_bi_outputs),
        manifest_path=paths.manifest_path,
    )

