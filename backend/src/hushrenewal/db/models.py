"""ORM models. The ledger holds the authoritative contract state; these tables
hold app-level metadata: a round registry (round_id -> contract id) and an audit
log of every off-chain clearing-price draw the matcher makes.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Round(Base):
    __tablename__ = "rounds"

    round_id: Mapped[str] = mapped_column(String, primary_key=True)
    contract_id: Mapped[str] = mapped_column(String, nullable=False)
    subscription: Mapped[str] = mapped_column(String, nullable=False)
    deadline: Mapped[datetime] = mapped_column(nullable=False)
    matcher: Mapped[str] = mapped_column(String, nullable=False)
    customer: Mapped[str] = mapped_column(String, nullable=False)
    vendor: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    draws: Mapped[list[PriceDraw]] = relationship(back_populates="round")


class PriceDraw(Base):
    """One row per Clear: the sealed band the matcher saw and the price it drew.
    This is the off-chain audit trail behind random-in-band clearing.
    """

    __tablename__ = "price_draws"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    round_id: Mapped[str] = mapped_column(ForeignKey("rounds.round_id"), nullable=False)
    floor: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    ceiling: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    price: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    outcome: Mapped[str] = mapped_column(String, nullable=False)
    clearing_contract_id: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    round: Mapped[Round] = relationship(back_populates="draws")
