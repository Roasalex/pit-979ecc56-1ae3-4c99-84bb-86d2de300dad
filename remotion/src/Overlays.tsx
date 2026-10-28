import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "./types";

// Shared enter/exit animation: springs in, fades out over the last 8 frames of its Sequence.
const useEnterExit = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 180 } });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { enter, opacity: Math.min(enter, exit) };
};

export const Hook: React.FC<{ text: string; brand: Brand }> = ({ text, brand }) => {
  const { enter, opacity } = useEnterExit();
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 260 }}>
      <div
        style={{
          opacity,
          transform: `translateY(${(1 - enter) * -60}px)`,
          maxWidth: 920,
          background: brand.colors.primary,
          color: brand.colors.text,
          padding: "28px 44px",
          borderRadius: 28,
          fontSize: 74,
          fontWeight: 800,
          lineHeight: 1.05,
          textAlign: "center",
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const LowerThird: React.FC<{ text: string; subtext?: string; brand: Brand }> = ({ text, subtext, brand }) => {
  const { enter, opacity } = useEnterExit();
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "flex-start", padding: "0 0 760px 60px" }}>
      <div style={{ opacity, transform: `translateX(${(1 - enter) * -400}px)` }}>
        <div style={{ background: brand.colors.accent, color: brand.colors.background, fontSize: 52, fontWeight: 800, padding: "14px 28px", borderRadius: 14 }}>
          {text}
        </div>
        {subtext ? (
          <div style={{ marginTop: 10, background: "rgba(0,0,0,0.65)", color: brand.colors.text, fontSize: 36, fontWeight: 600, padding: "10px 24px", borderRadius: 12, display: "inline-block" }}>
            {subtext}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const Callout: React.FC<{ text: string; position?: "top" | "middle"; brand: Brand }> = ({ text, position, brand }) => {
  const { enter, opacity } = useEnterExit();
  return (
    <AbsoluteFill style={{ justifyContent: position === "middle" ? "center" : "flex-start", alignItems: "center", paddingTop: position === "middle" ? 0 : 520 }}>
      <div
        style={{
          opacity,
          transform: `scale(${0.6 + 0.4 * enter}) rotate(${(1 - enter) * -6}deg)`,
          background: brand.colors.text,
          color: brand.colors.background,
          border: `8px solid ${brand.colors.accent}`,
          padding: "22px 40px",
          borderRadius: 24,
          fontSize: 64,
          fontWeight: 800,
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
