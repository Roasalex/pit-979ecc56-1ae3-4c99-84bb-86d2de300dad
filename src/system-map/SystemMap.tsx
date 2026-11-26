// "System map" ad (prompts/system-map-flowchart.md): one 9-box flowchart on #090909, a virtual camera moving over it while
// the creator's AI voice explains it. Palette is this video's own: gold accent, red only for "breaks", green only for
// BOOKED / JOB DONE. Every cue hangs off a word index (i) in words.ts. No names, numbers or claims beyond the script.
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EL_FONT } from "../../brand/elevate/theme";
import { WORDS, type W } from "./words";

const C = { bg: "#090909", box: "#151515", line: "#2A2A2A", gold: "#CFA54E", red: "#E5484D", green: "#3DBE7B", white: "#FFFFFF", grey: "#8A8A8A" };
const FPS = 30;
const f = (ms: number) => Math.round((ms / 1000) * FPS);
const byI = new Map(WORDS.map((w) => [w.i, w]));
const at = (i: number) => {
  for (let k = i; k < i + 4; k++) if (byI.has(k)) return f(byI.get(k)!.startMs);
  throw new Error(`no word near ${i}`);
};
const END_CARD = at(400);
export const SYSTEM_MAP_END = Math.max(END_CARD + 75, f(WORDS[WORDS.length - 1].endMs) + 30);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const useIn = (from: number, damping = 15) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - from, fps, config: { damping, stiffness: 170 } });
};
const ramp = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: ease });

// ---------------------------------------------------------------- the map (world coordinates)
type Box = { n: number; title: string; sub: string; x: number; y: number; w: number; h: number; at: number; green?: boolean };
const BW = 520, BH = 150;
const BOXES: Box[] = [
  { n: 1, title: "AD", sub: "your phone clip, city + price", x: 360, y: 200, w: BW, h: BH, at: at(104) },
  { n: 2, title: "FORM", sub: "short, on their phone", x: 720, y: 480, w: BW, h: BH, at: at(127) },
  { n: 3, title: "TEXT BACK", sub: "under 60 seconds", x: 360, y: 760, w: BW, h: BH, at: at(137) },
  { n: 4, title: "FOLLOW-UPS", sub: "day 1, 3, 7", x: 720, y: 1040, w: BW, h: BH, at: at(168) },
  { n: 5, title: "BOOKED", sub: "on your calendar", x: 360, y: 1320, w: BW, h: BH, at: at(186), green: true },
  { n: 6, title: "REMINDER", sub: "before the job", x: 720, y: 1600, w: BW, h: BH, at: at(196) },
  { n: 7, title: "JOB DONE", sub: "paid", x: 360, y: 1880, w: BW, h: BH, at: at(207), green: true },
  { n: 8, title: "REVIEW ASK", sub: "after the job", x: 720, y: 2160, w: BW, h: BH, at: at(211) },
  { n: 9, title: "MONDAY SCORECARD", sub: "", x: 540, y: 2470, w: 660, h: 190, at: at(255) },
];
const B = (n: number) => BOXES[n - 1];
const MAP_CY = 1330;

// which box the voice is explaining (gold border + hand-drawn ellipse)
const FOCUS: [number, number, number][] = [
  [1, at(104), at(122)], [2, at(127), at(130)], [3, at(137), at(163)], [4, at(168), at(184)], [5, at(186), at(192)],
  [6, at(196), at(206)], [7, at(207), at(209)], [8, at(211), at(226)], [9, at(255), at(262)],
];
const focusAt = (frame: number) => FOCUS.find(([, a, b]) => frame >= a && frame < b);

// "breaks" stamps (shot 17): one box per sentence
const BREAKS: [number, string, number, number][] = [
  [1, "WRONG CUSTOMERS", at(303), at(309)], [3, "TOO LATE", at(319), at(322)], [4, "ONE TOUCH", at(330), at(335)],
  [6, "NO-SHOW", at(345), at(349)], [8, "FEWER STARS", at(352), at(359)],
];
const DIM = [at(262), at(291)] as const; // results card over the dimmed map
const ALL_LIT = [at(368), END_CARD] as const;

