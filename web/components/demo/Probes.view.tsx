"use client";

import {
  CheckCircle,
  Eye,
  WarningOctagon,
} from "@phosphor-icons/react";
import {
  formatMoney,
  type ForceBadSettlementResult,
  type PeekResult,
} from "@/lib/api";
import { Cid, Pill } from "./ui";

export function PeekResultCard({
  peek,
  busy,
  onPeek,
}: {
  peek: PeekResult | null;
  busy: boolean;
  onPeek?: () => void;
}) {
  return (
    <div className="rounded-btn border border-line bg-bg/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Eye size={15} weight="bold" className="text-muted" />
          Vendor tries to read the bid
        </div>
        <button
          type="button"
          onClick={onPeek}
          disabled={busy}
          className="inline-flex h-8 items-center rounded-btn border border-line px-3 text-xs font-medium text-muted transition-colors hover:border-faint hover:text-ink disabled:opacity-60"
        >
          {busy ? "Probing..." : "Attempt peek"}
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
  );
}

export function ForceSettleResultCard({
  force,
  busy,
  canForceFail,
  onForce,
}: {
  force: ForceBadSettlementResult | null;
  busy: boolean;
  canForceFail: boolean;
  onForce?: () => void;
}) {
  return (
    <div className="rounded-btn border border-line bg-bg/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <WarningOctagon size={15} weight="bold" className="text-muted" />
          Settle with the wrong amount
        </div>
        <button
          type="button"
          onClick={onForce}
          disabled={busy || !canForceFail}
          className="inline-flex h-8 items-center rounded-btn border border-line px-3 text-xs font-medium text-muted transition-colors hover:border-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Probing..." : "Force bad settle"}
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
  );
}
