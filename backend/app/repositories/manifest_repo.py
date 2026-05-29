"""Cached manifest repository that mirrors support_analytics.manifest."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from support_analytics.manifest import ManifestRecord, load_manifest


@lru_cache(maxsize=8)
def _get_manifest_cached(manifest_path: str, mtime_ns: int | None) -> ManifestRecord:
    return load_manifest(Path(manifest_path))


def get_manifest(manifest_path: Path) -> ManifestRecord:
    """Load manifest metadata with mtime-aware in-process caching."""

    mtime_ns = manifest_path.stat().st_mtime_ns if manifest_path.exists() else None
    return _get_manifest_cached(str(manifest_path), mtime_ns)


def clear_manifest_cache() -> None:
    """Invalidate cached manifest metadata after refresh."""

    _get_manifest_cached.cache_clear()
