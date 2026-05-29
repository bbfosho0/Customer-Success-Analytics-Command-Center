"""Local authentication router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from ..core.security import issue_dev_token
from ..schemas import AuthCredentials, AuthResponse, AuthToken

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/sign-in", response_model=AuthResponse)
async def sign_in(payload: AuthCredentials) -> AuthResponse:
    """Issue a signed local JWT for non-empty development credentials."""

    if not payload.username.strip() or not payload.password.strip():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username and password are required")
    return AuthResponse(data=AuthToken.model_validate(issue_dev_token(payload.username)))
