"""Overwrite selected CRM Analytics datasets through the Salesforce CLI.

This helper is intended for the portfolio Developer Edition demonstration. It
uses the existing authenticated ``sf`` session and does not persist credentials
or org-specific identifiers in the repository.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import shutil
import subprocess
import sys
import tempfile
import time
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Sequence

if __package__ in (None, ""):
    from _paths import EXPORT_DIR, ROOT
else:
    from ._paths import EXPORT_DIR, ROOT

DEFAULT_DATASETS = ("Churn_Risk_Accounts", "Expansion_Opportunities")
API_VERSION = "v66.0"


def _numeric_scale(values: list[str]) -> int:
    scale = 0
    for value in values:
        if not value:
            continue
        try:
            decimal_value = Decimal(value)
        except InvalidOperation:
            continue
        scale = max(scale, max(0, -decimal_value.as_tuple().exponent))
    return min(scale, 6)


def build_external_data_metadata(
    dataset_name: str,
    csv_path: Path,
    schema_path: Path,
) -> dict[str, Any]:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    with csv_path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))

    fields: list[dict[str, Any]] = []
    for field in schema["fields"]:
        name = field["field_name"]
        data_type = field["inferred_data_type"]
        metadata_field: dict[str, Any] = {
            "fullyQualifiedName": name,
            "name": name,
            "type": data_type,
            "label": name,
        }
        if data_type == "Numeric":
            scale = _numeric_scale([row.get(name, "") for row in rows])
            metadata_field.update(
                {
                    "precision": 18,
                    "defaultValue": "0",
                    "scale": scale,
                    "format": "0" if scale == 0 else f"0.{('0' * scale)}",
                    "decimalSeparator": ".",
                }
            )
        elif data_type == "Date":
            metadata_field["format"] = "yyyy-MM-dd"
        fields.append(metadata_field)

    object_name = f"{dataset_name}_csv"
    return {
        "fileFormat": {
            "charsetName": "UTF-8",
            "fieldsDelimitedBy": ",",
            "linesTerminatedBy": "\n",
        },
        "objects": [
            {
                "connector": "CSV",
                "fullyQualifiedName": object_name,
                "label": csv_path.name,
                "name": object_name,
                "fields": fields,
            }
        ],
    }


def _run_sf(sf_path: str, args: Sequence[str]) -> dict[str, Any]:
    completed = subprocess.run(
        [sf_path, *args, "--json"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if completed.returncode != 0:
        detail = completed.stderr.strip() or completed.stdout.strip()
        raise RuntimeError(f"Salesforce CLI command failed: {detail}")
    payload = json.loads(completed.stdout)
    if payload.get("status") not in (None, 0):
        raise RuntimeError(json.dumps(payload, indent=2))
    return payload


def _container_id(sf_path: str, target_org: str, dataset_name: str) -> str:
    query = (
        "SELECT EdgemartContainer FROM InsightsExternalData "
        f"WHERE EdgemartAlias = '{dataset_name}' "
        "ORDER BY CreatedDate DESC LIMIT 1"
    )
    payload = _run_sf(
        sf_path,
        [
            "data",
            "query",
            "--target-org",
            target_org,
            "--query",
            query,
        ],
    )
    records = payload["result"]["records"]
    if not records:
        raise RuntimeError(
            f"No prior upload was found for {dataset_name}. Upload it once in "
            "Analytics Studio or provide an existing dataset alias."
        )
    return records[0]["EdgemartContainer"]


def _create_record(
    sf_path: str,
    target_org: str,
    sobject: str,
    values: dict[str, Any],
) -> str:
    with tempfile.TemporaryDirectory(prefix="crma-upload-") as temp_dir:
        body_path = Path(temp_dir) / "request.json"
        body_path.write_text(json.dumps(values), encoding="utf-8")
        completed = subprocess.run(
            [
                sf_path,
                "api",
                "request",
                "rest",
                f"/services/data/{API_VERSION}/sobjects/{sobject}",
                "--target-org",
                target_org,
                "--method",
                "POST",
                "--body",
                f"@{body_path}",
            ],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
    if completed.returncode != 0:
        detail = completed.stderr.strip() or completed.stdout.strip()
        raise RuntimeError(f"Salesforce REST request failed: {detail}")
    try:
        payload = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Salesforce REST request returned invalid JSON: {completed.stdout.strip()}"
        ) from exc
    if not payload.get("success"):
        raise RuntimeError(json.dumps(payload, indent=2))
    return payload["id"]


def upload_dataset(
    sf_path: str,
    target_org: str,
    dataset_name: str,
    *,
    timeout_seconds: int = 180,
) -> str:
    csv_path = EXPORT_DIR / f"{dataset_name}.csv"
    schema_path = EXPORT_DIR / "schemas" / f"{dataset_name}.schema.json"
    if not csv_path.exists() or not schema_path.exists():
        raise FileNotFoundError(
            f"Missing export for {dataset_name}. Run "
            "python scripts/export_salesforce_crma.py first."
        )

    metadata = build_external_data_metadata(dataset_name, csv_path, schema_path)
    metadata_base64 = base64.b64encode(
        json.dumps(metadata, separators=(",", ":")).encode("utf-8")
    ).decode("ascii")
    data_base64 = base64.b64encode(csv_path.read_bytes()).decode("ascii")
    container_id = _container_id(sf_path, target_org, dataset_name)

    upload_id = _create_record(
        sf_path,
        target_org,
        "InsightsExternalData",
        {
            "EdgemartAlias": dataset_name,
            "EdgemartLabel": dataset_name,
            "EdgemartContainer": container_id,
            "Format": "Csv",
            "Operation": "Overwrite",
            "Action": "None",
            "FileName": dataset_name,
            "MetadataJson": metadata_base64,
        },
    )
    _create_record(
        sf_path,
        target_org,
        "InsightsExternalDataPart",
        {
            "InsightsExternalDataId": upload_id,
            "PartNumber": 1,
            "DataFile": data_base64,
        },
    )
    _run_sf(
        sf_path,
        [
            "data",
            "update",
            "record",
            "--target-org",
            target_org,
            "--sobject",
            "InsightsExternalData",
            "--record-id",
            upload_id,
            "--values",
            "Action=Process",
        ],
    )

    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        payload = _run_sf(
            sf_path,
            [
                "data",
                "query",
                "--target-org",
                target_org,
                "--query",
                (
                    "SELECT Status, StatusMessage FROM InsightsExternalData "
                    f"WHERE Id = '{upload_id}'"
                ),
            ],
        )
        record = payload["result"]["records"][0]
        status = record["Status"]
        if status == "Completed":
            return upload_id
        if status in {"Failed", "Aborted"}:
            raise RuntimeError(
                f"{dataset_name} upload {status.lower()}: "
                f"{record.get('StatusMessage') or 'No status message'}"
            )
        time.sleep(2)
    raise TimeoutError(f"Timed out waiting for {dataset_name} upload {upload_id}.")


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target-org", required=True, help="Salesforce CLI org alias")
    parser.add_argument(
        "--datasets",
        nargs="+",
        default=list(DEFAULT_DATASETS),
        help="Dataset aliases to overwrite",
    )
    args = parser.parse_args(argv)

    sf_path = shutil.which("sf")
    if not sf_path:
        print("Salesforce CLI executable 'sf' was not found.", file=sys.stderr)
        return 1

    try:
        for dataset_name in args.datasets:
            upload_id = upload_dataset(sf_path, args.target_org, dataset_name)
            print(f"Uploaded {dataset_name} ({upload_id}).")
    except (FileNotFoundError, RuntimeError, TimeoutError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
