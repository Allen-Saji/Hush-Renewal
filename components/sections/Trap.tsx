import { Buildings, Storefront } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { MaskBars } from "@/components/ui/MaskBars";

function Side({
  icon,
  party,
  field,
  caption,
  align,
}: {
  icon: React.ReactNode;
  party: string;
  field: string;
  caption: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex-1 rounded-card border border-line bg-surface p-7 ${
        align === "right" ? "md:text-right" : ""
      }`}
    >
      <div
        className={`flex items-center gap-3 ${
          align === "right" ? "md:flex-row-reverse" : ""
        }`}
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-surface-2 text-muted">
          {icon}
        </span>
        <span className="text-sm font-medium text-ink">{party}</span>
      </div>

      <div
        className={`mt-7 flex items-center gap-3 ${
          align === "right" ? "md:justify-end" : ""
        }`}
      >
        <span className="text-sm text-muted">{field}</span>
        <span className="rounded-[8px] border border-line bg-surface-2 px-3 py-2">
          <MaskBars />
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-faint">{caption}</p>
    </div>
  );
}

export function Trap() {
  return (
    <section className="border-b border-line py-24 sm:py-28">
      <Container>
        <Reveal>
          <h2 className="max-w-[18ch] text-3xl font-semibold tracking-tight sm:text-4xl">
            Renewal is a standoff over hidden numbers.
          </h2>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">
            Neither side will name its number first. So renewal stays a slow,
            deadline-driven guess that often settles badly.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-12 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
            <Side
              icon={<Buildings size={20} />}
              party="Customer"
              field="Budget ceiling"
              caption="Reveal it and you lose every bit of leverage."
              align="left"
            />

            <div className="flex shrink-0 items-center justify-center md:flex-col">
              <span className="hidden h-12 w-px bg-line md:block" />
              <span className="rounded-full border border-line bg-bg px-3 py-1 text-xs text-faint">
                no shared view
              </span>
              <span className="hidden h-12 w-px bg-line md:block" />
            </div>

            <Side
              icon={<Storefront size={20} />}
              party="Vendor"
              field="Price floor"
              caption="Reveal it and you lose every bit of margin."
              align="right"
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
