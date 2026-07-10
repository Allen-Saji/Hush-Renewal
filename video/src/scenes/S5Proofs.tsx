import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { ShieldCheck } from "@phosphor-icons/react";
import { ForceSettleResultCard, PeekResultCard } from "@/components/demo/Probes.view";
import { Appear } from "../lib/Appear";
import { BrowserChrome } from "../lib/BrowserChrome";
import { fixture } from "../lib/fixture";

/*
  The captured adversarial probes (peek denied; mismatched settlement
  reverted by a real Daml assertion) plus the recorded live matcher
  active-contracts query against production -- the on-chain proof the
  hackathon checklist asks for.
*/
export function S5Proofs() {
  return (
    <AbsoluteFill className="bg-bg px-20 py-12 font-sans text-ink">
      <Appear at={0.2}>
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={26} weight="bold" className="text-accent" />
          <h1 className="text-3xl font-bold tracking-tight">
            Don&apos;t take the privacy on faith
          </h1>
        </div>
      </Appear>

      <div className="mt-6 grid flex-1 grid-cols-[640px_1fr] items-center gap-8">
        <div className="flex flex-col gap-5">
          <Appear at={0.9} from="left">
            <div style={{ zoom: 1.04 }}>
              <PeekResultCard peek={fixture.peek} busy={false} />
            </div>
          </Appear>
          <Appear at={4.8} from="left">
            <div style={{ zoom: 1.04 }}>
              <ForceSettleResultCard
                force={fixture.force}
                busy={false}
                canForceFail
              />
            </div>
          </Appear>
        </div>

        <Appear at={9.2} from="right">
          <div>
            <BrowserChrome url="hushrenewal.allensaji.dev/demo -- matcher active-contracts query, live">
              <OffthreadVideo
                muted
                src={staticFile("clips/live-proof.mp4")}
                startFrom={150}
                style={{ width: "100%", display: "block" }}
              />
            </BrowserChrome>
            <p className="mt-3 text-center text-sm text-faint">
              Recorded against the live Seaport validator, not a mock.
            </p>
          </div>
        </Appear>
      </div>
    </AbsoluteFill>
  );
}
