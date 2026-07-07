"""Vendor endpoints: submit a sealed ask. Acts only as the vendor."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from ...domain.parties import VendorService
from ...domain.schemas import SettlementResponse, SubmitAskRequest, SubmitResponse
from ..deps import get_vendor_service

router = APIRouter(prefix="/v1/vendor", tags=["vendor"])

VendorDep = Annotated[VendorService, Depends(get_vendor_service)]


@router.post("/rounds/{round_id}/ask", response_model=SubmitResponse, status_code=201)
async def submit_ask(
    round_id: str, body: SubmitAskRequest, service: VendorDep
) -> SubmitResponse:
    return await service.submit_ask(round_id, body.min_price)


@router.post(
    "/rounds/{round_id}/settlement/accept",
    response_model=SettlementResponse,
    status_code=201,
)
async def accept_settlement(round_id: str, service: VendorDep) -> SettlementResponse:
    return await service.accept_settlement(round_id)
