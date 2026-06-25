"use client";

import { motion, useReducedMotion } from "motion/react";

/* Sealed-value glyph: a number you can see exists but cannot read. A slow,
   low-amplitude shimmer reads as live data held under seal, not a static icon.
   Reduced-motion renders the bars still. */
export function MaskBars({
  tone = "faint",
  heights = [10, 14, 9, 13, 11],
}: {
  tone?: "faint" | "ink";
  heights?: number[];
}) {
  const reduce = useReducedMotion();
  const color = tone === "ink" ? "bg-ink/70" : "bg-faint/70";

  return (
    <span className="inline-flex items-end gap-[3px]" aria-label="sealed value">
      {heights.map((h, i) => (
        <motion.span
          key={i}
          style={{ height: h, transformOrigin: "bottom" }}
          className={`w-[5px] rounded-[2px] ${color}`}
          animate={reduce ? undefined : { scaleY: [1, 0.6, 1], opacity: [0.85, 0.5, 0.85] }}
          transition={
            reduce
              ? undefined
              : { duration: 1.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.16 }
          }
        />
      ))}
    </span>
  );
}
