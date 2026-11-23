// Video port of prompts/components/works-wheel.tsx: the same ring-to-drum geometry (place(), bow, cull), with
// `turn` driven by the frame: hold on the ring, open into the drum, then step through the items with a pause on each.
// Sized for a 9:16 frame (cards fill more of the width than on a desktop page). For showing several projects,
// client sites or screenshots in one beat.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "../../styles/fonts";
import inter500 from "@fontsource/inter/files/inter-latin-500-normal.woff2";

const INTER = fontFamily("WW Inter", [{ url: inter500, weight: "500" }]);

const STEP = 40, DRUM = 2.22, LENS = 2.7, RING_R = 1.14, BOW = 1.82, CULL = 1.6, RATIO = 1.45;
const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const place = (ringDeg: number, drumDeg: number, ringR: number, drumR: number, bow: number, m: number) =>
  `translateX(${m * -bow * (1 - Math.cos(rad(drumDeg)))}px) rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px) ` +
  `rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`;

export const WorksWheelVideo: React.FC<{
  items: { title: string; image: string }[];
  label?: string;
  startFrame?: number;
  /** Frames on the ring before it opens, frames per move, frames held on each item. */
  holdRing?: number;
  moveFrames?: number;
  holdItem?: number;
  cardWidth?: number;
  background?: string;
  color?: string;
}> = ({ items, label = "Our work", startFrame = 0, holdRing = 30, moveFrames = 18, holdItem = 30, cardWidth = 760, background = "#F4F4F1", color = "#18181B" }) => {
  const frame = useCurrentFrame() - startFrame;
  const { width, height } = useVideoConfig();
  const n = items.length;
  // turn: 0 (ring) -> 1 (drum, item 0 in front) -> 1 + k (item k in front)
  const stops = Array.from({ length: n + 1 }, (_, k) => k);
  let turn = 0;
  let f = frame - holdRing;
  for (let k = 1; k < stops.length && f > 0; k++) {
    const p = interpolate(f, [0, moveFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.65, 0, 0.35, 1) });
    turn = k - 1 + p;
    f -= moveFrames + holdItem;
  }
  const m = clamp(turn, 0, 1);
  const pos = Math.max(0, turn - 1);
  const cardH = cardWidth / RATIO;
  // the ring has to fit across a 9:16 frame: cap its radius at 30% of the width (cards shrink to close the loop)
  const ringR = Math.min(cardH * RING_R, width * 0.3);
  const drumR = cardH * DRUM;
  const ringScale = clamp((((2 * Math.PI * ringR) / n) * 0.82) / cardWidth, 0.16, 1);
  const active = clamp(Math.round(pos), 0, n - 1);

  return (
    <AbsoluteFill style={{ background, color, fontFamily: INTER, perspective: cardH * LENS, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: width / 2, top: height / 2, transformStyle: "preserve-3d", transform: `translateZ(${-m * drumR}px)` }}>
        {items.map((it, i) => {
          const d = i - pos;
          if (m > 0.5 && Math.abs(d) > CULL) return null;
          return (
            <div key={i} style={{ position: "absolute", width: cardWidth, height: cardH, marginLeft: -cardWidth / 2, marginTop: -cardH / 2,
              backfaceVisibility: "hidden", zIndex: Math.round(100 - Math.abs(d) * 2),
              transform: place(d * (360 / n), d * STEP, ringR, drumR, cardH * BOW, m) }}>
              <div style={{ width: "100%", height: "100%", borderRadius: 18, overflow: "hidden", transform: `scale(${ringScale + (1 - ringScale) * m})`,
                boxShadow: "0 30px 60px -24px rgba(0,0,0,0.35)" }}>
                <Img src={it.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 84, letterSpacing: -2, opacity: 1 - m }}>{label}</div>
      {/* in the gap between the front card and the one turning away below it */}
      <div style={{ position: "absolute", left: 0, right: 0, top: height / 2 + cardH / 2 + 40, textAlign: "center", fontSize: 64, letterSpacing: -1.5, opacity: m }}>
        {items[active]?.title}
      </div>
    </AbsoluteFill>
  );
};
