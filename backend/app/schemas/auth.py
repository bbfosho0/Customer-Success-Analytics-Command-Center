"""Authentication input/output schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class AuthCredentials(BaseModel):
    """Simple username/password payload for the local auth endpoint."""

    model_config = ConfigDict(extra="forbid")

    username: str
    password: str


class AuthToken(BaseModel):
    """Signed local access token response."""

    model_config = ConfigDict(extra="forbid")

    access_token: str
    token_type: str = "bearer"
    expires_at: str


class AuthResponse(BaseModel):
    """Envelope returned by the local auth endpoint."""

    model_config = ConfigDict(extra="forbid")

    data: AuthToken
