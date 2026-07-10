import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { MotionConfig } from "motion/react";
import { S1Problem } from "./scenes/S1Problem";
import { S2Build } from "./scenes/S2Build";
import { S3WhyCanton } from "./scenes/S3WhyCanton";
import { S4aNegotiate } from "./scenes/S4aNegotiate";
import { S4bClear } from "./scenes/S4bClear";
import { S4cSettle } from "./scenes/S4cSettle";
import { S5Proofs } from "./scenes/S5Proofs";
import { S6Close } from "./scenes/S6Close";

/*
  Scene durations come from the narration audio: gen_audio.py measures each
  clip with ffprobe and prints this map. Each scene's <Sequence> carries its
  own <Audio>, so the voice starts exactly at the scene's frame 0 -- sync at
  every boundary by construction.

  Locked from the generated ElevenLabs audio (gen_audio.py output).
*/
export const SCENE_FRAMES = {
  s1: 409,
  s2: 443,
  s3: 734,
  s4a: 457,
  s4b: 383,
  s4c: 285,
  s5: 462,
  s6: 316,
} as const;

export const TOTAL_FRAMES = Object.values(SCENE_FRAMES).reduce((a, b) => a + b, 0);

const ORDER: { id: keyof typeof SCENE_FRAMES; Comp: React.ComponentType }[] = [
  { id: "s1", Comp: S1Problem },
  { id: "s2", Comp: S2Build },
  { id: "s3", Comp: S3WhyCanton },
  { id: "s4a", Comp: S4aNegotiate },
  { id: "s4b", Comp: S4bClear },
  { id: "s4c", Comp: S4cSettle },
  { id: "s5", Comp: S5Proofs },
  { id: "s6", Comp: S6Close },
];

export function HushDemo() {
  let from = 0;
  return (
    <MotionConfig reducedMotion="always">
      <AbsoluteFill className="bg-bg">
        {ORDER.map(({ id, Comp }) => {
          const start = from;
          from += SCENE_FRAMES[id];
          return (
            <Sequence key={id} from={start} durationInFrames={SCENE_FRAMES[id]}>
              <Audio src={staticFile(`audio/hush-demo/${id}.mp3`)} />
              <Comp />
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </MotionConfig>
  );
}
