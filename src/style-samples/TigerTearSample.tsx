// Sample of the tiger tear graphic as a reel moment: 0.5s of poster, ~2.5s tear, then the tiger looking around.
import { AbsoluteFill } from "remotion";
import { TigerTearVideo } from "../shared/TigerTear";

export const TigerTearSample: React.FC = () => (
  <AbsoluteFill>
    <TigerTearVideo startFrame={15} tearFrames={75} />
  </AbsoluteFill>
);
