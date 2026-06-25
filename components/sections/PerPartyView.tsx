"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Eye, LockSimple } from "@phosphor-icons/react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { MaskBars } from "@/components/ui/MaskBars";

type View = "customer" | "vendor" | "matcher" | "both";

const views: { id: View; label: string }[] = [
  { id: "customer", label: "Customer" },
  { id: "vendor", label: "Vendor" },
  { id: "matcher", label: "Matcher" },
  { id: "both", label: "Both parties" },
];

const notes: Record<View, string> = {
  customer:
    "You see your own ceiling and the outcome. The vendor's floor never reaches your participant.",
  vendor:
    "You see your own floor and the outcome. The customer's ceiling never reaches your participant.",
  matcher:
    "The matcher computes the cross, so it sees both raw numbers. This is the honest trust boundary.",
  both: "Across both negotiating parties, the only shared fact is the outcome.",
};

function visibility(view: View) {
  return {
    ceiling: view === "customer" || view === "matcher",
    floor: view === "vendor" || view === "matcher",
    outcome: true,
  };
}

function FieldRow({
  label,
  owner,
  visible,
}: {
  label: string;
  owner: string;
  visible: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-xs text-faint">{owner}</div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={visible ? "v" : "h"}
          initial={reduce ? false : { opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -6 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3"
        >
          {visible ? (
            <>
              <MaskBars tone="ink" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-xs text-ink">
                <Eye size={13} weight="bold" /> Visible
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-faint">
              <LockSimple size={13} weight="bold" /> Hidden
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function PerPartyView() {
  const [view, setView] = useState<View>("customer");
  const vis = visibility(view);

  return (
    <section id="privacy" className="border-b border-line py-24 sm:py-28">
      <Container>
        <Reveal>
          <div className="max-w-[48ch]">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Each party sees only its own side.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              It is enforced by the ledger, not by a policy. A party&apos;s view
              cannot contain a field it is not a stakeholder of. Switch
              perspective and watch the other number disappear.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="mt-9 flex flex-wrap gap-2">
            {views.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`rounded-btn border px-4 py-2 text-sm font-medium transition-colors ${
                  view === v.id
                    ? "border-accent/50 bg-accent-soft text-ink"
                    : "border-line text-muted hover:border-faint hover:text-ink"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-6 max-w-3xl">
            <div className="overflow-hidden rounded-card border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <span className="text-sm font-medium text-ink">
                  Viewing as {views.find((v) => v.id === view)?.label}
                </span>
                <span className="text-xs text-faint">Projection</span>
              </div>

              <div className="divide-y divide-line">
                <FieldRow
                  label="Customer ceiling"
                  owner="owned by customer"
                  visible={vis.ceiling}
                />
                <FieldRow
                  label="Vendor floor"
                  owner="owned by vendor"
                  visible={vis.floor}
                />
                <FieldRow
                  label="Outcome"
                  owner="deal or no-deal"
                  visible={vis.outcome}
                />
              </div>

              <div className="border-t border-line bg-surface-2 px-5 py-4">
                <p className="text-sm leading-relaxed text-muted">
                  {notes[view]}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
