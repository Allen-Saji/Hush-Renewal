"""Package and template identifiers for the HushRenewal Daml model.

Template references use the package-name form (`#hush-renewal:Main:X`), which the
JSON Ledger API resolves without pinning a package id. See daml/Main.daml.
"""

from __future__ import annotations

from typing import Final

PACKAGE_NAME: Final = "hush-renewal"
MODULE: Final = "Main"


def template_id(name: str) -> str:
    """Return the package-name-qualified template id, e.g. `#hush-renewal:Main:RenewalRound`."""
    return f"#{PACKAGE_NAME}:{MODULE}:{name}"


class Template:
    RENEWAL_ROUND: Final = "RenewalRound"
    SEALED_BID: Final = "SealedBid"
    SEALED_ASK: Final = "SealedAsk"
    CLEARING_RESULT: Final = "ClearingResult"
    CASH: Final = "Cash"
    RENEWED_LICENSE: Final = "RenewedLicense"
    SETTLEMENT_PROPOSAL: Final = "SettlementProposal"
    SETTLEMENT_CUSTOMER_ACCEPTED: Final = "SettlementCustomerAccepted"
