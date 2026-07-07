"""Read-only round registry (from the app database)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from ...db.repository import RoundRepository
from ...domain.schemas import RoundResponse
from ..deps import get_round_repository

router = APIRouter(prefix="/v1", tags=["rounds"])

RepoDep = Annotated[RoundRepository, Depends(get_round_repository)]


@router.get("/rounds", response_model=list[RoundResponse])
async def list_rounds(repo: RepoDep) -> list[RoundResponse]:
    rows = await repo.list_rounds()
    return [RoundResponse.model_validate(row) for row in rows]


@router.get("/rounds/{round_id}", response_model=RoundResponse)
async def get_round(round_id: str, repo: RepoDep) -> RoundResponse:
    row = await repo.get_round(round_id)
    if row is None:
        raise HTTPException(status_code=404, detail="round not found")
    return RoundResponse.model_validate(row)
