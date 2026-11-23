// Video port of prompts/components/energy-meter.fixed.tsx: segments light up one by one on frames while the percent
// counts up; colour by value (under 30 red, up to 60 amber, above that the accent). For audit-style beats
// ("your Google profile: 18%"). Only show a score that was actually measured.
import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "../../styles/fonts";
import inter600 from "@fontsource/inter/files/inter-latin-600-normal.woff2";
import mono700 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2";

const INTER = fontFamily("SM Inter", [{ url: inter600, weight: "600" }]);
const MONO = fontFamily("SM Mono", [{ url: mono700, weight: "700" }]);

const colorFor = (v: number, accent: string) => (v < 30 ? "#EF4444" : v <= 60 ? "#F59E0B" : accent);

export const SegmentMeter: React.FC<{
  value: number;
  label?: string;
  segments?: number;
  startFrame?: number;
  /** Frames between one segment lighting and the next (the web version's 60ms = ~2 frames). */
  stagger?: number;
  accent?: string;
  width?: number;
  dark?: boolean;
}> = ({ value, label, segments = 10, startFrame = 0, stagger = 3, accent = "#22D3EE", width = 860, dark = true }) => {
  const frame = useCurrentFrame() - startFrame;
  const { fps } = useVideoConfig();
  const v = Math.max(0, Math.min(100, value));
  const filled = Math.round((v / 100) * segments);
  const lit = Math.max(0, Math.min(filled, Math.floor(frame / stagger) + 1));
  const countFrames = filled * stagger + 3;
  const shown = Math.round(interpolate(frame, [0, countFrames], [0, v], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const color = colorFor(v, accent);
  const pulse = v < 30 && frame > countFrames ? 0.7 + 0.3 * Math.abs(Math.sin((frame / fps) * Math.PI)) : 1;
  const ink = dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)";
  const corner = (s: React.CSSProperties) => <div style={{ position: "absolute", width: 26, height: 26, borderColor: `${accent}99`, borderStyle: "solid", borderWidth: 0, ...s }} />;
  return (
    <div style={{ position: "relative", width, padding: 30, boxSizing: "border-box", borderRadius: 10, border: `2px solid ${accent}4D`,
      background: dark ? "rgba(17,20,27,0.85)" : "rgba(255,255,255,0.9)", opacity: interpolate(frame, [-4, 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      {(
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: ink }}>{label}</span>
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 64, color }}>{shown}%</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        {Array.from({ length: segments }, (_, i) => {
          const on = i < lit;
          return (
            <div key={i} style={{ flex: 1, height: 64, borderRadius: 8, background: on ? color : dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              boxShadow: on ? `0 0 18px ${color}AA` : "none", opacity: on ? pulse : 1, transform: on && i === lit - 1 && frame < countFrames ? "scaleY(1.1)" : undefined }} />
          );
        })}
      </div>
      {corner({ left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4 })}
      {corner({ right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4 })}
      {corner({ left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4 })}
      {corner({ right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4 })}
    </div>
  );
};
