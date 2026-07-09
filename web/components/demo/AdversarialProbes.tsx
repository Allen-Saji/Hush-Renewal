"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Eye,
  ShieldCheck,
  WarningOctagon,
} from "@phosphor-icons/react";
import {
  api,
  formatMoney,
  type ForceBadSettlementResult,
  type PeekResult,
} from "@/lib/api";
import { Cid, Pill } from "./ui";

export function AdversarialProbes({
  roundId,
  canForceFail,
  onChange,
}: {
  roundId: string;
  canForceFail: boolean;
  onChange: () => void;
}) {
  const [peek, setPeek] = useState<PeekResult | null>(null);
  const [force, setForce] = useState<ForceBadSettlementResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runPeek() {
    setBusy("peek");
    setError(null);
    try {
      const res = await api.peek(roundId);
      setPeek(res);
      if (res.verdict === "denied") {
        toast.success("Peek denied by privacy", {
          description: "The bid exists, but the vendor cannot see it",
        });
      } else {
        toast.error("Bid leaked", {
          description: "The vendor could see the customer's ceiling",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Peek failed to run";
      setError(msg);
      toast.error("Peek failed", { description: msg });
    } finally {
      setBusy(null);
    }
  }

  async function runForce() {
    setBusy("force");
    setError(null);
    try {
      const res = await api.forceBadSettlement(roundId);
      setForce(res);
      onChange();
      if (res.reverted) {
        toast.success("Mismatched settlement reverted", {
          description: "No paid-but-not-renewed state was created",
        });
      } else {
        toast.error("Mismatched settlement went through", {
          description: "The ledger did not reject it",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Force-fail could not run";
      setError(msg);
      toast.error("Force-fail could not run", { description: msg });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} weight="bold" className="text-accent" />
        <h3 className="text-sm font-semibold text-ink">Adversarial probes</h3>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        A faked demo would pass these silently. These run against the live ledger,
        so the failures are real.
      </p>

      {error && (
        <div className="mt-3 text-xs text-[color:var(--color-nodeal)]">{error}</div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Peek */}
        <div className="rounded-btn border border-line bg-bg/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <Eye size={15} weight="bold" className="text-muted" />
              Vendor tries to read the bid
            </div>
            <button
              type="button"
              onClick={runPeek}
              disabled={busy === "peek"}
              className="inline-flex h-8 items-center rounded-btn border border-line px-3 text-xs font-medium text-muted transition-colors hover:border-faint hover:text-ink disabled:opacity-60"
            >
              {busy === "peek" ? "Probing..." : "Attempt peek"}
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-faint">
            The vendor queries the ledger for the customer&apos;s sealed bid.
          </p>
          {peek && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                {peek.verdict === "denied" ? (
                  <Pill tone="deal">
                    <CheckCircle size={12} weight="fill" /> Denied by privacy
                  </Pill>
                ) : (
                  <Pill tone="nodeal">
                    <WarningOctagon size={12} weight="fill" /> Leaked
                  </Pill>
                )}
              </div>
              <ul className="space-y-1 text-xs text-muted">
                <li>
                  Bid exists on the ledger:{" "}
                  <span className="text-ink">{peek.bid_exists ? "yes" : "no"}</span>
                  {peek.bid_contract_id && (
                    <>
                      {" "}
                      (<Cid value={peek.bid_contract_id} />)
                    </>
                  )}
                </li>
                <li>
                  Vendor can see it:{" "}
                  <span
                    className={
                      peek.vendor_can_see_bid
                        ? "text-[color:var(--color-nodeal)]"
                        : "text-[color:var(--color-deal)]"
                    }
                  >
                    {peek.vendor_can_see_bid ? "yes" : "no"}
                  </span>
                </li>
                <li className="text-faint">
                  Vendor&apos;s visible templates:{" "}
                  <span className="font-mono">
                    {peek.vendor_visible_templates.join(", ") || "none"}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Force bad settlement */}
        <div className="rounded-btn border border-line bg-bg/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <WarningOctagon size={15} weight="bold" className="text-muted" />
              Settle with the wrong amount
            </div>
            <button
              type="button"
              onClick={runForce}
              disabled={busy === "force" || !canForceFail}
              className="inline-flex h-8 items-center rounded-btn border border-line px-3 text-xs font-medium text-muted transition-colors hover:border-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "force" ? "Probing..." : "Force bad settle"}
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-faint">
            {canForceFail
              ? "Escrow cash that does not equal the deal price and try to settle."
              : "Available once a round has cleared as a DEAL."}
          </p>
          {force && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                {force.reverted ? (
                  <Pill tone="deal">
                    <CheckCircle size={12} weight="fill" /> Reverted
                  </Pill>
                ) : (
                  <Pill tone="nodeal">
                    <WarningOctagon size={12} weight="fill" /> Went through
                  </Pill>
                )}
              </div>
              <ul className="space-y-1 text-xs text-muted">
                <li>
                  Deal price{" "}
                  <span className="font-mono text-ink">
                    {formatMoney(force.deal_price)}
                  </span>
                  , escrowed{" "}
                  <span className="font-mono text-[color:var(--color-nodeal)]">
                    {formatMoney(force.escrowed_amount)}
                  </span>
                </li>
                {force.ledger_error && (
                  <li className="text-faint">
                    Ledger:{" "}
                    <span className="font-mono">{force.ledger_error}</span>
                  </li>
                )}
              </ul>
              <p className="text-xs leading-relaxed text-faint">{force.note}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
