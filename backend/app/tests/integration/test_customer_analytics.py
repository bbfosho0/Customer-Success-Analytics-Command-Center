from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_customer_analytics_overview_returns_kpis() -> None:
    response = client.get("/api/customer-analytics/overview")

    assert response.status_code == 200
    payload = response.json()
    assert payload["kpis"]
    assert any(kpi["label"] == "At-risk MRR" for kpi in payload["kpis"])


def test_churn_risk_accounts_are_sorted_by_priority() -> None:
    response = client.get("/api/customer-analytics/churn-risk")

    assert response.status_code == 200
    rows = response.json()
    assert rows
    assert [row["priority_rank"] for row in rows] == sorted(row["priority_rank"] for row in rows)
    assert all(row["customer_success_manager"] for row in rows)


def test_retention_and_ltv_endpoints_return_rows() -> None:
    retention = client.get("/api/customer-analytics/retention-cohorts")
    ltv = client.get("/api/customer-analytics/ltv")

    assert retention.status_code == 200
    assert ltv.status_code == 200
    assert retention.json()
    assert ltv.json()


def test_bi_exports_and_account_detail() -> None:
    exports = client.get("/api/customer-analytics/bi-exports")
    detail = client.get("/api/customer-analytics/accounts/acct_001")
    missing = client.get("/api/customer-analytics/accounts/unknown")

    assert exports.status_code == 200
    assert any(row["name"] == "customer_360" for row in exports.json())
    assert detail.status_code == 200
    assert detail.json()["account_id"] == "acct_001"
    assert missing.status_code == 404


def test_expansion_opportunities_include_customer_success_manager() -> None:
    response = client.get("/api/customer-analytics/expansion-opportunities")

    assert response.status_code == 200
    rows = response.json()
    assert rows
    assert all(row["customer_success_manager"] for row in rows)
