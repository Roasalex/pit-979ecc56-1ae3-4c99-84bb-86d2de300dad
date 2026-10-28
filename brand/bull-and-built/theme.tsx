// Bull & Built theme: palette, type and the recurring pieces measured off their reels (Oct 2026).
// Fonts (self-hosted, brand/fonts.ts) are best visual matches from 360-536px wide exports; swap in the real files if the brand has them.
import React from "react";
import { AbsoluteFill } from "remotion";
import { fontFamily } from "../fonts";
import inter400 from "@fontsource/inter/files/inter-latin-400-normal.woff2";
import inter700 from "@fontsource/inter/files/inter-latin-700-normal.woff2";
import inter800 from "@fontsource/inter/files/inter-latin-800-normal.woff2";
import instrumentItalic from "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2";
import mono500 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2";
import mono700 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2";
import kalam700 from "@fontsource/kalam/files/kalam-latin-700-normal.woff2";
import archivoBlack from "@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2";

export const BB = {
  red: "#E1362E",
  yellow: "#F5D355", // sticky notes and the caption emphasis word
  ink: "#0C090F", // dark grounds
  cream: "#EAE4DA", // light grounds, end card
  paper: "#F7F4EE", // index cards
  pen: "#253D97", // handwriting on the cards
  white: "#FFFFFF",
};

export const FONT = {
  sans: fontFamily("BB Inter", [{ url: inter400, weight: "400" }, { url: inter700, weight: "700" }, { url: inter800, weight: "800" }]),
  serifItalic: fontFamily("BB Instrument Serif", [{ url: instrumentItalic, weight: "400", style: "italic" }]),
  mono: fontFamily("BB JetBrains Mono", [{ url: mono500, weight: "500" }, { url: mono700, weight: "700" }]),
  hand: fontFamily("BB Kalam", [{ url: kalam700, weight: "700" }]),
  wordmark: fontFamily("BB Archivo Black", [{ url: archivoBlack, weight: "400" }]),
};

/** Caption: white Inter bold, sentence case, no outline, one emphasis word in yellow. */
export const BBCaption: React.FC<{ words: string[]; emphasis?: number[]; y: number }> = ({ words, emphasis = [], y }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute", top: y, left: 70, right: 70, textAlign: "center",
        fontFamily: FONT.sans, fontWeight: 700, fontSize: 64, lineHeight: 1.12, letterSpacing: -1,
        color: BB.white, textShadow: "0 2px 10px rgba(0,0,0,0.55)",
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ color: emphasis.includes(i) ? BB.yellow : BB.white }}>{w} </span>
      ))}
    </div>
  </AbsoluteFill>
);

/** Red tags: Instrument Serif italic in white on red blocks, stacked, the last line bigger. */
export const RedTags: React.FC<{ lines: string[]; top: number; left?: number }> = ({ lines, top, left = 70 }) => (
  <div style={{ position: "absolute", top, left, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
    {lines.map((l, i) => {
      const last = i === lines.length - 1 && lines.length > 1;
      return (
        <div key={i} style={{ background: BB.red, color: BB.white, fontFamily: FONT.serifItalic, fontStyle: "italic",
          fontSize: last ? 84 : 54, lineHeight: 1.05, padding: last ? "6px 22px 10px" : "4px 16px 6px" }}>
          {l}
        </div>
      );
    })}
  </div>
);

/** Pinned index card: mono label, ruled lines, handwritten ticks/crosses in blue pen, red pin. */
export const NoteCard: React.FC<{
  label: string; lines: { text: string; mark?: "tick" | "cross" }[];
  x: number; y: number; w?: number; tone?: "paper" | "yellow"; rotate?: number;
}> = ({ label, lines, x, y, w = 760, tone = "paper", rotate = -1.2 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, transform: `rotate(${rotate}deg)` }}>
    <div style={{
      position: "relative", background: tone === "yellow" ? BB.yellow : BB.paper, padding: "26px 34px 30px",
      minHeight: 230, boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
      borderTop: tone === "paper" ? `6px solid ${BB.red}` : undefined,
      backgroundImage: tone === "paper" ? "repeating-linear-gradient(transparent 0 46px, #C9D3E6 46px 48px)" : undefined,
      backgroundPosition: "0 72px",
    }}>
      <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: "#2A2A2A" }}>{label}</div>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: FONT.hand, fontWeight: 700, fontSize: 46, color: BB.pen, marginTop: 6,
          textDecoration: l.mark === "cross" ? "line-through" : undefined }}>
          {l.mark === "tick" && <span style={{ color: BB.red }}>✓ </span>}
          {l.mark === "cross" && <span style={{ color: BB.red }}>✗ </span>}
          {l.text}
        </div>
      ))}
      <div style={{ position: "absolute", top: -14, right: 110, width: 34, height: 34, borderRadius: 17,
        background: "radial-gradient(circle at 35% 35%, #FF8A80, #D32F2F 60%, #8E1B1B)", boxShadow: "0 4px 6px rgba(0,0,0,0.4)" }} />
    </div>
  </div>
);

