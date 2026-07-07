"""Async client for the Canton JSON Ledger API v2.

Thin, typed wrapper over the endpoints HushRenewal needs: command submission
(create / exercise), active-contract queries, and admin ops (DAR upload, party
allocation, rights grants). Every submission carries `userId = token.sub`, per
the Seaport gotcha where a mismatch yields an opaque 403.
"""

from __future__ import annotations

import uuid
from typing import Any

import httpx
import structlog

from ..core.config import Settings
from ..core.exceptions import CommandRejected, LedgerError
from .auth import OIDCTokenManager
from .constants import template_id

log = structlog.get_logger(__name__)

Json = dict[str, Any]


class LedgerClient:
    def __init__(
        self, settings: Settings, http: httpx.AsyncClient, tokens: OIDCTokenManager
    ) -> None:
        self._s = settings
        self._http = http
        self._tokens = tokens
        self._base = settings.ledger_api_url.rstrip("/")

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: Any | None = None,
        content: bytes | None = None,
        content_type: str = "application/json",
    ) -> Any:
        headers = {
            "Authorization": f"Bearer {await self._tokens.token()}",
            "Content-Type": content_type,
        }
        try:
            resp = await self._http.request(
                method, f"{self._base}{path}", json=json, content=content, headers=headers
            )
        except httpx.HTTPError as exc:
            raise LedgerError(f"Ledger request failed: {exc}") from exc
        if resp.status_code >= 400:
            self._raise_for_error(resp)
        return resp.json() if resp.content else {}

    def _raise_for_error(self, resp: httpx.Response) -> None:
        try:
            body = resp.json()
        except ValueError:
            body = {"cause": resp.text[:500]}
        exc_cls = CommandRejected if resp.status_code < 500 else LedgerError
        raise exc_cls(
            body.get("cause") or f"Ledger returned HTTP {resp.status_code}",
            status_code=resp.status_code,
            code=body.get("code"),
            cause=body.get("cause"),
            correlation_id=body.get("correlationId"),
        )

    # --- reads ---

    async def ledger_end(self) -> int:
        data = await self._request("GET", "/v2/state/ledger-end")
        return int(data["offset"])

    async def active_contracts(self, party: str) -> list[Json]:
        offset = await self.ledger_end()
        data = await self._request(
            "POST",
            "/v2/state/active-contracts",
            json={
                "filter": {"filtersByParty": {party: {}}},
                "verbose": True,
                "activeAtOffset": offset,
            },
        )
        rows: list[Json] = []
        for item in data if isinstance(data, list) else []:
            created = item.get("contractEntry", {}).get("JsActiveContract", {}).get(
                "createdEvent", {}
            )
            if created:
                rows.append(
                    {
                        "template": created["templateId"].split(":")[-1],
                        "contract_id": created["contractId"],
                        "payload": created.get("createArgument", {}),
                    }
                )
        return rows

    # --- writes ---

    async def submit_and_wait(
        self, commands: list[Json], act_as: list[str], read_as: list[str] | None = None
    ) -> Json:
        user_id = await self._tokens.user_id()
        body = {
            "commands": {
                "commands": commands,
                "commandId": str(uuid.uuid4()),
                "userId": user_id,
                "actAs": act_as,
                "readAs": read_as or [],
            }
        }
        return await self._request(
            "POST", "/v2/commands/submit-and-wait-for-transaction", json=body
        )

    async def create(self, template: str, arguments: Json, act_as: list[str]) -> Json:
        cmd = {"CreateCommand": {"templateId": template_id(template), "createArguments": arguments}}
        return await self.submit_and_wait([cmd], act_as)

    async def exercise(
        self,
        template: str,
        contract_id: str,
        choice: str,
        argument: Json,
        act_as: list[str],
        read_as: list[str] | None = None,
    ) -> Json:
        cmd = {
            "ExerciseCommand": {
                "templateId": template_id(template),
                "contractId": contract_id,
                "choice": choice,
                "choiceArgument": argument,
            }
        }
        return await self.submit_and_wait([cmd], act_as, read_as)

    # --- admin ---

    async def upload_dar(self, dar: bytes) -> Json:
        return await self._request(
            "POST", "/v2/packages", content=dar, content_type="application/octet-stream"
        )

    async def allocate_party(self, hint: str) -> str | None:
        data = await self._request(
            "POST", "/v2/parties", json={"partyIdHint": hint, "identityProviderId": ""}
        )
        return (data.get("partyDetails") or {}).get("party")

    async def grant_act_as(self, user_id: str, party: str) -> Json:
        return await self._request(
            "POST",
            f"/v2/users/{user_id}/rights",
            json={
                "userId": user_id,
                "rights": [{"kind": {"CanActAs": {"value": {"party": party}}}}],
            },
        )

    # --- helpers ---

    @staticmethod
    def created_contracts(tx: Json) -> dict[str, str]:
        """Map template name -> contractId for every CreatedEvent in a transaction."""
        out: dict[str, str] = {}
        for event in tx.get("transaction", {}).get("events", []):
            created = event.get("CreatedEvent") or event.get("created") or {}
            if created:
                out[created["templateId"].split(":")[-1]] = created["contractId"]
        return out

    @staticmethod
    def created_events(tx: Json) -> list[Json]:
        """Return {template, contract_id, payload} for every CreatedEvent."""
        events: list[Json] = []
        for event in tx.get("transaction", {}).get("events", []):
            created = event.get("CreatedEvent") or event.get("created") or {}
            if created:
                events.append(
                    {
                        "template": created["templateId"].split(":")[-1],
                        "contract_id": created["contractId"],
                        "payload": created.get("createArgument", {}),
                    }
                )
        return events
