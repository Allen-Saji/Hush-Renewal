import { AbsoluteFill, interpolate } from "remotion";
import { MatcherPanel } from "@/components/demo/Panels";
import { StepRail } from "@/components/demo/StepRail";
import { MaskBars } from "@/components/ui/MaskBars";
import { formatMoney } from "@/lib/api";
import { Appear, useAfter, useBeat } from "../lib/Appear";
import { bandPosition, fixture } from "../lib/fixture";

/*
  The real MatcherPanel showing the captured DEAL, next to a band graphic
  that explains the mechanism: the price lands at a random point inside
  [floor, ceiling], and the bounds themselves stay masked.
*/
function Bound({
  leftPct,
  label,
  value,
  masked,
}: {
  leftPct: number;
  label: string;
  value: string;
  masked: boolean;
}) {
  return (
    <>
      <div
        className="absolute h-12 w-0.5 bg-faint"
        style={{ left: `${leftPct}%`, top: 96 }}
      />
      <div
        className="absolute w-48 -translate-x-1/2 text-center"
        style={{ left: `${leftPct}%`, top: 152 }}
      >
        <div className="text-sm text-faint">{label}</div>
        {masked ? (
          <div className="mt-2 flex justify-center">
            <MaskBars tone="ink" />
          </div>
        ) : (
          <div className="mt-1 font-mono text-lg text-muted">{formatMoney(value)}</div>
        )}
      </div>
    </>
  );
}

export function S4bClear() {
  const cleared = useAfter(1.0);
  const draw = useBeat(3.4, 2.0);
  const boundsMasked = useAfter(9.9);

  const left = 14;
  const right = 86;
  const px = left + (right - left) * bandPosition * draw;

  return (
    <AbsoluteFill className="bg-bg px-24 py-12 font-sans text-ink">
      <StepRail states={["done", "done", cleared ? "done" : "active", "pending"]} />

      <div className="grid flex-1 grid-cols-[560px_1fr] items-center gap-8">
        <Appear at={0.5} from="left">
          <div style={{ zoom: 1.12 }}>
            <MatcherPanel
              bothSealed
              clearing={cleared ? fixture.clearing : null}
              busy={!cleared}
              onClear={() => undefined}
            />
          </div>
        </Appear>

        <Appear at={2.8} from="right">
          <div className="rounded-card border border-line bg-surface p-10">
            <div className="text-[0.8rem] font-medium uppercase tracking-[0.14em] text-faint">
              Where the price landed
            </div>

            {/* Fixed-height stage; everything positioned from its top. */}
            <div className="relative mt-4 h-64">
              {/* price label above the dot */}
              <div
                className="absolute w-72 -translate-x-1/2 text-center"
                style={{ left: `${px}%`, top: 8, opacity: interpolate(draw, [0, 0.2], [0, 1]) }}
              >
                <div className="font-mono text-3xl font-semibold text-[color:var(--color-deal)]">
                  {formatMoney(fixture.clearing.price)}
                </div>
                <div className="mt-1 text-sm text-faint">random draw, in band</div>
              </div>
              {/* axis */}
              <div className="absolute left-0 right-0 h-px bg-line" style={{ top: 120 }} />
              {/* overlap band */}
              <div
                className="absolute h-4 rounded-full bg-accent-soft"
                style={{ left: `${left}%`, right: `${100 - right}%`, top: 114 }}
              />
              {/* price dot */}
              <div
                className="absolute h-5 w-5 -translate-x-1/2 rounded-full bg-[color:var(--color-deal)] shadow-[0_0_22px_rgba(52,211,153,0.9)]"
                style={{ left: `${px}%`, top: 111, opacity: interpolate(draw, [0, 0.15], [0, 1]) }}
              />
              <Bound
                leftPct={left}
                label="vendor floor"
                value={fixture.decisions.vendor.price}
                masked={boundsMasked}
              />
              <Bound
                leftPct={right}
                label="customer ceiling"
                value={fixture.decisions.customer.price}
                masked={boundsMasked}
              />
            </div>

            <p className="mt-2 text-lg leading-relaxed text-muted">
              The outcome reveals the deal price.
              {boundsMasked && (
                <span className="text-ink">
                  {" "}
                  The two bounds behind it never leave their sealed contracts.
                </span>
              )}
            </p>
          </div>
        </Appear>
      </div>
    </AbsoluteFill>
  );
}
