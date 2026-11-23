// Sample of the card fan in a reel: placeholder numbered cards (swap in real screenshots), entry then two steps.
import { AbsoluteFill, staticFile } from "remotion";
import { CardFan } from "../shared/CardFan";

const IMAGES = Array.from({ length: 10 }, (_, i) => staticFile(`images/card-fan-sample/${i + 1}.png`));

export const CardFanSample: React.FC = () => (
  <AbsoluteFill style={{ background: "#F4F2EE" }}>
    <CardFan images={IMAGES} startFrame={5} cycleEvery={30} />
  </AbsoluteFill>
);
