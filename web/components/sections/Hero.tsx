import { Container } from "@/components/ui/Container";
import { HeroCopy } from "@/components/sections/HeroCopy";
import { HeroVisual } from "@/components/sections/HeroVisual";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-line"
    >
      {/* restrained cool wash, not a glow blob: very low opacity, neutral-cool */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60"
        style={{
          background:
            "radial-gradient(60% 80% at 75% 0%, var(--color-accent-soft) 0%, transparent 70%)",
        }}
      />

      <Container className="relative">
        <div className="grid min-h-[calc(100dvh-68px)] grid-cols-1 items-center gap-12 py-16 lg:grid-cols-12 lg:gap-8 lg:py-0">
          <HeroCopy />

          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
