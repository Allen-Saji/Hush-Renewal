"""Public models for the agent service.

`AgentDecision` is what the LLM must produce: a single reservation price plus a
short rationale. `ContextView` is the honesty surface -- it is exactly what the
agent was allowed to see (its own brief), so a viewer can confirm no field from
the other side ever entered this process.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Role = Literal["customer", "vendor"]
Scenario = Literal["deal", "no_deal"]


class NegotiateRequest(BaseModel):
    round_id: str = Field(min_length=1, max_length=100)
    scenario: Scenario = "deal"


class AgentDecision(BaseModel):
    """The structured output the LLM is forced to return."""

    model_config = ConfigDict(extra="ignore")

    reservation_price: Decimal = Field(
        gt=0, description="Customer ceiling or vendor floor -- the walkaway number."
    )
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str = Field(min_length=1, max_length=600)


class SealResult(BaseModel):
    contract_id: str
    side: Literal["bid", "ask"]


class SettleRequest(BaseModel):
    round_id: str = Field(min_length=1, max_length=100)


class SettleResult(BaseModel):
    """The agent's authorization of its own settlement leg."""

    role: Role
    round_id: str
    rationale: str
    result: dict[str, Any]


class ContextView(BaseModel):
    """What this agent can see -- returned verbatim so the isolation is auditable."""

    role: Role
    scenario: Scenario
    brief: dict[str, Any]
    can_see_counterparty_brief: bool = False
    can_see_counterparty_number: bool = False


class HealthResponse(BaseModel):
    status: str
    role: Role
    model: str
    backend_url: str
