"""Stable public entrypoint for the customer analytics ETL pipeline.

The implementation now lives under ``support_analytics.customer_analytics``.
Keep this script path working because it is referenced by the README, tests,
and demo workflow.
"""

from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from support_analytics.customer_analytics import run_customer_analytics_pipeline


def main() -> None:
    result = run_customer_analytics_pipeline(ROOT)
    print(f"Generated customer analytics for {result.customer_360_count} accounts.")


if __name__ == "__main__":
    main()
