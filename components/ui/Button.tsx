import { type ReactNode } from "react";

type Variant = "primary" | "ghost";

/*
  Primary: bg-accent (#2f6bf0) + white text = 4.6:1, passes WCAG AA.
  Hover lifts + casts a tinted shadow; it does NOT lighten the fill
  (lightening would drop contrast below AA). Tactile :active press.
*/
const base =
  "inline-flex items-center justify-center gap-2 rounded-btn text-[0.95rem] font-medium leading-none whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98] active:translate-y-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white px-5 h-11 hover:-translate-y-px hover:shadow-[0_10px_30px_-10px_rgba(47,107,240,0.55)]",
  ghost:
    "text-ink/90 px-4 h-11 border border-line hover:border-faint hover:bg-surface",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  href: string;
  variant?: Variant;
  className?: string;
}) {
  return (
    <a href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </a>
  );
}
