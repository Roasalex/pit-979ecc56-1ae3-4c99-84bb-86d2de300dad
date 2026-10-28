import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { BullAndBuiltSamples, DaisySamples } from "./style-samples/StyleSamples";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition id="StyleSamples-Notecards" component={BullAndBuiltSamples} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="StyleSamples-GlassLuxury" component={DaisySamples} durationInFrames={120} fps={30} width={1080} height={1920} />
    </>
  );
};
