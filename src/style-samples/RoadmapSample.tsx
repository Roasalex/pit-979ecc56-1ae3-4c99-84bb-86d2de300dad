// Sample of the AnimatedRoadmap graphic in a reel frame (neutral colours until the creator's brand sheet exists).
// Milestone names are the web demo's placeholders; swap in the video's own words.
import { AbsoluteFill } from "remotion";
import { AnimatedRoadmap } from "../shared/AnimatedRoadmap";

export const RoadmapSample: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #1F2937, #0B0F17 75%)" }}>
    <AnimatedRoadmap
      startFrame={10}
      drawFrames={75}
      milestones={[
        { name: "Kick-off", status: "complete", at: 0, label: "above" },
        { name: "Design", status: "complete", at: 0.3, label: "above" },
        { name: "Development", status: "in-progress", at: 0.62, label: "below" },
        { name: "Launch", status: "pending", at: 1, label: "above" },
      ]}
    />
  </AbsoluteFill>
);
