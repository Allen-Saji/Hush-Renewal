# HushRenewal

Private sealed-bid clearing for enterprise SaaS renewals, built on Canton.

## The problem

Large enterprises run hundreds of SaaS renewals a year. Enterprise contracts
are negotiated, not list-priced, and they step up sharply at renewal. The
negotiation is information-broken: the customer will not reveal its budget
ceiling (that kills its leverage) and the vendor will not reveal its price
floor (that kills its margin). So renewals become slow, deadline-driven
back-and-forth that often settles badly, or auto-rolls into another year at a
worse rate when a notice window is missed.

## The solution

Each side computes a single reservation price in private and submits it sealed
to a contract on Canton. A neutral matcher clears the overlap:

- If the vendor floor is at or below the customer ceiling, a deal price is
  produced and settled atomically against payment and the renewed license.
- Otherwise the result is "no deal" and nothing quantitative is revealed.

Neither party ever sees the other's number. The only thing that leaves the
round is the outcome.

## Why on a ledger

A trusted middleman could take both numbers too. Putting the mechanism on
Canton is what makes it trustworthy:

- A shared, tamper-evident outcome instead of trusting one server's word.
- Matching logic that is auditable, not an opaque black box.
- Money and the renewed license settle in one transaction, never as two
  fragile steps.
- The privacy boundary is enforced by the ledger, not by a policy.

## Repo layout

This is a monorepo.

- `web/` - marketing and demo landing page (Next.js + Tailwind). Walks through
  the sealed-bid flow and the per-party privacy model.
- Contract code (Daml) lives alongside it and will be added as the on-ledger
  clearing and settlement are built out.

## Running the web app

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Status

Built for the Build on Canton hackathon, Track 3 (Payments, Neo Banking and
Agentic Commerce).
