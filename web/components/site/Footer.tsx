import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/site/Wordmark";

const cols = [
  {
    title: "Product",
    items: [
      { label: "How it works", href: "#how" },
      { label: "Privacy model", href: "#privacy" },
      { label: "Settlement", href: "#settlement" },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "Read the spec", href: "#spec" },
      { label: "Why on-ledger", href: "#why" },
      { label: "Trust boundary", href: "#trust" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <Container className="py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Private sealed-bid clearing for enterprise SaaS renewals. Seal one
              price each, clear the overlap, settle atomically on Canton.
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-faint">
                {col.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.items.map((it) => (
                  <li key={it.label}>
                    <a
                      href={it.href}
                      className="text-sm text-muted transition-colors hover:text-ink"
                    >
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </footer>
  );
}
