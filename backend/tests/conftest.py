"""Test configuration. Sets dummy ledger credentials and a temp SQLite file so
Settings validates and the app can start without touching the network (unit
tests mock the ledger).
"""

from __future__ import annotations

import os
import pathlib
import tempfile

os.environ.setdefault("CANTON_DEVNET_JSON_API_URL", "http://ledger.test")
os.environ.setdefault("CANTON_DEVNET_OIDC_TOKEN_URL", "http://auth.test/token")
os.environ.setdefault("CANTON_DEVNET_OIDC_CLIENT_ID", "test-client")
os.environ.setdefault("CANTON_DEVNET_OIDC_CLIENT_SECRET", "test-secret")
os.environ.setdefault("CANTON_DEVNET_OIDC_AUDIENCE", "test-audience")

_db_path = pathlib.Path(tempfile.gettempdir()) / "hushrenewal-test.db"
_db_path.unlink(missing_ok=True)
os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{_db_path}")
