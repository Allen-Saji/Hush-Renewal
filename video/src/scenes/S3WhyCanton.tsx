import { AbsoluteFill } from "remotion";
import {
  CheckCircle,
  Coins,
  EyeSlash,
  FileText,
  LockKey,
  XCircle,
} from "@phosphor-icons/react";
import { Appear } from "../lib/Appear";

/*
  Why we build on Canton: the three chain features HushRenewal exploits,
  in narration order -- native signatory/observer privacy, multi-party
  atomic transactions, and on-chain assertions.
*/
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

/* Feature 1: visibility is defined per contract by signatories/observers. */
function NativePrivacy() {
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
        Every contract is distributed only to its signatories and observers.
        For the vendor, the sealed bid does not exist -- that&apos;s the ledger,
        not app policy.
      </p>
    </div>
  );
}

/* Feature 2: one transaction moves both legs, each party authorizes its own. */
function AtomicAcrossParties() {
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
        One transaction settles both legs, and each party authorizes only its
        own. Delivery-versus-payment without escrow tricks -- there is no
        paid-but-not-renewed state.
      </p>
    </div>
  );
}

/* Feature 3: the app's invariants execute on the ledger itself. */
function OnChainAssertions() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="rounded-btn border border-line bg-bg/50 px-5 py-3 font-mono text-base text-muted">
        assert floor {"<="} price {"<="} ceiling
      </div>
      <div className="flex items-center gap-2 text-base">
        <XCircle size={20} weight="fill" className="text-[color:var(--color-nodeal)]" />
        <span className="font-mono text-muted">out-of-band price</span>
        <span className="text-faint">-&gt;</span>
        <span className="text-[color:var(--color-nodeal)]">rejected</span>
      </div>
      <p className="max-w-md text-center text-base leading-snug text-muted">
        The band check is part of the Daml choice, so not even the matcher can
        clear outside the sealed bounds. The ledger rejects it.
      </p>
    </div>
  );
}

export function S3WhyCanton() {
  return (
    <AbsoluteFill className="bg-bg px-24 py-16 font-sans text-ink">
      <Appear at={0.3}>
        <h1 className="text-center text-4xl font-bold tracking-tight">
          Why build on Canton
        </h1>
      </Appear>

      <div className="mt-10 grid flex-1 grid-cols-3 gap-6">
        {[
          { at: 1.2, title: "Privacy native to the ledger", body: <NativePrivacy /> },
          { at: 12.5, title: "Atomic across parties", body: <AtomicAcrossParties /> },
          { at: 19.4, title: "Assertions run on-chain", body: <OnChainAssertions /> },
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
