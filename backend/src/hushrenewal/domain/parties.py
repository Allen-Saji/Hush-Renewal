"""Customer and vendor services.

Each acts as exactly one party and submits only that party's single-signatory
sealed contract. In production these would be separate services owned by the
customer and vendor; here they are code-isolated behind party-locked agents.
"""

from __future__ import annotations

from decimal import Decimal

import structlog

from ..core.config import Settings
from ..core.exceptions import CommandRejected
from ..domain.agents import PartyAgent
from ..domain.finding import find_by_round
from ..domain.schemas import CustomerAcceptResponse, SettlementResponse, SubmitResponse
from ..ledger.client import LedgerClient
from ..ledger.constants import Template

log = structlog.get_logger(__name__)


def _decimal_str(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01')):f}"


class CustomerService:
    def __init__(self, customer: PartyAgent, settings: Settings) -> None:
        self._customer = customer
        self._s = settings

    async def submit_bid(self, round_id: str, max_price: Decimal) -> SubmitResponse:
        tx = await self._customer.create(
            Template.SEALED_BID,
            {
                "customer": self._s.customer,
                "matcher": self._s.matcher,
                "roundId": round_id,
                "maxPrice": _decimal_str(max_price),
            },
        )
        contract_id = LedgerClient.created_contracts(tx).get(Template.SEALED_BID)
        if contract_id is None:
            raise CommandRejected("SealedBid was not created")
        log.info("bid.submitted", round_id=round_id)
        return SubmitResponse(contract_id=contract_id)

    async def accept_settlement(self, round_id: str) -> CustomerAcceptResponse:
        """Accept the matcher's proposal: escrow cash equal to the deal price,
        then sign AcceptByCustomer. Acts only as the customer."""
        view = await self._customer.active_contracts()
        proposal = find_by_round(view, Template.SETTLEMENT_PROPOSAL, round_id)
        if proposal is None:
            raise CommandRejected(
                f"No settlement proposal for round {round_id}", status_code=404
            )
        price = Decimal(str(proposal["payload"]["price"]))
        cash_tx = await self._customer.create(
            Template.CASH,
            {
                "owner": self._s.customer,
                "issuer": self._s.customer,
                "amount": _decimal_str(price),
                "matcher": self._s.matcher,
            },
        )
        cash_cid = LedgerClient.created_contracts(cash_tx).get(Template.CASH)
        if cash_cid is None:
            raise CommandRejected("Cash was not created")
        tx = await self._customer.exercise(
            Template.SETTLEMENT_PROPOSAL,
            proposal["contract_id"],
            "AcceptByCustomer",
            {"cashCid": cash_cid},
        )
        events = LedgerClient.created_events(tx)
        accepted = next(
            (e for e in events if e["template"] == Template.SETTLEMENT_CUSTOMER_ACCEPTED),
            None,
        )
        if accepted is None:
            raise CommandRejected("AcceptByCustomer did not create the accepted record")
        log.info("settlement.customer_accepted", round_id=round_id)
        return CustomerAcceptResponse(
            accepted_contract_id=accepted["contract_id"], cash_contract_id=cash_cid
        )


class VendorService:
    def __init__(self, vendor: PartyAgent, settings: Settings) -> None:
        self._vendor = vendor
        self._s = settings

    async def submit_ask(self, round_id: str, min_price: Decimal) -> SubmitResponse:
        tx = await self._vendor.create(
            Template.SEALED_ASK,
            {
                "vendor": self._s.vendor,
                "matcher": self._s.matcher,
                "roundId": round_id,
                "minPrice": _decimal_str(min_price),
            },
        )
        contract_id = LedgerClient.created_contracts(tx).get(Template.SEALED_ASK)
        if contract_id is None:
            raise CommandRejected("SealedAsk was not created")
        log.info("ask.submitted", round_id=round_id)
        return SubmitResponse(contract_id=contract_id)

    async def accept_settlement(self, round_id: str) -> SettlementResponse:
        """Accept the customer-signed settlement: AcceptByVendor fires the atomic
        delivery-versus-payment. Acts only as the vendor."""
        view = await self._vendor.active_contracts()
        accepted = find_by_round(view, Template.SETTLEMENT_CUSTOMER_ACCEPTED, round_id)
        if accepted is None:
            raise CommandRejected(
                f"No customer-accepted settlement for round {round_id}", status_code=404
            )
        # read_as customer so this single-participant submission can resolve the
        # customer's escrowed cash that AcceptByVendor fetches. In a multi-
        # participant deploy this becomes Canton explicit disclosure instead.
        tx = await self._vendor.exercise(
            Template.SETTLEMENT_CUSTOMER_ACCEPTED,
            accepted["contract_id"],
            "AcceptByVendor",
            {},
            read_as=[self._s.customer],
        )
        created = LedgerClient.created_contracts(tx)
        license_cid = created.get(Template.RENEWED_LICENSE)
        vendor_cash_cid = created.get(Template.CASH)
        if not (license_cid and vendor_cash_cid):
            raise CommandRejected("AcceptByVendor did not complete settlement")
        log.info("settlement.vendor_accepted", round_id=round_id)
        return SettlementResponse(
            license_contract_id=license_cid, vendor_cash_contract_id=vendor_cash_cid
        )
