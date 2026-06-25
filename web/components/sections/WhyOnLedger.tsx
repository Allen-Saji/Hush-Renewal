import { Check, X, Minus } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

type Cell = { kind: "yes" | "no" | "partial"; note: string };

const rows: { cap: string; web: Cell; hush: Cell }[] = [
  {
    cap: "Shared tamper-evident outcome",
    web: { kind: "no", note: "trust the server's word" },
    hush: { kind: "yes", note: "on-ledger record" },
  },
  {
    cap: "Auditable matching logic",
    web: { kind: "no", note: "opaque server" },
    hush: { kind: "yes", note: "verifiable Daml" },
  },
  {
    cap: "Atomic money and license settlement",
    web: { kind: "no", note: "separate, fragile step" },
    hush: { kind: "yes", note: "one transaction" },
  },
  {
    cap: "Counterparty cannot read your number",
    web: { kind: "partial", note: "depends on trust" },
    hush: { kind: "yes", note: "ledger-enforced" },
  },
];

function Mark({ cell }: { cell: Cell }) {
  const icon =
    cell.kind === "yes" ? (
      <Check size={16} weight="bold" className="text-deal" />
    ) : cell.kind === "no" ? (
      <X size={16} weight="bold" className="text-nodeal" />
    ) : (
      <Minus size={16} weight="bold" className="text-faint" />
    );
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0">{icon}</span>
      <span
        className={`text-sm ${cell.kind === "yes" ? "text-ink" : "text-faint"}`}
      >
        {cell.note}
      </span>
    </div>
  );
}

export function WhyOnLedger() {
  return (
    <section id="why" className="border-b border-line py-24 sm:py-28">
      <Container>
        <Reveal>
          <div className="max-w-[46ch]">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Why not just a trusted middleman?
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              A web service could take both numbers too. Here is what putting it
              on Canton actually adds.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-12 overflow-hidden rounded-card border border-line bg-surface">
            <div className="grid grid-cols-1 gap-y-1 border-b border-line px-6 py-4 text-xs uppercase tracking-[0.12em] text-faint sm:grid-cols-[1.4fr_1fr_1fr] sm:gap-y-0">
              <span>Capability</span>
              <span className="hidden sm:block">Trusted web service</span>
              <span className="hidden sm:block">HushRenewal on Canton</span>
            </div>

            <Stagger className="divide-y divide-line">
              {rows.map((r) => (
                <StaggerItem
                  key={r.cap}
                  className="grid grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-center sm:gap-4"
                >
                  <span className="text-sm font-medium text-ink">{r.cap}</span>
                  <div>
                    <span className="mb-1 block text-[0.7rem] text-faint sm:hidden">
                      Trusted web service
                    </span>
                    <Mark cell={r.web} />
                  </div>
                  <div>
                    <span className="mb-1 block text-[0.7rem] text-faint sm:hidden">
                      HushRenewal on Canton
                    </span>
                    <Mark cell={r.hush} />
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
