import { AbsoluteFill } from "remotion";
import { SettlementBand } from "@/components/demo/SettlementBand";
import { StepRail } from "@/components/demo/StepRail";
import { Appear, useAfter } from "../lib/Appear";
import { customerAccept, fixture, settled } from "../lib/fixture";

/*
  The real SettlementBand stepping through the captured settlement:
  matcher proposes, customer agent escrows, vendor agent accepts ->
  atomic DvP with the real contract ids.
*/
export function S4cSettle() {
  const proposed = useAfter(1.6);
  const accepted = useAfter(4.0);
  const done = useAfter(6.8);

  return (
    <AbsoluteFill className="bg-bg px-24 py-12 font-sans text-ink">
      <StepRail states={["done", "done", "done", done ? "done" : "active"]} />

      <div className="flex flex-1 flex-col justify-center gap-10">
        <Appear at={0.4} className="w-full">
          <div style={{ zoom: 1.22 }}>
            <SettlementBand
              price={fixture.clearing.price}
              proposed={proposed}
              customerAccepted={accepted ? customerAccept : null}
              settled={done ? settled : null}
              busy={!done}
              onSettle={() => undefined}
            />
          </div>
        </Appear>

        <Appear at={7.6}>
          <p className="text-center text-xl text-muted">
            Both agents authorized their own leg. One transaction moved the license and
            the cash.
          </p>
        </Appear>
      </div>
    </AbsoluteFill>
  );
}
