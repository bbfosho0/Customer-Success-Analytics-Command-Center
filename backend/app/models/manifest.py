"""Manifest diagnostics results."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ManifestInfo(BaseModel):
    """Metadata describing the generated Parquet artifact."""

    model_config = ConfigDict(extra="forbid")

    dataset: str
    path: str
    source: str
    hash: str
    row_count: int = Field(ge=0)
    generated_at: str
    notes: str
    size_bytes: int = Field(ge=0)
