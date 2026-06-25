# Image prompts (generate in ChatGPT, then drop in)

Two photographic slots. Generate each in ChatGPT image gen, download, place the
file under `public/`, and swap the `src` from the Picsum placeholder to the
local path. Both are art-directed for the dark-institutional palette
(near-black `#0a0b0d`, single signal-blue accent `#2f6bf0`).

---

## 1. Editorial moment band (full width, 16:9)

Used in: `app/page.tsx` -> `<ImageBand>` (replaces seed
`hushrenewal-crossing-beams`). Target size 1600x900.

> Cinematic abstract macro photograph for a dark fintech landing page. Two thin
> lines of cool electric-blue light travel toward each other across a near-black
> field and meet at a single bright point of contact. Deep matte black
> background, subtle film grain, soft volumetric haze, shallow depth of field.
> Restrained, institutional, high-end, editorial. One accent color only: signal
> blue (#2f6bf0) with a faint emerald glint at the crossing point. No text, no
> logos, no UI, no people. Horizontal 16:9.

---

## 2. Trust-boundary supporting image (portrait, 4:5)

Used in: `components/sections/TrustBoundary.tsx` (replaces seed
`hushrenewal-sealed-vault-macro`). Target size 900x1125.

> Editorial macro photograph for a dark privacy-infrastructure landing page.
> Extreme close-up of a precision sealed mechanism: two machined metal halves
> meeting along a clean seam, a single interlocking joint at center, brushed
> gunmetal and graphite tones on a near-black background. Moody low-key studio
> lighting with one cool signal-blue rim light (#2f6bf0), fine grain, shallow
> depth of field. Serious, institutional, trust-first. No text, no logos, no UI,
> no people. Vertical 4:5.

---

After saving, e.g. `public/moment.webp` and `public/trust.webp`:

- `app/page.tsx`: set `src="/moment.webp"`.
- `components/sections/TrustBoundary.tsx`: set `src="/trust.webp"`.

Local images do not need the `remotePatterns` entry in `next.config.ts`; you can
remove the `picsum.photos` pattern once both placeholders are replaced.
