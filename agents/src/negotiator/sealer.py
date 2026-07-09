"""Seals a reservation price on Canton via the matcher backend.

Role-locked by construction: a customer sealer can only build the customer bid
URL, a vendor sealer only the vendor ask URL. There is no code path by which one
agent submits on the other's endpoint -- the backend's party-locked service is
the second lock behind this one.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

import httpx
import structlog

from .config import Settings
from .errors import SealError
from .schemas import Role, SealResult

log = structlog.get_logger(__name__)

Side = Literal["bid", "ask"]

# (path template, JSON field, side label) for each role.
_SEAL_SPEC: dict[Role, tuple[str, str, Side]] = {
    "customer": ("/v1/customer/rounds/{round_id}/bid", "max_price", "bid"),
    "vendor": ("/v1/vendor/rounds/{round_id}/ask", "min_price", "ask"),
}


class Sealer:
    def __init__(self, role: Role, settings: Settings, http: httpx.AsyncClient) -> None:
        self._role = role
        self._base = settings.backend_url.rstrip("/")
        self._http = http
        self._path, self._field, self._side = _SEAL_SPEC[role]

    async def seal(self, round_id: str, price: Decimal) -> SealResult:
        url = f"{self._base}{self._path.format(round_id=round_id)}"
        body = {self._field: f"{price.quantize(Decimal('0.01')):f}"}
        try:
            resp = await self._http.post(url, json=body)
        except httpx.HTTPError as exc:
            raise SealError(f"could not reach matcher backend: {exc}") from exc
        if resp.status_code >= 400:
            raise SealError(
                f"backend rejected the {self._side} ({resp.status_code}): {resp.text}"
            )
        contract_id = resp.json().get("contract_id")
        if not contract_id:
            raise SealError("backend did not return a contract id")
        log.info("sealed", role=self._role, side=self._side, round_id=round_id)
        return SealResult(contract_id=contract_id, side=self._side)
