"""Prompt construction.

The prompt is built from one side's brief only. There is deliberately no slot,
anywhere, for the counterparty's position -- the agent reasons in the dark about
the other number, exactly as a real sealed-bid participant does.
"""

from __future__ import annotations

from .briefs import CustomerBrief, VendorBrief

_ROLE_FRAMING = {
    "customer": (
        "You are the autonomous procurement agent for the CUSTOMER. You act on "
        "the buyer's behalf to decide the highest price worth paying to renew."
    ),
    "vendor": (
        "You are the autonomous revenue agent for the VENDOR. You act on the "
        "seller's behalf to decide the lowest price worth accepting to renew."
    ),
}

_SHARED_RULES = (
    "This is a sealed-bid clearing: you submit ONE reservation number to a "
    "neutral matcher and never see the other side's number. Do not assume, "
    "invent, or 'estimate' the counterparty's figure as if it were known -- you "
    "are reasoning in the dark, which is the point. Reason only from YOUR brief. "
    "Money is annual USD."
)


def _render_brief(brief: CustomerBrief | VendorBrief) -> str:
    lines = []
    for key, value in brief.model_dump().items():
        label = key.replace("_", " ")
        lines.append(f"- {label}: {value}")
    return "\n".join(lines)


def reasoning_messages(brief: CustomerBrief | VendorBrief) -> list[dict[str, str]]:
    """Phase 1: think out loud. Streamed to the viewer as the agent 'reasons'."""
    system = (
        f"{_ROLE_FRAMING[brief.party]}\n\n{_SHARED_RULES}\n\n"
        "Think step by step in plain prose: weigh your alternatives, costs, and "
        "constraints, and converge on a single reservation price. Keep it under "
        "180 words. Do not output JSON here -- just your reasoning, ending with "
        "the number you have settled on."
    )
    user = (
        f"YOUR CONFIDENTIAL BRIEF:\n{_render_brief(brief)}\n\n"
        "Reason to your reservation price now."
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def decision_messages(
    brief: CustomerBrief | VendorBrief, reasoning: str
) -> list[dict[str, str]]:
    """Phase 2: commit. Forces a clean structured number from the reasoning."""
    system = (
        f"{_ROLE_FRAMING[brief.party]}\n\n"
        "Convert the reasoning below into a final decision. Respond with a SINGLE "
        'JSON object and nothing else: {"reservation_price": <number>, '
        '"confidence": <0..1>, "rationale": "<=1 sentence>"}. '
        "reservation_price is a positive number of US dollars per year."
    )
    user = (
        f"YOUR CONFIDENTIAL BRIEF:\n{_render_brief(brief)}\n\n"
        f"YOUR REASONING:\n{reasoning}\n\n"
        "Output the JSON decision now."
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
