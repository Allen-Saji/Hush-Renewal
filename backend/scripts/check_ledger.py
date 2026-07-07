"""Live readiness probe: mint a token and reach the Seaport validator.

Usage:
    set -a; source ~/.config/seaport-devnet.env; set +a
    uv run python scripts/check_ledger.py
"""

from __future__ import annotations

import asyncio

import httpx

from hushrenewal.core.config import get_settings
from hushrenewal.core.logging import configure_logging
from hushrenewal.ledger.auth import OIDCTokenManager
from hushrenewal.ledger.client import LedgerClient


async def main() -> None:
    settings = get_settings()
    configure_logging(settings)
    async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as http:
        tokens = OIDCTokenManager(settings, http)
        client = LedgerClient(settings, http, tokens)
        offset = await client.ledger_end()
        user_id = await tokens.user_id()
        print(f"OK  ledger_end={offset}  userId={user_id}  matcher={settings.matcher}")


if __name__ == "__main__":
    asyncio.run(main())
