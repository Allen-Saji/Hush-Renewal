"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useInView,
} from "motion/react";
import { LockSimple, ArrowClockwise } from "@phosphor-icons/react";
import { MaskBars } from "@/components/ui/MaskBars";

type Scenario = "deal" | "nodeal";

// Illustrative positions on a conceptual price axis (low -> high). No values
// are shown; the inputs stay sealed. Only the overlap geometry is visualized.
const POS: Record<Scenario, { floor: number; ceiling: number; clear: number }> = {
  deal: { floor: 37, ceiling: 67, clear: 53 },
  nodeal: { floor: 63, ceiling: 41, clear: 0 },
};

const STAGES = ["Round", "Seal", "Clear", "Settle"] as const;

const CAPTIONS: Record<Scenario, string[]> = {
  deal: [
    "A renewal round opens. Both sides can see it exists.",
    "Each agent submits one sealed price. The matcher is the only observer.",
    "The matcher crosses the two intervals.",
    "Floor sits at or below the ceiling. Cleared at a point inside the overlap, then settled.",
  ],
  nodeal: [
    "A renewal round opens. Both sides can see it exists.",
    "Each agent submits one sealed price. The matcher is the only observer.",
    "The matcher crosses the two intervals.",
    "Floor sits above the ceiling. No deal, and no number is revealed.",
  ],
};

function SealedTile({ role, submitted }: { role: string; submitted: boolean }) {
  return (
    <div className="flex-1 rounded-[12px] border border-line bg-surface-2 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-faint">{role}</span>
        <span
          className={`transition-colors ${submitted ? "text-accent" : "text-faint"}`}
        >
          <LockSimple size={14} weight="bold" />
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-sm text-muted">$</span>
        <MaskBars tone={submitted ? "ink" : "faint"} />
      </div>
    </div>
  );
}

