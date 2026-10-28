import { Composition } from "remotion";
import { Reel } from "./Reel";
import type { ReelProps } from "./types";
import defaultBrand from "../../brand/brand.json";

export const FPS = 30;

const defaultProps: ReelProps = {
  video: "",
  durationMs: 5000,
  words: [],
  overlays: [{ type: "hook", startMs: 0, endMs: 2500, text: "Preview: no plan loaded" }],
  brand: defaultBrand as ReelProps["brand"],
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={150}
    defaultProps={defaultProps}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.max(1, Math.round((props.durationMs / 1000) * FPS)),
    })}
  />
);
