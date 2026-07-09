import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/site/Wordmark";
import { ControlRoom } from "@/components/demo/ControlRoom";

export const metadata: Metadata = {
  title: "HushRenewal - live clearing room",
  description:
    "Drive a full sealed-bid SaaS-renewal round against the Canton DevNet validator: seal two private prices, clear the overlap, settle atomically, and watch each party's on-ledger view stay blind to the other's number.",
};

export default function DemoPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
        <Container>
          <div className="flex h-[68px] items-center justify-between gap-6">
            <a href="/" aria-label="HushRenewal home">
              <Wordmark />
            </a>
            <a
              href="/"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Back to overview
            </a>
          </div>
        </Container>
      </header>

      <main>
        <Container className="py-8 sm:py-12">
          <div className="max-w-[62ch]">
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-accent-hi">
              Live on Canton DevNet
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Watch two agents negotiate
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Two autonomous agents negotiate a renewal in private. Each reasons
              over only its own brief, seals a single reservation price on Canton,
              and never sees the other&apos;s number. The matcher clears the
              overlap at a random in-band price and settles atomically -- every
              step a live transaction on the Seaport 5n-sandbox validator.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-faint">
              The customer and vendor agents run as separate services with
              separate context. Expand &ldquo;what this agent can see&rdquo; to
              confirm neither holds a single field from the other side, and use
              the adversarial probes to watch a peek get denied and a mismatched
              settlement revert -- live, from the ledger.
            </p>
          </div>

          <div className="mt-9">
            <ControlRoom />
          </div>
        </Container>
      </main>
    </div>
  );
}
