// System map, Day 3 (prompts/system-map-flowchart.md look + the Day 3 shot list): one touch -> they were busy, not
// saying no -> box 4, the follow-ups on day 1, 3 and 7 -> the first text gets the ready, the next two get the busy ->
// leads left on the table. Same map, palette and camera as Days 1-2. Two cuts: trimmed voice-over and 1.12x (`fast`).
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EL_FONT } from "../../brand/elevate/theme";
import { Arrow, B, BOXES, BoxCard, C, LeadsButton, MAP_CY, Stamp, arrowPath, clamp, ramp, sketch, useIn } from "../system-map/SystemMap";
import { WORDS_FAST, WORDS_FASTER, WORDS_NORMAL, type W } from "./words";

const FPS = 30;
const f = (ms: number) => Math.round((ms / 1000) * FPS);
type T = { at: (i: number) => number; words: W[]; end: number };
const makeT = (words: W[]): T => {
  const by = new Map(words.map((w) => [w.i, w]));
  return { at: (i: number) => f(by.get(i)!.startMs), words, end: f(words[words.length - 1].endMs) + 75 };
};
type Speed = "normal" | "fast" | "faster";
const TS: Record<Speed, T> = { normal: makeT(WORDS_NORMAL), fast: makeT(WORDS_FAST), faster: makeT(WORDS_FASTER) };
const AUDIO: Record<Speed, string> = { normal: "recordings/system-map-day3.m4a", fast: "recordings/system-map-day3-fast.m4a", faster: "recordings/system-map-day3-faster.m4a" };
export const DAY3_END = TS.normal.end, DAY3_FAST_END = TS.fast.end, DAY3_FASTER_END = TS.faster.end;
const Ctx = createContext<T>(TS.normal);

// ---------------------------------------------------------------- camera
type Cam = { cy: number; z: number; ay: number };
const camAt = (frame: number, at: T["at"]): Cam => {
  const shots: [number, Cam][] = [
    [0, { cy: B(4).y, z: 1.05, ay: 760 }],
    [at(56), { cy: (B(4).y + B(5).y) / 2, z: 0.85, ay: 730 }], // box 4 and box 5 together, the split underneath
    [at(97), { cy: MAP_CY, z: 0.42, ay: 640 }], // end card
  ];
  let k = 0;
  while (k + 1 < shots.length && shots[k + 1][0] <= frame) k++;
  const [start, to] = shots[k];
  const push = (c: Cam, held: number) => ({ ...c, z: c.z * (1 + 0.012 * Math.min(Math.max(held, 0) / FPS, 6)) });
  if (k === 0) return push(to, frame - at(28));
  const [ps, from] = shots[k - 1];
  const a = push(from, start - (k === 1 ? at(28) : ps) - 26), b = push(to, frame - start - 26);
  const p = ramp(frame, start, start + 26);
  const l = (x: number, y: number) => x + (y - x) * p;
  return { cy: l(a.cy, b.cy), z: Math.exp(l(Math.log(a.z), Math.log(b.z))), ay: l(a.ay, b.ay) };
};

// ---------------------------------------------------------------- the map
const MapWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { at } = useContext(Ctx);
  const on4 = frame >= at(30) && frame < at(97); // box 4 is the subject
  const goldOn = at(30);
  const ellP = ramp(frame, goldOn, goldOn + 14);
  const arrow45 = frame >= at(65);
  const green5 = frame >= at(70);
  const split = frame >= at(56) && frame < at(97);
  const dimOf = (n: number) => (split ? (n === 4 || n === 5 ? 1 : 0.08) : on4 && n !== 4 ? 0.3 : 1);
  const b4 = B(4);
  const days: [string, number][] = [["DAY 1", at(39)], ["DAY 3", at(43)], ["DAY 7", at(47)]];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 2700 }}>
      <svg width={1080} height={2700} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {BOXES.slice(1).map((b, k) => (
          <g key={b.n} opacity={split ? (b.n === 5 ? 1 : 0.08) : on4 ? 0.3 : 1}>
            <Arrow {...arrowPath(BOXES[k], b)} start={-30} gold={b.n === 5 && arrow45} />
          </g>
        ))}
        <g opacity={split ? 0.08 : on4 ? 0.25 : 1}>
          <Arrow d={`M ${B(7).x - 260} ${B(7).y} C -60 ${B(7).y}, -60 ${B(1).y}, ${B(1).x - 274} ${B(1).y}`} ex={B(1).x - 274} ey={B(1).y} angle={0} start={-30} color={C.green} width={5} gold={false} />
        </g>
        {on4 && ellP > 0 ? (
          <path d={sketch(b4.x, b4.y, b4.w / 2 + 34, b4.h / 2 + 40, 4)} pathLength={1} fill="none" stroke={C.gold} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={1} strokeDashoffset={1 - ellP} />
        ) : null}
      </svg>
      {BOXES.map((b) => (
        <div key={b.n} style={{ opacity: dimOf(b.n) }}>
          <BoxCard b={{ ...b, at: -30, green: b.n === 5 ? green5 : b.green }} frame={frame} gold={on4 && b.n === 4} />
        </div>
      ))}
      {/* three dots under box 4, each sending a small text */}
      {frame >= at(35) && frame < at(56) ? (
        <div style={{ position: "absolute", left: b4.x - 210, top: b4.y + 110, width: 420, display: "flex", justifyContent: "space-between", fontFamily: EL_FONT,
          opacity: ramp(frame, at(35), at(35) + 8) * (1 - ramp(frame, at(56) - 8, at(56))) }}>
          {days.map(([t, a]) => <DayDot key={t} label={t} at={a} />)}
        </div>
      ) : null}
    </div>
  );
};

