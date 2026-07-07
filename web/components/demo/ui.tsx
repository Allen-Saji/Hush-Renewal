/* Small presentational atoms shared across the demo control room. */

import { type ReactNode } from "react";
import { formatMoney, shortCid } from "@/lib/api";

type Tone = "neutral" | "accent" | "deal" | "nodeal" | "muted";

const toneClass: Record<Tone, string> = {
  neutral: "border-line bg-surface-2 text-muted",
  accent: "border-accent/40 bg-accent-soft text-ink",
  deal: "border-[color:var(--color-deal)]/40 bg-[color:var(--color-deal)]/10 text-[color:var(--color-deal)]",
  nodeal:
    "border-[color:var(--color-nodeal)]/40 bg-[color:var(--color-nodeal)]/10 text-[color:var(--color-nodeal)]",
  muted: "border-line bg-transparent text-faint",
};

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  const c =
    tone === "deal"
      ? "bg-[color:var(--color-deal)]"
      : tone === "nodeal"
        ? "bg-[color:var(--color-nodeal)]"
        : tone === "accent"
          ? "bg-accent"
          : "bg-faint";
  return <span className={`inline-block h-2 w-2 rounded-full ${c}`} />;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-faint">
      {children}
    </div>
  );
}

export function Money({ value }: { value: string | number | null | undefined }) {
  return <span className="font-mono tabular-nums">{formatMoney(value)}</span>;
}

export function Cid({ value }: { value: string }) {
  return (
    <span className="font-mono text-xs text-faint" title={value}>
      {shortCid(value)}
    </span>
  );
}
