"use client";

import { type ReactNode } from "react";
import {
  ArrowsInLineHorizontal,
  LockKey,
  ShoppingBagOpen,
  Storefront,
} from "@phosphor-icons/react";
import { MaskBars } from "@/components/ui/MaskBars";
import { type Clearing } from "@/lib/api";
import { FieldLabel, Money, Pill } from "./ui";

type Accent = "customer" | "vendor" | "matcher";

const glyph: Record<Accent, ReactNode> = {
  customer: <ShoppingBagOpen size={18} weight="bold" />,
  vendor: <Storefront size={18} weight="bold" />,
  matcher: <ArrowsInLineHorizontal size={18} weight="bold" />,
};

function Panel({
  accent,
  label,
  subtitle,
  emphasize = false,
  children,
}: {
  accent: Accent;
  label: string;
  subtitle: string;
  emphasize?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-card border bg-surface p-5 ${
        emphasize ? "border-accent/40" : "border-line"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-btn border ${
            emphasize
              ? "border-accent/50 bg-accent-soft text-accent-hi"
              : "border-line bg-surface-2 text-muted"
          }`}
        >
          {glyph[accent]}
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">{label}</div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">{subtitle}</p>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function PriceInput({
  value,
  onChange,
  onSubmit,
  busy,
  placeholder,
  cta,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  placeholder: string;
  cta: string;
}) {
  const valid = Number(value) > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !busy) onSubmit();
      }}
      className="mt-auto"
    >
      <div className="flex items-center rounded-btn border border-line bg-bg/50 focus-within:border-accent/60">
        <span className="pl-3 text-sm text-faint">$</span>
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder={placeholder}
          className="w-full bg-transparent px-2 py-2.5 font-mono text-sm text-ink outline-none placeholder:text-faint"
        />
      </div>
      <button
        type="submit"
        disabled={!valid || busy}
        className="mt-2.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent px-3 text-sm font-medium text-white transition-all hover:-translate-y-px hover:shadow-[0_10px_30px_-10px_rgba(47,107,240,0.55)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        <LockKey size={15} weight="bold" />
        {busy ? "Sealing..." : cta}
      </button>
    </form>
  );
}

export function SealedPricePanel({
  side,
  roundOpen,
  sealed,
  value,
  onChange,
  onSubmit,
  busy,
}: {
  side: "customer" | "vendor";
  roundOpen: boolean;
  sealed: boolean;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const isCustomer = side === "customer";
  const label = isCustomer ? "Customer" : "Vendor";
  const subtitle = isCustomer
    ? "The buyer. Seals a private ceiling -- the most it will pay to renew."
    : "The seller. Seals a private floor -- the least it will accept.";
  const fieldName = isCustomer ? "Ceiling (max price)" : "Floor (min price)";

  return (
    <Panel accent={side} label={label} subtitle={subtitle}>
      <FieldLabel>{fieldName}</FieldLabel>
      {sealed ? (
        <div className="mt-2 flex flex-1 flex-col">
          <div className="flex items-center gap-3">
            <MaskBars tone="ink" />
            <Money value={value} />
          </div>
          <div className="mt-auto pt-4">
            <Pill tone="accent">
              <LockKey size={13} weight="bold" /> Sealed on the ledger
            </Pill>
            <p className="mt-2 text-xs leading-relaxed text-faint">
              Only you and the matcher can see this number. The other side never
              does.
            </p>
          </div>
        </div>
      ) : roundOpen ? (
        <PriceInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          busy={busy}
          placeholder={isCustomer ? "100000" : "80000"}
          cta={isCustomer ? "Seal ceiling" : "Seal floor"}
        />
      ) : (
        <p className="mt-2 text-xs text-faint">Waiting for a round to open.</p>
      )}
    </Panel>
  );
}

export function MatcherPanel({
  bothSealed,
  clearing,
  busy,
  onClear,
}: {
  bothSealed: boolean;
  clearing: Clearing | null;
  busy: boolean;
  onClear: () => void;
}) {
  return (
    <Panel
      accent="matcher"
      label="Matcher"
      subtitle="The neutral clearer -- the one party that sees both sealed numbers. It draws a price at random inside the overlap; the ledger checks the draw is in band."
      emphasize
    >
      {clearing ? (
        clearing.outcome === "DEAL" ? (
          <div className="mt-auto">
            <FieldLabel>Cleared</FieldLabel>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[color:var(--color-deal)]">
                <Money value={clearing.price} />
              </span>
              <Pill tone="deal">DEAL</Pill>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Drawn at random within the overlap of floor and ceiling. Neither
              exact reservation price is revealed by the outcome.
            </p>
          </div>
        ) : (
          <div className="mt-auto">
            <FieldLabel>Cleared</FieldLabel>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-semibold text-[color:var(--color-nodeal)]">
                No deal
              </span>
              <Pill tone="nodeal">NO_DEAL</Pill>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              The floor sat above the ceiling. No price, and neither number, is
              revealed.
            </p>
          </div>
        )
      ) : bothSealed ? (
        <div className="mt-auto">
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent px-3 text-sm font-medium text-white transition-all hover:-translate-y-px hover:shadow-[0_10px_30px_-10px_rgba(47,107,240,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowsInLineHorizontal size={16} weight="bold" />
            {busy ? "Clearing..." : "Clear round"}
          </button>
          <p className="mt-2 text-xs text-faint">
            Both sides have sealed. Clear to compute the cross.
          </p>
        </div>
      ) : (
        <p className="mt-auto text-xs text-faint">
          Waiting for both sides to seal their prices.
        </p>
      )}
    </Panel>
  );
}
