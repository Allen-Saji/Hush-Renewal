import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/*
  Frame-driven entrance. `at` is seconds from the start of the enclosing
  Sequence, i.e. seconds into that scene's voiceover, so visual beats are
  authored directly against the narration timeline.
*/
export function Appear({
  at,
  duration = 0.45,
  from = "up",
  children,
  className,
}: {
  at: number;
  duration?: number;
  from?: "up" | "down" | "left" | "right" | "none";
  children: React.ReactNode;
  className?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = at * fps;
  const end = start + duration * fps;

  const t = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Ease-out cubic; snappy without spring randomness.
  const e = 1 - Math.pow(1 - t, 3);

  const dist = 26 * (1 - e);
  const translate =
    from === "up"
      ? `translateY(${dist}px)`
      : from === "down"
        ? `translateY(${-dist}px)`
        : from === "left"
          ? `translateX(${dist}px)`
          : from === "right"
            ? `translateX(${-dist}px)`
            : "none";

  return (
    <div className={className} style={{ opacity: e, transform: translate }}>
      {children}
    </div>
  );
}

/** Numeric progress 0..1 between two second-marks of the scene. */
export function useBeat(at: number, duration = 0.45): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [at * fps, (at + duration) * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return 1 - Math.pow(1 - t, 3);
}

/** True once the scene timeline passes `at` seconds. */
export function useAfter(at: number): boolean {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame >= at * fps;
}
