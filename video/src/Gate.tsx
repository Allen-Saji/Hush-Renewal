import { AbsoluteFill } from "remotion";
import { MotionConfig } from "motion/react";
import { MatcherPanel } from "@/components/demo/Panels";
import { AgentPanelView } from "@/components/demo/AgentPanel.view";
import { StepRail } from "@/components/demo/StepRail";

// Throwaway gate composition: proves Tailwind @source scanning, @theme tokens,
// Geist @font-face, and the react/motion singleton aliases all work with the
// real web components before any scene is built.
export function Gate() {
  return (
    <MotionConfig reducedMotion="always">
      <AbsoluteFill className="bg-bg p-16 font-sans text-ink">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <StepRail states={["done", "done", "active", "pending"]} />
          <AgentPanelView
            role="customer"
            brief={{ current_price: "84000", budget_policy: "hold to +10%" }}
            showBrief
            phase="sealed"
            reasoning="Comparable quotes put the market at 88-95k. Switching cost is real but bounded..."
            decision={{
              price: "92000.00",
              confidence: 0.82,
              rationale: "Ceiling set below the switching-cost breakeven.",
            }}
            sealedCid="00aabbccddeeff00112233445566778899aabbccddeeff0011223344556677"
            error={null}
            blinkCaret={false}
          />
          <MatcherPanel
            bothSealed
            clearing={{ contract_id: "00ff", outcome: "DEAL", price: "80763.17" }}
            busy={false}
            onClear={() => undefined}
          />
        </div>
      </AbsoluteFill>
    </MotionConfig>
  );
}
