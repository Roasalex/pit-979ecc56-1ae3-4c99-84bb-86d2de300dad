import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { BullAndBuiltSamples, DaisySamples } from "./brand-samples/BrandSamples";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition id="BrandSamples-BullAndBuilt" component={BullAndBuiltSamples} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="BrandSamples-Daisy" component={DaisySamples} durationInFrames={120} fps={30} width={1080} height={1920} />
    </>
  );
};
