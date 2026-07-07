# HushRenewal matcher service -- production image.
# Built with uv for fast, reproducible installs from the committed lockfile.
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencies first (cached layer), then the project source.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
RUN uv sync --frozen --no-dev

# Drop privileges.
RUN useradd -m app && chown -R app:app /app
USER app

ENV PATH="/app/.venv/bin:$PATH" \
    DATABASE_URL="sqlite+aiosqlite:////tmp/hushrenewal.db"

# Render injects $PORT (default 10000). Shell form expands it at runtime.
CMD uvicorn hushrenewal.main:app --host 0.0.0.0 --port ${PORT:-8000}
