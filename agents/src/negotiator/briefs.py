"""The private briefs.

Each brief is one side's confidential negotiating position. A customer-role
process only ever reads `CUSTOMER_BRIEFS`; a vendor-role process only ever reads
`VENDOR_BRIEFS`. The two dicts are co-located in source for review, but at
runtime a process loads exactly one -- `brief_for(role, scenario)` is the only
door, and it hands back a single side. Note what is *absent*: the customer brief
holds no vendor cost or margin; the vendor brief holds no customer budget or
competitor quote. Neither could reconstruct the other's number if it tried.

Numbers are shaped so an honest reasoner lands in-band ("deal") or out-of-band
("no_deal"), but the price is genuinely LLM-derived, not hard-coded -- the agent
is really deciding, which is the point.
"""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from .schemas import Role, Scenario


class CustomerBrief(BaseModel):
    model_config = ConfigDict(extra="forbid")

    party: str = "customer"
    company: str
    subscription: str
    seats_now: int
    seats_prior: int
    last_annual_price: Decimal
    budget_directive: str
    competitor_quote: Decimal
    switching_cost_estimate: Decimal
    switching_disruption: str
    strategic_notes: str
    objective: str = (
        "Decide the MAXIMUM annual price you would pay to renew with the incumbent "
        "rather than switch away (your ceiling). Above it, switching is the better "
        "deal. This number is secret -- the vendor must never learn it."
    )


class VendorBrief(BaseModel):
    model_config = ConfigDict(extra="forbid")

    party: str = "vendor"
    company: str
    subscription: str
    seats: int
    list_price: Decimal
    annual_cost_to_serve: Decimal
    margin_floor_pct: int
    account_notes: str
    quota_pressure: str
    discount_authority_floor: Decimal
    objective: str = (
        "Decide the MINIMUM annual price you would accept to renew this account "
        "rather than let it lapse (your floor). Below it, walking away is better. "
        "This number is secret -- the customer must never learn it."
    )


CUSTOMER_BRIEFS: dict[Scenario, CustomerBrief] = {
    "deal": CustomerBrief(
        company="Northwind Analytics",
        subscription="Workday Enterprise HR Suite",
        seats_now=380,
        seats_prior=500,
        last_annual_price=Decimal("95000"),
        budget_directive=(
            "Finance mandated a 15% cut to SaaS spend this cycle. The soft target "
            "for this renewal is roughly $80,000."
        ),
        competitor_quote=Decimal("72000"),
        switching_cost_estimate=Decimal("15000"),
        switching_disruption=(
            "Migrating to the competitor means ~2 quarters of HR-team disruption "
            "and re-integrating payroll and SSO. Painful but survivable."
        ),
        strategic_notes=(
            "Procurement prefers to renew -- the integrations are built and the "
            "team knows the tool -- but only at a price that reflects the smaller "
            "seat count. Headcount is down from 500 to 380."
        ),
    ),
    "no_deal": CustomerBrief(
        company="Northwind Analytics",
        subscription="Workday Enterprise HR Suite",
        seats_now=300,
        seats_prior=500,
        last_annual_price=Decimal("95000"),
        budget_directive=(
            "After a down quarter, finance slashed SaaS spend 30% and set a HARD "
            "ceiling of $70,000 for this renewal -- no exceptions without CFO sign-off."
        ),
        competitor_quote=Decimal("63000"),
        switching_cost_estimate=Decimal("12000"),
        switching_disruption=(
            "The competitor migration is well understood and the team is willing. "
            "Effective all-in cost of switching is around $75,000 the first year, "
            "then much cheaper."
        ),
        strategic_notes=(
            "Leadership is comfortable walking away. The incumbent is convenient "
            "but not indispensable, and the seat count keeps falling."
        ),
    ),
}


VENDOR_BRIEFS: dict[Scenario, VendorBrief] = {
    "deal": VendorBrief(
        company="Workday Inc.",
        subscription="Workday Enterprise HR Suite",
        seats=380,
        list_price=Decimal("115000"),
        annual_cost_to_serve=Decimal("48000"),
        margin_floor_pct=40,
        account_notes=(
            "Flagship reference logo in this vertical. There are churn signals -- "
            "they have hinted at evaluating a competitor -- and retaining them "
            "protects both the ARR and the reference value we cite in sales."
        ),
        quota_pressure=(
            "The rep is behind quota this quarter; closing this renewal now "
            "materially helps the number."
        ),
        discount_authority_floor=Decimal("82000"),
    ),
    "no_deal": VendorBrief(
        company="Workday Inc.",
        subscription="Workday Enterprise HR Suite",
        seats=300,
        list_price=Decimal("118000"),
        annual_cost_to_serve=Decimal("50000"),
        margin_floor_pct=42,
        account_notes=(
            "Low churn risk -- deep payroll and SSO integrations make this customer "
            "expensive to replace, so there is little pressure to discount hard. "
            "We would rather hold price than win a thin renewal."
        ),
        quota_pressure=(
            "The rep has already hit quota this quarter, so there is no incentive "
            "to chase this deal at a low price."
        ),
        discount_authority_floor=Decimal("85000"),
    ),
}


def brief_for(role: Role, scenario: Scenario) -> CustomerBrief | VendorBrief:
    """The single door to a brief. Returns exactly one side's position."""
    if role == "customer":
        return CUSTOMER_BRIEFS[scenario]
    return VENDOR_BRIEFS[scenario]
