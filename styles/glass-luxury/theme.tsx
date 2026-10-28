// Style reference "glass-luxury" (from a Daisy Rodriguez reel the creator likes, Oct 2026): pieces to reuse, recoloured in the creator's own brand.
// Fonts (self-hosted, brand/fonts.ts) are best visual matches from a 360px wide export; swap in the real files if the brand has them.
import React from "react";
import { AbsoluteFill } from "remotion";
import { fontFamily } from "../fonts";
import jost400 from "@fontsource/jost/files/jost-latin-400-normal.woff2";
import jost500 from "@fontsource/jost/files/jost-latin-500-normal.woff2";
import jost600 from "@fontsource/jost/files/jost-latin-600-normal.woff2";
import corm500 from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2";
import corm600 from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2";
import corm500i from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2";
import corm600i from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-italic.woff2";
import mont800 from "@fontsource/montserrat/files/montserrat-latin-800-normal.woff2";

export const DR = {
  green: "#142B26", // grounds, end card
  gold: "#E0A92A", // pill, daisy centre, emphasis
  goldText: "#D9B44A", // caption emphasis word over footage
  cream: "#F3EEDF",
  white: "#FFFFFF",
};

const cormorant = fontFamily("DR Cormorant Garamond", [
  { url: corm500, weight: "500" }, { url: corm600, weight: "600" },
  { url: corm500i, weight: "500", style: "italic" }, { url: corm600i, weight: "600", style: "italic" },
]);

export const FONT = {
  sans: fontFamily("DR Jost", [{ url: jost400, weight: "400" }, { url: jost500, weight: "500" }, { url: jost600, weight: "600" }]),
  serif: cormorant,
  serifItalic: cormorant,
  display: fontFamily("DR Montserrat", [{ url: mont800, weight: "800" }]),
};

/** Caption: Jost medium, lowercase-casual, white with the key word in gold, soft shadow, no outline. */
export const DRCaption: React.FC<{ words: string[]; emphasis?: number[]; y: number }> = ({ words, emphasis = [], y }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", top: y, left: 80, right: 80, textAlign: "center", fontFamily: FONT.sans,
      fontWeight: 500, fontSize: 58, lineHeight: 1.15, color: DR.white, textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
      {words.map((w, i) => (
        <span key={i} style={{ color: emphasis.includes(i) ? DR.goldText : DR.white }}>{w} </span>
      ))}
    </div>
  </AbsoluteFill>
);

/** Frosted glass card: tiny spaced caps label, a big serif italic word, optional gold asterisk and footnote. */
export const GlassCard: React.FC<{ label: string; word: string; footnote?: string; x: number; y: number; w?: number }> = ({ label, word, footnote, x, y, w = 380 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, padding: "28px 30px 26px", borderRadius: 34, textAlign: "center",
    background: "linear-gradient(160deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))",
    border: "2px solid rgba(255,255,255,0.45)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.25)" }}>
    <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 22, letterSpacing: 6, color: DR.cream }}>{label}</div>
    <div style={{ fontFamily: FONT.serifItalic, fontStyle: "italic", fontWeight: 600, fontSize: 96, lineHeight: 1, color: DR.white, marginTop: 6 }}>
      {word}<span style={{ color: DR.gold }}>*</span>
    </div>
    {footnote && <div style={{ fontFamily: FONT.sans, fontSize: 20, color: DR.cream, opacity: 0.85, marginTop: 8 }}>{footnote}</div>}
  </div>
);

/** Big gold serif word (sits behind her when a person matte is available: skill references/background-removal.md). */
export const GoldWord: React.FC<{ text: string; y: number; size?: number }> = ({ text, y, size = 300 }) => (
  <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", fontFamily: FONT.serifItalic,
    fontStyle: "italic", fontWeight: 600, fontSize: size, lineHeight: 1,
    background: "linear-gradient(180deg, #F6E3A8, #D6AE52 55%, #B98A2E)", WebkitBackgroundClip: "text", color: "transparent",
    filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.25))" }}>{text}</div>
);

/** Heavy caps statement ("HERE'S WHY"), white Montserrat ExtraBold. */
export const BigCaps: React.FC<{ lines: string[]; y: number }> = ({ lines, y }) => (
  <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", fontFamily: FONT.display, fontWeight: 800,
    fontSize: 190, lineHeight: 0.9, letterSpacing: -4, color: DR.white, textShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>
    {lines.map((l) => <div key={l}>{l}</div>)}
  </div>
);

/** Gold rounded CTA pill with a small daisy. */
export const Pill: React.FC<{ text: string; x?: number; y: number }> = ({ text, x, y }) => (
  <div style={{ position: "absolute", top: y, left: x ?? 0, right: x === undefined ? 0 : undefined, display: "flex", justifyContent: "center" }}>
    <div style={{ background: DR.gold, color: DR.green, fontFamily: FONT.sans, fontWeight: 600, fontSize: 50,
      padding: "18px 46px", borderRadius: 60, boxShadow: "0 10px 26px rgba(0,0,0,0.3)" }}>{text}</div>
  </div>
);

export const DaisyFlower: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    {Array.from({ length: 16 }).map((_, i) => (
      <ellipse key={i} cx={0} cy={-27} rx={8.5} ry={21} fill="#FFFDF7" transform={`rotate(${(360 / 16) * i})`} />
    ))}
    <circle r={14} fill={DR.gold} />
  </svg>
);

/** End card: deep green, daisy mark, name in Cormorant with an italic surname, gold spaced subtitle, DM pill. */
export const EndCard: React.FC<{ cta: string }> = ({ cta }) => (
  <AbsoluteFill style={{ background: DR.green, alignItems: "center", justifyContent: "center" }}>
    <DaisyFlower size={300} />
    <div style={{ fontFamily: FONT.serif, fontWeight: 500, fontSize: 120, color: DR.cream, marginTop: 40 }}>
      Daisy <span style={{ fontFamily: FONT.serifItalic, fontStyle: "italic" }}>Rodriguez</span>
    </div>
    <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 34, letterSpacing: 8, color: DR.gold, marginTop: 6 }}>LUXURY REAL ESTATE</div>
    <div style={{ background: DR.gold, color: DR.green, fontFamily: FONT.sans, fontWeight: 600, fontSize: 50,
      padding: "18px 46px", borderRadius: 60, marginTop: 60 }}>{cta}</div>
  </AbsoluteFill>
);
