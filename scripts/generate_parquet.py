"""CLI for producing local Parquet artifacts from the sample JSON/CSV inputs."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

from support_analytics.etl import generate_parquet


def build_parser() -> argparse.ArgumentParser:
    """Create the command parser used by local development and refresh hooks."""

    parser = argparse.ArgumentParser(description="Generate local support analytics Parquet artifacts.")
    parser.add_argument("--input", dest="input_path", type=Path, default=Path("data/sample_calls.json"))
    parser.add_argument("--agents", dest="agents_path", type=Path, default=Path("data/agents.csv"))
    parser.add_argument("--output", dest="output_path", type=Path, default=Path("data/cleaned_calls.parquet"))
    parser.add_argument("--manifest", dest="manifest_path", type=Path, default=Path("data/manifest.json"))
    return parser


def main(args: Iterable[str] | None = None) -> None:
    """Generate the local artifact set and print a concise summary."""

    parsed = build_parser().parse_args(args)
    manifest = generate_parquet(
        input_path=parsed.input_path,
        agents_path=parsed.agents_path,
        output_path=parsed.output_path,
        manifest_path=parsed.manifest_path,
    )
    print(
        "Generated {rows} rows at {path} ({size} bytes)".format(
            rows=manifest["row_count"], path=manifest["path"], size=manifest["size_bytes"]
        )
    )


if __name__ == "__main__":
    main()
