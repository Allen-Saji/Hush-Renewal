import { AbsoluteFill } from "remotion";
import { ArrowRight, LockKey, Scales } from "@phosphor-icons/react";
import { AgentPanelView } from "@/components/demo/AgentPanel.view";
import { MaskBars } from "@/components/ui/MaskBars";
import { Appear } from "../lib/Appear";
import { fixture } from "../lib/fixture";

/*
  The two production agent panels, idle, with their real private briefs
  expanded -- visibly disjoint -- and the matcher in the middle as the only
  party that ever sees both sealed numbers.
*/
export function S2Build() {
  return (
    <AbsoluteFill className="bg-bg justify-center px-20 py-14 font-sans text-ink">
      <Appear at={0.4}>
        <h1 className="text-center text-4xl font-bold tracking-tight">
          A sealed-bid clearing between two agents
        </h1>
      </Appear>

      <div className="mt-10 grid grid-cols-[1fr_300px_1fr] items-start gap-6">
        <Appear at={1.8} from="left">
          <div style={{ zoom: 0.92 }}>
            <AgentPanelView
              role="customer"
              brief={fixture.briefs.customer}
              showBrief
              phase="idle"
              reasoning=""
              decision={null}
              sealedCid={null}
              error={null}
              blinkCaret={false}
            />
          </div>
        </Appear>

        <div className="flex flex-col items-center gap-5 pt-24">
          <Appear at={10.8} from="none">
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent-soft px-4 py-2 text-sm font-medium text-ink">
                <LockKey size={16} weight="bold" className="text-accent" />
                one sealed number each
              </span>
              <MaskBars tone="ink" />
            </div>
          </Appear>
          <Appear at={13.8} from="none">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-faint">
                <ArrowRight size={20} weight="bold" />
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-btn border border-line bg-surface-2 text-accent">
                  <Scales size={24} weight="bold" />
                </span>
                <ArrowRight size={20} weight="bold" className="-scale-x-100" />
              </div>
              <div className="text-center text-sm leading-snug text-muted">
                only the neutral <span className="font-semibold text-ink">matcher</span>
                <br />
                sees both
              </div>
            </div>
          </Appear>
        </div>

        <Appear at={2.6} from="right">
          <div style={{ zoom: 0.92 }}>
            <AgentPanelView
              role="vendor"
              brief={fixture.briefs.vendor}
              showBrief
              phase="idle"
              reasoning=""
              decision={null}
              sealedCid={null}
              error={null}
              blinkCaret={false}
            />
          </div>
        </Appear>
      </div>
    </AbsoluteFill>
  );
}
