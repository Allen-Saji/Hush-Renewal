"""Authorizes this party's settlement leg on Canton via the matcher backend.

Settlement is the agent honoring a clearing it already agreed to: the clearing
contract asserts on-chain that the deal price lies within [floor, ceiling], so a
cleared price is guaranteed to respect this agent's sealed bound. The agent's
policy is to authorize any in-band clearing -- and it, not a human, signs its own
leg. Role-locked by construction, exactly like the sealer.
"""

from __future__ import annotations

from typing import Any

import httpx
import structlog

from .config import Settings
from .errors import SettleError
from .schemas import Role

log = structlog.get_logger(__name__)

# (accept path template, the agent's stated authorization) for each role.
_SETTLE_SPEC: dict[Role, tuple[str, str]] = {
    "customer": (
        "/v1/customer/rounds/{round_id}/settlement/accept",
        "The cleared price is guaranteed within my sealed ceiling by the clearing "
        "contract, so I authorize payment and escrow the cash.",
    ),
    "vendor": (
        "/v1/vendor/rounds/{round_id}/settlement/accept",
        "The cleared price is guaranteed at or above my sealed floor by the "
        "clearing contract, so I authorize the atomic delivery-versus-payment.",
    ),
}


class Settler:
    def __init__(self, role: Role, settings: Settings, http: httpx.AsyncClient) -> None:
        self._role = role
        self._base = settings.backend_url.rstrip("/")
        self._http = http
        self._path, self._rationale = _SETTLE_SPEC[role]

    @property
    def rationale(self) -> str:
        return self._rationale

    async def settle(self, round_id: str) -> dict[str, Any]:
        url = f"{self._base}{self._path.format(round_id=round_id)}"
        try:
            resp = await self._http.post(url)
        except httpx.HTTPError as exc:
            raise SettleError(f"could not reach matcher backend: {exc}") from exc
        if resp.status_code >= 400:
            raise SettleError(
                f"backend rejected the {self._role} settlement "
                f"({resp.status_code}): {resp.text}"
            )
        log.info("settled", role=self._role, round_id=round_id)
        result: dict[str, Any] = resp.json()
        return result