// ---------------------------------------------------------------- virtual camera
type Cam = { cx: number; cy: number; z: number; ay?: number }; // ay: screen y the target sits at (default 820)
// keep the map centred left-right so the pop-ups beside each box stay on screen; the push-in comes from drift()
const onBox = (n: number, z = 1.05): Cam => ({ cx: 540, cy: B(n).y, z });
// whole map fits between the headline (ends ~y 480) and the captions (start ~y 1670)
const whole = (z = 0.5, ay = 1070): Cam => ({ cx: 540, cy: MAP_CY, z, ay });
const SHOTS: [number, Cam][] = [
  [0, onBox(1)],
  [at(122), onBox(2)],
  [at(130), onBox(3)],
  [at(152), onBox(3, 0.82)],
  [at(163), onBox(4)],
  [at(184), onBox(5)],
  [at(192), onBox(6)],
  [at(206), onBox(7)],
  [at(209), onBox(8)],
  [at(226), whole()],
  [at(250), onBox(9, 1.0)],
  [at(262), whole()],
  [at(303), onBox(1)],
  [at(319), onBox(3)],
  [at(330), onBox(4)],
  [at(345), onBox(6)],
  [at(352), onBox(8)],
  [at(368), whole()],
  [END_CARD, whole(0.42, 640)],
];
const MOVE = 26; // frames per camera move
const drift = (s: Cam, held: number): Cam => ({ ...s, z: s.z * (1 + 0.012 * Math.min(Math.max(held, 0) / FPS, 6)) }); // slow push-in
const camAt = (frame: number): Cam => {
  let k = 0;
  while (k + 1 < SHOTS.length && SHOTS[k + 1][0] <= frame) k++;
  const [start, target] = SHOTS[k];
  if (k === 0) return drift(target, frame - start);
  const [pStart, pTarget] = SHOTS[k - 1];
  const from = drift(pTarget, start - pStart - MOVE);
  const to = drift(target, frame - start - MOVE);
  const p = ramp(frame, start, start + MOVE);
  const lerp = (a: number, b: number) => a + (b - a) * p;
  return { cx: lerp(from.cx, to.cx), cy: lerp(from.cy, to.cy), z: Math.exp(lerp(Math.log(from.z), Math.log(to.z))), ay: lerp(from.ay ?? 820, to.ay ?? 820) };
};

// ---------------------------------------------------------------- drawing helpers
const arrowPath = (a: Box, b: Box) => {
  const x1 = a.x, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y - b.h / 2 - 14;
  const my = (y1 + y2) / 2;
  return { d: `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`, ex: x2, ey: y2, angle: 90 };
};
/** Hand-drawn loop: slightly lumpy, overshoots its start like a marker circle. */
const sketch = (cx: number, cy: number, rx: number, ry: number, seed: number) => {
  const pts: string[] = [];
  const a0 = -2.3 + seed * 0.3;
  for (let t = 0; t <= 1.0001; t += 1 / 90) {
    const a = a0 + t * (Math.PI * 2 + 0.45);
    const wob = 1 + 0.035 * Math.sin(3 * a + seed) + 0.02 * Math.sin(5 * a + 2 * seed) + 0.05 * t;
    pts.push(`${(cx + Math.cos(a) * rx * wob).toFixed(1)} ${(cy + Math.sin(a) * ry * wob).toFixed(1)}`);
  }
  return "M " + pts.join(" L ");
};

const Arrow: React.FC<{ d: string; ex: number; ey: number; angle: number; start: number; color?: string; width?: number; gold: boolean }> = ({ d, ex, ey, angle, start, color = "#5a5a5a", width = 4, gold }) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, start, start + 10);
  if (p <= 0) return null;
  const stroke = gold ? C.gold : color;
  return (
    <g>
      <path d={d} pathLength={1} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeDasharray={1} strokeDashoffset={1 - p} />
      {p > 0.92 ? <polygon points="-14,-11 4,0 -14,11" fill={stroke} transform={`translate(${ex} ${ey}) rotate(${angle})`} /> : null}
    </g>
  );
};

