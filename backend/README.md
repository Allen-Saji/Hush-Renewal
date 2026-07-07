# HushRenewal Matcher Service

Async FastAPI backend for HushRenewal: private SaaS-renewal sealed-bid clearing
on Canton. The Canton ledger is the source of truth; this service is the neutral
**matcher** that opens rounds, relays sealed bids/asks, draws the clearing price
off-chain (random-in-band, validated on-chain), and drives atomic settlement.

## Stack

FastAPI, httpx (async), Pydantic v2, pydantic-settings, structlog, tenacity.
Managed with `uv`. Talks to the Seaport 5n-sandbox validator over the Canton
JSON Ledger API v2 with OIDC client-credentials auth.

## Layout

```
src/hushrenewal/
  core/    config, logging, exceptions
  ledger/  auth (OIDC token manager), client (JSON Ledger API v2), constants
  domain/  schemas, matcher service
  api/     deps, routes/{health, rounds}
scripts/   check_ledger.py  (live readiness probe)
tests/     unit tests with a mocked ledger
```

## Develop

```bash
uv sync

# credentials (never committed): reuse the shared m2m creds
set -a; source ~/.config/seaport-devnet.env; set +a

uv run python scripts/check_ledger.py          # verify token + validator reachable
uv run uvicorn hushrenewal.main:app --reload    # http://127.0.0.1:8000/docs

uv run ruff check .
uv run pytest
```

Configuration is environment-driven; see `.env.example`. The OIDC token expires
every ~8h and is refreshed automatically. `userId` is always derived from the
token's `sub` claim.
