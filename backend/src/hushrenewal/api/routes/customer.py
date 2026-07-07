"""Customer endpoints: submit a sealed bid. Acts only as the customer."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from ...domain.parties import CustomerService
from ...domain.schemas import CustomerAcceptResponse, SubmitBidRequest, SubmitResponse
from ..deps import get_customer_service

router = APIRouter(prefix="/v1/customer", tags=["customer"])

CustomerDep = Annotated[CustomerService, Depends(get_customer_service)]


@router.post("/rounds/{round_id}/bid", response_model=SubmitResponse, status_code=201)
async def submit_bid(
    round_id: str, body: SubmitBidRequest, service: CustomerDep
) -> SubmitResponse:
    return await service.submit_bid(round_id, body.max_price)


@router.post(
    "/rounds/{round_id}/settlement/accept",
    response_model=CustomerAcceptResponse,
    status_code=201,
)
async def accept_settlement(
    round_id: str, service: CustomerDep
) -> CustomerAcceptResponse:
    return await service.accept_settlement(round_id)