/** A small blank text bubble (two lines of "text"): it's the shape of a message, not a message. */
const MiniBubble: React.FC<{ w?: number; color?: string }> = ({ w = 120, color = "#2f2f2f" }) => (
  <div style={{ width: w, padding: "12px 14px", background: color, borderRadius: "18px 18px 18px 5px", boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
    <div style={{ height: 8, width: "90%", borderRadius: 4, background: "rgba(255,255,255,0.75)" }} />
    <div style={{ height: 8, width: "60%", borderRadius: 4, background: "rgba(255,255,255,0.75)", marginTop: 8 }} />
  </div>
);

const DayDot: React.FC<{ label: string; at: number }> = ({ label, at: a }) => {
  const frame = useCurrentFrame();
  const on = frame >= a;
  const p = ramp(frame, a, a + 6);
  const fly = ramp(frame, a + 2, a + 26);
  return (
    <div style={{ position: "relative", width: 110, textAlign: "center" }}>
      {on ? (
        <div style={{ position: "absolute", left: -5, top: 100 + 30 * fly, opacity: Math.min(1, fly * 4) * (1 - ramp(frame, a + 40, a + 52)), transform: `scale(${0.6 + 0.4 * Math.min(1, fly * 2)})` }}>
          <MiniBubble />
        </div>
      ) : null}
      <div style={{ width: 44, height: 44, margin: "0 auto", borderRadius: 99, border: `3px solid ${on ? C.gold : C.line}`, background: on ? C.gold : "transparent",
        transform: `scale(${1 + 0.35 * Math.sin(p * Math.PI)})`, boxShadow: on ? "0 0 24px rgba(207,165,78,0.6)" : "none" }} />
      <div style={{ marginTop: 12, fontWeight: 800, fontSize: 28, letterSpacing: 2, color: on ? C.white : "#555" }}>{label}</div>
    </div>
  );
};

// ---------------------------------------------------------------- screen space
const LeadIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 200, style }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.22, background: C.box, border: `3px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.6)", ...style }}>
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24">
      <circle cx={12} cy={8} r={4.2} fill="none" stroke={C.white} strokeWidth={1.7} />
      <path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5" fill="none" stroke={C.white} strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  </div>
);

/** Shots 1-2: one lead, one text, nothing back; then BUSY / AT WORK / FORGOT float up around it. */
const OneTouch: React.FC = () => {
  const frame = useCurrentFrame();
  const { at } = useContext(Ctx);
  const s = useIn(0, 13);
  if (frame >= at(28) + 10) return null;
  const out = 1 - ramp(frame, at(28), at(28) + 10);
  const send = ramp(frame, at(6), at(9));
  const silent = frame >= at(10);
  const tags: [string, number, number, number][] = [["BUSY", at(20), -250, -170], ["AT WORK", at(24), 160, -150], ["FORGOT", at(27), -40, 260]];
  return (
    <AbsoluteFill style={{ opacity: out, fontFamily: EL_FONT }}>
      <div style={{ position: "absolute", left: 640, top: 760, opacity: s, transform: `scale(${0.8 + 0.2 * s})` }}>
        <LeadIcon size={240} />
        <div style={{ marginTop: 16, textAlign: "center", fontWeight: 800, fontSize: 30, letterSpacing: 5, color: C.grey }}>LEAD</div>
      </div>
      {/* the one text: flies from the left to the lead, then sits there unanswered */}
      {frame >= at(6) ? (
        <div style={{ position: "absolute", left: 120 + 330 * send, top: 820 - 40 * Math.sin(send * Math.PI), opacity: Math.min(1, send * 3) }}>
          <MiniBubble w={150} color="#1f7aff" />
          {silent ? <div style={{ marginTop: 10, fontSize: 22, fontWeight: 700, color: C.grey, opacity: ramp(frame, at(10), at(10) + 8) }}>Delivered · no reply</div> : null}
        </div>
      ) : null}
      {tags.map(([t, a, dx, dy]) => {
        if (frame < a) return null;
        const p = ramp(frame, a, a + 16);
        const drift = Math.sin((frame - a) / 14) * 6;
        return (
          <div key={t} style={{ position: "absolute", left: 760 + dx, top: 880 + dy - 50 * p + drift, opacity: Math.min(1, p * 2), transform: `translateX(-50%) scale(${0.7 + 0.3 * p})`,
            fontWeight: 800, fontSize: 34, letterSpacing: 4, color: "#bdbdbd", background: "#1c1c1c", border: `2px solid ${C.line}`, borderRadius: 999, padding: "10px 26px" }}>{t}</div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Shot 5: READY gets text 1; BUSY gets texts 2 and 3. */
const Split: React.FC = () => {
  const frame = useCurrentFrame();
  const { at } = useContext(Ctx);
  if (frame < at(56) || frame >= at(75) + 10) return null;
  const o = ramp(frame, at(56), at(56) + 10) * (1 - ramp(frame, at(75), at(75) + 10));
  const col = (label: string, from: number, n: number, tags: string[]) => (
    <div style={{ flex: 1, background: C.box, border: `2px solid ${frame >= from ? C.gold : C.line}`, borderRadius: 24, padding: "30px 24px", minHeight: 300,
      opacity: ramp(frame, from, from + 8), transform: `translateY(${(1 - ramp(frame, from, from + 10)) * 30}px)` }}>
      <div style={{ fontWeight: 800, fontSize: 46, letterSpacing: 6, color: C.white, textAlign: "center" }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 26 }}>
        {Array.from({ length: n }, (_, k) => {
          const a = from + 6 + k * 10;
          const p = ramp(frame, a, a + 8);
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 14, opacity: p, transform: `scale(${0.7 + 0.3 * p})` }}>
              <MiniBubble w={170} color="#1f7aff" />
              <span style={{ fontWeight: 800, fontSize: 24, letterSpacing: 3, color: C.gold }}>{tags[k]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1010, display: "flex", gap: 28, fontFamily: EL_FONT, opacity: o }}>
      {col("READY", at(57), 1, ["TEXT 1"])}
      {col("BUSY", at(65), 2, ["TEXT 2", "TEXT 3"])}
    </div>
  );
};

/** Shot 6: a stack of leads slides off the screen; red stamp. */
const OffTheTable: React.FC = () => {
  const frame = useCurrentFrame();
  const { at } = useContext(Ctx);
  const s = useIn(at(88), 13);
  if (frame < at(88) || frame >= at(97)) return null;
  const slide = ramp(frame, at(92), at(96));
  const out = 1 - ramp(frame, at(97) - 6, at(97));
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {Array.from({ length: 5 }, (_, k) => (
        <div key={k} style={{ position: "absolute", left: 300 + k * 34 + slide * (900 + k * 40), top: 820 - k * 26, opacity: s, transform: `rotate(${(k - 2) * 4 + slide * 18}deg) scale(${0.85 + 0.15 * s})` }}>
          <LeadIcon size={200} />
        </div>
      ))}
      <Stamp at={at(95)} color={C.red} angle={-8} size={56} style={{ left: 540, top: 1000 }}>PAID FOR. NEVER WORKED.</Stamp>
    </AbsoluteFill>
  );
};

const BigX: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const s = useIn(from, 10);
  if (frame < from || frame >= to) return null;
  const t = frame - from;
  const shake = t < 8 ? Math.sin(t * 2.4) * (8 - t) * 1.2 : 0;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: Math.min(1, s * 1.6) * (1 - ramp(frame, to - 6, to)) }}>
      <g transform={`translate(${540 + shake} 355) scale(${2 - s}) rotate(-4)`}>
        <path d="M -270 -90 L 270 90 M 270 -90 L -270 90" stroke={C.red} strokeWidth={22} strokeLinecap="round" />
      </g>
    </svg>
  );
};

const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const { at, end } = useContext(Ctx);
  const H: [number, string][] = [
    [0, ""], [at(5), "ONE TOUCH"], [at(14), "THEY'RE NOT SAYING NO"], [at(28), "THE SYSTEM KEEPS GOING"], [at(35), "DAY 1, 3 AND 7"],
    [at(48), "SHORT AND FRIENDLY"], [at(56), ""], [at(79), "\"I CALLED ONCE.\""], [at(87), "PAYING FOR LEADS"], [at(97), ""], [end, ""],
  ];
  let k = 0;
  for (let j = 0; j < H.length; j++) if (frame >= H[j][0]) k = j;
  const [start, text] = H[k];
  if (!text) return null;
  const stop = H[k + 1][0];
  const o = Math.min(ramp(frame, start, start + 8), 1 - ramp(frame, stop - 6, stop));
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 190, height: 330, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
      fontFamily: EL_FONT, fontWeight: 800, fontSize: text.length > 20 ? 64 : 92, letterSpacing: 6, lineHeight: 1.12, color: C.white, opacity: o,
      transform: `translateY(${(1 - ramp(frame, start, start + 8)) * 18}px)`, textShadow: "0 6px 30px rgba(0,0,0,0.9)" }}>{text}</div>
  );
};

const chunk = (words: W[]) => {
  const out: { from: number; to: number; text: string }[] = [];
  let cur: W[] = [];
  const flush = () => {
    if (!cur.length) return;
    const last = cur[cur.length - 1];
    out.push({ from: f(cur[0].startMs), to: f(Math.min(last.endMs, last.startMs + 600)) + 3, text: cur.map((w) => w.text).join(" ").replace(/[.,:?"]+$/, "").replace(/^"/, "") });
    cur = [];
  };
  for (const w of words) {
    const cand = [...cur, w].map((x) => x.text).join(" ");
    if (cur.length >= 3 || (cur.length > 0 && cand.length > 16)) flush();
    cur.push(w);
    if (/[.?!,:]"?$/.test(w.text)) flush();
  }
  flush();
  return out;
};
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { words } = useContext(Ctx);
  const c = chunk(words).find((x) => frame >= x.from && frame < x.to);
  if (!c) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <text x={540} y={1740} textAnchor="middle" fontFamily={EL_FONT} fontWeight={800} fontSize={72} letterSpacing={-1} fill={C.white} stroke="#000" strokeWidth={12} style={{ paintOrder: "stroke" }}>{c.text}</text>
    </svg>
  );
};

const Day3: React.FC<{ speed: Speed }> = ({ speed }) => {
  const frame = useCurrentFrame();
  const { at } = useContext(Ctx);
  const cam = camAt(frame, at);
  const mapO = frame < at(28) ? 0 : frame < at(75) ? ramp(frame, at(28), at(28) + 12) : frame < at(97) ? 1 - 0.85 * ramp(frame, at(75), at(75) + 10) : 0.15 + 0.85 * ramp(frame, at(97), at(97) + 10);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile(AUDIO[speed])} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 2700, opacity: mapO, transformOrigin: "0 0",
        transform: `translate(540px, ${cam.ay}px) scale(${cam.z}) translate(-540px, ${-cam.cy}px)` }}>
        <MapWorld />
      </div>
      <AbsoluteFill style={{ pointerEvents: "none", opacity: frame >= at(28) && frame < at(97) ? interpolate(cam.z, [0.7, 0.95], [0, 1], clamp) : 0,
        background: `linear-gradient(to bottom, ${C.bg} 0%, ${C.bg} 23%, rgba(9,9,9,0) 31%, rgba(9,9,9,0) 78%, ${C.bg} 85%, ${C.bg} 100%)` }} />
      <OneTouch />
      <Split />
      <OffTheTable />
      {frame >= at(97) ? (
        <>
          <LeadsButton from={at(97) + 8} top={1300} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1470, textAlign: "center", fontFamily: EL_FONT, fontWeight: 700, fontSize: 44, letterSpacing: 2, color: C.white,
            opacity: ramp(frame, at(97) + 18, at(97) + 30) }}>elevate-mk-tg.com</div>
        </>
      ) : null}
      <Headline />
      <BigX from={at(10)} to={at(14)} />
      <Captions />
    </AbsoluteFill>
  );
};

export const SystemMapDay3: React.FC<{ speed?: Speed }> = ({ speed = "normal" }) => (
  <Ctx.Provider value={TS[speed]}>
    <Day3 speed={speed} />
  </Ctx.Provider>
);
