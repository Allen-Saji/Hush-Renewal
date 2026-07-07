"""Upload a DAR to the Seaport validator.

    set -a; source ~/.config/seaport-devnet.env; set +a
    uv run python scripts/upload_dar.py ../.daml/dist/hush-renewal-1.0.0.dar
"""

from __future__ import annotations

import asyncio
import os
import sys

import httpx

from hushrenewal.core.config import get_settings
from hushrenewal.core.logging import configure_logging
from hushrenewal.ledger.auth import OIDCTokenManager
from hushrenewal.ledger.client import LedgerClient


async def upload(dar: bytes, name: str) -> None:
    settings = get_settings()
    configure_logging(settings)
    async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as http:
        tokens = OIDCTokenManager(settings, http)
        client = LedgerClient(settings, http, tokens)
        resp = await client.upload_dar(dar)
        print(f"uploaded {name} ({len(dar)} bytes) -> {resp}")


if __name__ == "__main__":
    path = sys.argv[1]
    with open(path, "rb") as fh:
        data = fh.read()
    asyncio.run(upload(data, os.path.basename(path)))
