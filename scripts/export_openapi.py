"""Export the FastAPI OpenAPI schema for generated-client drift checks."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from backend.app.main import app


def main() -> None:
    parser = argparse.ArgumentParser(description="Write backend OpenAPI JSON to disk.")
    parser.add_argument("--output", default="openapi.json", help="Output path for the schema JSON")
    args = parser.parse_args()

    output = Path(args.output)
    output.write_text(json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
