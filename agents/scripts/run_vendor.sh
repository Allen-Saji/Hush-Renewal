#!/usr/bin/env bash
# Start the vendor negotiation agent (its own process, its own port).
set -euo pipefail
cd "$(dirname "$0")/.."
export AGENT_ROLE=vendor
export PORT="${PORT:-8200}"
exec uv run uvicorn negotiator.main:app --host "${HOST:-0.0.0.0}" --port "$PORT"
