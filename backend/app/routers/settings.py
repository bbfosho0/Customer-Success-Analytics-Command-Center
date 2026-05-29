"""Settings and manifest diagnostics router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from ..core.config import settings
from ..models import ManifestInfo
from ..repositories import manifest_repo
from ..services.data_access import clear_data_cache, resolve_repo_path
from ..services.refresh import trigger_refresh

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/manifest")
async def get_manifest() -> dict[str, ManifestInfo]:
    """Expose manifest metadata so the frontend can display diagnostics."""

    record = manifest_repo.get_manifest(resolve_repo_path(settings.manifest_path))
    return {"data": ManifestInfo.model_validate(record.__dict__)}


@router.post("/refresh")
async def refresh_data() -> dict[str, object]:
    """Run the local ETL refresh hook when enabled for development."""

    if not settings.enable_refresh_endpoint:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Refresh endpoint disabled")
    manifest = trigger_refresh(resolve_repo_path("scripts/generate_parquet.py"))
    clear_data_cache()
    return {"data": manifest}
