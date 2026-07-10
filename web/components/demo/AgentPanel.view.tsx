"use client";

import type { RefObject } from "react";
import {
  Brain,
  CheckCircle,
  Eye,
  EyeSlash,
  LockKey,
  ShoppingBagOpen,
  Storefront,
  WarningCircle,
} from "@phosphor-icons/react";
import { MaskBars } from "@/components/ui/MaskBars";
import type { AgentRole } from "@/lib/agents";
import { formatMoney } from "@/lib/api";
import { Cid, FieldLabel, Money, Pill } from "./ui";

export type Phase = "idle" | "reasoning" | "decided" | "sealed" | "error";

export type Decision = { price: string; confidence: number; rationale: string };

export const META: Record<
  AgentRole,
  { label: string; glyph: React.ReactNode; blurb: string; blindTo: string; field: string }
> = {
  customer: {
    label: "Customer agent",
    glyph: <ShoppingBagOpen size={18} weight="bold" />,
    blurb: "Reasons over the buyer's private brief to a ceiling.",
    blindTo: "the vendor's floor",
    field: "Ceiling (max price)",
  },
  vendor: {
    label: "Vendor agent",
    glyph: <Storefront size={18} weight="bold" />,
    blurb: "Reasons over the seller's private brief to a floor.",
    blindTo: "the customer's ceiling",
    field: "Floor (min price)",
  },
};

// Brief fields shown in "what this agent can see". `party` and `objective`
// are rendered separately.
function briefEntries(brief: Record<string, unknown>) {
  return Object.entries(brief).filter(
    ([k]) => k !== "party" && k !== "objective",
  );
}

function humanize(key: string): string {
  return key.replace(/_/g, " ");
}

function isMoneyKey(key: string): boolean {
  return /price|cost|quote/.test(key);
}

export function AgentPanelView({
  role,
  brief,
  showBrief,
  onToggleBrief,
  phase,
  reasoning,
  decision,
  sealedCid,
  error,
  streamRef,
  blinkCaret = true,
  reasoningAnchor = "top",
}: {
  role: AgentRole;
  brief: Record<string, unknown> | null;
  showBrief: boolean;
  onToggleBrief?: () => void;
  phase: Phase;
  reasoning: string;
  decision: Decision | null;
  sealedCid: string | null;
  error: string | null;
  streamRef?: RefObject<HTMLDivElement | null>;
  blinkCaret?: boolean;
  reasoningAnchor?: "top" | "bottom";
}) {
  const meta = META[role];

  const statusPill =
    phase === "sealed" ? (
      <Pill tone="deal">
        <CheckCircle size={13} weight="fill" /> Sealed
      </Pill>
    ) : phase === "reasoning" ? (
      <Pill tone="accent">
        <Brain size={13} weight="bold" /> Reasoning
      </Pill>
    ) : phase === "decided" ? (
      <Pill tone="accent">
        <LockKey size={13} weight="bold" /> Sealing
      </Pill>
    ) : phase === "error" ? (
      <Pill tone="nodeal">
        <WarningCircle size={13} weight="fill" /> Error
      </Pill>
    ) : (
      <Pill tone="muted">Idle</Pill>
    );

  return (
    <div className="flex flex-col rounded-card border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-line bg-surface-2 text-muted">
            {meta.glyph}
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">{meta.label}</div>
            <div className="text-xs text-faint">{meta.blurb}</div>
          </div>
        </div>
        {statusPill}
      </div>

      {/* What this agent can see */}
      <div className="mt-4 rounded-btn border border-line bg-bg/40">
        <button
          type="button"
          onClick={onToggleBrief}
          className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
        >
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
            <Eye size={14} weight="bold" className="text-accent" />
            What this agent can see
          </span>
          <span className="text-xs text-faint">{showBrief ? "hide" : "show"}</span>
        </button>
        {showBrief && brief && (
          <div className="border-t border-line px-3.5 py-3">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {briefEntries(brief).map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[0.68rem] uppercase tracking-wide text-faint">
                    {humanize(k)}
                  </dt>
                  <dd className="truncate text-xs text-muted" title={String(v)}>
                    {isMoneyKey(k) && !Number.isNaN(Number(v))
                      ? formatMoney(v as string)
                      : String(v)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-2.5 text-xs text-faint">
              <EyeSlash size={13} weight="bold" className="text-[color:var(--color-nodeal)]" />
              Cannot see {meta.blindTo}, or any field from the other side.
            </div>
          </div>
        )}
      </div>

      {/* Reasoning stream */}
      <div className="mt-4 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-faint">
        Reasoning
      </div>
      <div
        ref={streamRef}
        className={`mt-2 h-40 rounded-btn border border-line bg-bg/40 p-3 text-xs leading-relaxed text-muted ${
          reasoningAnchor === "bottom"
            ? "flex flex-col justify-end overflow-hidden"
            : "overflow-y-auto"
        }`}
      >
        {reasoning ? (
          <p className="whitespace-pre-wrap">
            {reasoning}
            {phase === "reasoning" && (
              <span
                className={`ml-0.5 inline-block h-3.5 w-1.5 bg-accent align-middle ${
                  blinkCaret ? "animate-pulse" : ""
                }`}
              />
            )}
          </p>
        ) : (
          <span className="text-faint">
            {phase === "reasoning"
              ? "Thinking..."
              : "Idle. Runs when you start the negotiation."}
          </span>
        )}
      </div>

      {/* Decision + seal */}
      <div className="mt-4">
        {error ? (
          <p className="text-xs text-[color:var(--color-nodeal)]">{error}</p>
        ) : decision ? (
          <div>
            <FieldLabel>{meta.field}</FieldLabel>
            <div className="mt-1 flex items-center gap-3">
              {sealedCid ? <MaskBars tone="ink" /> : null}
              <span className="text-xl font-semibold text-ink">
                <Money value={decision.price} />
              </span>
              <span className="text-xs text-faint">
                conf {Math.round(decision.confidence * 100)}%
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-faint">
              {decision.rationale}
            </p>
            {sealedCid && (
              <div className="mt-2 flex items-center gap-2">
                <Pill tone="accent">
                  <LockKey size={12} weight="bold" /> Sealed on Canton
                </Pill>
                <Cid value={sealedCid} />
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-faint">
            No number committed yet. The agent decides privately, then seals.
          </p>
        )}
      </div>
    </div>
  );
}
