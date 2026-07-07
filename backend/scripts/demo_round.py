"""Live end-to-end demo of the clearing pipeline through the service layer.

Drives open-round -> submit-bid -> submit-ask -> clear against the real Seaport
validator, exactly as the HTTP routes do, but without an HTTP server. Proves the
strict-matcher-only wiring works: each step is executed by its own party-locked
agent.

    set -a; source ~/.config/seaport-devnet.env; set +a
    uv run python scripts/demo_round.py
"""

from __future__ import annotations

import asyncio
from decimal import Decimal

import httpx

from hushrenewal.core.config import get_settings
from hushrenewal.core.logging import configure_logging
from hushrenewal.db.base import create_engine, create_sessionmaker, init_models
from hushrenewal.db.repository import RoundRepository
from hushrenewal.domain.agents import PartyAgent
from hushrenewal.domain.matcher import MatcherService
from hushrenewal.domain.parties import CustomerService, VendorService
from hushrenewal.domain.schemas import OpenRoundRequest
from hushrenewal.ledger.auth import OIDCTokenManager
from hushrenewal.ledger.client import LedgerClient


async def main() -> None:
    settings = get_settings()
    configure_logging(settings)

    engine = create_engine("sqlite+aiosqlite:///./demo.db")
    sessionmaker = create_sessionmaker(engine)
    await init_models(engine)
    rounds = RoundRepository(sessionmaker)

    async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as http:
        tokens = OIDCTokenManager(settings, http)
        ledger = LedgerClient(settings, http, tokens)

        matcher = MatcherService(PartyAgent(settings.matcher, ledger), rounds, settings)
        customer = CustomerService(PartyAgent(settings.customer, ledger), settings)
        vendor = VendorService(PartyAgent(settings.vendor, ledger), settings)

        rnd = await matcher.open_round(OpenRoundRequest(subscription="Workday Enterprise"))
        print(f"1. opened  {rnd.round_id}  ({rnd.contract_id[:16]}...)")

        bid = await customer.submit_bid(rnd.round_id, Decimal("100000"))
        print(f"2. bid     ceiling 100000  ({bid.contract_id[:16]}...)")

        ask = await vendor.submit_ask(rnd.round_id, Decimal("80000"))
        print(f"3. ask     floor 80000     ({ask.contract_id[:16]}...)")

        cleared = await matcher.clear(rnd.round_id)
        print(f"4. cleared {cleared.outcome} @ {cleared.price}  ({cleared.contract_id[:16]}...)")

        proposal = await matcher.propose_settlement(rnd.round_id)
        print(f"5. matcher proposed settlement  ({proposal.contract_id[:16]}...)")

        accepted = await customer.accept_settlement(rnd.round_id)
        print(f"6. customer accepted + escrowed cash  ({accepted.accepted_contract_id[:16]}...)")

        settled = await vendor.accept_settlement(rnd.round_id)
        print("7. vendor accepted -> SETTLED atomically")
        print(
            f"   license {settled.license_contract_id[:16]}...  "
            f"vendor cash {settled.vendor_cash_contract_id[:16]}..."
        )

        vendor_view = [c["template"] for c in await ledger.active_contracts(settings.vendor)]
        print(f"\nvendor sees: {sorted(set(vendor_view))}  (no SealedBid = privacy holds)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
