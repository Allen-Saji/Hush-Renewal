"use client";

import { CheckCircle, Handshake } from "@phosphor-icons/react";
import { type CustomerAccept, type Settlement } from "@/lib/api";
import { Cid, Money, Pill } from "./ui";

type StepState = "pending" | "active" | "done";

function StepCard({
  index,
  actor,
  title,
  body,
  state,
  busy,
  onRun,
  cta,
  children,
}: {
  index: number;
  actor: string;
  title: string;
  body: string;
  state: StepState;
  busy: boolean;
  onRun?: () => void;
  cta: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`flex-1 rounded-card border p-4 transition-colors ${
        state === "active"
          ? "border-accent/50 bg-accent-soft/40"
          : state === "done"
            ? "border-line bg-surface-2"
            : "border-line bg-surface opacity-70"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line text-xs font-medium text-muted">
          {state === "done" ? (
            <CheckCircle
              size={18}
              weight="fill"
              className="text-[color:var(--color-deal)]"
            />
          ) : (
            index
          )}
        </span>
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-faint">
          {actor}
        </span>
      </div>

      <div className="mt-3 text-sm font-medium text-ink">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>

      {children}

      {state === "active" && onRun && (
        <button
          type="button"
          onClick={onRun}
          disabled={busy}
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-btn bg-accent px-3 text-sm font-medium text-white transition-all hover:-translate-y-px hover:shadow-[0_10px_30px_-10px_rgba(47,107,240,0.55)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {busy ? "Working..." : cta}
        </button>
      )}
    </div>
  );
}

export function SettlementBand({
  price,
  proposed,
  customerAccepted,
  settled,
  busy,
  onPropose,
  onCustomerAccept,
  onVendorAccept,
}: {
  price: string | null;
  proposed: boolean;
  customerAccepted: CustomerAccept | null;
  settled: Settlement | null;
  busy: string | null;
  onPropose: () => void;
  onCustomerAccept: () => void;
  onVendorAccept: () => void;
}) {
  const step1: StepState = proposed ? "done" : "active";
  const step2: StepState = customerAccepted
    ? "done"
    : proposed
      ? "active"
      : "pending";
  const step3: StepState = settled
    ? "done"
    : customerAccepted
      ? "active"
      : "pending";

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Handshake size={18} weight="bold" className="text-accent" />
          <h3 className="text-sm font-semibold text-ink">Atomic settlement</h3>
        </div>
        <p className="text-xs text-muted">
          Each party authorizes only its own step. Delivery and payment execute
          together on the vendor&apos;s accept -- or not at all.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <StepCard
          index={1}
          actor="Matcher"
          title="Propose settlement"
          body="Turns the cleared result into a settlement proposal at the agreed price."
          state={step1}
          busy={busy === "propose"}
          onRun={onPropose}
          cta="Propose settlement"
        >
          {price && (
            <div className="mt-2 text-xs text-muted">
              Deal price <Money value={price} />
            </div>
          )}
        </StepCard>

        <StepCard
          index={2}
          actor="Customer"
          title="Accept + escrow cash"
          body="Customer accepts and locks cash equal to the deal price into the handshake."
          state={step2}
          busy={busy === "customerAccept"}
          onRun={onCustomerAccept}
          cta="Accept + escrow"
        >
          {customerAccepted && (
            <div className="mt-2 text-xs text-muted">
              Cash <Cid value={customerAccepted.cash_contract_id} />
            </div>
          )}
        </StepCard>

        <StepCard
          index={3}
          actor="Vendor"
          title="Accept -> atomic DvP"
          body="Vendor accepts; the license is issued and cash moves to the vendor in one atomic step."
          state={step3}
          busy={busy === "vendorAccept"}
          onRun={onVendorAccept}
          cta="Accept + settle"
        >
          {settled && (
            <div className="mt-2 space-y-1 text-xs text-muted">
              <div>
                License <Cid value={settled.license_contract_id} />
              </div>
              <div>
                Vendor cash <Cid value={settled.vendor_cash_contract_id} />
              </div>
            </div>
          )}
        </StepCard>
      </div>

      {settled && (
        <div className="mt-4 flex items-center gap-2">
          <Pill tone="deal">
            <CheckCircle size={13} weight="fill" /> Settled atomically on Canton
          </Pill>
          <span className="text-xs text-muted">
            License issued to the customer, payment delivered to the vendor.
          </span>
        </div>
      )}
    </section>
  );
}
