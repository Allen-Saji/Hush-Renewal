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


class ContractView(BaseModel):
    template: str
    contract_id: str
    payload: dict


class HealthResponse(BaseModel):
    status: str
    ledger_end: int | None = None
