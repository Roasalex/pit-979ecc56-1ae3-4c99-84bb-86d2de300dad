// Sample of a captured Hairline figure in a reel. The clip comes from `node scripts/capture-hairline.mjs Elevator`
// (public/ is not in git, so run that first on a new machine).
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

export const HairlineSample: React.FC = () => (
  <AbsoluteFill style={{ background: "#0b0b0f" }}>
    <AbsoluteFill style={{ top: 528, height: 864 }}>
      <OffthreadVideo src={staticFile("hairline/elevator.mp4")} muted style={{ width: 1080, height: 864 }} />
    </AbsoluteFill>
  </AbsoluteFill>
);
