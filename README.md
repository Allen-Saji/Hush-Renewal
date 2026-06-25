# HushRenewal landing

Marketing landing page for HushRenewal: private sealed-bid clearing for
enterprise SaaS renewals on Canton. Both sides submit one sealed reservation
price, a neutral matcher clears the overlap, and the deal settles atomically.
Neither party sees the other's number.

Built with the taste-skill `design-taste-frontend` ruleset (dark institutional,
signal-blue accent).

## Stack

- Next.js 15 (App Router, React Server Components)
- Tailwind v4 (`@theme` tokens in `app/globals.css`)
- Motion (`motion/react`) for the signature interval-crossing demo and reveals
- Geist Sans + Geist Mono via `next/font`
- Phosphor icons (one family, SSR variants in server components)

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (verified green)
```

## Design notes

- Dials: `DESIGN_VARIANCE 6 / MOTION_INTENSITY 5 / VISUAL_DENSITY 4`.
- One theme: dark, locked at the root (`color-scheme: dark`). No section inverts.
- One accent: signal blue `#2f6bf0` (white-on-accent buttons pass WCAG AA).
  `--color-deal` / `--color-nodeal` are semantic-only and appear solely inside
  the mechanism diagrams, never as brand color.
- Shape scale: cards `rounded-card` (16px), buttons `rounded-btn` (10px),
  chips full.
- Zero em-dashes anywhere (plain ASCII hyphens only).

## Section map

`Hero` -> `Trap` (renewal standoff) -> `HowItWorks` (the animated
interval-crossing demo) -> `ImageBand` -> `PerPartyView` (privacy projection
toggle) -> `TrustBoundary` (honest claim ledger) -> `Settlement` (atomic DvP) ->
`WhyOnLedger` (comparison) -> `FinalCTA`.

## Images

Two photographic slots, generated from `IMAGE-PROMPTS.md` and stored as webp in
`public/`:

- `public/moment.webp` (crossing beams) -> `ImageBand` in `app/page.tsx`.
- `public/trust.webp` (interlocking machined joint) ->
  `components/sections/TrustBoundary.tsx`.

All other visuals (hero card, the interval-crossing demo, settlement diagram)
are real components, not images.
