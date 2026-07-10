import { AbsoluteFill } from "remotion";
import { AgentPanelView, type Phase } from "@/components/demo/AgentPanel.view";
import { StepRail } from "@/components/demo/StepRail";
import { Dot } from "@/components/demo/ui";
import { Appear, useAfter } from "../lib/Appear";
import { useTypewriter } from "../lib/Typewriter";
import { fixture } from "../lib/fixture";

/*
  Replays the captured round through the production panels: the real
  reasoning text typewrites frame-by-frame, then both panels flip to the
  sealed state with the real prices and contract ids.
*/
const REASONING_START = 3.2;
const REASONING_END = 7.6;
const DECIDED_AT = 7.9;
const SEALED_AT = 8.8;

function panel(role: "customer" | "vendor", reasoning: string, phase: Phase) {
  return (
    <AgentPanelView
      role={role}
      brief={fixture.briefs[role]}
      showBrief={false}
      phase={phase}
      reasoning={reasoning}
      decision={phase === "decided" || phase === "sealed" ? fixture.decisions[role] : null}
      sealedCid={phase === "sealed" ? fixture.sealedCids[role] : null}
      error={null}
      blinkCaret={false}
      reasoningAnchor="bottom"
    />
  );
}

export function S4aNegotiate() {
  const customerText = useTypewriter({
    text: fixture.reasoning.customer,
    at: REASONING_START,
    endAt: REASONING_END,
  });
  const vendorText = useTypewriter({
    text: fixture.reasoning.vendor,
    at: REASONING_START + 0.4,
    endAt: REASONING_END + 0.4,
  });

  const decided = useAfter(DECIDED_AT);
  const sealed = useAfter(SEALED_AT);
  const phase: Phase = sealed ? "sealed" : decided ? "decided" : "reasoning";

  return (
    <AbsoluteFill className="bg-bg px-24 py-12 font-sans text-ink">
      <Appear at={0.2}>
        <StepRail states={["done", sealed ? "done" : "active", "pending", "pending"]} />
      </Appear>

      <Appear at={0.9} className="mt-4">
        <div className="flex items-center justify-between rounded-card border border-line bg-surface px-6 py-4">
          <div>
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-faint">
              Renewal round
            </div>
            <div className="mt-1 text-lg font-semibold">{fixture.round.subscription}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted">{fixture.round.round_id}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-muted">
              <Dot tone="deal" /> Canton DevNet
            </span>
          </div>
        </div>
      </Appear>

      <div className="mt-5 grid flex-1 grid-cols-2 items-start gap-8">
        <Appear at={2.2} from="left">
          <div style={{ zoom: 1.14 }}>{panel("customer", customerText, phase)}</div>
        </Appear>
        <Appear at={2.5} from="right">
          <div style={{ zoom: 1.14 }}>{panel("vendor", vendorText, phase)}</div>
        </Appear>
      </div>
    </AbsoluteFill>
  );
}
