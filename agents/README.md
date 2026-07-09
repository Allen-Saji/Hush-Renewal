# HushRenewal negotiation agents

Two autonomous LLM agents that privately negotiate a SaaS renewal price and seal
it on Canton. The customer agent and the vendor agent each reason over **only
their own confidential brief**, commit to a single reservation number, and submit
it sealed to the matcher backend. Neither agent ever sees the other's brief or
number. A neutral matcher clears the overlap; nobody on either side learns the
counterparty's figure.

This is the layer that makes the demo the *product* (autonomous agents doing a
private negotiation) rather than a control-room UI where a human types the
numbers.

## Shape

```
customer agent (own brief) --reason--> price --seal--> POST /v1/customer/.../bid  --.
                                                                                    |--> matcher backend --> Canton
vendor agent   (own brief) --reason--> price --seal--> POST /v1/vendor/.../ask   --'
```

- **One process = one role.** `AGENT_ROLE` fixes it at start. Run two processes
  (two ports, two configs) so the isolation is a deployment fact, not a
  convention. They share this codebase but never share state.
- **Reasoning** (`llm.py`) is two-phase on purpose: phase one *streams* the
  agent thinking over its own brief (so a viewer watches it reason); phase two is
  a deterministic JSON-mode call that extracts the committed reservation price.
- **Sealing** (`sealer.py`) is role-locked: a customer sealer can only build the
  customer bid URL, a vendor sealer only the vendor ask URL. The backend's
  party-locked service is the second lock behind this one.
- **`/context`** returns exactly what the agent can see -- its own brief,
  verbatim -- so the "no cross-side data" claim is auditable, not asserted.

## Endpoints

| Method | Path         | Purpose                                                    |
|--------|--------------|------------------------------------------------------------|
| GET    | `/health`    | Liveness + which role/model/backend this process is        |
| GET    | `/context`   | What this agent can see (its own brief). `?scenario=deal`   |
| POST   | `/negotiate` | Run a round; SSE stream: reasoning -> decision -> sealed    |

`/negotiate` streams Server-Sent Events: `start`, `reasoning` (many), `decision`,
`sealed`, `done`, or `error`.

## Scenarios

- `deal` -- briefs shaped so the reasoned ceiling and floor overlap -> the round
  clears at a random-in-band price.
- `no_deal` -- floor above ceiling -> NO_DEAL, and the ledger reveals no price
  (a failed negotiation leaks nothing).

The prices are genuinely LLM-derived from the briefs, not hard-coded. The briefs
are shaped to make each outcome the expected one at low temperature.

## Run

```bash
cp .env.example .env   # set GROQ_API_KEY (or CUSTOMER_/VENDOR_ variants)

# matcher backend must be running (see ../backend), pointed at Seaport DevNet
./scripts/run_customer.sh    # :8100
./scripts/run_vendor.sh      # :8200  (separate terminal)

# or drive a full round end-to-end against the running backend:
export GROQ_API_KEY=gsk_...
uv run python scripts/demo_negotiation.py deal      # or: no_deal
```

## Honest limitations

- **Groq is a reasoning runtime, not part of the product's tech stack.** Swap the
  model with `GROQ_MODEL`, or point `GROQ_BASE_URL` at any OpenAI-compatible API.
- **Single DevNet participant.** Isolation here is at the service / brief /
  endpoint layer, not separate Canton nodes. The privacy guarantee itself is
  Daml subtransaction privacy and is identical either way -- we state this
  plainly rather than fake a multi-node topology.
- **The matcher sees both raw numbers** to clear them. That is the honest trust
  boundary of sealed-bid clearing; ZK/MPC to remove it is future work.

## Dev

```bash
uv sync
uv run ruff check . && uv run mypy src tests && uv run pytest -q
```
