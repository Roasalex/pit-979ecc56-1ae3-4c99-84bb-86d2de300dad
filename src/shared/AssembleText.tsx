// Video port of prompts/components/text-scroll-animation.tsx (and the fixed scroll-assemble.tsx): letters (or images)
// start spread out and tilted around the centre and fly together, on frames instead of scroll. Variants match the
// web: "tilt" (rotateX, the headline version), "rise" and "spin" (the icon versions).
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { fontFamily } from "../../styles/fonts";
import inter800 from "@fontsource/inter/files/inter-latin-800-normal.woff2";

const INTER = fontFamily("AT Inter", [{ url: inter800, weight: "800" }]);

type Variant = "tilt" | "rise" | "spin";

const pieceStyle = (d: number, p: number, variant: Variant, unit: number): React.CSSProperties => {
  const k = 1 - p;
  const spread = variant === "spin" ? 1.8 : 1;
  const x = d * unit * spread * k;
  const y = (variant === "rise" ? Math.abs(d) * unit : variant === "spin" ? -Math.abs(d) * unit * 0.4 : 0) * k;
  const rx = variant === "tilt" ? d * 50 * k : 0;
  const rz = variant === "spin" ? d * 50 * k : 0;
  const s = variant === "tilt" ? 1 : 0.75 + 0.25 * p;
  return { display: "inline-block", transform: `translate(${x}px, ${y}px) rotateX(${rx}deg) rotate(${rz}deg) scale(${s})` };
};

export const AssembleText: React.FC<{
  text?: string;
  images?: string[];
  startFrame?: number;
  durationFrames?: number;
  variant?: Variant;
  size?: number;
  color?: string;
  imageSize?: number;
  style?: React.CSSProperties;
}> = ({ text, images, startFrame = 0, durationFrames = 36, variant = "tilt", size = 130, color = "#F97316", imageSize = 130, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const opacity = interpolate(frame, [startFrame - 1, startFrame + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (images?.length) {
    const c = Math.floor(images.length / 2);
    return (
      <div style={{ display: "flex", gap: imageSize * 0.4, justifyContent: "center", perspective: 500, opacity, ...style }}>
        {images.map((src, i) => (
          <img key={i} src={src} style={{ width: imageSize, height: imageSize, objectFit: "contain", ...pieceStyle(i - c, p, variant === "tilt" ? "rise" : variant, imageSize * 0.75) }} />
        ))}
      </div>
    );
  }
  const words = (text ?? "").split(" ");
  const total = (text ?? "").length;
  const c = Math.floor(total / 2);
  let idx = 0;
  return (
    <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: size, lineHeight: 1.05, letterSpacing: -size * 0.04, color, textTransform: "uppercase",
      textAlign: "center", perspective: 500, opacity, ...style }}>
      {words.map((w, wi) => {
        const node = (
          <React.Fragment key={wi}>
            {wi > 0 ? " " : null}
            <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {[...w].map((ch, i) => <span key={i} style={pieceStyle(idx + i - c, p, variant, size * 0.4)}>{ch}</span>)}
            </span>
          </React.Fragment>
        );
        idx += w.length + 1;
        return node;
      })}
    </div>
  );
};