const BoxCard: React.FC<{ b: Box; frame: number; gold: boolean; children?: React.ReactNode }> = ({ b, frame, gold, children }) => {
  const s = useIn(b.at, 13);
  if (frame < b.at) return null;
  const greenOn = b.green && frame >= b.at + (b.n === 5 ? 10 : 0);
  const border = gold ? C.gold : greenOn ? C.green : C.line;
  return (
    <div style={{ position: "absolute", left: b.x - b.w / 2, top: b.y - b.h / 2, width: b.w, height: b.h, borderRadius: 22, boxSizing: "border-box",
      background: greenOn ? "#122419" : C.box, border: `${gold || greenOn ? 4 : 2}px solid ${border}`, padding: "26px 34px", fontFamily: EL_FONT,
      opacity: s, transform: `scale(${0.85 + 0.15 * s})`, boxShadow: gold ? "0 0 60px rgba(207,165,78,0.25)" : "0 20px 50px rgba(0,0,0,0.5)" }}>
      <div style={{ position: "absolute", top: 14, right: 20, fontSize: 24, fontWeight: 700, color: gold ? C.gold : "#6a6a6a" }}>{b.n}</div>
      <div style={{ fontWeight: 800, fontSize: 50, letterSpacing: 3, color: greenOn ? C.green : C.white, lineHeight: 1 }}>{b.title}</div>
      {b.sub ? <div style={{ fontWeight: 500, fontSize: 28, color: C.grey, marginTop: 14 }}>{b.sub}</div> : null}
      {children}
    </div>
  );
};

