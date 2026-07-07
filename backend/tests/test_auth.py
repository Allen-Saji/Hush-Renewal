from __future__ import annotations

import base64
import json

import httpx
import respx

from hushrenewal.core.config import Settings
from hushrenewal.ledger.auth import OIDCTokenManager


def _fake_jwt(sub: str) -> str:
    def seg(d: dict[str, object]) -> str:
        return base64.urlsafe_b64encode(json.dumps(d).encode()).rstrip(b"=").decode()

    return f"{seg({'alg': 'HS256'})}.{seg({'sub': sub})}.signature"


@respx.mock
async def test_token_is_minted_and_sub_is_extracted() -> None:
    settings = Settings()  # type: ignore[call-arg]
    token = _fake_jwt("6")
    route = respx.post(settings.oidc_token_url).mock(
        return_value=httpx.Response(200, json={"access_token": token, "expires_in": 28800})
    )
    async with httpx.AsyncClient() as http:
        manager = OIDCTokenManager(settings, http)
        assert await manager.token() == token
        assert await manager.user_id() == "6"
        # Cached: a second call does not hit the token endpoint again.
        assert await manager.token() == token
    assert route.call_count == 1
