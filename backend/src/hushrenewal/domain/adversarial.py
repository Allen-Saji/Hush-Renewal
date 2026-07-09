"""Adversarial probes for the demo.

Two actions that a faked demo could never survive:

- `peek`: the vendor queries the ledger for the customer's sealed bid. The bid
  provably exists (the matcher holds its contract id), yet the vendor's own
  active-contract view does not contain it -- Canton privacy, live.
- `force_bad_settlement`: escrow a cash amount that does not equal the deal
  price and try to settle. The ledger rejects it, so no half-settled,
  paid-but-not-renewed state is reachable.

Both compose the existing single-party services and agents, so the strict
"no action signs for more than one party" boundary still holds.
"""

from __future__ import annotations

from decimal import Decimal

import structlog

from ..core.config import Settings
from ..core.exceptions import CommandRejected
from ..domain.agents import PartyAgent
from ..domain.finding import find_by_round
from ..domain.matcher import MatcherService
from ..domain.parties import CustomerService
from ..domain.schemas import ForceBadSettlementResult, PeekResult
from ..ledger.constants import Template

log = structlog.get_logger(__name__)


class AdversarialService:
    def __init__(
        self,
        matcher_agent: PartyAgent,
        vendor_agent: PartyAgent,
        matcher_service: MatcherService,
        customer_service: CustomerService,
        settings: Settings,
    ) -> None:
        self._matcher_agent = matcher_agent
        self._vendor_agent = vendor_agent
        self._matcher_service = matcher_service
        self._customer_service = customer_service
        self._s = settings

    async def peek(self, round_id: str) -> PeekResult:
        """The vendor tries to read the customer's sealed bid, and cannot."""
        matcher_view = await self._matcher_agent.active_contracts()
        bid = find_by_round(matcher_view, Template.SEALED_BID, round_id)

        vendor_view = await self._vendor_agent.active_contracts()
        scoped = [c for c in vendor_view if c["payload"].get("roundId") == round_id]
        vendor_sees_bid = any(
            c["template"] == Template.SEALED_BID or "maxPrice" in str(c["payload"])
            for c in scoped
        )
        templates = sorted({c["template"] for c in scoped})

        log.info(
            "adversarial.peek",
            round_id=round_id,
            bid_exists=bid is not None,
            vendor_sees_bid=vendor_sees_bid,
        )
        return PeekResult(
            round_id=round_id,
            bid_exists=bid is not None,
            bid_contract_id=bid["contract_id"] if bid else None,
            vendor_can_see_bid=vendor_sees_bid,
            vendor_visible_templates=templates,
            verdict="leaked" if vendor_sees_bid else "denied",
        )

    async def force_bad_settlement(self, round_id: str) -> ForceBadSettlementResult:
        """Escrow a mismatched cash amount and try to settle; expect a revert."""
        view = await self._matcher_agent.active_contracts()
        clearing = find_by_round(view, Template.CLEARING_RESULT, round_id)
        if clearing is None or clearing["payload"].get("outcome") != "DEAL":
            raise CommandRejected(
                "Force-fail needs a round that already cleared as a DEAL",
                status_code=409,
            )

        proposal = find_by_round(view, Template.SETTLEMENT_PROPOSAL, round_id)
        if proposal is None:
            await self._matcher_service.propose_settlement(round_id)
            view = await self._matcher_agent.active_contracts()
            proposal = find_by_round(view, Template.SETTLEMENT_PROPOSAL, round_id)
        if proposal is None:
            raise CommandRejected(
                "Could not create a settlement proposal to probe", status_code=409
            )

        price = Decimal(str(proposal["payload"]["price"]))
        wrong = price - Decimal("5000")
        if wrong <= 0:
            wrong = (price / 2).quantize(Decimal("0.01"))

        try:
            await self._customer_service.accept_settlement(
                round_id, amount_override=wrong
            )
        except CommandRejected as exc:
            log.info("adversarial.force_bad_settlement.reverted", round_id=round_id)
            return ForceBadSettlementResult(
                round_id=round_id,
                deal_price=price,
                escrowed_amount=wrong,
                reverted=True,
                ledger_error=exc.message,
                note=(
                    "The ledger rejected the mismatched settlement, so no "
                    "half-settled, paid-but-not-renewed state was created."
                ),
            )

        log.warning("adversarial.force_bad_settlement.accepted", round_id=round_id)
        return ForceBadSettlementResult(
            round_id=round_id,
            deal_price=price,
            escrowed_amount=wrong,
            reverted=False,
            ledger_error=None,
            note="Unexpected: the mismatched settlement was NOT rejected.",
        )
