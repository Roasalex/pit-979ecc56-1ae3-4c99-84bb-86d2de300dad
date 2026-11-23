import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { BullAndBuiltSamples, DaisySamples } from "./style-samples/StyleSamples";
import { RoadmapSample } from "./style-samples/RoadmapSample";
import { TigerTearSample } from "./style-samples/TigerTearSample";
import { CardFanSample } from "./style-samples/CardFanSample";
import { QuoteFrameSample } from "./style-samples/QuoteFrameSample";
import { OrbitSample } from "./style-samples/OrbitSample";
import { HairlineSample } from "./style-samples/HairlineSample";
import { DataFlowSample } from "./style-samples/DataFlowSample";
import { StatCountSample } from "./style-samples/StatCountSample";
import { AssembleTextSample } from "./style-samples/AssembleTextSample";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition id="StyleSamples-Notecards" component={BullAndBuiltSamples} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="StyleSamples-GlassLuxury" component={DaisySamples} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="RoadmapSample" component={RoadmapSample} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="TigerTearSample" component={TigerTearSample} durationInFrames={180} fps={30} width={1080} height={1920} />
      <Composition id="CardFanSample" component={CardFanSample} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="QuoteFrameSample" component={QuoteFrameSample} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="OrbitSample" component={OrbitSample} durationInFrames={150} fps={30} width={1080} height={1920} />
      <Composition id="HairlineSample" component={HairlineSample} durationInFrames={240} fps={30} width={1080} height={1920} />
      <Composition id="DataFlowSample" component={DataFlowSample} durationInFrames={180} fps={30} width={1080} height={1920} />
      <Composition id="StatCountSample" component={StatCountSample} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="AssembleTextSample" component={AssembleTextSample} durationInFrames={75} fps={30} width={1080} height={1920} />
    </>
  );
};
