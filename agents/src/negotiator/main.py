"""ASGI entrypoint. `AGENT_ROLE` decides which agent this process becomes.

    AGENT_ROLE=customer PORT=8100 uv run uvicorn negotiator.main:app
    AGENT_ROLE=vendor   PORT=8200 uv run uvicorn negotiator.main:app
"""

from __future__ import annotations

from .app import create_app
from .config import get_settings

app = create_app(get_settings())
