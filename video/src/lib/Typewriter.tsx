import { useCurrentFrame, useVideoConfig } from "remotion";

/*
  Frame-driven text reveal used to replay the agents' real reasoning.
  Returns the visible slice so callers can pass it into the production
  AgentPanelView as the `reasoning` prop.
*/
export function useTypewriter({
  text,
  at,
  endAt,
  cps = 60,
}: {
  text: string;
  at: number;
  /** If set, reveal is paced so the full text lands exactly at this second. */
  endAt?: number;
  cps?: number;
}): string {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = Math.max(0, frame / fps - at);
  const rate = endAt !== undefined ? text.length / Math.max(0.1, endAt - at) : cps;
  return text.slice(0, Math.floor(elapsed * rate));
}
