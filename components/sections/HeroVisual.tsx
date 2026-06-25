"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { LockSimple, ArrowDown } from "@phosphor-icons/react";
import { MaskBars } from "@/components/ui/MaskBars";

function Tile({ role, label }: { role: string; label: string }) {
  return (
    <div className="flex-1 rounded-[12px] border border-line bg-surface-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-faint">{role}</span>
        <LockSimple size={14} className="text-faint" weight="bold" />
      </div>
      <div className="mt-4 flex items-center gap-2 font-mono text-ink">
        <span className="text-sm text-muted">$</span>
        <MaskBars />
      </div>
      <div className="mt-1 text-[0.7rem] text-faint">{label}</div>
    </div>
  );
}

export function HeroVisual() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: 0.15 },
    },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative w-full max-w-[420px] rounded-card border border-line bg-surface p-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]"
    >
      <motion.div
        variants={item}
        className="mb-4 flex items-center justify-between"
      >
        <span className="text-sm font-medium text-ink">Renewal round</span>
        <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[0.7rem] text-muted">
          Sealed
        </span>
      </motion.div>

      <motion.div variants={item} className="flex gap-3">
        <Tile role="Customer ceiling" label="hidden from vendor" />
        <Tile role="Vendor floor" label="hidden from customer" />
      </motion.div>

      <motion.div
        variants={item}
        className="my-3 flex items-center justify-center text-faint"
      >
        <ArrowDown size={16} weight="bold" />
      </motion.div>

      <motion.div
        variants={item}
        className="rounded-[12px] border border-line bg-surface-2 p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-faint">Matcher clears the overlap</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
            style={{
              background: "color-mix(in oklab, var(--color-deal) 16%, transparent)",
              color: "var(--color-deal)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-deal" />
            Deal
          </span>
          <span className="font-mono text-sm text-ink">price in band</span>
        </div>
      </motion.div>

      <motion.p variants={item} className="mt-4 text-[0.78rem] leading-relaxed text-faint">
        Neither side ever sees the other&apos;s number. Only the outcome is shared.
      </motion.p>
    </motion.div>
  );
}