export function SealedCrossing() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });

  const [scenario, setScenario] = useState<Scenario>("deal");
  const [step, setStep] = useState(0);
  const [playId, setPlayId] = useState(0);

  useEffect(() => {
    if (inView) setPlayId((p) => p + 1);
  }, [inView]);

  useEffect(() => {
    if (playId === 0) return;
    if (reduce) {
      setStep(3);
      return;
    }
    setStep(0);
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1150),
      setTimeout(() => setStep(3), 2050),
    ];
    return () => timers.forEach(clearTimeout);
  }, [playId, scenario, reduce]);

  const pos = POS[scenario];
  const isDeal = scenario === "deal";
  const crossing = step >= 2;
  const result = step >= 3;
  const activeStage = step === 3 ? (isDeal ? 3 : 2) : step;

  const replay = (next?: Scenario) => {
    if (next && next !== scenario) setScenario(next);
    setPlayId((p) => p + 1);
  };

  return (
    <div
      ref={ref}
      className="rounded-card border border-line bg-surface p-5 sm:p-8"
    >
      {/* Stage strip */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {STAGES.map((s, i) => {
          const active = i <= activeStage;
          const isCurrent = i === activeStage;
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? "border-accent/40 bg-accent-soft text-ink"
                    : "border-line text-faint"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    isCurrent ? "bg-accent" : active ? "bg-accent/50" : "bg-faint/50"
                  }`}
                />
                {s}
              </span>
              {i < STAGES.length - 1 && (
                <span className="hidden h-px w-5 bg-line sm:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* Sealed inputs */}
      <div className="mt-7 flex gap-3">
        <SealedTile role="Customer ceiling" submitted={step >= 1} />
        <SealedTile role="Vendor floor" submitted={step >= 1} />
      </div>

      {/* The interval-overlap axis */}
      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between text-[0.7rem] text-faint">
          <span>lower price</span>
          <span>higher price</span>
        </div>

        <div className="relative h-12">
          {/* base axis */}
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-surface-2" />

          {/* customer acceptable region: 0 -> ceiling */}
          <motion.div
            className="absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-l-full bg-ink/10"
            initial={{ width: 0 }}
            animate={{ width: crossing ? `${pos.ceiling}%` : 0 }}
            transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* vendor acceptable region: floor -> 100 */}
          <motion.div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-r-full bg-ink/10"
            style={{ left: `${pos.floor}%` }}
            initial={{ width: 0 }}
            animate={{ width: crossing ? `${100 - pos.floor}%` : 0 }}
            transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* overlap region (deal only) */}
          {isDeal && (
            <motion.div
              className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
              style={{
                left: `${pos.floor}%`,
                background:
                  "color-mix(in oklab, var(--color-accent) 55%, transparent)",
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: result ? `${pos.ceiling - pos.floor}%` : 0,
                opacity: result ? 1 : 0,
              }}
              transition={{ duration: reduce ? 0 : 0.5, ease: "easeOut" }}
            />
          )}

          {/* markers */}
          {crossing && (
            <>
              <Marker x={pos.floor} label="floor" tone="vendor" />
              <Marker x={pos.ceiling} label="ceiling" tone="customer" />
            </>
          )}

          {/* clearing point (deal) */}
          {isDeal && result && (
            <motion.div
              className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.clear}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
            >
              <span className="block h-3.5 w-3.5 rounded-full bg-deal ring-4 ring-[color-mix(in_oklab,var(--color-deal)_22%,transparent)]" />
            </motion.div>
          )}

          {/* no-overlap gap (nodeal) */}
          {!isDeal && result && (
            <div
              className="absolute top-1/2 flex -translate-y-1/2 items-center justify-center"
              style={{ left: `${pos.ceiling}%`, width: `${pos.floor - pos.ceiling}%` }}
            >
              <span className="h-px w-full border-t border-dashed border-nodeal/60" />
            </div>
          )}
        </div>
      </div>

      {/* Outcome + caption */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-[2.5rem] max-w-[42ch] text-sm leading-relaxed text-muted">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${scenario}-${step}`}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {CAPTIONS[scenario][step]}
            </motion.p>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {result && (
            <motion.span
              initial={reduce ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-sm font-medium"
              style={{
                background: isDeal
                  ? "color-mix(in oklab, var(--color-deal) 15%, transparent)"
                  : "color-mix(in oklab, var(--color-nodeal) 15%, transparent)",
                color: isDeal ? "var(--color-deal)" : "var(--color-nodeal)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: isDeal ? "var(--color-deal)" : "var(--color-nodeal)" }}
              />
              {isDeal ? "Deal, price in band" : "No deal, nothing revealed"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="inline-flex rounded-btn border border-line p-1">
          <button
            type="button"
            onClick={() => replay("deal")}
            className={`rounded-[7px] px-3 py-1.5 text-xs font-medium transition-colors ${
              isDeal ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
            }`}
          >
            Overlap
          </button>
          <button
            type="button"
            onClick={() => replay("nodeal")}
            className={`rounded-[7px] px-3 py-1.5 text-xs font-medium transition-colors ${
              !isDeal ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
            }`}
          >
            No overlap
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[0.7rem] uppercase tracking-[0.12em] text-faint">
            Illustrative
          </span>
          <button
            type="button"
            onClick={() => replay()}
            className="inline-flex items-center gap-2 rounded-btn border border-line px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-faint hover:text-ink"
          >
            <ArrowClockwise size={14} weight="bold" />
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}

function Marker({
  x,
  label,
  tone,
}: {
  x: number;
  label: string;
  tone: "vendor" | "customer";
}) {
  return (
    <div
      className="absolute top-0 z-[5] flex -translate-x-1/2 flex-col items-center"
      style={{ left: `${x}%` }}
    >
      <span className="h-12 w-px bg-faint/50" />
      <span className="absolute -bottom-5 whitespace-nowrap text-[0.65rem] text-faint">
        {label}
      </span>
    </div>
  );
}
