// Sample of SegmentMeter with the web demo's own placeholder labels and values.
import { AbsoluteFill } from "remotion";
import { SegmentMeter } from "../shared/SegmentMeter";

export const SegmentMeterSample: React.FC = () => (
  <AbsoluteFill style={{ background: "#07090D", alignItems: "center", justifyContent: "center", gap: 60 }}>
    <SegmentMeter value={82} label="Reactor output" startFrame={6} />
    <SegmentMeter value={54} label="Shield integrity" startFrame={16} />
    <SegmentMeter value={18} label="Power reserve" startFrame={26} />
  </AbsoluteFill>
);