/** A stamp that slams down at an angle with a little shake. */
const Stamp: React.FC<{ at: number; color: string; angle?: number; size?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at: t, color, angle = -8, size = 54, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < t) return null;
  const s = spring({ frame: frame - t, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  const shake = frame - t < 8 ? Math.sin((frame - t) * 2.4) * (8 - (frame - t)) * 0.9 : 0;
  return (
    <div style={{ position: "absolute", fontFamily: EL_FONT, fontWeight: 800, fontSize: size, letterSpacing: 4, color, border: `6px solid ${color}`, borderRadius: 12,
      padding: "10px 26px", whiteSpace: "nowrap", background: "rgba(9,9,9,0.78)", opacity: Math.min(1, s * 1.5),
      transform: `translate(-50%, -50%) translate(${shake}px, ${shake * 0.6}px) rotate(${angle}deg) scale(${2.3 - 1.3 * s})`, ...style }}>{children}</div>
  );
};

// ---------------------------------------------------------------- world: boxes, arrows, extras
const World: React.FC = () => {
  const frame = useCurrentFrame();
  const fo = focusAt(frame);
  const lit = frame >= ALL_LIT[0];
  const arrowGold = (start: number) => lit || (frame >= start && frame < start + 45);
  const ell = fo ? B(fo[0]) : null;
  const ellP = fo ? ramp(frame, fo[1], fo[1] + 14) : 0;
  const pulse = frame >= at(156) && frame < at(156) + 24 ? 1 + 0.07 * Math.sin(((frame - at(156)) / 12) * Math.PI * 2) ** 2 : 1;
  const loopStart = at(232);
  const b4 = B(4), b5 = B(5), b6 = B(6), b8 = B(8), b3 = B(3), b1 = B(1);
  const timerP = ramp(frame, at(139), at(139) + 50);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 2700 }}>
      <svg width={1080} height={2700} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {BOXES.slice(1).map((b, k) => {
          const a = arrowPath(BOXES[k], b);
          return <Arrow key={b.n} {...a} start={b.at - 12} gold={arrowGold(b.at - 12)} />;
        })}
        {/* paid jobs teach the ads: box 7 back up to box 1 */}
        <Arrow d={`M ${B(7).x - BW / 2} ${B(7).y} C -60 ${B(7).y}, -60 ${b1.y}, ${b1.x - BW / 2 - 14} ${b1.y}`} ex={b1.x - BW / 2 - 14} ey={b1.y} angle={0}
          start={loopStart} color={C.green} width={5} gold={false} />
        {frame >= at(236) ? (
          <text x={30} y={1040} fill={C.green} fontFamily={EL_FONT} fontWeight={800} fontSize={30} letterSpacing={4} textAnchor="middle"
            transform="rotate(-90 30 1040)" opacity={ramp(frame, at(236), at(236) + 10)}>PAID JOBS TEACH THE ADS</text>
        ) : null}
        {ell && ellP > 0 ? (
          <g transform={`translate(${ell.x} ${ell.y}) scale(${pulse}) translate(${-ell.x} ${-ell.y})`}>
            <path d={sketch(ell.x, ell.y, ell.w / 2 + 34, ell.h / 2 + 40, ell.n)} pathLength={1} fill="none" stroke={C.gold} strokeWidth={7}
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - ellP} />
          </g>
        ) : null}
        {/* box 3: 60-second timer ring */}
        {frame >= at(139) && frame < at(163) ? (
          <g transform={`translate(${b3.x + 420} ${b3.y - 60})`} opacity={ramp(frame, at(139), at(139) + 6)}>
            <circle r={62} fill="none" stroke={C.line} strokeWidth={10} />
            <circle r={62} fill="none" stroke={C.gold} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={timerP} transform="rotate(-90)" strokeLinecap="round" />
            <text y={14} textAnchor="middle" fill={C.white} fontFamily={EL_FONT} fontWeight={800} fontSize={42}>{Math.round(60 * (1 - timerP))}</text>
          </g>
        ) : null}
      </svg>

      {BOXES.map((b) => {
        const gold = (fo && fo[0] === b.n) || lit;
        return (
          <BoxCard key={b.n} b={b} frame={frame} gold={!!gold}>
            {b.n === 9 ? <Scorecard frame={frame} /> : null}
          </BoxCard>
        );
      })}

      {/* box 1: CITY + PRICE tags */}
      <Tag x={b1.x + BW / 2 + 40} y={b1.y - 50} at={at(115)}>CITY</Tag>
      <Tag x={b1.x + BW / 2 + 40} y={b1.y + 14} at={at(118)}>PRICE</Tag>
      {/* box 3: the text back */}
      {frame >= at(142) && frame < at(163) ? <TextBubble x={b3.x + BW / 2 + 10} y={b3.y + 20} at={at(142)} /> : null}
      {/* box 4: day 1 / 3 / 7 */}
      {frame >= b4.at ? <DayDots x={b4.x - BW / 2 - 380} y={b4.y} frame={frame} /> : null}
      {/* box 5: a calendar slot fills */}
      {frame >= b5.at ? <Calendar x={b5.x + BW / 2 + 40} y={b5.y - 80} frame={frame} fill={at(190)} /> : null}
      {/* box 6: bell */}
      {frame >= b6.at ? <Bell x={b6.x - BW / 2 - 130} y={b6.y - 55} frame={frame} from={b6.at} /> : null}
      {/* box 8: five stars */}
      {frame >= b8.at ? <Stars x={b8.x - BW / 2 - 400} y={b8.y - 34} frame={frame} from={at(215)} to={at(225)} /> : null}

      {/* shot 17: what breaks */}
      {frame >= BREAKS[0][2] && frame < ALL_LIT[0]
        ? BREAKS.map(([n, label, , t]) => (
            <Stamp key={n} at={t} color={C.red} angle={n % 2 ? -7 : 6} size={44} style={{ left: B(n).x, top: B(n).y }}>✕ {label}</Stamp>
          ))
        : null}
    </div>
  );
};

const Tag: React.FC<{ x: number; y: number; at: number; children: React.ReactNode }> = ({ x, y, at: t, children }) => {
  const s = useIn(t, 11);
  if (useCurrentFrame() < t) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: EL_FONT, fontWeight: 800, fontSize: 32, letterSpacing: 4, color: C.gold,
      border: `3px solid ${C.gold}`, borderRadius: 999, padding: "6px 22px", opacity: s, transform: `scale(${0.6 + 0.4 * s})`, transformOrigin: "left center" }}>{children}</div>
  );
};

const TextBubble: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at: t }) => {
  const s = useIn(t, 12);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 340, fontFamily: EL_FONT, opacity: s, transform: `scale(${0.7 + 0.3 * s})`, transformOrigin: "left top" }}>
      <div style={{ background: "#2f2f2f", color: C.white, fontSize: 28, fontWeight: 500, lineHeight: 1.3, padding: "16px 22px", borderRadius: "26px 26px 26px 6px" }}>
        Hey Mike, got your request...
      </div>
      <div style={{ marginTop: 8, fontSize: 18, letterSpacing: 4, color: C.grey, fontWeight: 700 }}>EXAMPLE</div>
    </div>
  );
};

