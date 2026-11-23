// Reel graphic built from the dot-pattern-1 demo: a bordered dot-grid frame with square corner marks, a small
// kicker line, and a big quote in bold/thin word pairs that appear one word at a time, on the frames you give.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { DotPattern } from "./DotPattern";
import { fontFamily } from "../../styles/fonts";
import inter100 from "@fontsource/inter/files/inter-latin-100-normal.woff2";
import inter600 from "@fontsource/inter/files/inter-latin-600-normal.woff2";

const INTER = fontFamily("QF Inter", [{ url: inter100, weight: "100" }, { url: inter600, weight: "600" }]);

export type QuoteWord = {
  text: string;
  bold?: boolean;
  /** Frame the word appears: use the spoken word's start from the transcript. */
  at: number;
  /** Start a new line before this word. */
  br?: boolean;
};

export const QuoteFrame: React.FC<{
  kicker?: string;
  words: QuoteWord[];
  accent?: string;
  ink?: string;
  ground?: string;
  /** Frame the box draws in. */
  startFrame?: number;
  box?: { x: number; y: number; width: number; height: number };
  fontSize?: number;
}> = ({
  kicker,
  words,
  accent = "#EF4444",
  ink = "#0A0A0A",
  ground = "#FFFFFF",
  startFrame = 0,
  box = { x: 90, y: 470, width: 900, height: 980 },
  fontSize = 96,
}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [startFrame, startFrame + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const corner = (style: React.CSSProperties) => (
    <div style={{ position: "absolute", width: 22, height: 22, background: accent, transform: `scale(${draw})`, ...style }} />
  );
  const lines: QuoteWord[][] = [];
  for (const w of words) {
    if (w.br || lines.length === 0) lines.push([]);
    lines[lines.length - 1].push(w);
  }
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.width, height: box.height, background: ground,
      border: `2px solid ${accent}`,
      // wipe in from the left; the -14px margins keep the corner squares (which sit outside the box) visible
      clipPath: `inset(-14px calc(${(1 - draw) * 100}% - 14px) -14px -14px)` }}>
      <DotPattern gap={16} dot={1.6} color="rgba(100,116,139,0.45)" />
      {corner({ left: -11, top: -11 })}
      {corner({ right: -11, top: -11 })}
      {corner({ left: -11, bottom: -11 })}
      {corner({ right: -11, bottom: -11 })}
      <div style={{ position: "absolute", inset: 0, padding: "70px 64px", display: "flex", flexDirection: "column", justifyContent: "center",
        fontFamily: INTER, color: ink }}>
        {kicker ? <div style={{ fontSize: 40, fontWeight: 600, color: accent, marginBottom: 18,
          opacity: interpolate(frame, [startFrame + 6, startFrame + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{kicker}</div> : null}
        {lines.map((line, i) => (
          <div key={i} style={{ fontSize, lineHeight: 1.02, letterSpacing: -fontSize * 0.05, display: "flex", flexWrap: "wrap", columnGap: fontSize * 0.22 }}>
            {line.map((w, j) => (
              <span key={j} style={{ fontWeight: w.bold ? 600 : 100, opacity: frame >= w.at ? 1 : 0 }}>{w.text}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
