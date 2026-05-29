"""Integration coverage for operational hardening behavior."""

from __future__ import annotations

from fastapi.testclient import TestClient

from ...main import app


def test_response_includes_request_id_header() -> None:
    """Every request should return a correlation header."""

    client = TestClient(app)
    response = client.get("/api/healthz", headers={"X-Request-ID": "test-request"})
    assert response.headers["X-Request-ID"] == "test-request"


def test_invalid_call_filter_returns_friendly_422() -> None:
    """Invalid filter combinations should return a stable validation envelope."""

    client = TestClient(app)
    response = client.get("/api/calls?min_duration_seconds=60&max_duration_seconds=10")
    body = response.json()
    assert response.status_code == 422
    assert body["error"]["code"] == "validation_error"
    assert body["error"]["request_id"]
