"""Liveness and readiness probes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from ...domain.schemas import HealthResponse
from ...ledger.client import LedgerClient
from ..deps import get_ledger_client

router = APIRouter(tags=["health"])

LedgerDep = Annotated[LedgerClient, Depends(get_ledger_client)]


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness: the process is up. Does not touch the ledger."""
    return HealthResponse(status="ok")


@router.get("/health/ledger", response_model=HealthResponse)
async def health_ledger(ledger: LedgerDep) -> HealthResponse:
    """Readiness: we can mint a token and reach the validator. 502 on failure."""
    end = await ledger.ledger_end()
    return HealthResponse(status="ok", ledger_end=end)
