from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Compatibility shim. The maintained implementation lives in
# salesforce/scripts/build_salesforce_crma_metadata.py, but this path remains
# available for older local commands and notes.
from salesforce.scripts.build_salesforce_crma_metadata import build, main

__all__ = ["build", "main"]


if __name__ == "__main__":
    raise SystemExit(main())
