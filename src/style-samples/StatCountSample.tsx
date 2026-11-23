// Sample of StatCount with the web demo's placeholder numbers (not claims: a real edit uses the creator's own numbers).
import { AbsoluteFill } from "remotion";
import { StatCount } from "../shared/StatCount";

export const StatCountSample: React.FC = () => (
  <AbsoluteFill style={{ background: "#0B0B0F", alignItems: "center", justifyContent: "center", gap: 90 }}>
    <StatCount to={1000000} label="users" startFrame={6} />
    <StatCount to={99.9} suffix="%" label="uptime" startFrame={16} />
    <StatCount from={5} to={0} label="issues" startFrame={26} odometer={false} />
  </AbsoluteFill>
);
