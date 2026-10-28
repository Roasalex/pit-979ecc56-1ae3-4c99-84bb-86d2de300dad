import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand, Word } from "./types";

type Page = { words: Word[]; startMs: number; endMs: number };

// Groups words into short pages. A page also breaks on a gap > 600ms so captions never hang over silence.
export const paginate = (words: Word[], perPage: number): Page[] => {
  const pages: Page[] = [];
  let current: Word[] = [];
  for (const w of words) {
    const prev = current[current.length - 1];
    if (current.length >= perPage || (prev && w.startMs - prev.endMs > 600)) {
      pages.push({ words: current, startMs: current[0].startMs, endMs: current[current.length - 1].endMs });
      current = [];
    }
    current.push(w);
  }
  if (current.length) pages.push({ words: current, startMs: current[0].startMs, endMs: current[current.length - 1].endMs });
  // Hold each page until the next one starts so captions don't flicker between words.
  for (let i = 0; i < pages.length - 1; i++) {
    if (pages[i + 1].startMs - pages[i].endMs <= 600) pages[i].endMs = pages[i + 1].startMs;
  }
  return pages;
};

export const Captions: React.FC<{ words: Word[]; brand: Brand }> = ({ words, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const c = brand.captions;
  const page = paginate(words, c.wordsPerPage).find((p) => ms >= p.startMs && ms < p.endMs);
  if (!page) return null;

  const pop = spring({ frame: frame - Math.round((page.startMs / 1000) * fps), fps, config: { damping: 14, stiffness: 220 } });

  return (
    <AbsoluteFill
      style={{
        justifyContent: c.position === "middle" ? "center" : "flex-end",
        alignItems: "center",
        paddingBottom: c.position === "middle" ? 0 : 420,
        paddingLeft: 80,
        paddingRight: 80,
      }}
    >
      <div
        style={{
          transform: `scale(${0.85 + 0.15 * pop})`,
          textAlign: "center",
          fontSize: c.fontSize,
          fontWeight: c.fontWeight,
          lineHeight: 1.1,
          textTransform: c.uppercase ? "uppercase" : "none",
          WebkitTextStroke: `10px ${c.strokeColor}`,
          paintOrder: "stroke fill",
          textShadow: "0 6px 24px rgba(0,0,0,0.45)",
        }}
      >
        {page.words.map((w, i) => {
          const active = ms >= w.startMs && ms < w.endMs;
          return (
            <span key={i} style={{ color: active ? c.activeColor : c.color }}>
              {w.text.trim()}{" "}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
