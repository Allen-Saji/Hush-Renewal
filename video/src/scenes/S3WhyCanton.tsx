import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CheckCircle,
  Coins,
  EyeSlash,
  FileText,
  LockKey,
  XCircle,
} from "@phosphor-icons/react";
import { Appear, useBeat } from "../lib/Appear";

function PartyChip({ name, dim }: { name: string; dim?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-btn border px-3.5 py-2 text-base font-medium ${
        dim ? "border-line text-faint" : "border-accent/40 bg-accent-soft text-ink"
      }`}
    >
      {dim && <EyeSlash size={16} weight="bold" className="text-[color:var(--color-nodeal)]" />}
      {name}
    </span>
  );
}

/* Beat 1: a SealedBid is a Daml contract; the vendor is not a stakeholder. */
function Visibility() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="rounded-btn border border-line bg-bg/50 px-5 py-3 font-mono text-base text-muted">
        SealedBid {"{"} maxPrice: <span className="text-ink">sealed</span> {"}"}
      </div>
      <div className="flex items-center gap-3">
        <PartyChip name="Customer" />
        <PartyChip name="Matcher" />
        <PartyChip name="Vendor" dim />
      </div>
      <p className="max-w-md text-center text-base leading-snug text-muted">
        Visibility comes from the contract&apos;s signatories and observers.
        The vendor isn&apos;t one, so for the vendor the contract does not exist.
      </p>
    </div>
  );
}

/* Beat 2: random draw inside the overlap; midpoint crossed out. */
function RandomBand({ at }: { at: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = useBeat(at + 0.8, 1.2);
  const dotX = interpolate(draw, [0, 1], [4, 20]); // % along the band, lands off-midpoint
  const crossed = frame >= (at + 3.2) * fps;

  return (
    <div className="flex w-full flex-col items-center gap-12">
      <div className="relative h-16 w-full max-w-xl">
        {/* axis */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-line" />
        {/* overlap band */}
        <div className="absolute left-[25%] right-[25%] top-1/2 h-3 -translate-y-1/2 rounded-full bg-accent-soft" />
        {/* floor + ceiling ticks */}
        <div className="absolute left-[25%] top-1/2 h-8 w-0.5 -translate-y-1/2 bg-faint" />
        <div className="absolute right-[25%] top-1/2 h-8 w-0.5 -translate-y-1/2 bg-faint" />
        <span className="absolute left-[25%] top-full -translate-x-1/2 pt-1 text-sm text-faint">
          floor
        </span>
        <span className="absolute right-[25%] top-full translate-x-1/2 pt-1 text-sm text-faint">
          ceiling
        </span>
        {/* midpoint, crossed out */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <XCircle
            size={26}
            weight="fill"
            className={crossed ? "text-[color:var(--color-nodeal)]" : "text-transparent"}
          />
        </div>
        {/* random price dot */}
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[color:var(--color-deal)] shadow-[0_0_18px_rgba(52,211,153,0.8)]"
          style={{ left: `calc(25% + ${dotX}% * 0.5)`, opacity: draw }}
        />
      </div>
      <p className="max-w-md text-center text-base leading-snug text-muted">
        The clearing price is a random draw inside the overlap.
        The midpoint would let either side solve for the other&apos;s number.
      </p>
    </div>
  );
}

/* Beat 3: license and cash move together or not at all. */
function AtomicDvP() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-2 rounded-btn border border-line bg-surface-2 px-4 py-2.5 text-base text-ink">
          <FileText size={20} weight="bold" className="text-accent" /> License
        </span>
        <LockKey size={24} weight="fill" className="text-accent" />
        <span className="inline-flex items-center gap-2 rounded-btn border border-line bg-surface-2 px-4 py-2.5 text-base text-ink">
          <Coins size={20} weight="bold" className="text-accent" /> Cash
        </span>
      </div>
      <p className="max-w-md text-center text-base leading-snug text-muted">
        One transaction settles both legs. There is no paid-but-not-renewed state.
      </p>
    </div>
  );
}

export function S3WhyCanton() {
  return (
    <AbsoluteFill className="bg-bg px-24 py-16 font-sans text-ink">
      <Appear at={0.3}>
        <h1 className="text-center text-4xl font-bold tracking-tight">Why Canton</h1>
      </Appear>

      <div className="mt-10 grid flex-1 grid-cols-3 gap-6">
        {[
          {
            at: 1.2,
            title: "Privacy by signatories, not policy",
            body: <Visibility />,
          },
          { at: 10.0, title: "Random in-band clearing", body: <RandomBand at={10.0} /> },
          { at: 16.5, title: "Atomic delivery-versus-payment", body: <AtomicDvP /> },
        ].map((card, i) => (
          <Appear key={card.title} at={card.at} className="h-full">
            <div className="flex h-full flex-col gap-6 rounded-card border border-line bg-surface p-7">
              <div className="flex items-center gap-2.5">
                <CheckCircle
                  size={22}
                  weight="fill"
                  className="text-[color:var(--color-deal)]"
                />
                <h2 className="text-xl font-semibold">{card.title}</h2>
              </div>
              <div className="flex flex-1 items-center justify-center">{card.body}</div>
              <div className="text-center font-mono text-sm text-faint">{i + 1} / 3</div>
            </div>
          </Appear>
        ))}
      </div>
    </AbsoluteFill>
  );
}
