// Video port of prompts/components/count-up.fixed.tsx: a number that counts to its value on frames, as an odometer
// (digits roll, with the fixed carry logic) or plain, with an optional label. For stat beats: "2,000+ jobs".
// Only use numbers the creator actually said or that are in the brand sheet.
import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "../../styles/fonts";
import inter500 from "@fontsource/inter/files/inter-latin-500-normal.woff2";
import inter800 from "@fontsource/inter/files/inter-latin-800-normal.woff2";

const INTER = fontFamily("SC Inter", [{ url: inter500, weight: "500" }, { url: inter800, weight: "800" }]);

const decimalsOf = (n: number) => {
  const s = n.toString();
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
};

const Digit: React.FC<{ scaled: number; place: number; size: number }> = ({ scaled, place, size }) => {
  const a = Math.abs(scaled);
  const below = a % place;
  const turning = place === 1 ? below : Math.max(0, below - (place - 1));
  const pos = (Math.floor(a / place) % 10) + turning;
  const h = size;
  return (
    <span style={{ position: "relative", display: "inline-block", width: "0.62em", height: h, overflow: "hidden" }}>
      <span style={{ position: "absolute", left: 0, right: 0, top: 0, transform: `translateY(${-pos * h}px)` }}>
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} style={{ display: "flex", justifyContent: "center", alignItems: "center", height: h }}>{i % 10}</span>
        ))}
      </span>
    </span>
  );
};

export const StatCount: React.FC<{
  to: number;
  from?: number;
  startFrame?: number;
  durationFrames?: number;
  separator?: string;
  prefix?: string;
  suffix?: string;
  label?: string;
  odometer?: boolean;
  size?: number;
  color?: string;
  labelColor?: string;
  style?: React.CSSProperties;
}> = ({
  to,
  from = 0,
  startFrame = 0,
  durationFrames = 60,
  separator = ",",
  prefix = "",
  suffix = "",
  label,
  odometer = true,
  size = 150,
  color = "#FFFFFF",
  labelColor = "rgba(255,255,255,0.7)",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const decimals = Math.max(decimalsOf(from), decimalsOf(to));
  const v = interpolate(frame, [startFrame, startFrame + durationFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const fmt = (n: number) => {
    const s = new Intl.NumberFormat("en-US", { useGrouping: !!separator, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
    return separator ? s.replace(/,/g, separator) : s;
  };
  const scaled = Math.round(v * 10 ** decimals * 1000) / 1000;
  const target = fmt(Math.max(Math.abs(from), Math.abs(to)));
  const digitCount = target.replace(/\D/g, "").length;
  const pop = spring({ frame: frame - startFrame, fps, config: { damping: 14, stiffness: 160 } });
  let d = 0;
  return (
    <div style={{ fontFamily: INTER, textAlign: "center", transform: `scale(${0.85 + 0.15 * pop})`, opacity: pop, ...style }}>
      <div style={{ fontWeight: 800, fontSize: size, lineHeight: 1, color, letterSpacing: -size * 0.03, display: "inline-flex", alignItems: "center" }}>
        {prefix}
        {odometer
          ? [...target].map((ch, i) => (/\d/.test(ch) ? <Digit key={i} scaled={scaled} place={10 ** (digitCount - 1 - d++)} size={size} /> : <span key={i}>{ch}</span>))
          : fmt(v)}
        {suffix}
      </div>
      {label ? <div style={{ fontWeight: 500, fontSize: size * 0.24, color: labelColor, marginTop: size * 0.12 }}>{label}</div> : null}
    </div>
  );
};