/** Dark statement panel: dotted grid, red corner brackets, italic red lead-in, bold/light sans mix. */
export const StatementPanel: React.FC<{ lead: string; lines: { bold?: string; light?: string }[]; footer?: string }> = ({ lead, lines, footer = "BULL & BUILT · FROM THE JOB SITE" }) => {
  const box = { left: 120, top: 560, width: 840, height: 640 };
  const corner = (l: number, t: number) => (
    <div style={{ position: "absolute", left: l - 9, top: t - 9, width: 18, height: 18, background: BB.red }} />
  );
  return (
    <AbsoluteFill style={{ background: BB.ink }}>
      <div style={{ position: "absolute", ...box, border: `3px solid ${BB.red}`,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1.6px, transparent 1.6px)", backgroundSize: "22px 22px",
        padding: "70px 60px", boxSizing: "border-box" }}>
        <div style={{ fontFamily: FONT.serifItalic, fontStyle: "italic", color: BB.red, fontSize: 58, marginBottom: 18 }}>{lead}</div>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: FONT.sans, fontSize: 70, lineHeight: 1.12, letterSpacing: -2, color: BB.white }}>
            {l.bold && <span style={{ fontWeight: 800 }}>{l.bold} </span>}
            {l.light && <span style={{ fontWeight: 400, opacity: 0.85 }}>{l.light}</span>}
          </div>
        ))}
      </div>
      {corner(box.left, box.top)}{corner(box.left + box.width, box.top)}
      {corner(box.left, box.top + box.height)}{corner(box.left + box.width, box.top + box.height)}
      <div style={{ position: "absolute", top: box.top + box.height + 130, left: box.left, fontFamily: FONT.mono,
        fontWeight: 500, fontSize: 26, letterSpacing: 5, color: "rgba(255,255,255,0.7)" }}>{footer}</div>
    </AbsoluteFill>
  );
};

/** End card: cream ground, logo, Archivo wordmark, serif italic tagline, red URL tag, yellow sticky CTA. */
export const EndCard: React.FC<{ cta: string; logo?: React.ReactNode }> = ({ cta, logo }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #F4F1EC, ${BB.cream} 70%, #D8D1C5)`,
    alignItems: "center", justifyContent: "center" }}>
    <div style={{ height: 360, display: "flex", alignItems: "flex-end" }}>
      {logo ?? <div style={{ fontFamily: FONT.mono, fontSize: 26, color: "#9A9187", border: "3px dashed #B9B0A4", padding: "120px 70px" }}>LOGO FILE NEEDED</div>}
    </div>
    <div style={{ fontFamily: FONT.wordmark, fontSize: 84, letterSpacing: 4, color: "#111", marginTop: 50 }}>BULL &amp; BUILT</div>
    <div style={{ fontFamily: FONT.serifItalic, fontStyle: "italic", fontSize: 74, color: "#1B1B1B", marginTop: 4 }}>Be the Bull. Lead the Market.</div>
    <div style={{ background: BB.red, color: BB.white, fontFamily: FONT.mono, fontWeight: 700, fontSize: 36, letterSpacing: 3,
      padding: "14px 30px", marginTop: 34 }}>BULLANDBUILT.COM</div>
    <div style={{ background: BB.yellow, fontFamily: FONT.hand, fontWeight: 700, fontSize: 56, color: "#1B1B1B",
      padding: "16px 40px", marginTop: 26, transform: "rotate(-3deg)", boxShadow: "0 12px 22px rgba(0,0,0,0.25)" }}>{cta}</div>
  </AbsoluteFill>
);
