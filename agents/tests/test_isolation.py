"""The isolation guarantee, enforced as a test.

If a future edit ever leaks a vendor-only field into the customer brief (or the
reverse), or wires a sealer to the wrong endpoint, these fail. That is the whole
security property of the design, so it is worth a regression test.
"""

from __future__ import annotations

from negotiator.briefs import CUSTOMER_BRIEFS, VENDOR_BRIEFS, brief_for
from negotiator.schemas import Scenario

VENDOR_ONLY_FIELDS = {
    "list_price",
    "annual_cost_to_serve",
    "margin_floor_pct",
    "discount_authority_floor",
    "quota_pressure",
    "account_notes",
}
CUSTOMER_ONLY_FIELDS = {
    "budget_directive",
    "competitor_quote",
    "switching_cost_estimate",
    "switching_disruption",
    "last_annual_price",
}

SCENARIOS: list[Scenario] = ["deal", "no_deal"]


def test_customer_brief_never_holds_vendor_fields() -> None:
    for scenario in SCENARIOS:
        keys = set(brief_for("customer", scenario).model_dump().keys())
        assert keys.isdisjoint(VENDOR_ONLY_FIELDS)


def test_vendor_brief_never_holds_customer_fields() -> None:
    for scenario in SCENARIOS:
        keys = set(brief_for("vendor", scenario).model_dump().keys())
        assert keys.isdisjoint(CUSTOMER_ONLY_FIELDS)


def test_brief_for_returns_only_the_requested_side() -> None:
    for scenario in SCENARIOS:
        assert brief_for("customer", scenario).party == "customer"
        assert brief_for("vendor", scenario).party == "vendor"


def test_every_scenario_is_defined_for_both_sides() -> None:
    assert set(CUSTOMER_BRIEFS) == set(VENDOR_BRIEFS) == set(SCENARIOS)
