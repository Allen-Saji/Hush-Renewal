"""Adversarial demo endpoints: probes that a faked demo could not survive."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from ...domain.adversarial import AdversarialService
from ...domain.schemas import ForceBadSettlementResult, PeekResult
from ..deps import get_adversarial_service

router = APIRouter(prefix="/v1/adversarial", tags=["adversarial"])

AdversarialDep = Annotated[AdversarialService, Depends(get_adversarial_service)]


@router.post("/rounds/{round_id}/peek", response_model=PeekResult)
async def peek(round_id: str, service: AdversarialDep) -> PeekResult:
    """The vendor attempts to read the customer's sealed bid from the ledger."""
    return await service.peek(round_id)


@router.post(
    "/rounds/{round_id}/force-bad-settlement", response_model=ForceBadSettlementResult
)
async def force_bad_settlement(
    round_id: str, service: AdversarialDep
) -> ForceBadSettlementResult:
    """Escrow a mismatched cash amount and try to settle; the ledger reverts it."""
    return await service.force_bad_settlement(round_id)
