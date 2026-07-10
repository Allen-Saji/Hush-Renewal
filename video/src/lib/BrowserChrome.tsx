/*
  Minimal browser frame drawn in Remotion around the live-proof recording,
  so the clip reads as "a real browser against production" without capturing
  actual browser UI.
*/
export function BrowserChrome({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#3a3f4b]" />
          <span className="h-3 w-3 rounded-full bg-[#3a3f4b]" />
          <span className="h-3 w-3 rounded-full bg-[#3a3f4b]" />
        </div>
        <div className="flex-1 rounded-btn border border-line bg-bg/60 px-3 py-1 font-mono text-xs text-muted">
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}
