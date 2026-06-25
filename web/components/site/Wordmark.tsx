/*
  HushRenewal mark: two outer bars = the two sealed sides; the accent
  connector = the clearing that joins them. Reads as an "H" and as
  "two halves matched". One simple geometric mark, currentColor + accent,
  legible in any theme. (Not a hand-rolled illustration; a wordmark glyph.)
*/
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 text-ink ${className}`}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="4" height="16" rx="2" fill="currentColor" />
        <rect x="16" y="3" width="4" height="16" rx="2" fill="currentColor" />
        <rect x="6" y="9" width="10" height="4" rx="2" className="fill-accent" />
      </svg>
      <span className="text-[1.05rem] font-semibold tracking-tight">
        HushRenewal
      </span>
    </span>
  );
}
