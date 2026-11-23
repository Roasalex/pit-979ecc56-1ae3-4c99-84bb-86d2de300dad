// Sample of AssembleText with the web demo's own words (placeholder: a real edit uses a line the creator says).
import { AbsoluteFill } from "remotion";
import { AssembleText } from "../shared/AssembleText";

export const AssembleTextSample: React.FC = () => (
  <AbsoluteFill style={{ background: "#F5F4F3", alignItems: "center", justifyContent: "center", padding: "0 90px" }}>
    <AssembleText text="See more from" startFrame={8} />
  </AbsoluteFill>
);
