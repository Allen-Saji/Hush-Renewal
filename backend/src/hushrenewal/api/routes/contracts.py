"""Party-scoped contract views: the privacy-demo surface.

Querying as the vendor returns a view with no SealedBid (and no `maxPrice`
anywhere); querying as the customer, no SealedAsk. This is the endpoint a
frontend uses to show each side that it cannot see the other's number.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from ...core.config import Settings
from ...domain.schemas import ContractView
from ...ledger.client import LedgerClient
from ..deps import get_ledger_client, get_settings

router = APIRouter(prefix="/v1/parties", tags=["contracts"])

LedgerDep = Annotated[LedgerClient, Depends(get_ledger_client)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


@router.get("/{role}/contracts", response_model=list[ContractView])
async def party_contracts(
    role: str, ledger: LedgerDep, settings: SettingsDep
) -> list[ContractView]:
    parties = {
        "matcher": settings.matcher,
        "customer": settings.customer,
        "vendor": settings.vendor,
    }
    party = parties.get(role)
    if party is None:
        raise HTTPException(status_code=404, detail="unknown role")
    rows = await ledger.active_contracts(party)
    return [ContractView(**row) for row in rows]
