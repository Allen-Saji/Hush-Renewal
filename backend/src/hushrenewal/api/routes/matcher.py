"""Matcher endpoints: open a round, clear a round. Acts only as the matcher."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from ...domain.matcher import MatcherService
from ...domain.schemas import (
    ClearingResponse,
    OpenRoundRequest,
    RoundResponse,
    SettlementProposalResponse,
)
from ..deps import get_matcher_service

router = APIRouter(prefix="/v1/matcher", tags=["matcher"])

MatcherDep = Annotated[MatcherService, Depends(get_matcher_service)]


@router.post("/rounds", response_model=RoundResponse, status_code=201)
async def open_round(body: OpenRoundRequest, service: MatcherDep) -> RoundResponse:
    return await service.open_round(body)


@router.post("/rounds/{round_id}/clear", response_model=ClearingResponse)
async def clear_round(round_id: str, service: MatcherDep) -> ClearingResponse:
    return await service.clear(round_id)


@router.post(
    "/rounds/{round_id}/settlement/propose",
    response_model=SettlementProposalResponse,
    status_code=201,
)
async def propose_settlement(
    round_id: str, service: MatcherDep
) -> SettlementProposalResponse:
    return await service.propose_settlement(round_id)
