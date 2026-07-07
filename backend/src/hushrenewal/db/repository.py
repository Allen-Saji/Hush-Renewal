"""Data-access layer. Services depend on this, not on SQLAlchemy directly."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from .models import PriceDraw, Round


class RoundRepository:
    def __init__(self, sessionmaker: async_sessionmaker) -> None:
        self._sessionmaker = sessionmaker

    async def add_round(
        self,
        *,
        round_id: str,
        contract_id: str,
        subscription: str,
        deadline: datetime,
        matcher: str,
        customer: str,
        vendor: str,
    ) -> Round:
        row = Round(
            round_id=round_id,
            contract_id=contract_id,
            subscription=subscription,
            deadline=deadline,
            matcher=matcher,
            customer=customer,
            vendor=vendor,
        )
        async with self._sessionmaker() as session, session.begin():
            session.add(row)
        return row

    async def get_round(self, round_id: str) -> Round | None:
        async with self._sessionmaker() as session:
            return await session.get(Round, round_id)

    async def list_rounds(self) -> list[Round]:
        async with self._sessionmaker() as session:
            result = await session.scalars(select(Round).order_by(Round.created_at.desc()))
            return list(result)

    async def record_draw(
        self,
        *,
        round_id: str,
        floor: Decimal,
        ceiling: Decimal,
        price: Decimal | None,
        outcome: str,
        clearing_contract_id: str,
    ) -> None:
        row = PriceDraw(
            round_id=round_id,
            floor=floor,
            ceiling=ceiling,
            price=price,
            outcome=outcome,
            clearing_contract_id=clearing_contract_id,
        )
        async with self._sessionmaker() as session, session.begin():
            session.add(row)
