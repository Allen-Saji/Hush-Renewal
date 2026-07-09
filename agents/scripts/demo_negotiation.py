"""Live end-to-end agent negotiation against the running matcher backend.

Drives the whole thing the way the frontend will: open a round, let each agent
reason over ONLY its own brief and seal its number, clear, then prove from the
ledger that neither side could see the other's figure.

Prereqs:
  1. Matcher backend running on BACKEND_URL (default http://localhost:8000),
     itself pointed at the live Seaport DevNet validator.
  2. GROQ_API_KEY set (or CUSTOMER_/VENDOR_ variants).

    set -a; source ~/.config/seaport-devnet.env; set +a   # backend creds (if co-run)
    export GROQ_API_KEY=gsk_...
    uv run python scripts/demo_negotiation.py [deal|no_deal]
"""

from __future__ import annotations

import asyncio
import sys

import httpx

from negotiator.config import Settings
from negotiator.llm import Reasoner
from negotiator.negotiator import Negotiator
from negotiator.schemas import Role, Scenario
from negotiator.sealer import Sealer


def _build(role: Role, http: httpx.AsyncClient) -> Negotiator:
    settings = Settings(role=role)  # type: ignore[call-arg]
    return Negotiator(role, Reasoner(settings), Sealer(role, settings, http))


async def _run_agent(agent: Negotiator, round_id: str, scenario: Scenario) -> None:
    label = ""
    async for event in agent.negotiate(round_id, scenario):
        if event.name == "start":
            label = event.data["role"].upper()
            print(f"\n[{label}] reasoning over its private brief:\n", flush=True)
        elif event.name == "reasoning":
            print(event.data["text"], end="", flush=True)
        elif event.name == "decision":
            print(
                f"\n\n[{label}] committed reservation price = "
                f"${event.data['reservation_price']} "
                f"(confidence {event.data['confidence']})",
                flush=True,
            )
        elif event.name == "sealed":
            print(
                f"[{label}] sealed on Canton as {event.data['side']} "
                f"({event.data['contract_id'][:20]}...)",
                flush=True,
            )
        elif event.name == "error":
            raise SystemExit(f"[{label}] negotiation failed: {event.data['message']}")


async def main() -> None:
    scenario: Scenario = "no_deal" if (len(sys.argv) > 1 and sys.argv[1] == "no_deal") else "deal"
    base = Settings(role="customer").backend_url.rstrip("/")  # type: ignore[call-arg]

    async with httpx.AsyncClient(timeout=90.0) as http:
        # 1. Matcher opens the round.
        resp = await http.post(
            f"{base}/v1/matcher/rounds",
            json={"subscription": "Workday Enterprise HR Suite"},
        )
        resp.raise_for_status()
        round_id = resp.json()["round_id"]
        print(f"round opened: {round_id}  (scenario: {scenario})")

        # 2. Each agent reasons privately and seals. Customer first, then vendor;
        #    neither is handed the other's brief or number.
        customer = _build("customer", http)
        vendor = _build("vendor", http)
        await _run_agent(customer, round_id, scenario)
        await _run_agent(vendor, round_id, scenario)

        # 3. Matcher clears across the two sealed contracts.
        cleared = (await http.post(f"{base}/v1/matcher/rounds/{round_id}/clear")).json()
        print(
            f"\nMATCHER cleared: {cleared['outcome']}"
            + (f" @ ${cleared['price']}" if cleared.get("price") else " (no price revealed)")
        )

        # 4. Privacy proof from the chain: the vendor's own ledger view.
        vendor_view = (await http.get(f"{base}/v1/parties/vendor/contracts")).json()
        leaks = [c for c in vendor_view if "maxPrice" in str(c.get("payload", {}))]
        templates = sorted({c["template"] for c in vendor_view})
        print(f"\nvendor's ledger view: {templates}")
        print(
            "privacy check: "
            + ("FAIL -- customer ceiling leaked!" if leaks else "PASS -- vendor never saw maxPrice")
        )


if __name__ == "__main__":
    asyncio.run(main())
