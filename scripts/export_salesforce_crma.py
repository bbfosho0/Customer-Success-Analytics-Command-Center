"""Export generated customer analytics marts as Salesforce CRM Analytics datasets."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

import polars as pl


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MARTS_DIR = ROOT / "data" / "marts"
DEFAULT_CURATED_DIR = ROOT / "data" / "curated"
DEFAULT_OUTPUT_DIR = ROOT / "data" / "salesforce_crma"


@dataclass(frozen=True)
class DatasetSpec:
    source_name: str
    output_name: str
    fallbacks: tuple[str, ...] = ()


DATASETS = (
    DatasetSpec("customer_360", "Customer_360"),
    DatasetSpec("churn_risk_accounts", "Churn_Risk_Accounts"),
    DatasetSpec("retention_cohorts", "Retention_Cohorts"),
    DatasetSpec("ltv_by_segment", "LTV_By_Segment"),
    DatasetSpec("expansion_opportunities", "Expansion_Opportunities"),
    DatasetSpec("support_impact_on_churn", "Support_Impact_On_Churn"),
)

# Explicit semantic aliases take precedence over the generic readable conversion.
COLUMN_NAME_OVERRIDES = {
    "account_id": "Account_Id__c",
    "account_name": "Account_Name__c",
    "health_score": "Health_Score__c",
    "risk_band": "Risk_Band__c",
    "risk_level": "Risk_Band__c",
    "current_mrr": "Current_MRR__c",
    "churn_probability": "Churn_Probability__c",
    "recommended_action": "Recommended_Action__c",
}

IDENTIFIER_COLUMNS = {
    "account_id",
    "subscription_id",
    "usage_id",
    "invoice_id",
    "opportunity_id",
    "touch_id",
}


class MissingSourceError(RuntimeError):
    """Raised when none of the generated analytics sources are available."""


def salesforce_column_name(source_column: str) -> str:
    """Convert a source column to a readable Salesforce custom-field API name."""
    if source_column in COLUMN_NAME_OVERRIDES:
        return COLUMN_NAME_OVERRIDES[source_column]

    tokens = [token for token in re.split(r"[^A-Za-z0-9]+", source_column) if token]
    acronyms = {"crm", "csm", "id", "ltv", "mrr"}
    readable = "_".join(token.upper() if token.lower() in acronyms else token.capitalize() for token in tokens)
    return f"{readable}__c"


def _find_source(spec: DatasetSpec, marts_dir: Path, curated_dir: Path) -> Path | None:
    candidates: list[Path] = []
    for name in (spec.source_name, *spec.fallbacks):
        candidates.extend(
            [
                marts_dir / f"{name}.parquet",
                marts_dir / f"{name}.csv",
                curated_dir / f"{name}.parquet",
                curated_dir / f"{name}.csv",
            ]
        )
    return next((path for path in candidates if path.is_file()), None)


def _read_source(path: Path) -> pl.DataFrame:
    if path.suffix.lower() == ".parquet":
        return pl.read_parquet(path)
    return pl.read_csv(path, try_parse_dates=True, infer_schema_length=1000)


def _crm_data_type(dtype: pl.DataType) -> str:
    if dtype == pl.Boolean:
        return "Boolean"
    if dtype.is_integer() or dtype.is_float() or dtype == pl.Decimal:
        return "Numeric"
    if dtype == pl.Date:
        return "Date"
    if dtype == pl.Datetime or dtype == pl.Time:
        return "DateTime"
    return "Text"


def _analytics_role(source_column: str, dtype: pl.DataType) -> str:
    lowered = source_column.lower()
    if lowered in IDENTIFIER_COLUMNS or lowered.endswith("_id"):
        return "identifier"
    if dtype == pl.Date or dtype == pl.Datetime or lowered.endswith("_date") or lowered.endswith("_month"):
        return "date"
    if dtype.is_numeric() and dtype != pl.Boolean:
        return "measure"
    return "dimension"


def _display_source(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def _schema_metadata(frame: pl.DataFrame, source: Path, output_name: str, root: Path) -> dict[str, object]:
    fields = []
    for source_column, dtype in frame.schema.items():
        fields.append(
            {
                "field_name": salesforce_column_name(source_column),
                "inferred_data_type": _crm_data_type(dtype),
                "suggested_crm_analytics_role": _analytics_role(source_column, dtype),
                "original_source_column": source_column,
            }
        )
    return {
        "source_file": _display_source(source, root),
        "output_dataset_name": output_name,
        "fields": fields,
    }


def export_datasets(
    marts_dir: Path = DEFAULT_MARTS_DIR,
    curated_dir: Path = DEFAULT_CURATED_DIR,
    output_dir: Path = DEFAULT_OUTPUT_DIR,
    root: Path = ROOT,
) -> list[Path]:
    """Write all available CRM Analytics CSVs and their schema metadata."""
    available = [(spec, _find_source(spec, marts_dir, curated_dir)) for spec in DATASETS]
    if not any(source is not None for _, source in available):
        raise MissingSourceError(
            "No generated customer analytics marts were found. "
            "Run 'python scripts/generate_customer_analytics.py' before exporting Salesforce CRM Analytics datasets."
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    schema_dir = output_dir / "schemas"
    schema_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    for spec, source in available:
        if source is None:
            print(f"Skipping {spec.output_name}: source mart was not found.", file=sys.stderr)
            continue

        frame = _read_source(source)
        renamed = frame.rename({column: salesforce_column_name(column) for column in frame.columns})
        csv_path = output_dir / f"{spec.output_name}.csv"
        schema_path = schema_dir / f"{spec.output_name}.schema.json"
        renamed.write_csv(
            csv_path,
            include_header=True,
            datetime_format="%Y-%m-%dT%H:%M:%S",
            date_format="%Y-%m-%d",
        )
        schema_path.write_text(
            json.dumps(_schema_metadata(frame, source, spec.output_name, root), indent=2) + "\n",
            encoding="utf-8",
        )
        written.extend([csv_path, schema_path])

    return written


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--marts-dir", type=Path, default=DEFAULT_MARTS_DIR)
    parser.add_argument("--curated-dir", type=Path, default=DEFAULT_CURATED_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        written = export_datasets(args.marts_dir, args.curated_dir, args.output_dir)
    except MissingSourceError as exc:
        print(f"Salesforce CRM Analytics export failed: {exc}", file=sys.stderr)
        return 1

    dataset_count = len(written) // 2
    print(f"Exported {dataset_count} Salesforce CRM Analytics dataset(s) to {args.output_dir}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
