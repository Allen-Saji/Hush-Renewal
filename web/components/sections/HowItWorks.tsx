import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { SealedCrossing } from "@/components/sections/SealedCrossing";

const steps = [
  {
    n: "01",
    title: "Round",
    body: "The matcher opens a renewal round both parties can observe.",
  },
  {
    n: "02",
    title: "Seal",
    body: "Each side's agent computes one reservation price and submits it sealed.",
  },
  {
    n: "03",
    title: "Clear",
    body: "The matcher crosses the two. Floor at or below ceiling makes a deal.",
  },
  {
    n: "04",
    title: "Settle",
    body: "On a deal, payment and the renewed license settle in one transaction.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-line py-24 sm:py-28">
      <Container>
        <Reveal>
          <div className="max-w-[44ch]">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              How a sealed renewal clears.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Round, seal, clear, settle. Only the outcome is ever shared. Watch
              the intervals cross.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-12">
            <SealedCrossing />
          </div>
        </Reveal>

        <Stagger
          as="ol"
          className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((s) => (
            <StaggerItem as="li" key={s.n} className="bg-bg p-6">
              <span className="font-mono text-sm text-accent">{s.n}</span>
              <h3 className="mt-3 text-base font-medium text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {s.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
