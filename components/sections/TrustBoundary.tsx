import Image from "next/image";
import { Check, Minus } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

const guarantees = [
  "Your counterparty never sees your number.",
  "Only the outcome is shared, as a tamper-evident record.",
  "The matching logic is auditable Daml, not a black box.",
  "Money and license settle atomically, or not at all.",
];

const notYet = [
  "The matcher's participant does see both raw inputs.",
  "Zero-knowledge clearing, where no one sees the numbers, is future work.",
  "Cash and license are modeled tokens, not real tokenized assets.",
];

export function TrustBoundary() {
  return (
    <section id="trust" className="border-b border-line py-24 sm:py-28">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <h2 className="max-w-[20ch] text-3xl font-semibold tracking-tight sm:text-4xl">
                We tell you exactly who sees what.
              </h2>
              <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-muted">
                The matcher computes the cross, so its participant sees both raw
                numbers. We do not hide that. Counterparty blindness is real and
                ledger-enforced; hiding inputs from the matcher itself is the
                next step, not a claim we make today.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <Reveal delay={0.05}>
                <h3 className="text-sm font-medium text-ink">
                  What HushRenewal guarantees
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {guarantees.map((g) => (
                    <li key={g} className="flex gap-3 text-sm leading-relaxed text-muted">
                      <Check
                        size={18}
                        weight="bold"
                        className="mt-0.5 shrink-0 text-deal"
                      />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.1}>
                <h3 className="text-sm font-medium text-ink">
                  What it does not claim yet
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {notYet.map((n) => (
                    <li key={n} className="flex gap-3 text-sm leading-relaxed text-faint">
                      <Minus
                        size={18}
                        weight="bold"
                        className="mt-0.5 shrink-0 text-faint"
                      />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.08} className="lg:col-span-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card border border-line">
              <Image
                src="/trust.webp"
                alt="Two machined metal halves interlocking along a seam lit in blue, standing for the trust boundary"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover opacity-[0.92]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
