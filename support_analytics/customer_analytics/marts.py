"""DuckDB mart and BI export generation for customer analytics ETL."""

from __future__ import annotations

from pathlib import Path

import duckdb

from .config import CustomerAnalyticsPaths, MART_SQL_MAP


def run_sql_marts(paths: CustomerAnalyticsPaths) -> list[Path]:
    paths.marts_dir.mkdir(parents=True, exist_ok=True)
    paths.bi_exports_dir.mkdir(parents=True, exist_ok=True)
    connection = duckdb.connect()
    connection.execute(f"SET home_directory='{paths.root.as_posix()}'")
    connection.execute(
        (paths.sql_dir / "00_create_customer_views.sql").read_text(encoding="utf-8")
    )

    outputs: list[Path] = []
    for sql_file, output_name in MART_SQL_MAP.items():
        sql = (paths.sql_dir / sql_file).read_text(encoding="utf-8")
        parquet_path = paths.marts_dir / f"{output_name}.parquet"
        csv_path = paths.bi_exports_dir / f"{output_name}.csv"
        connection.execute(
            f"COPY ({sql}) TO '{parquet_path.as_posix()}' (FORMAT PARQUET)"
        )
        connection.execute(
            f"COPY ({sql}) TO '{csv_path.as_posix()}' (HEADER, DELIMITER ',')"
        )
        outputs.extend([parquet_path, csv_path])
    connection.close()
    return outputs

