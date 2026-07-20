# VPS deployment

The production matcher and negotiation agents run as three isolated systemd
services behind Caddy:

| Service | Local port | Public endpoint |
|---|---:|---|
| Matcher backend | 8000 | `api.hushrenewal.allensaji.dev` |
| Customer agent | 8100 | `customer-agent.hushrenewal.allensaji.dev` |
| Vendor agent | 8200 | `vendor-agent.hushrenewal.allensaji.dev` |

The application ports bind to loopback only. Caddy is the only public ingress
on ports 80 and 443. Each process has a dedicated unprivileged user and reads a
root-owned environment file from `/etc/hushrenewal`.

Caddy rejects state-changing requests that do not carry the production
frontend origin. This is a public-demo abuse guard, not authentication: browser
origins can be spoofed by a deliberate client. Production use still requires
real tenant authentication, authorization, and rate limits.

## Server layout

```text
/opt/hushrenewal/current/       checked-out release
/opt/hushrenewal/venvs/backend  backend virtual environment
/opt/hushrenewal/venvs/agents   agents virtual environment
/etc/hushrenewal/*.env          production secrets and service settings
/var/lib/hushrenewal/           matcher SQLite audit database
```

## Required environment files

`/etc/hushrenewal/backend.env` contains only the `CANTON_DEVNET_*` connection
and OIDC variables. The systemd unit supplies production logging, persistence,
keep-warm, and CORS settings. Party hints use the application defaults.

`/etc/hushrenewal/groq.env` contains the shared Groq key and is readable only
by the two agent service users. The committed `agent-customer.defaults` and
`agent-vendor.defaults` files are installed beside it for role-specific
non-secret settings.

Never commit the files under `/etc/hushrenewal`. They must be owned by `root`,
grouped to the matching service user or agent group, and mode `0640`.

## Service operations

```bash
sudo systemctl status hushrenewal-backend
sudo systemctl status hushrenewal-agent@customer
sudo systemctl status hushrenewal-agent@vendor

sudo journalctl -u hushrenewal-backend -n 100 --no-pager
sudo journalctl -u hushrenewal-agent@customer -n 100 --no-pager
sudo journalctl -u hushrenewal-agent@vendor -n 100 --no-pager
```

After a release, fast-forward `/opt/hushrenewal/current` as the `allen` deploy
user, run `uv sync --frozen --no-dev` in both service directories with their
dedicated virtual environments, then restart all three units. Verify `/health`,
`/health/ledger`, both agent `/context` routes, and a complete live negotiation
before declaring the release healthy.