const DayDots: React.FC<{ x: number; y: number; frame: number }> = ({ x, y, frame }) => {
  const days: [string, number][] = [["DAY 1", at(173)], ["DAY 3", at(175)], ["DAY 7", at(178)]];
  return (
    <div style={{ position: "absolute", left: x, top: y - 50, width: 340, display: "flex", justifyContent: "space-between", fontFamily: EL_FONT }}>
      {days.map(([t, a]) => {
        const on = frame >= a;
        const p = ramp(frame, a, a + 6);
        return (
          <div key={t} style={{ textAlign: "center" }}>
            <div style={{ width: 44, height: 44, margin: "0 auto", borderRadius: 99, border: `3px solid ${on ? C.gold : C.line}`, background: on ? C.gold : "transparent",
              transform: `scale(${1 + 0.35 * Math.sin(p * Math.PI)})`, boxShadow: on ? "0 0 24px rgba(207,165,78,0.6)" : "none" }} />
            <div style={{ marginTop: 12, fontWeight: 800, fontSize: 26, letterSpacing: 2, color: on ? C.white : "#555" }}>{t}</div>
          </div>
        );
      })}
    </div>
  );
};

const Calendar: React.FC<{ x: number; y: number; frame: number; fill: number }> = ({ x, y, frame, fill }) => {
  const p = ramp(frame, fill, fill + 10);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 300, padding: 14, background: C.box, border: `2px solid ${C.line}`, borderRadius: 16,
      display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, opacity: ramp(frame, fill - 20, fill - 10) }}>
      {Array.from({ length: 15 }, (_, k) => (
        <div key={k} style={{ height: 34, borderRadius: 6, background: k === 7 ? `rgba(61,190,123,${0.15 + 0.85 * p})` : "#202020",
          transform: k === 7 ? `scale(${1 + 0.25 * Math.sin(p * Math.PI)})` : undefined }} />
      ))}
    </div>
  );
};

