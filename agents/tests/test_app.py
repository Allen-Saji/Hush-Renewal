"""App wiring smoke test -- offline (no Groq call needed for /health or /context)."""

from __future__ import annotations

from fastapi.testclient import TestClient

from negotiator.app import create_app
from negotiator.config import Settings


def _client(role: str) -> TestClient:
    settings = Settings(role=role, GROQ_API_KEY="gsk_test")
    return TestClient(create_app(settings))


def test_health_reports_its_role() -> None:
    with _client("customer") as client:
        body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["role"] == "customer"


def test_context_exposes_only_own_brief() -> None:
    with _client("vendor") as client:
        body = client.get("/context", params={"scenario": "deal"}).json()
    assert body["role"] == "vendor"
    assert body["can_see_counterparty_brief"] is False
    assert body["can_see_counterparty_number"] is False
    # a vendor process must not carry the customer's budget or competitor quote
    assert "competitor_quote" not in body["brief"]
    assert "budget_directive" not in body["brief"]
    assert body["brief"]["party"] == "vendor"
