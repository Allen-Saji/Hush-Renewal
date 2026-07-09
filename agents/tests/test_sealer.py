"""The sealer is role-locked: each role can only reach its own endpoint."""

from __future__ import annotations

import json
from decimal import Decimal

import httpx
import pytest

from negotiator.config import Settings
from negotiator.sealer import Sealer


def _settings(role: str) -> Settings:
    return Settings(role=role, GROQ_API_KEY="gsk_test", BACKEND_URL="http://backend")


@pytest.mark.parametrize(
    ("role", "expected_path", "expected_field"),
    [
        ("customer", "/v1/customer/rounds/r1/bid", "max_price"),
        ("vendor", "/v1/vendor/rounds/r1/ask", "min_price"),
    ],
)
async def test_sealer_posts_only_its_own_endpoint(
    role: str, expected_path: str, expected_field: str
) -> None:
    seen: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["body"] = json.loads(request.content)
        return httpx.Response(201, json={"contract_id": "abc123"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as http:
        sealer = Sealer(role, _settings(role), http)  # type: ignore[arg-type]
        result = await sealer.seal("r1", Decimal("81234.5"))

    assert seen["url"] == f"http://backend{expected_path}"
    assert expected_field in seen["body"]  # type: ignore[operator]
    assert result.contract_id == "abc123"
    assert result.side == ("bid" if role == "customer" else "ask")
