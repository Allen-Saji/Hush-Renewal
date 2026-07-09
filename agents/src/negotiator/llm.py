"""Groq-backed reasoning.

Two phases, on purpose: phase one streams the agent's reasoning so a viewer
watches it think over its own brief; phase two makes a deterministic, JSON-mode
call that extracts the committed number. Separating "show the thinking" from
"commit the number" keeps the stream readable and the decision clean.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import cast

import pydantic
import structlog
from groq import APIError, AsyncGroq
from groq.types.chat import ChatCompletionMessageParam

from .briefs import CustomerBrief, VendorBrief
from .config import Settings
from .errors import ReasoningError
from .prompts import decision_messages, reasoning_messages
from .schemas import AgentDecision

log = structlog.get_logger(__name__)


class Reasoner:
    def __init__(self, settings: Settings) -> None:
        key = settings.resolved_groq_key
        if key is None:  # guarded by Settings validation, but keep mypy + safety happy
            raise ReasoningError("no Groq API key configured")
        self._client = AsyncGroq(
            api_key=key.get_secret_value(),
            base_url=settings.groq_base_url,
        )
        self._model = settings.groq_model
        self._reasoning_temp = settings.reasoning_temperature
        self._decision_temp = settings.decision_temperature
        self._max_tokens = settings.max_reasoning_tokens

    async def stream_reasoning(
        self, brief: CustomerBrief | VendorBrief
    ) -> AsyncIterator[str]:
        """Yield reasoning text chunks as the model produces them."""
        messages = cast(list[ChatCompletionMessageParam], reasoning_messages(brief))
        try:
            stream = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=self._reasoning_temp,
                max_tokens=self._max_tokens,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except APIError as exc:
            log.warning("reasoning.stream_failed", error=str(exc))
            raise ReasoningError(f"Groq streaming failed: {exc}") from exc

    async def decide(
        self, brief: CustomerBrief | VendorBrief, reasoning: str
    ) -> AgentDecision:
        """Turn the streamed reasoning into a validated reservation price."""
        messages = cast(list[ChatCompletionMessageParam], decision_messages(brief, reasoning))
        try:
            resp = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=self._decision_temp,
                response_format={"type": "json_object"},
            )
        except APIError as exc:
            log.warning("decision.call_failed", error=str(exc))
            raise ReasoningError(f"Groq decision call failed: {exc}") from exc

        content = resp.choices[0].message.content
        if not content:
            raise ReasoningError("Groq returned an empty decision")
        try:
            return AgentDecision.model_validate_json(content)
        except pydantic.ValidationError as exc:
            log.warning("decision.invalid", content=content, error=str(exc))
            raise ReasoningError(f"decision was not a valid reservation price: {exc}") from exc
