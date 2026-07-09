"""FastAPI dependency providers. Shared, long-lived collaborators live on
app.state (built once in the lifespan) so we reuse one connection pool, one
token cache, and one set of party-locked services across all requests.
"""

from __future__ import annotations

from fastapi import Request

from ..core.config import Settings
from ..db.repository import RoundRepository
from ..domain.adversarial import AdversarialService
from ..domain.matcher import MatcherService
from ..domain.parties import CustomerService, VendorService
from ..ledger.client import LedgerClient


def get_settings(request: Request) -> Settings:
    return request.app.state.settings  # type: ignore[no-any-return]


def get_ledger_client(request: Request) -> LedgerClient:
    return request.app.state.ledger  # type: ignore[no-any-return]


def get_round_repository(request: Request) -> RoundRepository:
    return request.app.state.rounds  # type: ignore[no-any-return]


def get_matcher_service(request: Request) -> MatcherService:
    return request.app.state.matcher_service  # type: ignore[no-any-return]


def get_customer_service(request: Request) -> CustomerService:
    return request.app.state.customer_service  # type: ignore[no-any-return]


def get_vendor_service(request: Request) -> VendorService:
    return request.app.state.vendor_service  # type: ignore[no-any-return]


def get_adversarial_service(request: Request) -> AdversarialService:
    return request.app.state.adversarial_service  # type: ignore[no-any-return]
