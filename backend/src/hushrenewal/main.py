"""FastAPI application factory and lifespan."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import (
    adversarial,
    contracts,
    customer,
    health,
    matcher,
    rounds,
    vendor,
)
from .core.config import get_settings
from .core.exceptions import register_exception_handlers
from .core.logging import configure_logging
from .db.base import create_engine, create_sessionmaker, init_models
from .db.repository import RoundRepository
from .domain.adversarial import AdversarialService
from .domain.agents import PartyAgent
from .domain.matcher import MatcherService
from .domain.parties import CustomerService, VendorService
from .ledger.auth import OIDCTokenManager
from .ledger.client import LedgerClient

log = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings)

    http = httpx.AsyncClient(timeout=settings.http_timeout_seconds)
    tokens = OIDCTokenManager(settings, http)
    ledger = LedgerClient(settings, http, tokens)

    engine = create_engine(settings.database_url)
    sessionmaker = create_sessionmaker(engine)
    await init_models(engine)
    rounds_repo = RoundRepository(sessionmaker)

    matcher_agent = PartyAgent(settings.matcher, ledger)
    customer_agent = PartyAgent(settings.customer, ledger)
    vendor_agent = PartyAgent(settings.vendor, ledger)

    app.state.settings = settings
    app.state.http = http
    app.state.tokens = tokens
    app.state.ledger = ledger
    app.state.engine = engine
    app.state.rounds = rounds_repo
    matcher_service = MatcherService(matcher_agent, rounds_repo, settings)
    customer_service = CustomerService(customer_agent, settings)
    app.state.matcher_service = matcher_service
    app.state.customer_service = customer_service
    app.state.vendor_service = VendorService(vendor_agent, settings)
    app.state.adversarial_service = AdversarialService(
        matcher_agent, vendor_agent, matcher_service, customer_service, settings
    )

    log.info("app.startup", env=settings.app_env, matcher=settings.matcher)
    try:
        yield
    finally:
        await http.aclose()
        await engine.dispose()
        log.info("app.shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="HushRenewal Matcher Service",
        version="0.1.0",
        summary="Private SaaS-renewal sealed-bid clearing on Canton.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    for module in (health, matcher, customer, vendor, rounds, contracts, adversarial):
        app.include_router(module.router)
    return app


app = create_app()
