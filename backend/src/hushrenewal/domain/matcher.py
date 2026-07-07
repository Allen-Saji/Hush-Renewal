"""Matcher service: the neutral party that opens rounds and clears them.

Acts only as the matcher. To clear, it reads the two sealed contracts from its
own ledger view (the matcher is an observer on both, the honest trust boundary),
draws a random-in-band price off-chain, and exercises `Clear`, which validates
band membership on-chain. Every draw is written to the audit log.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import structlog

from ..core.config import Settings
from ..core.exceptions import CommandRejected
from ..db.repository import RoundRepository
from ..domain.agents import PartyAgent
from ..domain.finding import find_by_round
from ..domain.schemas import (
    ClearingResponse,
    OpenRoundRequest,
    RoundResponse,
    SettlementProposalResponse,
)
from ..ledger.client import LedgerClient
from ..ledger.constants import Template
from .pricing import draw_in_band

log = structlog.get_logger(__name__)


def _iso_z(dt: datetime) -> str:
    return dt.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def _decimal_str(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01')):f}"


class MatcherService:
    def __init__(self, matcher: PartyAgent, rounds: RoundRepository, settings: Settings) -> None:
        self._matcher = matcher
        self._rounds = rounds
        self._s = settings

    async def open_round(self, request: OpenRoundRequest) -> RoundResponse:
        round_id = f"round-{uuid.uuid4().hex[:8]}"
        deadline = request.deadline or (
            datetime.now(UTC) + timedelta(days=self._s.default_round_days)
        )
        tx = await self._matcher.create(
            Template.RENEWAL_ROUND,
            {
                "matcher": self._s.matcher,
                "customer": self._s.customer,
                "vendor": self._s.vendor,
                "roundId": round_id,
                "subscription": request.subscription,
                "deadline": _iso_z(deadline),
            },
        )
        contract_id = LedgerClient.created_contracts(tx).get(Template.RENEWAL_ROUND)
        if contract_id is None:
            raise CommandRejected("RenewalRound was not created")
        await self._rounds.add_round(
            round_id=round_id,
            contract_id=contract_id,
            subscription=request.subscription,
            deadline=deadline,
            matcher=self._s.matcher,
            customer=self._s.customer,
            vendor=self._s.vendor,
        )
        log.info("round.opened", round_id=round_id, contract_id=contract_id)
        return RoundResponse(
            round_id=round_id,
            contract_id=contract_id,
            matcher=self._s.matcher,
            customer=self._s.customer,
            vendor=self._s.vendor,
            subscription=request.subscription,
            deadline=deadline,
        )

    async def clear(self, round_id: str) -> ClearingResponse:
        record = await self._rounds.get_round(round_id)
        if record is None:
            raise CommandRejected(f"Unknown round {round_id}", status_code=404)

        view = await self._matcher.active_contracts()
        bid = find_by_round(view, Template.SEALED_BID, round_id)
        ask = find_by_round(view, Template.SEALED_ASK, round_id)
        if bid is None or ask is None:
            raise CommandRejected(
                "Both a sealed bid and a sealed ask are required before clearing",
                status_code=409,
            )

        ceiling = Decimal(str(bid["payload"]["maxPrice"]))
        floor = Decimal(str(ask["payload"]["minPrice"]))
        is_deal = floor <= ceiling
        price = draw_in_band(floor, ceiling) if is_deal else floor

        tx = await self._matcher.exercise(
            Template.RENEWAL_ROUND,
            record.contract_id,
            "Clear",
            {
                "bidCid": bid["contract_id"],
                "askCid": ask["contract_id"],
                "dealPrice": _decimal_str(price),
            },
        )
        events = LedgerClient.created_events(tx)
        result = next(
            (e for e in events if e["template"] == Template.CLEARING_RESULT), None
        )
        if result is None:
            raise CommandRejected("Clear did not produce a ClearingResult")

        outcome = result["payload"].get("outcome", "UNKNOWN")
        cleared_price = price if outcome == "DEAL" else None
        await self._rounds.record_draw(
            round_id=round_id,
            floor=floor,
            ceiling=ceiling,
            price=cleared_price,
            outcome=outcome,
            clearing_contract_id=result["contract_id"],
        )
        log.info("round.cleared", round_id=round_id, outcome=outcome)
        return ClearingResponse(
            contract_id=result["contract_id"], outcome=outcome, price=cleared_price
        )

    async def propose_settlement(self, round_id: str) -> SettlementProposalResponse:
        view = await self._matcher.active_contracts()
        clearing = find_by_round(view, Template.CLEARING_RESULT, round_id)
        if clearing is None:
            raise CommandRejected(f"No cleared result for round {round_id}", status_code=404)
        if clearing["payload"].get("outcome") != "DEAL":
            raise CommandRejected(
                "Round did not clear as a DEAL; nothing to settle", status_code=409
            )
        tx = await self._matcher.exercise(
            Template.CLEARING_RESULT, clearing["contract_id"], "ProposeSettlement", {}
        )
        events = LedgerClient.created_events(tx)
        proposal = next(
            (e for e in events if e["template"] == Template.SETTLEMENT_PROPOSAL), None
        )
        if proposal is None:
            raise CommandRejected("ProposeSettlement did not create a proposal")
        log.info("settlement.proposed", round_id=round_id)
        return SettlementProposalResponse(contract_id=proposal["contract_id"])
