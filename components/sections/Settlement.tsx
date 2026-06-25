import {
  Buildings,
  Storefront,
  ArrowRight,
  CurrencyDollar,
  SealCheck,
  Atom,
} from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

function Node({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-[10px] border border-line bg-surface-2 px-3.5 py-2.5">
      <span className="text-muted">{icon}</span>
      <span className="text-sm font-medium text-ink">{label}</span>
    </div>
  );
}

function Leg({
  from,
  to,
  payload,
  icon,
}: {
  from: React.ReactNode;
  to: React.ReactNode;
  payload: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      {from}
      <div className="flex flex-1 items-center gap-2 px-1">
        <span className="hidden h-px flex-1 bg-line sm:block" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1 text-xs text-muted">
          {icon}
          {payload}
        </span>
        <span className="h-px flex-1 bg-line" />
        <ArrowRight size={16} weight="bold" className="shrink-0 text-faint" />
      </div>
      {to}
    </div>
  );
}

export function Settlement() {
  return (
    <section id="settlement" className="border-b border-line py-24 sm:py-28">
      <Container>
        <Reveal>
          <div className="max-w-[46ch]">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Money and license move in one transaction.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              On a deal, payment to the vendor and the renewed license to the
              customer settle atomically. Either both happen or neither does. No
              paid-but-not-renewed state can exist.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-12 rounded-card border border-line bg-surface p-6 sm:p-9">
            <div className="flex flex-col gap-6 border-l-2 border-accent/50 pl-6">
              <Leg
                from={<Node icon={<Buildings size={18} />} label="Customer" />}
                to={<Node icon={<Storefront size={18} />} label="Vendor" />}
                payload="cash"
                icon={<CurrencyDollar size={13} weight="bold" />}
              />
              <Leg
                from={<Node icon={<Storefront size={18} />} label="Vendor" />}
                to={<Node icon={<Buildings size={18} />} label="Customer" />}
                payload="renewed license"
                icon={<SealCheck size={13} weight="bold" />}
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-accent-soft px-3.5 py-1.5 text-sm font-medium text-ink">
                <Atom size={15} weight="bold" className="text-accent" />
                One atomic transaction. Both legs or neither.
              </span>
              <span className="text-sm text-faint">
                Adapted from Canton&apos;s delivery-versus-payment pattern.
              </span>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
