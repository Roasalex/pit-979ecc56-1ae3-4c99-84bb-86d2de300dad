// Video port of prompts/components/testimonials-wall.tsx: columns of review cards scrolling in opposite directions
// on a 3D tilt, driven by the frame. REAL REVIEWS ONLY (the client's own, e.g. from Google), never invented ones.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "../../styles/fonts";
import inter500 from "@fontsource/inter/files/inter-latin-500-normal.woff2";
import inter700 from "@fontsource/inter/files/inter-latin-700-normal.woff2";

const INTER = fontFamily("RW Inter", [{ url: inter500, weight: "500" }, { url: inter700, weight: "700" }]);

export type VideoReview = { name: string; body: string; rating?: number; source?: string };

const CARD_W = 420;
const GAP = 28;

const Card: React.FC<{ r: VideoReview }> = ({ r }) => (
  <div style={{ width: CARD_W, background: "#fff", borderRadius: 22, padding: 30, boxSizing: "border-box", boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    border: "1px solid #e5e7eb", fontFamily: INTER, color: "#111" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 60, height: 60, borderRadius: 30, background: "#eef0f4", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 26 }}>{r.name[0]}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 28 }}>{r.name}</div>
        {r.source ? <div style={{ fontWeight: 500, fontSize: 22, color: "#6b7280" }}>{r.source}</div> : null}
      </div>
    </div>
    {r.rating ? <div style={{ color: "#F59E0B", fontSize: 30, letterSpacing: 4, marginTop: 12 }}>{"★".repeat(r.rating)}<span style={{ opacity: 0.25 }}>{"★".repeat(5 - r.rating)}</span></div> : null}
    <div style={{ fontWeight: 500, fontSize: 27, lineHeight: 1.35, color: "#374151", marginTop: 10 }}>{r.body}</div>
  </div>
);

export const ReviewWall: React.FC<{
  reviews: VideoReview[];
  columns?: number;
  /** Pixels per second each column moves. */
  speed?: number;
  tilt?: boolean;
  background?: string;
  /** Approximate card height, used to size the loop. */
  cardHeight?: number;
}> = ({ reviews, columns = 3, speed = 70, tilt = true, background = "#F4F4F1", cardHeight = 300 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loop = reviews.length * (cardHeight + GAP);
  return (
    <AbsoluteFill style={{ background, overflow: "hidden", perspective: 900 }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center",
        transform: tilt ? "translateZ(-200px) rotateX(18deg) rotateY(-10deg) rotateZ(14deg) scale(1.25)" : undefined }}>
        <div style={{ display: "flex", gap: GAP }}>
          {Array.from({ length: columns }, (_, c) => {
            const dir = c % 2 === 0 ? -1 : 1;
            const offset = ((((frame / fps) * speed + c * 140) % loop) + loop) % loop;
            const col = reviews.map((_, i) => reviews[(i + c * 2) % reviews.length]);
            return (
              <div key={c} style={{ height: 2600, overflow: "hidden" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: GAP, transform: `translateY(${dir < 0 ? -offset : offset - loop}px)` }}>
                  {[...col, ...col, ...col].map((r, i) => <Card key={i} r={r} />)}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(${background} 0%, transparent 18%, transparent 82%, ${background} 100%)` }} />
    </AbsoluteFill>
  );
};