const Bell: React.FC<{ x: number; y: number; frame: number; from: number }> = ({ x, y, frame, from }) => {
  const t = frame - from;
  const swing = t < 40 ? Math.sin(t * 0.7) * 22 * (1 - t / 40) : 0;
  return (
    <svg width={110} height={110} viewBox="0 0 24 24" style={{ position: "absolute", left: x, top: y, transform: `rotate(${swing}deg)`, transformOrigin: "50% 10%", opacity: ramp(frame, from, from + 6) }}>
      <path d="M12 2a6 6 0 0 0-6 6v4l-2 3h16l-2-3V8a6 6 0 0 0-6-6z M9.5 18a2.5 2.5 0 0 0 5 0" fill="none" stroke={C.gold} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
};

const Stars: React.FC<{ x: number; y: number; frame: number; from: number; to: number }> = ({ x, y, frame, from, to }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", gap: 10 }}>
    {Array.from({ length: 5 }, (_, k) => {
      const a = from + ((to - from) * k) / 5;
      const p = ramp(frame, a, a + 6);
      return (
        <svg key={k} width={64} height={64} viewBox="0 0 24 24" style={{ transform: `scale(${1 + 0.3 * Math.sin(p * Math.PI)})` }}>
          <path d="M12 2l3 6.5 7 .9-5.1 4.8 1.3 7L12 17.8 5.8 21.2l1.3-7L2 9.4l7-.9z" fill={p > 0 ? C.gold : "none"} fillOpacity={p} stroke={p > 0 ? C.gold : "#555"} strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      );
    })}
  </div>
);

const Scorecard: React.FC<{ frame: number }> = ({ frame }) => {
  const words: [string, number][] = [["LEADS", at(257)], ["BOOKED JOBS", at(258)], ["MONEY BOOKED", at(260)]];
  return (
    <div style={{ display: "flex", gap: 20, marginTop: 22 }}>
      {words.map(([t, a]) => (
        <span key={t} style={{ fontWeight: 800, fontSize: 26, letterSpacing: 1.5, whiteSpace: "nowrap", color: frame >= a ? C.gold : "#4a4a4a" }}>{t}</span>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- screen space: intro, headline, card, end, captions
const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const H: [number, string][] = [
    [at(0), "11:00 AM. THEY ASK FOR A PRICE."], [at(25), "6:00 PM?"], [at(27), "TOMORROW?"], [at(35), "IT'S NOT YOU."],
    [at(58), "ON THE TOOLS, NOT THE PHONE"], [at(72), "A SYSTEM THAT ANSWERS FOR YOU"], [at(93), "HOW IT WORKS"], [at(101), "IT STARTS WITH AN AD"],
    [at(106), "FILMED ON YOUR PHONE"], [at(122), "A SHORT FORM"], [at(139), "UNDER 60 SECONDS"], [at(152), "WHERE JOBS ARE WON OR LOST"],
    [at(163), "DAY 1, 3 AND 7"], [at(180), "YOU DON'T TOUCH IT"], [at(184), "ON YOUR CALENDAR"], [at(192), "A REMINDER BEFORE THE JOB"],
    [at(200), "MORE OF THEM SHOW UP"], [at(206), "THEN A REVIEW ASK"], [at(222), "MORE STARS"], [at(226), "PAID JOBS TEACH THE ADS"],
    [at(238), "MORE PEOPLE LIKE THE ONES WHO PAID"], [at(250), "ONE SCORECARD, EVERY MONDAY"], [at(262), ""], [at(291), "SET UP WRONG, IT BREAKS"],
    [at(303), ""], [at(368), ""], [at(383), "NO PROMISED NUMBERS."], [at(391), "EVERY NUMBER, EVERY MONDAY."], [END_CARD, ""],
  ];
  let k = -1;
  for (let j = 0; j < H.length; j++) if (frame >= H[j][0]) k = j;
  if (k < 0 || !H[k][1]) return null;
  const [start, text] = H[k];
  const end = k + 1 < H.length ? H[k + 1][0] : SYSTEM_MAP_END;
  const o = Math.min(ramp(frame, start, start + 8), 1 - ramp(frame, end - 6, end));
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 190, height: 330, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
      fontFamily: EL_FONT, fontWeight: 800, fontSize: text.length > 22 ? 62 : 80, letterSpacing: 6, lineHeight: 1.12, color: C.white, opacity: o,
      transform: `translateY(${(1 - ramp(frame, start, start + 8)) * 18}px)`, textShadow: "0 6px 30px rgba(0,0,0,0.9)" }}>{text}</div>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= at(93) + 15) return null;
  const out = 1 - ramp(frame, at(93), at(93) + 15);
  const phoneScene = frame < at(35) + 10;
  const sceneOut = 1 - ramp(frame, at(35), at(35) + 10);
  // clock: 11:00 -> 6:00 (7 hours forward) between "When do they hear back" and "6 o'clock"
  const spin = ramp(frame, at(18), at(26));
  const hour = 330 + 210 * spin, minute = 360 * 7 * spin;
  const pm = spin >= 1;
  return (
    <AbsoluteFill style={{ opacity: out, fontFamily: EL_FONT }}>
      {phoneScene ? (
        <div style={{ position: "absolute", inset: 0, opacity: sceneOut }}>
          <PopIn at={0} style={{ left: 120, top: 640, width: 400, height: 720 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 60, border: `8px solid ${C.line}`, background: "#0f0f0f", position: "relative", boxSizing: "border-box" }}>
              <div style={{ position: "absolute", left: "50%", top: 18, width: 100, height: 24, marginLeft: -50, borderRadius: 20, background: "#000" }} />
              <PopIn at={6} style={{ left: 26, top: 110, width: 300 }}>
                <div style={{ background: "#2f2f2f", color: C.white, fontSize: 30, fontWeight: 500, lineHeight: 1.3, padding: "16px 22px", borderRadius: "26px 26px 26px 6px" }}>How much would that be?</div>
              </PopIn>
            </div>
          </PopIn>
          <PopIn at={8} style={{ left: 600, top: 760, width: 340, height: 420 }}>
            <svg width={340} height={340} viewBox="-170 -170 340 340">
              <circle r={150} fill={C.box} stroke={C.line} strokeWidth={6} />
              {Array.from({ length: 12 }, (_, k) => <line key={k} x1={0} y1={-128} x2={0} y2={-112} stroke="#555" strokeWidth={6} transform={`rotate(${k * 30})`} />)}
              <line x1={0} y1={0} x2={0} y2={-70} stroke={C.white} strokeWidth={10} strokeLinecap="round" transform={`rotate(${hour})`} />
              <line x1={0} y1={0} x2={0} y2={-108} stroke={C.gold} strokeWidth={6} strokeLinecap="round" transform={`rotate(${minute})`} />
              <circle r={10} fill={C.gold} />
            </svg>
            <div style={{ textAlign: "center", marginTop: 14, fontWeight: 800, fontSize: 50, letterSpacing: 4, color: pm ? C.gold : C.white }}>{pm ? "6:00 PM" : "11:00 AM"}</div>
          </PopIn>
          <Stamp at={at(31)} color={C.red} angle={-9} size={50} style={{ left: 320, top: 1000 }}>BOOKED SOMEONE ELSE</Stamp>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 140, right: 140, top: 720, opacity: 1 - ramp(frame, at(72), at(72) + 10) }}>
          {([["GOOD WORK", at(44)], ["GOOD REVIEWS", at(48)], ["BUSY ON THE JOB", at(52)]] as [string, number][]).map(([t, a]) => <Check key={t} at={a}>{t}</Check>)}
        </div>
      )}
      {frame >= at(88) && frame < at(88) + 75 ? <LeadsButton from={at(88)} leaveAt={at(88) + 60} top={900} /> : null}
    </AbsoluteFill>
  );
};

