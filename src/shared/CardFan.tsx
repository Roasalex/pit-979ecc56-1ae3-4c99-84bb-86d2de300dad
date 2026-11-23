// Video port of prompts/components/card-fan-carousel.tsx: same fan geometry (7 slots, -21..21 deg), but the
// elastic entry and the carousel steps run on frames instead of GSAP, hover and arrow clicks.
// Good for showing several screenshots at once: client sites, reel thumbnails, reviews, results.
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const FAN = [
  { rot: -21, scale: 0.7756, x: -30, y: 7.3 },
  { rot: -14, scale: 0.8498, x: -22, y: 4.0 },
  { rot: -7, scale: 0.9346, x: -11, y: 1.3 },
  { rot: 0, scale: 1.0, x: 0, y: 0.0 },
  { rot: 7, scale: 0.9346, x: 11, y: 1.3 },
  { rot: 14, scale: 0.8498, x: 22, y: 4.0 },
  { rot: 21, scale: 0.7756, x: 30, y: 7.3 },
];
const HALF = 3;

/** Slot geometry for a fractional slot (-1..7): between two fan positions, or flying off past the ends. */
const slotAt = (s: number) => {
  if (s < 0 || s > 6) {
    const end = s < 0 ? FAN[0] : FAN[6];
    const k = Math.min(1, s < 0 ? -s : s - 6); // 0 at the end slot, 1 one slot past it
    const dir = s < 0 ? -1 : 1;
    return { rot: end.rot + dir * 9 * k, scale: end.scale - 0.25 * k, x: end.x + dir * 10 * k, y: end.y, opacity: 1 - k };
  }
  const a = FAN[Math.floor(s)];
  const b = FAN[Math.min(6, Math.floor(s) + 1)];
  const t = s - Math.floor(s);
  const mix = (p: number, q: number) => p + (q - p) * t;
  return { rot: mix(a.rot, b.rot), scale: mix(a.scale, b.scale), x: mix(a.x, b.x), y: mix(a.y, b.y), opacity: 1 };
};

type Props = {
  /** Image sources (staticFile() paths or URLs). 7 or more fill the fan; more than 7 can cycle. */
  images: string[];
  startFrame?: number;
  /** Advance the fan by one card every N frames after the entry (0 = no cycling). */
  cycleEvery?: number;
  /** Card width in px (3:4 cards) and the fan's centre on the 1080x1920 frame. */
  cardWidth?: number;
  center?: { x: number; y: number };
  /** px per "rem" unit of the original layout. With 260px cards, 10.5 spaces them like the web version
   *  (neighbours ~0.45 of a card apart) and keeps the outer cards inside the reel safe area (x 90-990). */
  unit?: number;
  radius?: number;
};

export const CardFan: React.FC<Props> = ({
  images,
  startFrame = 0,
  cycleEvery = 0,
  cardWidth = 260,
  center = { x: 540, y: 960 },
  unit = 10.5,
  radius = 28,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = images.length;
  const visible = Math.min(7, n);
  const cardH = (cardWidth * 4) / 3;

  // Carousel position: one smooth step per cycle, each step eased with a spring.
  const entryDone = startFrame + 30;
  let shift = 0;
  if (cycleEvery > 0 && n > 7 && frame > entryDone) {
    const since = frame - entryDone;
    const steps = Math.floor(since / cycleEvery);
    shift = steps + spring({ frame: since - steps * cycleEvery, fps, config: { damping: 18, stiffness: 160 } });
  }

  return (
    <AbsoluteFill>
      {images.map((src, i) => {
        // which slot this card is in: centred on card HALF at the start, wrapping round the deck
        let s = i - shift - (n > 7 ? 0 : (visible >> 1) - HALF);
        if (n > 7) s = ((((s + n / 2 - HALF) % n) + n) % n) - n / 2 + HALF;
        else if (n < 7) s = HALF + ((i - (n >> 1)) * 3) / Math.max(1, n >> 1); // spread fewer cards across the fan
        if (s < -1 || s > 7) return null;
        const g = slotAt(s);
        // elastic entry from below, staggered by slot like the web version (0.06s apart)
        const slotIndex = Math.round(Math.max(0, Math.min(6, s)));
        const enter = spring({ frame: frame - startFrame - Math.round(fps * (0.2 + slotIndex * 0.06)), fps, config: { damping: 9, stiffness: 120, mass: 0.9 } });
        const x = g.x * unit * enter;
        const y = interpolate(enter, [0, 1], [12 * unit, g.y * unit]);
        const scale = interpolate(enter, [0, 1], [0.5, g.scale]);
        const z = 10 - Math.round(Math.abs(s - HALF));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: center.x - cardWidth / 2,
              top: center.y - cardH / 2,
              width: cardWidth,
              height: cardH,
              borderRadius: radius,
              overflow: "hidden",
              zIndex: z,
              opacity: Math.min(1, enter * 1.5) * g.opacity,
              transform: `translate(${x}px, ${y}px) rotate(${g.rot * enter}deg) scale(${scale})`,
              boxShadow: "0 30px 60px -20px rgba(0,0,0,0.45)",
            }}
          >
            <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
