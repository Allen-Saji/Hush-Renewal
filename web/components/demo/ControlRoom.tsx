"use client";

import { useEffect, useState } from "react";
import {
  ArrowClockwise,
  CheckCircle,
  Lightning,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  api,
  type Clearing,
  type CustomerAccept,
  type Round,
  type Settlement,
} from "@/lib/api";
import { Cid, Dot } from "./ui";
import { MatcherPanel, SealedPricePanel } from "./Panels";
import { SettlementBand } from "./SettlementBand";
import { LedgerProjection } from "./LedgerProjection";

type Conn = "checking" | "ok" | "down";

const STEPS = ["Open round", "Seal prices", "Clear", "Settle"] as const;

export function ControlRoom() {
  const [subscription, setSubscription] = useState("Workday Enterprise");
  const [round, setRound] = useState<Round | null>(null);
  const [ceiling, setCeiling] = useState("");
  const [floor, setFloor] = useState("");
  const [bidSealed, setBidSealed] = useState(false);
  const [askSealed, setAskSealed] = useState(false);
  const [clearing, setClearing] = useState<Clearing | null>(null);
  const [proposed, setProposed] = useState(false);
  const [customerAccepted, setCustomerAccepted] = useState<CustomerAccept | null>(
    null,
  );
  const [settled, setSettled] = useState<Settlement | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [conn, setConn] = useState<Conn>("checking");
  const [ledgerEnd, setLedgerEnd] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .health()
      .then((h) => {
        if (ignore) return;
        setConn("ok");
        setLedgerEnd(h.ledger_end);
      })
      .catch(() => {
        if (!ignore) setConn("down");
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const bothSealed = bidSealed && askSealed;

  function reset() {
    setRound(null);
    setCeiling("");
    setFloor("");
    setBidSealed(false);
    setAskSealed(false);
    setClearing(null);
    setProposed(false);
    setCustomerAccepted(null);
    setSettled(null);
    setError(null);
    setRefreshKey((k) => k + 1);
  }

  const stage = !round
    ? 0
    : !bothSealed
      ? 1
      : !clearing
        ? 2
        : 3;

  function stepState(i: number): "done" | "active" | "pending" {
    if (i === 0) return round ? "done" : "active";
    if (i === 1) return bothSealed ? "done" : round ? "active" : "pending";
    if (i === 2) return clearing ? "done" : bothSealed ? "active" : "pending";
    // Settle
    if (settled) return "done";
    if (clearing?.outcome === "DEAL") return "active";
    return "pending";
  }

  return (
    <div className="space-y-5">
      {/* Round bar */}
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        {round ? (
          <div className="min-w-0">
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-faint">
              Renewal round
            </div>
            <div className="mt-1 truncate text-lg font-semibold text-ink">
              {round.subscription}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
              <span>
                id <span className="font-mono text-muted">{round.round_id}</span>
              </span>
              <span>
                contract <Cid value={round.contract_id} />
              </span>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:max-w-md">
            <label className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-faint">
              Subscription to renew
            </label>
            <div className="flex gap-2">
              <input
                value={subscription}
                onChange={(e) => setSubscription(e.target.value)}
                className="w-full rounded-btn border border-line bg-bg/50 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/60"
              />
              <button
                type="button"
                onClick={() =>
                  run("open", async () => {
                    const r = await api.openRound(subscription.trim() || "Renewal");
                    setRound(r);
                  })
                }
                disabled={busy === "open" || conn === "down"}
                className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-btn bg-accent px-4 text-sm font-medium text-white transition-all hover:-translate-y-px hover:shadow-[0_10px_30px_-10px_rgba(47,107,240,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lightning size={15} weight="bold" />
                {busy === "open" ? "Opening..." : "Open round"}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-muted">
            <Dot tone={conn === "ok" ? "deal" : conn === "down" ? "nodeal" : "neutral"} />
            {conn === "ok"
              ? `Canton DevNet - offset ${ledgerEnd ?? "?"}`
              : conn === "down"
                ? "Backend unreachable"
                : "Connecting..."}
          </span>
          {round && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line px-3 text-sm text-muted transition-colors hover:border-faint hover:text-ink"
            >
              <ArrowClockwise size={14} weight="bold" /> New round
            </button>
          )}
        </div>
      </div>

      {/* Step rail */}
      <ol className="flex items-center gap-2 overflow-x-auto rounded-card border border-line bg-surface px-4 py-3 text-sm">
        {STEPS.map((label, i) => {
          const s = stepState(i);
          return (
            <li key={label} className="flex items-center gap-2 whitespace-nowrap">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.7rem] font-medium ${
                  s === "done"
                    ? "bg-[color:var(--color-deal)]/15 text-[color:var(--color-deal)]"
                    : s === "active"
                      ? "bg-accent text-white"
                      : "bg-surface-2 text-faint"
                }`}
              >
                {s === "done" ? <CheckCircle size={14} weight="fill" /> : i + 1}
              </span>
              <span className={s === "pending" ? "text-faint" : "text-ink"}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="mx-1 h-px w-6 bg-line sm:w-10" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Quick-fill scenarios */}
      {round && !bothSealed && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-faint">Quick fill:</span>
          <button
            type="button"
            onClick={() => {
              if (!bidSealed) setCeiling("100000");
              if (!askSealed) setFloor("80000");
            }}
            className="rounded-full border border-line px-3 py-1 text-muted transition-colors hover:border-faint hover:text-ink"
          >
            Deal (ceiling 100k / floor 80k)
          </button>
          <button
            type="button"
            onClick={() => {
              if (!bidSealed) setCeiling("70000");
              if (!askSealed) setFloor("90000");
            }}
            className="rounded-full border border-line px-3 py-1 text-muted transition-colors hover:border-faint hover:text-ink"
          >
            No deal (ceiling 70k / floor 90k)
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-card border border-[color:var(--color-nodeal)]/40 bg-[color:var(--color-nodeal)]/10 px-4 py-3 text-sm text-[color:var(--color-nodeal)]">
          <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Party panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SealedPricePanel
          side="customer"
          roundOpen={!!round}
          sealed={bidSealed}
          value={ceiling}
          onChange={setCeiling}
          busy={busy === "bid"}
          onSubmit={() =>
            run("bid", async () => {
              if (!round) return;
              await api.submitBid(round.round_id, ceiling);
              setBidSealed(true);
            })
          }
        />
        <MatcherPanel
          bothSealed={bothSealed}
          clearing={clearing}
          busy={busy === "clear"}
          onClear={() =>
            run("clear", async () => {
              if (!round) return;
              const c = await api.clear(round.round_id);
              setClearing(c);
            })
          }
        />
        <SealedPricePanel
          side="vendor"
          roundOpen={!!round}
          sealed={askSealed}
          value={floor}
          onChange={setFloor}
          busy={busy === "ask"}
          onSubmit={() =>
            run("ask", async () => {
              if (!round) return;
              await api.submitAsk(round.round_id, floor);
              setAskSealed(true);
            })
          }
        />
      </div>

      {/* Settlement (only on a DEAL) */}
      {clearing?.outcome === "DEAL" && (
        <SettlementBand
          price={clearing.price}
          proposed={proposed}
          customerAccepted={customerAccepted}
          settled={settled}
          busy={busy}
          onPropose={() =>
            run("propose", async () => {
              if (!round) return;
              await api.propose(round.round_id);
              setProposed(true);
            })
          }
          onCustomerAccept={() =>
            run("customerAccept", async () => {
              if (!round) return;
              const a = await api.customerAccept(round.round_id);
              setCustomerAccepted(a);
            })
          }
          onVendorAccept={() =>
            run("vendorAccept", async () => {
              if (!round) return;
              const s = await api.vendorAccept(round.round_id);
              setSettled(s);
            })
          }
        />
      )}

      {clearing?.outcome === "NO_DEAL" && (
        <div className="rounded-card border border-[color:var(--color-nodeal)]/30 bg-[color:var(--color-nodeal)]/5 px-5 py-4 text-sm text-muted">
          No overlap: the vendor&apos;s floor sat above the customer&apos;s ceiling,
          so the round closes with no deal. Crucially, neither sealed number is
          revealed by this outcome -- the ledger only records NO_DEAL.
        </div>
      )}

      {/* Live privacy proof */}
      <LedgerProjection roundId={round?.round_id ?? null} refreshKey={refreshKey} />
    </div>
  );
}