const PopIn: React.FC<{ at: number; style: React.CSSProperties; children: React.ReactNode }> = ({ at: t, style, children }) => {
  const s = useIn(t, 13);
  return <div style={{ position: "absolute", opacity: s, transform: `scale(${0.8 + 0.2 * s})`, ...style }}>{children}</div>;
};

const Check: React.FC<{ at: number; children: React.ReactNode }> = ({ at: t, children }) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, t, t + 8);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 46, fontFamily: EL_FONT, opacity: 0.25 + 0.75 * p }}>
      <svg width={70} height={70} viewBox="0 0 24 24">
        <rect x={1.5} y={1.5} width={21} height={21} rx={5} fill="none" stroke={p > 0 ? C.gold : "#444"} strokeWidth={1.6} />
        <path d="M6 12.5l4 4 8-9" fill="none" stroke={C.gold} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      </svg>
      <div style={{ fontWeight: 800, fontSize: 60, letterSpacing: 5, color: C.white }}>{children}</div>
    </div>
  );
};

const LeadsButton: React.FC<{ from: number; leaveAt?: number; top: number }> = ({ from, leaveAt, top }) => {
  const frame = useCurrentFrame();
  const s = useIn(from, 12);
  const away = leaveAt ? ramp(frame, leaveAt, leaveAt + 14) : 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: EL_FONT, opacity: s * (1 - away),
      transform: `translateX(${-away * 700}px) scale(${0.8 + 0.2 * s})` }}>
      <div style={{ display: "inline-block", background: C.gold, color: "#0b0b0b", fontWeight: 800, fontSize: 66, letterSpacing: 4, padding: "30px 60px", borderRadius: 18,
        boxShadow: "0 20px 60px rgba(207,165,78,0.35)" }}>DM "LEADS"</div>
    </div>
  );
};

