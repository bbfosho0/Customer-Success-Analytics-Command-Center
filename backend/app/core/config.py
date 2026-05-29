"""Centralized settings leveraging Pydantic BaseSettings."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Expose the knobs required by the local API simulation."""

    model_config = SettingsConfigDict(env_file="backend/.env", extra="ignore")

    app_env: str = "local"
    data_source: str = "local"
    parquet_path: str = "data/cleaned_calls.parquet"
    manifest_path: str = "data/manifest.json"
    secret_key: str = "dev-secret"
    enable_refresh_endpoint: bool = True
    cors_origins: str = "http://localhost:3000"


settings = Settings()
