"""Locate a party's active contract of a given template for a given round.

Each party queries its own ledger view and finds the contract it needs by
roundId, so settlement stays stateless and per-party (no cross-party lookups).
"""

from __future__ import annotations

from ..ledger.client import Json


def find_by_round(view: list[Json], template: str, round_id: str) -> Json | None:
    for row in view:
        if row["template"] == template and row["payload"].get("roundId") == round_id:
            return row
    return None
