from __future__ import annotations

import csv
import shutil
from pathlib import Path

from scripts.generate_customer_portfolio_sample import generate_portfolio


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"


def _rows(raw_dir: Path, name: str) -> list[dict[str, str]]:
    with (raw_dir / f"{name}.csv").open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def test_portfolio_generator_creates_100_deterministic_accounts(
    tmp_path: Path,
) -> None:
    raw_dir = tmp_path / "raw"
    shutil.copytree(RAW_DIR, raw_dir)
    original_anchor_names = [
        row["account_name"] for row in _rows(raw_dir, "accounts")[:12]
    ]

    counts = generate_portfolio(raw_dir=raw_dir, account_count=100)
    first = {
        path.name: path.read_bytes()
        for path in raw_dir.glob("*.csv")
    }
    generate_portfolio(raw_dir=raw_dir, account_count=100)

    accounts = _rows(raw_dir, "accounts")
    assert counts["accounts"] == 100
    assert len(accounts) == 100
    assert len({row["account_id"] for row in accounts}) == 100
    assert len({row["account_name"] for row in accounts}) == 100
    assert [row["account_name"] for row in accounts[:12]] == original_anchor_names
    assert counts["product_usage"] == 200
    assert counts["opportunities"] >= 50
    assert counts["customer_success_touches"] >= 140
    assert {
        path.name: path.read_bytes()
        for path in raw_dir.glob("*.csv")
    } == first