const ResultCard: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useIn(at(267), 14);
  if (frame < at(267) || frame >= DIM[1] + 12) return null;
  const out = ramp(frame, DIM[1], DIM[1] + 12);
  const count = (to: number, a: number) => Math.round(to * ramp(frame, a, a + 24));
  // lines keep their space before they appear, so the card doesn't jump
  const line = (a: number, children: React.ReactNode, style: React.CSSProperties = {}) => (
    <div style={{ opacity: frame >= a ? ramp(frame, a, a + 6) : 0, transform: `translateY(${(1 - ramp(frame, a, a + 8)) * 20}px)`, lineHeight: 1.05, ...style }}>{children}</div>
  );
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 520, padding: "56px 40px", background: C.box, border: `2px solid ${C.line}`, borderRadius: 28, textAlign: "center",
      fontFamily: EL_FONT, color: C.white, opacity: s * (1 - out), transform: `scale(${0.92 + 0.08 * s}) translateY(${-out * 60}px)` }}>
      <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: 7, color: C.grey }}>ONE SHOP WE WORK WITH</div>
      {line(at(272), <><span style={{ fontWeight: 800, fontSize: 130 }}>{count(30, at(272))}</span><div style={{ fontWeight: 800, fontSize: 36, letterSpacing: 6 }}>PAID JOBS</div></>, { marginTop: 30 })}
      {line(at(277), <span style={{ fontWeight: 800, fontSize: 118, color: C.gold }}>${count(10264, at(277)).toLocaleString("en-US")}</span>, { marginTop: 26 })}
      {line(at(280), <><span style={{ fontWeight: 800, fontSize: 130 }}>{count(45, at(280))}</span><div style={{ fontWeight: 800, fontSize: 36, letterSpacing: 6 }}>DAYS</div></>, { marginTop: 26 })}
      {line(at(283), <span style={{ fontWeight: 500, fontSize: 30, color: C.grey }}>$3,271 spent on ads in the same 45 days</span>, { marginTop: 34 })}
    </div>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < END_CARD) return null;
  const u = ramp(frame, END_CARD + 12, END_CARD + 24);
  return (
    <>
      <LeadsButton from={END_CARD + 6} top={1290} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1460, textAlign: "center", fontFamily: EL_FONT, fontWeight: 700, fontSize: 44, letterSpacing: 2, color: C.white, opacity: u }}>elevate-mk-tg.com</div>
    </>
  );
};

// word-by-word captions, 1-3 words, white, bottom centre
type Chunk = { from: number; to: number; text: string };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: W[] = [];
  const flush = () => {
    if (!cur.length) return;
    const last = cur[cur.length - 1];
    out.push({ from: f(cur[0].startMs), to: f(Math.min(last.endMs, last.startMs + 600)) + 3, text: cur.map((w) => w.text).join(" ").replace(/[.,:?]$/, "") });
    cur = [];
  };
  for (const w of WORDS) {
    const cand = [...cur, w].map((x) => x.text).join(" ");
    if (cur.length >= 3 || (cur.length > 0 && cand.length > 16)) flush();
    cur.push(w);
    if (/[.?!,:]$/.test(w.text)) flush();
  }
  flush();
  return out;
})();
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const c = CHUNKS.find((x) => frame >= x.from && frame < x.to);
  if (!c) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <text x={540} y={1740} textAnchor="middle" fontFamily={EL_FONT} fontWeight={800} fontSize={72} letterSpacing={-1} fill={C.white} stroke="#000" strokeWidth={12}
        style={{ paintOrder: "stroke" }}>{c.text}</text>
    </svg>
  );
};

export const SystemMap: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const mapIn = ramp(frame, at(93), at(93) + 15);
  const dim = frame >= DIM[0] && frame < DIM[1] ? 1 - 0.75 * ramp(frame, DIM[0], DIM[0] + 12) : frame >= DIM[1] && frame < DIM[1] + 12 ? 0.25 + 0.75 * ramp(frame, DIM[1], DIM[1] + 12) : 1;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile("recordings/system-map.m4a")} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 2700, opacity: mapIn * dim, transformOrigin: "0 0",
        transform: `translate(540px, ${cam.ay ?? 820}px) scale(${cam.z}) translate(${-cam.cx}px, ${-cam.cy}px)` }}>
        <World />
      </div>
      {/* while zoomed in, fade the map out under the headline and the captions so nothing sits behind them */}
      <AbsoluteFill style={{ pointerEvents: "none", opacity: interpolate(cam.z, [0.7, 0.95], [0, 1], clamp),
        background: `linear-gradient(to bottom, ${C.bg} 0%, ${C.bg} 23%, rgba(9,9,9,0) 33%, rgba(9,9,9,0) 76%, ${C.bg} 84%, ${C.bg} 100%)` }} />
      <Intro />
      <ResultCard />
      {frame >= at(371) && frame < END_CARD ? (
        <>
          <Stamp at={at(371)} color={C.white} angle={-6} size={64} style={{ left: 540, top: 900 }}>WE SET IT UP.</Stamp>
          <Stamp at={at(380)} color={C.white} angle={-6} size={56} style={{ left: 560, top: 1050 }}>ABOUT A WEEK.</Stamp>
        </>
      ) : null}
      <EndCard />
      <Headline />
      <Captions />
    </AbsoluteFill>
  );
};
