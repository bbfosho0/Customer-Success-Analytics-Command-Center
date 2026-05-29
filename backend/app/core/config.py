"""Centralized settings leveraging Pydantic BaseSettings."""

from __future__ import annotations

from functools import cached_property

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Expose the knobs required by the local API simulation."""

    model_config = SettingsConfigDict(env_file="backend/.env", extra="ignore")

    app_env: str = "local"
    data_source: str = "local"
    parquet_path: str = "data/cleaned_calls.parquet"
    manifest_path: str = "data/manifest.json"
    secret_key: str = Field(default="dev-secret", min_length=8)
    access_token_expire_minutes: int = Field(default=60, ge=1, le=24 * 60)
    enable_refresh_endpoint: bool = True
    cors_origins: str = "http://localhost:3000"
    log_level: str = "INFO"

    @field_validator("app_env", "data_source", mode="before")
    @classmethod
    def _normalize_lower(cls, value: object) -> object:
        return value.lower() if isinstance(value, str) else value

    @cached_property
    def cors_origin_list(self) -> list[str]:
        """Return configured CORS origins, rejecting wildcard use outside local dev."""

        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        if not origins:
            origins = ["http://localhost:3000"]
        if "*" in origins and self.app_env not in {"local", "test"}:
            raise ValueError("Wildcard CORS origins are only allowed for local/test environments")
        return origins


settings = Settings()
