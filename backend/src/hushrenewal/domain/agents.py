"""Party-locked ledger agents.

Each agent can act as exactly one Canton party and nothing else. This is how
strict separation is enforced in code: the matcher service is handed only the
matcher agent, so it is structurally incapable of signing for customer or
vendor. In production each agent would carry its own OIDC credential and run as
its own service; here they share one validator token but stay code-isolated.
"""

from __future__ import annotations

from ..ledger.client import Json, LedgerClient


class PartyAgent:
    def __init__(self, party: str, ledger: LedgerClient) -> None:
        self.party = party
        self._ledger = ledger

    async def create(self, template: str, arguments: Json) -> Json:
        return await self._ledger.create(template, arguments, act_as=[self.party])

    async def exercise(
        self,
        template: str,
        contract_id: str,
        choice: str,
        argument: Json,
        read_as: list[str] | None = None,
    ) -> Json:
        # act_as is always locked to this agent's single party. read_as only
        # grants visibility (e.g. to resolve a counterparty's escrowed contract
        # during a jointly-authorized settlement); it is not signing authority.
        return await self._ledger.exercise(
            template, contract_id, choice, argument, act_as=[self.party], read_as=read_as
        )

    async def active_contracts(self) -> list[Json]:
        return await self._ledger.active_contracts(self.party)
