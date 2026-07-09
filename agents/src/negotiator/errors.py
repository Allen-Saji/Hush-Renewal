"""Agent-side errors, normalised so the SSE stream can report a clean message."""

from __future__ import annotations


class NegotiationError(Exception):
    """The agent could not complete a negotiation (reasoning or sealing failed)."""


class ReasoningError(NegotiationError):
    """The LLM call failed or returned something unusable."""


class SealError(NegotiationError):
    """Submitting the sealed number to the matcher backend failed."""
