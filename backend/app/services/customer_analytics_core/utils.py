"""Shared row normalization helpers for customer analytics."""

from __future__ import annotations

from typing import Any, TypeVar

import polars as pl
from pydantic import BaseModel


T = TypeVar("T", bound=BaseModel)


def clean_value(value: object) -> object:
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def rows(frame: pl.DataFrame) -> list[dict[str, Any]]:
    return [{key: clean_value(value) for key, value in row.items()} for row in frame.to_dicts()]


def as_models(frame: pl.DataFrame, schema: type[T]) -> list[T]:
    return [schema.model_validate(row) for row in rows(frame)]

