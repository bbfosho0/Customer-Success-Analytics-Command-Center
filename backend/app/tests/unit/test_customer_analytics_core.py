from __future__ import annotations

from datetime import date
from pathlib import Path

import polars as pl
import pytest
from fastapi import HTTPException

from backend.app.services.customer_analytics_core import cache, utils


def test_rows_serializes_date_values() -> None:
    frame = pl.DataFrame({"account_id": ["acct_001"], "signup_date": [date(2025, 4, 30)]})

    assert utils.rows(frame) == [
        {"account_id": "acct_001", "signup_date": "2025-04-30"}
    ]


def test_read_mart_raises_service_unavailable_for_missing_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(cache, "MARTS_DIR", tmp_path)
    cache.clear_mart_cache()

    with pytest.raises(HTTPException) as exc_info:
        cache.read_mart("missing_dataset")

    assert exc_info.value.status_code == 503
    assert "missing_dataset.parquet" in str(exc_info.value.detail)

