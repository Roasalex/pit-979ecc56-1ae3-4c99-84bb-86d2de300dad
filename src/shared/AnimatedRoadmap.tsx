// Video port of the web "AnimatedRoadmap" (21st.dev hero-section-5): the dashed route draws itself over
// time instead of on scroll, and each milestone pops in when the line reaches it.
// Positions come from the path itself (getPointAtLength), so markers always sit on the line.
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";

export type RoadmapMilestone = {
  name: string;
  status: "complete" | "in-progress" | "pending";
  /** Where along the route it sits, 0 = start, 1 = end. */
  at: number;
  /** Which side of the marker the label goes. */
  label?: "right" | "left" | "above" | "below";
};

export type RoadmapTheme = {
  line: string;
  card: string;
  cardText: string;
  complete: string;
  inProgress: string;
  pending: string;
  fontFamily: string;
};

export const DEFAULT_ROADMAP_THEME: RoadmapTheme = {
  line: "#FFFFFF",
  card: "#FFFFFF",
  cardText: "#111111",
  complete: "#22C55E",
  inProgress: "#3B82F6",
  pending: "#9CA3AF",
  fontFamily: "Inter, Helvetica, Arial, sans-serif",
};

type Props = {
  milestones: RoadmapMilestone[];
  /** SVG path in a 800x400 box (the web component's default route). */
  path?: string;
  /** Frame the line starts drawing, and how many frames it takes. */
  startFrame?: number;
  drawFrames?: number;
  /** Where the 800x400 route box sits on the 1080x1920 frame. */
  box?: { x: number; y: number; width: number };
  mapImage?: string;
  theme?: RoadmapTheme;
};

const VIEW_W = 800;
const VIEW_H = 400;

export const AnimatedRoadmap: React.FC<Props> = ({
  milestones,
  path = "M 50 350 Q 200 50 400 200 T 750 100",
  startFrame = 0,
  drawFrames = 60,
  box = { x: 60, y: 760, width: 960 },
  mapImage,
  theme = DEFAULT_ROADMAP_THEME,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = box.width / VIEW_W;
  const height = VIEW_H * scale;
  const total = getLength(path);
  const progress = interpolate(frame, [startFrame, startFrame + drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  return (
    <AbsoluteFill>
      {mapImage ? (
        <Img
          src={mapImage}
          style={{ position: "absolute", left: box.x, top: box.y - 40 * scale, width: box.width, height: height + 80 * scale,
            objectFit: "contain", opacity: interpolate(frame, [startFrame - 12, startFrame], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
        />
      ) : null}
      <svg width={box.width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        style={{ position: "absolute", left: box.x, top: box.y, overflow: "visible" }}>
        <defs>
          {/* A solid stroke drawn along the route reveals the dashed line, so the dashes stay intact. */}
          <mask id="roadmap-reveal" maskUnits="userSpaceOnUse" x={-50} y={-50} width={VIEW_W + 100} height={VIEW_H + 100}>
            <path d={path} fill="none" stroke="white" strokeWidth={14} strokeLinecap="round"
              strokeDasharray={total} strokeDashoffset={total * (1 - progress)} />
          </mask>
        </defs>
        <path d={path} fill="none" stroke={theme.line} strokeWidth={4} strokeDasharray="12 7" strokeLinecap="round" mask="url(#roadmap-reveal)" />
      </svg>
      {milestones.map((m) => {
        const pt = getPointAtLength(path, total * m.at) ?? { x: 0, y: 0 };
        const x = box.x + pt.x * scale;
        const y = box.y + pt.y * scale;
        const appear = startFrame + Math.round(drawFrames * m.at);
        const pop = spring({ frame: frame - appear, fps, config: { damping: 12, stiffness: 180 } });
        const pulse = m.status === "in-progress" ? 1 + 0.25 * Math.max(0, Math.sin(((frame - appear) / fps) * Math.PI * 2)) : 1;
        const dot = m.status === "complete" ? theme.complete : m.status === "in-progress" ? theme.inProgress : theme.pending;
        const side = m.label ?? "right";
        const labelPos: React.CSSProperties =
          side === "right" ? { left: 34, top: "50%", transform: "translateY(-50%)" }
          : side === "left" ? { right: 34, top: "50%", transform: "translateY(-50%)" }
          : side === "above" ? { bottom: 34, left: "50%", transform: "translateX(-50%)" }
          : { top: 34, left: "50%", transform: "translateX(-50%)" };
        return (
          <div key={m.name} style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity: frame < appear ? 0 : 1,
            transform: `scale(${0.5 + 0.5 * pop})` }}>
            <div style={{ position: "absolute", left: -26, top: -26, width: 52, height: 52, borderRadius: 26, background: `${dot}33`,
              transform: `scale(${pulse})` }} />
            <div style={{ position: "absolute", left: -11, top: -11, width: 22, height: 22, borderRadius: 11, background: dot,
              border: "4px solid rgba(0,0,0,0.25)", boxSizing: "border-box" }} />
            <div style={{ position: "absolute", ...labelPos, whiteSpace: "nowrap", background: theme.card, color: theme.cardText,
              fontFamily: theme.fontFamily, fontWeight: 700, fontSize: 40, padding: "12px 26px", borderRadius: 999,
              boxShadow: "0 10px 26px rgba(0,0,0,0.3)" }}>
              {m.name}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
