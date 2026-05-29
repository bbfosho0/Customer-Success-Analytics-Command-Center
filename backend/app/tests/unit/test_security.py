"""Unit tests for local signed JWT helpers."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from ...core.security import issue_dev_token, verify_token


def test_issue_dev_token_returns_verifiable_jwt() -> None:
    """Issued tokens should be signed and decode to the requested subject."""

    token = issue_dev_token("admin")["access_token"]
    claims = verify_token(token)
    assert claims["sub"] == "admin"


def test_verify_token_rejects_tampered_signature() -> None:
    """Changing the token signature should fail verification."""

    token = issue_dev_token("admin")["access_token"]
    tampered = token.rsplit(".", 1)[0] + ".invalid"
    with pytest.raises(HTTPException):
        verify_token(tampered)
