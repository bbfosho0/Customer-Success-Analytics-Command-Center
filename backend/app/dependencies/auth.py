"""Authentication dependencies."""

from __future__ import annotations

from fastapi import Header, HTTPException, status

from ..core.security import verify_token


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, str]:
    """Return the authenticated local user from a signed Bearer token."""

    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expected Bearer token")
    claims = verify_token(token)
    return {"username": str(claims.get("sub", "local-user"))}
