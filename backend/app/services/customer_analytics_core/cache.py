"""Mart access and caching for customer analytics."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import polars as pl
from fastapi import HTTPException, status

from ..data_access import resolve_repo_path


MARTS_DIR = resolve_repo_path("data/marts")
BI_EXPORTS_DIR = resolve_repo_path("data/bi_exports")


def _relative_repo_path(path: Path) -> Path:
    try:
        return path.relative_to(resolve_repo_path("."))
    except ValueError:
        return path


@lru_cache(maxsize=16)
def read_mart(name: str) -> pl.DataFrame:
    path = MARTS_DIR / f"{name}.parquet"
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Customer analytics mart is missing: {_relative_repo_path(path)}",
        )
    return pl.read_parquet(path)


def clear_mart_cache() -> None:
    read_mart.cache_clear()
