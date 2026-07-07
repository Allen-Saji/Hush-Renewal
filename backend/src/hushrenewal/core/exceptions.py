"""Domain exceptions and their FastAPI handlers.

Ledger failures are normalised into a small hierarchy so route handlers never
have to parse raw ledger error bodies, and clients get a consistent shape.
"""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

log = structlog.get_logger(__name__)


class LedgerError(Exception):
    """A call to the ledger failed (transport or 5xx). Maps to HTTP 502."""

    http_status = 502

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        code: str | None = None,
        cause: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.cause = cause
        self.correlation_id = correlation_id


class LedgerAuthError(LedgerError):
    """OIDC token acquisition failed. Maps to HTTP 502 (our misconfig, not the client's)."""

    http_status = 502


class CommandRejected(LedgerError):
    """A command was rejected by contract logic or authorization. Maps to HTTP 422."""

    http_status = 422


def _payload(exc: LedgerError) -> dict[str, Any]:
    return {
        "error": exc.__class__.__name__,
        "message": exc.message,
        "ledgerStatus": exc.status_code,
        "code": exc.code,
        "cause": exc.cause,
        "correlationId": exc.correlation_id,
    }


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(LedgerError)
    async def _handle_ledger_error(request: Request, exc: LedgerError) -> JSONResponse:
        log.warning("ledger.error", path=request.url.path, **_payload(exc))
        return JSONResponse(status_code=exc.http_status, content=_payload(exc))
