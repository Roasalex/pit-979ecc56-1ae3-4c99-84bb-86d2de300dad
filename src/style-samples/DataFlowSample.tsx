// Sample of DataFlow: the circuit draws in, then coloured lights run into the chip. Label is a placeholder.
import { AbsoluteFill } from "remotion";
import { DataFlow } from "../shared/DataFlow";

export const DataFlowSample: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #111318, #050507 75%)" }}>
    <DataFlow label="YOUR CRM" startFrame={5} />
  </AbsoluteFill>
);
