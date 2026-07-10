"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "@phosphor-icons/react";
import {
  api,
  type ForceBadSettlementResult,
  type PeekResult,
} from "@/lib/api";
import { ForceSettleResultCard, PeekResultCard } from "./Probes.view";

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
        <PeekResultCard peek={peek} busy={busy === "peek"} onPeek={runPeek} />
        <ForceSettleResultCard
          force={force}
          busy={busy === "force"}
          canForceFail={canForceFail}
          onForce={runForce}
        />
      </div>
    </section>
  );
}
