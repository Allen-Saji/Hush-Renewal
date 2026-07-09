"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowClockwise,
  Brain,
  CheckCircle,
  Lightning,
  WarningCircle,
} from "@phosphor-icons/react";
import { Toaster, toast } from "sonner";
import {
  api,
  formatMoney,
  type Clearing,
  type CustomerAccept,
  type Round,
  type Settlement,
} from "@/lib/api";
import { settle as agentSettle, type Scenario } from "@/lib/agents";
import { Dot } from "./ui";
import { MatcherPanel } from "./Panels";
import { AgentNegotiation, type AgentHandle } from "./AgentNegotiation";
import { SettlementBand } from "./SettlementBand";
import { LedgerProjection } from "./LedgerProjection";
import { AdversarialProbes } from "./AdversarialProbes";

type Conn = "checking" | "ok" | "down";

const STEPS = ["Open round", "Agents negotiate", "Clear", "Settle"] as const;

const SCENARIOS: { id: Scenario; label: string; hint: string }[] = [
  { id: "deal", label: "Overlap", hint: "briefs that should clear a deal" },
  { id: "no_deal", label: "No overlap", hint: "floor above ceiling -> no deal" },
];

export function ControlRoom() {
  const [subscription, setSubscription] = useState("Workday Enterprise HR Suite");
  const [round, setRound] = useState<Round | null>(null);
  const [scenario, setScenario] = useState<Scenario>("deal");
  const [sealedCount, setSealedCount] = useState(0);
  const [running, setRunning] = useState(false);
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

  const customerRef = useRef<AgentHandle | null>(null);
  const vendorRef = useRef<AgentHandle | null>(null);

  useEffect(() => {
    let ignore = false;
    // Poll health so a transient DevNet blip self-heals instead of bricking the
    // demo until a reload.
    const check = () => {
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
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      ignore = true;
      clearInterval(id);
    };
  }, []);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      toast.error("Action failed", { description: msg });
    } finally {
      setBusy(null);
    }
  }

  const bothSealed = sealedCount >= 2;
  const scenarioLocked = running || sealedCount > 0 || !!clearing;

  async function runNegotiation() {
    if (!round) return;
    setRunning(true);
    setError(null);
    setSealedCount(0);
    try {
      await Promise.all([customerRef.current?.run(), vendorRef.current?.run()]);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An agent could not negotiate");
    } finally {
      setRunning(false);
    }
  }

  // Agent-driven settlement: the matcher (neutral service) proposes, then each
  // agent authorizes its OWN leg through its own service. No human clicks a
  // party's accept button.
  async function runSettlement() {
    if (!round) return;
    setBusy("settle");
    setError(null);
    try {
      await api.propose(round.round_id);
      setProposed(true);
      toast.success("Matcher proposed the settlement");

      const c = await agentSettle("customer", round.round_id);
      setCustomerAccepted({
        accepted_contract_id: c.result.accepted_contract_id,
        cash_contract_id: c.result.cash_contract_id,
      });
      toast.success("Customer agent authorized + escrowed cash", {
        description: c.rationale,
      });

      const v = await agentSettle("vendor", round.round_id);
      setSettled({
        license_contract_id: v.result.license_contract_id,
        vendor_cash_contract_id: v.result.vendor_cash_contract_id,
      });
      toast.success("Vendor agent settled atomically on Canton", {
        description: v.rationale,
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Settlement failed";
      setError(msg);
      toast.error("Settlement failed", { description: msg });
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setRound(null);
    setSealedCount(0);
    setClearing(null);
    setProposed(false);
    setCustomerAccepted(null);
    setSettled(null);
    setError(null);
    setRefreshKey((k) => k + 1);
  }

  function stepState(i: number): "done" | "active" | "pending" {
    if (i === 0) return round ? "done" : "active";
    if (i === 1) return bothSealed ? "done" : round ? "active" : "pending";
    if (i === 2) return clearing ? "done" : bothSealed ? "active" : "pending";
    if (settled) return "done";
    if (clearing?.outcome === "DEAL") return "active";
    return "pending";
  }

  return (
    <div className="space-y-5">
      <Toaster
        theme="dark"
        position="bottom-right"
        closeButton
        toastOptions={{
          style: {
            background: "var(--color-surface)",
            border: "1px solid var(--color-line)",
            color: "var(--color-ink)",
          },
        }}
      />

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
            <div className="mt-1 text-xs text-faint">
              id <span className="font-mono text-muted">{round.round_id}</span>
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
                    toast.success("Round opened", { description: r.round_id });
                  })
                }
                disabled={busy === "open"}
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

      {/* Scenario + run bar */}
      {round && !bothSealed && (
        <div className="flex flex-col gap-3 rounded-card border border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-faint">Scenario:</span>
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                disabled={scenarioLocked}
                onClick={() => setScenario(sc.id)}
                title={sc.hint}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  scenario === sc.id
                    ? "border-accent/50 bg-accent-soft text-ink"
                    : "border-line text-muted hover:border-faint hover:text-ink"
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={runNegotiation}
            disabled={running}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-btn bg-accent px-5 text-sm font-medium text-white transition-all hover:-translate-y-px hover:shadow-[0_10px_30px_-10px_rgba(47,107,240,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Brain size={16} weight="bold" />
            {running ? "Agents negotiating..." : "Run the negotiation"}
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

      {/* Agent panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AgentNegotiation
          ref={customerRef}
          role="customer"
          scenario={scenario}
          roundId={round?.round_id ?? null}
          onSealed={() => setSealedCount((c) => c + 1)}
        />
        <AgentNegotiation
          ref={vendorRef}
          role="vendor"
          scenario={scenario}
          roundId={round?.round_id ?? null}
          onSealed={() => setSealedCount((c) => c + 1)}
        />
      </div>

      {/* Matcher clears */}
      <MatcherPanel
        bothSealed={bothSealed}
        clearing={clearing}
        busy={busy === "clear"}
        onClear={() =>
          run("clear", async () => {
            if (!round) return;
            const c = await api.clear(round.round_id);
            setClearing(c);
            if (c.outcome === "DEAL") {
              toast.success("Cleared: DEAL", {
                description: `${formatMoney(c.price)}, drawn at random inside the band`,
              });
            } else {
              toast("Cleared: no deal", {
                description: "Floor sat above ceiling. No price is revealed.",
              });
            }
          })
        }
      />

      {/* Settlement (only on a DEAL) -- driven by the agents */}
      {clearing?.outcome === "DEAL" && (
        <SettlementBand
          price={clearing.price}
          proposed={proposed}
          customerAccepted={customerAccepted}
          settled={settled}
          busy={busy === "settle"}
          onSettle={runSettlement}
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

      {/* Adversarial probes -- available once both sides have sealed */}
      {round && bothSealed && (
        <AdversarialProbes
          roundId={round.round_id}
          canForceFail={clearing?.outcome === "DEAL"}
          onChange={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
