"""OIDC client-credentials token manager for the Seaport validator.

The m2m token expires every ~8h. This manager caches it, decodes the `sub`
claim (the ledger userId that every command submission must carry), and
refreshes ahead of expiry under a single-flight lock so concurrent requests
never trigger a thundering herd of token mints.
"""

from __future__ import annotations

import asyncio
import base64
import binascii
import json
import time
from typing import Any

import httpx
import structlog
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from ..core.config import Settings
from ..core.exceptions import LedgerAuthError

log = structlog.get_logger(__name__)


def _decode_jwt_claims(token: str) -> dict[str, Any]:
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload))  # type: ignore[no-any-return]
    except (IndexError, ValueError, binascii.Error) as exc:
        raise LedgerAuthError("Could not decode access token claims") from exc


class OIDCTokenManager:
    def __init__(self, settings: Settings, http: httpx.AsyncClient) -> None:
        self._s = settings
        self._http = http
        self._lock = asyncio.Lock()
        self._token: str | None = None
        self._user_id: str | None = None
        self._expires_at = 0.0  # time.monotonic() deadline

    async def token(self) -> str:
        if self._is_valid() and self._token is not None:
            return self._token
        async with self._lock:
            if not (self._is_valid() and self._token is not None):
                await self._refresh()
            if self._token is None:
                raise LedgerAuthError("Access token unavailable after refresh")
            return self._token

    async def user_id(self) -> str:
        await self.token()
        if self._user_id is None:
            raise LedgerAuthError("userId unavailable after token refresh")
        return self._user_id

    def _is_valid(self) -> bool:
        leeway = self._s.token_refresh_leeway_seconds
        return self._token is not None and time.monotonic() < (self._expires_at - leeway)

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, max=4),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    async def _post_token(self) -> httpx.Response:
        return await self._http.post(
            self._s.oidc_token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": self._s.oidc_client_id,
                "client_secret": self._s.oidc_client_secret.get_secret_value(),
                "audience": self._s.oidc_audience,
                "scope": self._s.oidc_scope,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    async def _refresh(self) -> None:
        try:
            resp = await self._post_token()
        except httpx.HTTPError as exc:
            raise LedgerAuthError(f"Token endpoint unreachable: {exc}") from exc
        if resp.status_code != 200:
            raise LedgerAuthError(
                f"Token mint failed with HTTP {resp.status_code}", status_code=resp.status_code
            )
        data = resp.json()
        token: str = data["access_token"]
        claims = _decode_jwt_claims(token)
        self._token = token
        self._user_id = str(claims["sub"])
        self._expires_at = time.monotonic() + float(data.get("expires_in", 3600))
        log.info("oidc.token.refreshed", user_id=self._user_id, expires_in=data.get("expires_in"))
