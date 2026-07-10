"""Agent settings, loaded from the environment (or a local .env).

One process serves exactly one role. `AGENT_ROLE` decides whether this service
is the customer agent or the vendor agent; everything downstream -- which brief
it loads, which backend endpoint it may seal on -- is locked to that role. Run
the two agents as two processes (two ports, two configs) so the isolation is a
deployment fact, not just a code convention.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Role = Literal["customer", "vendor"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        populate_by_name=True,
    )

    # --- Identity (the one setting that defines this process) ---
    role: Role = Field(alias="AGENT_ROLE")

    # --- Groq (reasoning runtime, not part of the product's tech stack) ---
    # A role-specific key wins over the shared one, so the two agents can carry
    # genuinely separate credentials when you want the isolation to be total.
    groq_api_key: SecretStr | None = Field(default=None, alias="GROQ_API_KEY")
    customer_groq_api_key: SecretStr | None = Field(
        default=None, alias="CUSTOMER_GROQ_API_KEY"
    )
    vendor_groq_api_key: SecretStr | None = Field(
        default=None, alias="VENDOR_GROQ_API_KEY"
    )
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")
    groq_base_url: str | None = Field(default=None, alias="GROQ_BASE_URL")
    reasoning_temperature: float = Field(default=0.4, alias="REASONING_TEMPERATURE")
    decision_temperature: float = Field(default=0.0, alias="DECISION_TEMPERATURE")
    max_reasoning_tokens: int = Field(default=800, alias="MAX_REASONING_TOKENS")

    # --- Matcher backend (where the sealed number is submitted) ---
    backend_url: str = Field(default="http://localhost:8000", alias="BACKEND_URL")

    # --- Server / application ---
    host: str = Field(default="0.0.0.0", alias="HOST")  # noqa: S104
    port: int = Field(default=8100, alias="PORT")
    app_env: str = Field(default="dev", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_json: bool = Field(default=False, alias="LOG_JSON")
    http_timeout_seconds: float = Field(default=60.0, alias="HTTP_TIMEOUT_SECONDS")
    cors_origins: str = Field(default="*", alias="CORS_ORIGINS")

    # --- Keep-warm (Render free tier idles after 15 min without inbound traffic;
    # a self-ping through the public URL counts as inbound and prevents the
    # 30-60s cold start. RENDER_EXTERNAL_URL is injected by Render, so this is a
    # no-op locally. Set KEEP_WARM=0 to stop burning free instance hours once
    # judging is over.) ---
    keep_warm: bool = Field(default=True, alias="KEEP_WARM")
    keep_warm_interval_seconds: float = Field(default=600.0, alias="KEEP_WARM_INTERVAL_SECONDS")
    external_url: str | None = Field(default=None, alias="RENDER_EXTERNAL_URL")

    @model_validator(mode="after")
    def _require_a_key(self) -> Settings:
        if self.resolved_groq_key is None:
            raise ValueError(
                "No Groq API key. Set GROQ_API_KEY, or a role-specific "
                f"{self.role.upper()}_GROQ_API_KEY."
            )
        return self

    @property
    def resolved_groq_key(self) -> SecretStr | None:
        role_key = (
            self.customer_groq_api_key
            if self.role == "customer"
            else self.vendor_groq_api_key
        )
        return role_key or self.groq_api_key

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
