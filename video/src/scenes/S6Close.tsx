import { AbsoluteFill, Img, staticFile } from "remotion";
import { CheckCircle, Info } from "@phosphor-icons/react";
import { Appear } from "../lib/Appear";
import { fixture } from "../lib/fixture";

const shortParty = (p: string) => p.split("::")[0];

export function S6Close() {
  return (
    <AbsoluteFill className="bg-bg items-center justify-center px-28 font-sans text-ink">
      <div className="flex w-full max-w-5xl flex-col items-center gap-8">
        <Appear at={0.3} className="flex flex-col items-center gap-4">
          <Img src={staticFile("logo.svg")} style={{ height: 72 }} />
          <h1 className="text-5xl font-bold tracking-tight">HushRenewal</h1>
          <p className="text-xl text-muted">
            Sealed-bid SaaS renewals, live on Canton
          </p>
        </Appear>

        <Appear at={1.6} className="w-full">
          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-card border border-line bg-surface p-6">
              <div className="flex items-center gap-2 text-base font-semibold">
                <CheckCircle size={20} weight="fill" className="text-[color:var(--color-deal)]" />
                What&apos;s real
              </div>
              <ul className="mt-3 space-y-1.5 text-base text-muted">
                <li>Canton DevNet ledger, every step a live transaction</li>
                <li>Daml signatory privacy, probed adversarially</li>
                <li>Atomic delivery-versus-payment settlement</li>
              </ul>
            </div>
            <div className="rounded-card border border-line bg-surface p-6">
              <div className="flex items-center gap-2 text-base font-semibold">
                <Info size={20} weight="fill" className="text-accent" />
                What&apos;s synthetic
              </div>
              <ul className="mt-3 space-y-1.5 text-base text-muted">
                <li>The SaaS renewal briefs (demo data)</li>
                <li>The cash token used for settlement</li>
              </ul>
            </div>
          </div>
        </Appear>

        <Appear at={3.6} className="w-full">
          <div className="rounded-card border border-line bg-surface px-6 py-5 font-mono text-sm text-muted">
            <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-1.5">
              <span className="text-faint">package</span>
              <span className="break-all">{fixture.ids.packageId}</span>
              <span className="text-faint">parties</span>
              <span>
                {shortParty(fixture.ids.matcher)} - {shortParty(fixture.ids.customer)} -{" "}
                {shortParty(fixture.ids.vendor)}
              </span>
              <span className="text-faint">round</span>
              <span>
                {fixture.round.round_id} - DEAL - license{" "}
                {fixture.settlement.vendor.result.license_contract_id.slice(0, 10)}...
              </span>
            </div>
          </div>
        </Appear>

        <Appear at={5.6}>
          <div className="rounded-btn bg-accent px-6 py-3 text-lg font-medium text-white">
            hushrenewal.allensaji.dev
          </div>
        </Appear>
      </div>
    </AbsoluteFill>
  );
}
