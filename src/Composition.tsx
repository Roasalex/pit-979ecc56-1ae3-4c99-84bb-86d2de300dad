import { AbsoluteFill, Composition } from "remotion";

// Placeholder so the project builds. Each video gets its own folder (src/<video>/) and
// composition registered in Root.tsx; see .claude/skills/remotion-reel/SKILL.md.
export const MyComposition = () => {
  return (
    <Composition
      id="Blank"
      component={MyComponent}
      durationInFrames={30}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};

export const MyComponent: React.FC = () => {
  return <AbsoluteFill style={{ backgroundColor: "black" }} />;
};
