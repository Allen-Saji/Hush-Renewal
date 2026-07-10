import { Composition, Still } from "remotion";
import { Gate } from "./Gate";
import { HushDemo, TOTAL_FRAMES } from "./HushDemo";
import "./style.css";

export function Root() {
  return (
    <>
      <Composition
        id="HushDemo"
        component={HushDemo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={TOTAL_FRAMES}
      />
      <Still id="Gate" component={Gate} width={1920} height={1080} />
    </>
  );
}
