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
import { WorksWheelSample } from "./style-samples/WorksWheelSample";
import { ReviewWallSample } from "./style-samples/ReviewWallSample";
import { SegmentMeterSample } from "./style-samples/SegmentMeterSample";
import { ElevateSamples } from "./style-samples/ElevateSamples";
import { ElevateVsl, END as ELEVATE_VSL_END } from "./elevate-vsl/ElevateVsl";
import { ElevateAd4, END as ELEVATE_AD4_END } from "./elevate-ad4/ElevateAd4";
import { SystemMap, SYSTEM_MAP_END } from "./system-map/SystemMap";
import { SystemMapDay2, DAY2_END, DAY2_FAST_END } from "./system-map-day2/SystemMapDay2";

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
      <Composition id="WorksWheelSample" component={WorksWheelSample} durationInFrames={240} fps={30} width={1080} height={1920} />
      <Composition id="ReviewWallSample" component={ReviewWallSample} durationInFrames={150} fps={30} width={1080} height={1920} />
      <Composition id="SegmentMeterSample" component={SegmentMeterSample} durationInFrames={90} fps={30} width={1080} height={1920} />
      <Composition id="BrandSamples-Elevate" component={ElevateSamples} durationInFrames={90} fps={30} width={1080} height={1920} />
      <Composition id="ElevateVsl" component={ElevateVsl} durationInFrames={ELEVATE_VSL_END} fps={30} width={1080} height={1920} />
      <Composition id="ElevateVslVisuals" component={ElevateVsl} defaultProps={{ visualsOnly: true }} durationInFrames={ELEVATE_VSL_END} fps={30} width={1080} height={1920} />
      <Composition id="ElevateAd4" component={ElevateAd4} durationInFrames={ELEVATE_AD4_END} fps={30} width={1080} height={1920} />
      <Composition id="ElevateAd4Visuals" component={ElevateAd4} defaultProps={{ visualsOnly: true }} durationInFrames={ELEVATE_AD4_END} fps={30} width={1080} height={1920} />
      <Composition id="SystemMap" component={SystemMap} durationInFrames={SYSTEM_MAP_END} fps={30} width={1080} height={1920} />
      <Composition id="SystemMapDay2" component={SystemMapDay2} durationInFrames={DAY2_END} fps={30} width={1080} height={1920} />
      <Composition id="SystemMapDay2Fast" component={SystemMapDay2} defaultProps={{ fast: true }} durationInFrames={DAY2_FAST_END} fps={30} width={1080} height={1920} />
    </>
  );
};
