// Video port of prompts/components/orbiting-skills.tsx: two glowing rings with items orbiting a centre,
// driven by the frame (inner ring one way, outer the other), items spring in one by one, labels optional.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type OrbitVideoItem = { id: string; icon: React.ReactNode; label?: string; ring: 0 | 1 };

export const Orbit: React.FC<{
  items: OrbitVideoItem[];
  center?: React.ReactNode;
  startFrame?: number;
  /** Seconds per turn, inner and outer (outer turns the other way). */
  speeds?: [number, number];
  radii?: [number, number];
  centerPos?: { x: number; y: number };
  colors?: [string, string];
  showLabels?: boolean;
  fontFamily?: string;
}> = ({
  items,
  center,
  startFrame = 0,
  speeds = [9, 15],
  radii = [190, 340],
  centerPos = { x: 540, y: 900 },
  colors = ["#06B6D4", "#9333EA"],
  showLabels = true,
  fontFamily = "Inter, Helvetica, Arial, sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - startFrame) / fps;
  const ringIn = (ring: number) => spring({ frame: frame - startFrame - ring * 6, fps, config: { damping: 16, stiffness: 120 } });
  const pulse = (delay: number) => 0.75 + 0.25 * Math.sin(((t - delay) / 4) * Math.PI * 2);

  return (
    <AbsoluteFill>
      {[0, 1].map((ring) => {
        const r = radii[ring];
        const c = colors[ring];
        const s = ringIn(ring);
        return (
          <div key={ring} style={{ position: "absolute", left: centerPos.x - r, top: centerPos.y - r, width: r * 2, height: r * 2,
            borderRadius: "50%", border: `2px solid ${c}55`, transform: `scale(${s})`, opacity: s * pulse(ring * 1.5),
            background: `radial-gradient(circle, transparent 30%, ${c}22 70%, ${c}44 100%)`,
            boxShadow: `0 0 90px ${c}55, inset 0 0 90px ${c}33` }} />
        );
      })}
      {center ? (
        <div style={{ position: "absolute", left: centerPos.x - 80, top: centerPos.y - 80, width: 160, height: 160, borderRadius: "50%",
          background: "linear-gradient(135deg, #374151, #111827)", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 80px ${colors[0]}66, 0 0 140px ${colors[1]}44`, transform: `scale(${ringIn(0)})` }}>
          {center}
        </div>
      ) : null}
      {items.map((it) => {
        const onRing = items.filter((x) => x.ring === it.ring);
        const k = onRing.indexOf(it);
        const dir = it.ring === 0 ? 1 : -1;
        const angle = (k / onRing.length) * Math.PI * 2 + dir * (t / speeds[it.ring]) * Math.PI * 2 - Math.PI / 2;
        const x = centerPos.x + Math.cos(angle) * radii[it.ring];
        const y = centerPos.y + Math.sin(angle) * radii[it.ring];
        const order = items.indexOf(it);
        const pop = spring({ frame: frame - startFrame - 10 - order * 5, fps, config: { damping: 11, stiffness: 160 } });
        const size = it.ring === 0 ? 104 : 116;
        return (
          <div key={it.id} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${pop})` }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "rgba(31,41,55,0.92)", padding: 24, boxSizing: "border-box",
              display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.45)" }}>
              {it.icon}
            </div>
            {showLabels && it.label ? (
              <div style={{ position: "absolute", top: size + 10, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap",
                fontFamily, fontWeight: 700, fontSize: 30, color: "#fff", background: "rgba(17,24,39,0.9)", padding: "6px 14px", borderRadius: 10,
                opacity: interpolate(pop, [0.6, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                {it.label}
              </div>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
