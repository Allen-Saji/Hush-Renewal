"""API request/response models. These are the app's public contract; the Daml
templates in daml/Main.daml are the ledger-side counterpart.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class OpenRoundRequest(BaseModel):
    subscription: str = Field(min_length=1, max_length=200)
    deadline: datetime | None = Field(
        default=None, description="Round expiry (UTC). Defaults to a server-side window if omitted."
    )


class RoundResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    round_id: str
    contract_id: str
    matcher: str
    customer: str
    vendor: str
    subscription: str
    deadline: datetime


class SubmitBidRequest(BaseModel):
    max_price: Decimal = Field(gt=0, description="Customer's sealed ceiling.")


class SubmitAskRequest(BaseModel):
    min_price: Decimal = Field(gt=0, description="Vendor's sealed floor.")


class SubmitResponse(BaseModel):
    contract_id: str


class ClearingResponse(BaseModel):
    contract_id: str
    outcome: str  # "DEAL" | "NO_DEAL"
    price: Decimal | None = None


class SettlementProposalResponse(BaseModel):
    contract_id: str


class CustomerAcceptResponse(BaseModel):
    accepted_contract_id: str
    cash_contract_id: str


class SettlementResponse(BaseModel):
    license_contract_id: str
    vendor_cash_contract_id: str


class PeekResult(BaseModel):
    """Result of the vendor attempting to read the customer's sealed bid."""

    round_id: str
    bid_exists: bool
    bid_contract_id: str | None = None
    vendor_can_see_bid: bool
    vendor_visible_templates: list[str]
    verdict: str  # "denied" | "leaked"


class ForceBadSettlementResult(BaseModel):
    """Result of deliberately settling with a mismatched cash amount."""

    round_id: str
    deal_price: Decimal
    escrowed_amount: Decimal
    reverted: bool
    ledger_error: str | None = None
    note: str


class ContractView(BaseModel):
    template: str
    contract_id: str
    payload: dict


class HealthResponse(BaseModel):
    status: str
    ledger_end: int | None = None
