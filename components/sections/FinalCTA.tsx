import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section id="spec" className="py-24 sm:py-32">
      <Container>
        <Reveal>
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="max-w-[16ch] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                See a renewal clear without a leak.
              </h2>
              <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted">
                Walk the sealed-bid flow, then read how the privacy invariant
                holds on Canton. The full product spec is available on request.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
              <Button href="#how">See it clear</Button>
              <Button href="#trust" variant="ghost">
                Read the spec
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
