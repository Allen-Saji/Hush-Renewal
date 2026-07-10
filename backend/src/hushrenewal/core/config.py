"""Application settings, loaded from the environment (or a local .env)."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        populate_by_name=True,
    )

    # --- Ledger / Seaport DevNet (names match ~/.config/seaport-devnet.env) ---
    ledger_api_url: str = Field(alias="CANTON_DEVNET_JSON_API_URL")
    ledger_ws_url: str | None = Field(default=None, alias="CANTON_DEVNET_WS_URL")
    oidc_token_url: str = Field(alias="CANTON_DEVNET_OIDC_TOKEN_URL")
    oidc_client_id: str = Field(alias="CANTON_DEVNET_OIDC_CLIENT_ID")
    oidc_client_secret: SecretStr = Field(alias="CANTON_DEVNET_OIDC_CLIENT_SECRET")
    oidc_audience: str = Field(alias="CANTON_DEVNET_OIDC_AUDIENCE")
    oidc_scope: str = Field(default="daml_ledger_api", alias="CANTON_DEVNET_OIDC_SCOPE")

    # --- Application ---
    app_env: str = Field(default="dev", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_json: bool = Field(default=False, alias="LOG_JSON")
    http_timeout_seconds: float = Field(default=60.0, alias="HTTP_TIMEOUT_SECONDS")
    token_refresh_leeway_seconds: int = Field(default=300, alias="TOKEN_REFRESH_LEEWAY_SECONDS")
    default_round_days: int = Field(default=7, alias="DEFAULT_ROUND_DAYS")

    # --- Keep-warm (Render free tier idles after 15 min without inbound traffic;
    # a self-ping through the public URL counts as inbound and prevents the
    # 30-60s cold start. RENDER_EXTERNAL_URL is injected by Render, so this is a
    # no-op locally. Set KEEP_WARM=0 to stop burning free instance hours once
    # judging is over.) ---
    keep_warm: bool = Field(default=True, alias="KEEP_WARM")
    keep_warm_interval_seconds: float = Field(default=600.0, alias="KEEP_WARM_INTERVAL_SECONDS")
    external_url: str | None = Field(default=None, alias="RENDER_EXTERNAL_URL")

    # --- CORS (comma-separated origins; "*" allows any). The demo API carries no
    # cookies or credentials, so a permissive default is safe; tighten to the
    # deployed frontend origin in production. ---
    cors_origins: str = Field(default="*", alias="CORS_ORIGINS")

    # --- Persistence (SQLite by default; swap the URL for Postgres) ---
    database_url: str = Field(
        default="sqlite+aiosqlite:///./hushrenewal.db", alias="DATABASE_URL"
    )

    # --- Canton parties (not secret; allocated on the 5n sandbox) ---
    ledger_namespace: str = Field(
        default="1220a14ca128063b8dc9d1ebb0bd22633be9f2168500f4dbc1ecaeb1855b14e5acf8",
        alias="LEDGER_NAMESPACE",
    )
    matcher_party_hint: str = Field(default="hushrenewal-matcher-1", alias="MATCHER_PARTY_HINT")
    customer_party_hint: str = Field(default="hushrenewal-customer-1", alias="CUSTOMER_PARTY_HINT")
    vendor_party_hint: str = Field(default="hushrenewal-vendor-1", alias="VENDOR_PARTY_HINT")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def matcher(self) -> str:
        return f"{self.matcher_party_hint}::{self.ledger_namespace}"

    @property
    def customer(self) -> str:
        return f"{self.customer_party_hint}::{self.ledger_namespace}"

    @property
    def vendor(self) -> str:
        return f"{self.vendor_party_hint}::{self.ledger_namespace}"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
