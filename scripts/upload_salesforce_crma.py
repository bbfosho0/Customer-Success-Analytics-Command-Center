from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Compatibility shim. The maintained implementation lives in
# salesforce/scripts/upload_salesforce_crma.py, but this path remains available
# for stable local workflows.
from salesforce.scripts.upload_salesforce_crma import (
    API_VERSION,
    DEFAULT_DATASETS,
    build_external_data_metadata,
    main,
    upload_dataset,
)

__all__ = [
    "API_VERSION",
    "DEFAULT_DATASETS",
    "build_external_data_metadata",
    "main",
    "upload_dataset",
]


if __name__ == "__main__":
    raise SystemExit(main())
