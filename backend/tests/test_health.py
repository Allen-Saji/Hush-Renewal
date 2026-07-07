from __future__ import annotations

from fastapi.testclient import TestClient

from hushrenewal.main import app


def test_liveness_does_not_touch_ledger() -> None:
    with TestClient(app) as client:
        resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "ledger_end": None}
