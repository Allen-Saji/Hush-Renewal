"""The negotiator: reason over the private brief, commit a number, seal it.

Emits a sequence of events so a viewer can watch the whole thing happen live --
the reasoning as it streams, the committed reservation price, and the on-ledger
contract id once the number is sealed on Canton. One negotiator serves one role;
it can only ever load its own brief and seal on its own side.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any

import structlog

from .briefs import brief_for
from .errors import NegotiationError
from .llm import Reasoner
from .schemas import ContextView, Role, Scenario
from .sealer import Sealer

log = structlog.get_logger(__name__)


@dataclass(frozen=True)
class Event:
    """One item in the negotiation stream. `name` is the SSE event type."""

    name: str
    data: dict[str, Any]


class Negotiator:
    def __init__(self, role: Role, reasoner: Reasoner, sealer: Sealer) -> None:
        self._role = role
        self._reasoner = reasoner
        self._sealer = sealer

    def context(self, scenario: Scenario) -> ContextView:
        """Exactly what this agent can see -- its own brief, nothing else."""
        return ContextView(
            role=self._role,
            scenario=scenario,
            brief=brief_for(self._role, scenario).model_dump(mode="json"),
        )

    async def negotiate(
        self, round_id: str, scenario: Scenario
    ) -> AsyncIterator[Event]:
        brief = brief_for(self._role, scenario)
        log.info("negotiate.start", role=self._role, round_id=round_id, scenario=scenario)
        yield Event("start", {"role": self._role, "round_id": round_id, "scenario": scenario})

        try:
            parts: list[str] = []
            async for chunk in self._reasoner.stream_reasoning(brief):
                parts.append(chunk)
                yield Event("reasoning", {"text": chunk})

            decision = await self._reasoner.decide(brief, "".join(parts))
            yield Event(
                "decision",
                {
                    "reservation_price": str(decision.reservation_price),
                    "confidence": decision.confidence,
                    "rationale": decision.rationale,
                },
            )

            seal = await self._sealer.seal(round_id, decision.reservation_price)
            yield Event("sealed", {"contract_id": seal.contract_id, "side": seal.side})

            log.info(
                "negotiate.done",
                role=self._role,
                round_id=round_id,
                side=seal.side,
                contract_id=seal.contract_id,
            )
            yield Event(
                "done",
                {
                    "role": self._role,
                    "round_id": round_id,
                    "reservation_price": str(decision.reservation_price),
                    "contract_id": seal.contract_id,
                },
            )
        except NegotiationError as exc:
            log.warning("negotiate.failed", role=self._role, round_id=round_id, error=str(exc))
            yield Event("error", {"message": str(exc)})
