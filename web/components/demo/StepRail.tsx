"use client";

import { CheckCircle } from "@phosphor-icons/react";

export const STEPS = ["Open round", "Agents negotiate", "Clear", "Settle"] as const;

export type StepState = "done" | "active" | "pending";

export function StepRail({ states }: { states: StepState[] }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto rounded-card border border-line bg-surface px-4 py-3 text-sm">
      {STEPS.map((label, i) => {
        const s = states[i] ?? "pending";
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
  );
}
