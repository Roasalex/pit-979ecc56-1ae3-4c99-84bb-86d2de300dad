// Video port of prompts/components/cpu-architecture.tsx: eight circuit lines that draw in, coloured lights that run
// along them into a central chip, and a label with a moving sheen. Same paths and light timings as the web CSS, but
// driven by the frame (deterministic), with heavier strokes so the lines survive phone screens.
import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";

// [line path, light path (runs on into the chip), light colours, seconds per run, delay]
const LINES: [string, string, [string, string], number, number][] = [
  ["M 10 20 h 79.5 q 5 0 5 5 v 30", "M 10 20 h 79.5 q 5 0 5 5 v 24", ["#00E8ED", "#0088FF"], 5, 1],
  ["M 180 10 h -69.7 q -5 0 -5 5 v 30", "M 180 10 h -69.7 q -5 0 -5 5 v 24", ["#FFD800", "#FFD800"], 2, 6],
  ["M 130 20 v 21.8 q 0 5 -5 5 h -10", "M 130 20 v 21.8 q 0 5 -5 5 h -10", ["#830CD1", "#FF008B"], 6, 4],
  ["M 170 80 v -21.8 q 0 -5 -5 -5 h -50", "M 170 80 v -21.8 q 0 -5 -5 -5 h -50", ["#FFFFFF", "#FFFFFF"], 3, 3],
  ["M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20", "M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20", ["#22c55e", "#22c55e"], 4, 9],
  ["M 94.8 95 v -36", "M 94.8 95 v -36", ["#f97316", "#f97316"], 7, 3],
  ["M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14", "M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14", ["#06b6d4", "#06b6d4"], 4, 4],
  ["M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20", "M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20", ["#f43f5e", "#f43f5e"], 3, 3],
];
const ease = Easing.bezier(0.75, -0.01, 0, 0.99);

export const DataFlow: React.FC<{
  label?: string;
  startFrame?: number;
  /** Seconds to cut from every light's start delay (the web version waits up to 9s for the last one). */
  delayScale?: number;
  lineColor?: string;
  y?: number;
}> = ({ label = "CPU", startFrame = 0, delayScale = 0.35, lineColor = "rgba(255,255,255,0.28)", y = 690 }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = (frame - startFrame) / fps;
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const draw = interpolate(t, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.25, 0.1, 0.5, 1) });
  const fontSize = Math.min(7, 22 / Math.max(1, label.length * 0.62));
  const sheen = ((t % 5) / 5) * 4 - 2; // the web version's 5s gradient sweep

  return (
    <svg width={width} height={width / 2} viewBox="0 0 200 100" style={{ position: "absolute", left: 0, top: y, overflow: "visible" }}>
      <defs>
        {LINES.map(([, light, [a, b]], i) => (
          <React.Fragment key={i}>
            <mask id={`${id}m${i}`}><path d={light} stroke="white" strokeWidth={0.9} fill="none" /></mask>
            <radialGradient id={`${id}g${i}`} fx="1">
              <stop offset="0%" stopColor={a} />
              <stop offset="50%" stopColor={b} />
              <stop offset="100%" stopColor={b} stopOpacity={0} />
            </radialGradient>
          </React.Fragment>
        ))}
        <linearGradient id={`${id}pin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F4F4F" />
          <stop offset="60%" stopColor="#121214" />
        </linearGradient>
        <linearGradient id={`${id}txt`} x1="0" y1="0" x2="1" y2="0">
          <stop offset={sheen} stopColor="#777" />
          <stop offset={sheen + 1} stopColor="#fff" />
          <stop offset={sheen + 2} stopColor="#777" />
        </linearGradient>
      </defs>
      {LINES.map(([d], i) => {
        const len = getLength(d);
        const start = getPointAtLength(d, 0) ?? { x: 0, y: 0 };
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={lineColor} strokeWidth={0.5} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
            <circle cx={start.x} cy={start.y} r={interpolate(t, [0, 0.25, 0.5], [0, 1.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
              fill="#000" stroke="#3a3a3a" strokeWidth={0.4} />
          </g>
        );
      })}
      {LINES.map(([, light, , dur, delay], i) => {
        const local = t - delay * delayScale;
        if (local < 0) return null;
        const p = ease((local % dur) / dur);
        const len = getLength(light);
        // the curve undershoots below 0 at the start (as in the CSS), so clamp into the path
        const pt = getPointAtLength(light, Math.max(0, Math.min(len, p * len * 1.25))) ?? { x: 0, y: 0 };
        return (
          <g key={i} mask={`url(#${id}m${i})`}>
            <circle cx={pt.x} cy={pt.y} r={8} fill={`url(#${id}g${i})`} />
          </g>
        );
      })}
      <g fill={`url(#${id}pin)`}>
        {[[93, 37], [104, 37]].map(([x, yy]) => <rect key={x} x={x} y={yy} width={2.5} height={5} rx={0.7} />)}
        {[[93, 58], [104, 58]].map(([x, yy]) => <rect key={x} x={x} y={yy} width={2.5} height={5} rx={0.7} />)}
        {[[82, 44], [82, 51]].map(([x, yy]) => <rect key={yy} x={x} y={yy} width={5} height={2.5} rx={0.7} />)}
        {[[113, 44], [113, 51]].map(([x, yy]) => <rect key={yy} x={x} y={yy} width={5} height={2.5} rx={0.7} />)}
      </g>
      <rect x={85} y={40} width={30} height={20} rx={2} fill="#181818" />
      <text x={100} y={50} textAnchor="middle" dominantBaseline="central" fontSize={fontSize} fontWeight={600}
        letterSpacing="0.05em" fill={`url(#${id}txt)`} fontFamily="Inter, Helvetica, Arial, sans-serif">
        {label}
      </text>
    </svg>
  );
};
