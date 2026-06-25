"use client";

import { useEffect, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/site/Wordmark";

const links = [
  { label: "How it works", href: "#how" },
  { label: "Privacy", href: "#privacy" },
  { label: "Settlement", href: "#settlement" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md glass-fallback transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? "border-line bg-bg/90 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.7)]"
          : "border-line/70 bg-bg/80"
      }`}
    >
      <Container>
        <div className="flex h-[68px] items-center justify-between gap-6">
          <a href="#top" className="shrink-0" aria-label="HushRenewal home">
            <Wordmark />
          </a>

          {/* Desktop: one line, condenses to a hamburger under lg */}
          <nav className="hidden items-center gap-8 lg:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Button href="#spec" variant="ghost">
              Read the spec
            </Button>
            <Button href="#how">See it clear</Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-btn border border-line text-ink"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </Container>

      {/* Mobile sheet (explicit < lg collapse) */}
      {open && (
        <div className="lg:hidden border-t border-line bg-bg">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-btn px-2 py-3 text-base text-muted hover:bg-surface hover:text-ink"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-1 gap-2">
              <Button href="#spec" variant="ghost">
                Read the spec
              </Button>
              <Button href="#how">See it clear</Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
