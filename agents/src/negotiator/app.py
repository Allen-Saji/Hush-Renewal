"""FastAPI application for one negotiation agent.

The role is fixed at process start. Endpoints:
  GET  /health            -- liveness + which role/model/backend this process is
  GET  /context           -- what this agent can see (its own brief, verbatim)
  POST /negotiate         -- run a round; streams reasoning -> decision -> sealed
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
import structlog
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .config import Settings
from .errors import SettleError
from .llm import Reasoner
from .logging import configure_logging
from .negotiator import Event, Negotiator
from .schemas import (
    ContextView,
    HealthResponse,
    NegotiateRequest,
    Scenario,
    SettleRequest,
    SettleResult,
)
from .sealer import Sealer
from .settler import Settler

log = structlog.get_logger(__name__)

_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",  # let nginx/proxies stream instead of buffering
}


def _sse(event: Event) -> str:
    return f"event: {event.name}\ndata: {json.dumps(event.data)}\n\n"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings: Settings = app.state.settings
    configure_logging(settings)

    http = httpx.AsyncClient(timeout=settings.http_timeout_seconds)
    reasoner = Reasoner(settings)
    sealer = Sealer(settings.role, settings, http)

    app.state.http = http
    app.state.negotiator = Negotiator(settings.role, reasoner, sealer)
    app.state.settler = Settler(settings.role, settings, http)

    log.info(
        "agent.startup",
        role=settings.role,
        model=settings.groq_model,
        backend=settings.backend_url,
    )
    try:
        yield
    finally:
        await http.aclose()
        log.info("agent.shutdown", role=settings.role)


def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(
        title=f"HushRenewal {settings.role.capitalize()} Agent",
        version="0.1.0",
        summary="Autonomous sealed-bid negotiation agent.",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            role=settings.role,
            model=settings.groq_model,
            backend_url=settings.backend_url,
        )

    @app.get("/context", response_model=ContextView)
    async def context(request: Request, scenario: Scenario = "deal") -> ContextView:
        negotiator: Negotiator = request.app.state.negotiator
        return negotiator.context(scenario)

    @app.post("/negotiate")
    async def negotiate(request: Request, body: NegotiateRequest) -> StreamingResponse:
        negotiator: Negotiator = request.app.state.negotiator

        async def stream() -> AsyncIterator[str]:
            async for event in negotiator.negotiate(body.round_id, body.scenario):
                yield _sse(event)

        return StreamingResponse(
            stream(), media_type="text/event-stream", headers=_SSE_HEADERS
        )

    @app.post("/settle", response_model=SettleResult)
    async def settle(request: Request, body: SettleRequest) -> SettleResult:
        settler: Settler = request.app.state.settler
        try:
            result = await settler.settle(body.round_id)
        except SettleError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        return SettleResult(
            role=settings.role,
            round_id=body.round_id,
            rationale=settler.rationale,
            result=result,
        )

    return app
