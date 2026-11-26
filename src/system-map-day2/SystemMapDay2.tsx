// System map, Day 2 (prompts/system-map-flowchart.md look + the Day 2 shot list): "better leads?" -> the late callback
// -> the fix is box 3, the text back. Same map, palette and camera as Day 1 (shared pieces from ../system-map), plus the
// creator's stick-figure poses (public/images/stick/) as a small guide. Two cuts: the trimmed voice-over, and the same
// at 1.12x (`fast`). Every cue hangs off a word index; the two transcripts have the same 96 words.
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EL_FONT } from "../../brand/elevate/theme";
import { Arrow, B, BOXES, BoxCard, C, LeadsButton, MAP_CY, arrowPath, clamp, ramp, sketch, useIn } from "../system-map/SystemMap";
import { WORDS_FAST, WORDS_NORMAL, type W } from "./words";

const FPS = 30;
const f = (ms: number) => Math.round((ms / 1000) * FPS);
type T = { at: (i: number) => number; words: W[]; end: number };
const makeT = (words: W[]): T => {
  const by = new Map(words.map((w) => [w.i, w]));
  const at = (i: number) => f(by.get(i)!.startMs);
  return { at, words, end: f(words[words.length - 1].endMs) + 75 };
};
const TN = makeT(WORDS_NORMAL), TF = makeT(WORDS_FAST);
export const DAY2_END = TN.end, DAY2_FAST_END = TF.end;
const Ctx = createContext<T>(TN);

// ---------------------------------------------------------------- camera (same transform as Day 1)
type Cam = { cy: number; z: number; ay: number };
const camAt = (frame: number, at: T["at"]): Cam => {
  const whole: Cam = { cy: MAP_CY, z: 0.42, ay: 1000 };
  const box3: Cam = { cy: B(3).y, z: 1.05, ay: 700 };
  const end: Cam = { cy: MAP_CY, z: 0.42, ay: 640 };
  const shots: [number, Cam][] = [[0, whole], [at(40), box3], [at(85), end]];
  let k = 0;
  while (k + 1 < shots.length && shots[k + 1][0] <= frame) k++;
  const [start, to] = shots[k];
  const push = (c: Cam, held: number) => ({ ...c, z: c.z * (1 + 0.012 * Math.min(Math.max(held, 0) / FPS, 6)) });
  if (k === 0) return push(to, frame - start);
  const [ps, from] = shots[k - 1];
  const a = push(from, start - ps - 26), b = push(to, frame - start - 26);
  const p = ramp(frame, start, start + 26);
  const l = (x: number, y: number) => x + (y - x) * p;
  return { cy: l(a.cy, b.cy), z: Math.exp(l(Math.log(a.z), Math.log(b.z))), ay: l(a.ay, b.ay) };
};

// ---------------------------------------------------------------- the map
const MapWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { at } = useContext(Ctx);
  const fix = frame >= at(40) && frame < at(85); // box 3 is the subject
  const rest = fix && frame >= at(80) ? 0.3 + 0.7 * (1 - ramp(frame, at(80), at(80) + 8)) : 1; // phone shot: everything but box 3 steps back further
  const goldOn = at(43);
  const gray = frame < at(9);
  const b3 = B(3);
  const ellP = ramp(frame, goldOn, goldOn + 14);
  const timerA = at(50), timerP = ramp(frame, timerA, at(56));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 2700, filter: gray ? "grayscale(1)" : undefined }}>
      <svg width={1080} height={2700} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {BOXES.slice(1).map((b, k) => (
          <g key={b.n} opacity={fix && b.n !== 3 ? 0.3 * rest : gray ? 0.55 : 1}>
            <Arrow {...arrowPath(BOXES[k], b)} start={-30} gold={fix && b.n === 3 && frame >= goldOn} />
          </g>
        ))}
        <g opacity={fix ? 0.25 * rest : gray ? 0.55 : 1}>
          <Arrow d={`M ${B(7).x - 260} ${B(7).y} C -60 ${B(7).y}, -60 ${B(1).y}, ${B(1).x - 274} ${B(1).y}`} ex={B(1).x - 274} ey={B(1).y} angle={0} start={-30} color={C.green} width={5} gold={false} />
        </g>
        {fix && ellP > 0 ? (
          <path d={sketch(b3.x, b3.y, b3.w / 2 + 34, b3.h / 2 + 40, 3)} pathLength={1} fill="none" stroke={C.gold} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={1} strokeDashoffset={1 - ellP} />
        ) : null}
        {fix && frame >= timerA && frame < at(62) ? (
          <g transform={`translate(${b3.x + 420} ${b3.y - 10})`} opacity={ramp(frame, timerA, timerA + 6) * (1 - ramp(frame, at(62) - 8, at(62)))}>
            <circle r={62} fill="none" stroke={C.line} strokeWidth={10} />
            <circle r={62} fill="none" stroke={C.gold} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={timerP} transform="rotate(-90)" strokeLinecap="round" />
            <text y={14} textAnchor="middle" fill={C.white} fontFamily={EL_FONT} fontWeight={800} fontSize={42}>{Math.round(60 * (1 - timerP))}</text>
          </g>
        ) : null}
      </svg>
      {BOXES.map((b) => (
        <div key={b.n} style={{ opacity: fix && b.n !== 3 ? 0.3 * rest : gray ? 0.55 : 1 }}>
          <BoxCard b={{ ...b, at: -30 }} frame={frame} gold={fix && b.n === 3 && frame >= goldOn} />
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- screen-space pieces
const Stick: React.FC<{ pose: string; from: number; to: number; x: number; y: number; h?: number }> = ({ pose, from, to, x, y, h = 300 }) => {
  const frame = useCurrentFrame();
  const s = useIn(from, 12);
  if (frame < from || frame >= to) return null;
  const out = 1 - ramp(frame, to - 6, to);
  const bob = Math.sin((frame - from) / 9) * 5;
  return <Img src={staticFile(`images/stick/${pose}.png`)} style={{ position: "absolute", left: x, top: y + bob + (1 - s) * 40, height: h, opacity: s * out, transform: `scale(${0.85 + 0.15 * s})` }} />;
};

const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const { at, end } = useContext(Ctx);
  const H: [number, string][] = [
    [0, "BETTER LEADS?"], [at(9), ""], [at(40), "HERE'S THE FIX"], [at(53), "UNDER 60 SECONDS"], [at(80), "YOU NEVER TOUCHED YOUR PHONE"],
    [at(85), ""], [end, ""],
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

/** Shot 1: a red X slams across the "BETTER LEADS?" headline. */
const BigX: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const s = useIn(from, 10);
  const t = frame - from;
  const shake = t < 8 ? Math.sin(t * 2.4) * (8 - t) * 1.2 : 0;
  const out = 1 - ramp(frame, to - 6, to);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: Math.min(1, s * 1.6) * out }}>
      <g transform={`translate(${540 + shake} 355) scale(${2 - s}) rotate(-4)`}>
        <path d="M -330 -95 L 330 95 M 330 -95 L -330 95" stroke={C.red} strokeWidth={22} strokeLinecap="round" />
      </g>
    </svg>
  );
};

/** Shot 2: three steps drawing left to right. */
const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { at } = useContext(Ctx);
  if (frame < at(9) || frame >= at(33)) return null;
  const o = ramp(frame, at(9), at(9) + 8) * (1 - ramp(frame, at(33) - 8, at(33)));
  const steps: [number, string, string, boolean][] = [
    [at(14), "11:00 AM", "FORM FILLED", false], [at(16), "11:05", "ON A JOB", false], [at(23), "6:00 PM", "THEY BOOKED SOMEONE ELSE", true],
  ];
  const X = [170, 540, 910], Y = 860;
  return (
    <AbsoluteFill style={{ opacity: o, fontFamily: EL_FONT }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {[0, 1].map((k) => {
          const p = ramp(frame, steps[k][0] + 4, steps[k + 1][0]);
          return <line key={k} x1={X[k] + 34} y1={Y} x2={X[k] + 34 + (X[k + 1] - X[k] - 68) * p} y2={Y} stroke={C.gold} strokeWidth={6} strokeLinecap="round" />;
        })}
        {steps.map(([a, , , bad], k) => {
          const s = ramp(frame, a, a + 8);
          if (frame < a) return <circle key={k} cx={X[k]} cy={Y} r={24} fill="none" stroke={C.line} strokeWidth={4} />;
          return bad ? (
            <g key={k} transform={`translate(${X[k]} ${Y}) scale(${0.6 + 0.4 * s})`}>
              <circle r={34} fill="rgba(229,72,77,0.15)" stroke={C.red} strokeWidth={5} />
              <path d="M -13 -13 L 13 13 M 13 -13 L -13 13" stroke={C.red} strokeWidth={6} strokeLinecap="round" />
            </g>
          ) : (
            <circle key={k} cx={X[k]} cy={Y} r={24 + 6 * Math.sin(s * Math.PI)} fill={C.gold} />
          );
        })}
      </svg>
      {steps.map(([a, t, label], k) => (
        <div key={k} style={{ position: "absolute", left: X[k] - 160, width: 320, top: Y + 70, textAlign: "center", opacity: ramp(frame, a, a + 8),
          transform: `translateY(${(1 - ramp(frame, a, a + 10)) * 24}px)` }}>
          <div style={{ fontWeight: 800, fontSize: 52, color: k === 2 ? C.white : C.gold, letterSpacing: 1 }}>{t}</div>
          <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 4, color: C.white, marginTop: 14, lineHeight: 1.3 }}>{label}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** Shot 3: the line, big. */
const LateCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { at } = useContext(Ctx);
  const s = useIn(at(33), 14);
  if (frame < at(33) || frame >= at(40)) return null;
  const out = 1 - ramp(frame, at(40) - 6, at(40));
  const l2 = ramp(frame, at(37), at(37) + 8);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 560, padding: "70px 50px", background: C.box, border: `2px solid ${C.line}`, borderRadius: 28, textAlign: "center",
      fontFamily: EL_FONT, fontWeight: 800, letterSpacing: 5, opacity: s * out, transform: `scale(${0.92 + 0.08 * s})` }}>
      <div style={{ fontSize: 76, color: C.white, lineHeight: 1.1 }}>THE LEAD WASN'T BAD.</div>
      <div style={{ fontSize: 96, color: C.gold, marginTop: 34, opacity: l2, transform: `scale(${0.85 + 0.15 * l2})` }}>IT WAS LATE.</div>
    </div>
  );
};

/** Shot 6: the text back types out with the voice, word by word. */
const TypingBubble: React.FC = () => {
  const frame = useCurrentFrame();
  const { at, words } = useContext(Ctx);
  const a = at(60), bubbleFrom = at(65), out = at(80);
  if (frame < a || frame >= out + 8) return null;
  const typed = words.filter((w) => w.i >= 65 && w.i <= 79 && f(w.startMs) <= frame).map((w) => w.text);
  const o = ramp(frame, a, a + 6) * (1 - ramp(frame, out, out + 8));
  return (
    <div style={{ position: "absolute", left: 150, right: 150, top: 960, fontFamily: EL_FONT, opacity: o }}>
      <div style={{ display: "inline-block", maxWidth: 780, background: "#2f2f2f", color: C.white, fontSize: 44, fontWeight: 500, lineHeight: 1.3, padding: "24px 32px",
        borderRadius: "34px 34px 34px 8px", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
        {frame < bubbleFrom ? (
          <span style={{ display: "inline-flex", gap: 12, padding: "8px 4px" }}>
            {[0, 1, 2].map((k) => <span key={k} style={{ width: 16, height: 16, borderRadius: 99, background: "#9a9a9a", opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame - a) / 3 - k)) }} />)}
          </span>
        ) : typed.join(" ")}
      </div>
      <div style={{ marginTop: 12, marginLeft: 8, fontSize: 22, letterSpacing: 5, color: C.grey, fontWeight: 700 }}>EXAMPLE</div>
    </div>
  );
};

/** Shot 7: phone face down, gold check. */
const PhoneDown: React.FC = () => {
  const frame = useCurrentFrame();
  const { at } = useContext(Ctx);
  const a = at(80);
  const s = useIn(a, 13);
  const chk = ramp(frame, a + 10, a + 22);
  if (frame < a || frame >= at(85)) return null;
  const out = 1 - ramp(frame, at(85) - 6, at(85));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1010, height: 300, display: "flex", justifyContent: "center", alignItems: "center", gap: 70, opacity: s * out }}>
      <div style={{ perspective: 900 }}>
        <div style={{ width: 210, height: 380, borderRadius: 40, background: "linear-gradient(160deg, #262626, #141414)", border: `3px solid ${C.line}`, position: "relative",
          transform: `rotateX(58deg) rotateZ(-18deg) translateY(${(1 - s) * -60}px)`, boxShadow: "0 40px 40px rgba(0,0,0,0.6)" }}>
          <div style={{ position: "absolute", left: 22, top: 22, width: 70, height: 70, borderRadius: 18, background: "#0d0d0d", border: `2px solid ${C.line}` }} />
        </div>
      </div>
      <svg width={150} height={150} viewBox="0 0 24 24" style={{ transform: `scale(${0.6 + 0.4 * chk})`, opacity: chk }}>
        <circle cx={12} cy={12} r={10.5} fill="none" stroke={C.gold} strokeWidth={1.6} />
        <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke={C.gold} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - chk} />
      </svg>
    </div>
  );
};

// word-by-word captions, 1-3 words; hidden while the bubble types the same words
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
    if (w.i >= 65 && w.i <= 79) { flush(); continue; }
    const cand = [...cur, w].map((x) => x.text).join(" ");
    if (cur.length >= 3 || (cur.length > 0 && cand.length > 16)) flush();
    cur.push(w);
    if (/[.?!,:]"?$/.test(w.text)) flush();
  }
  flush();
  return out;
};
const CH_N = chunk(WORDS_NORMAL), CH_F = chunk(WORDS_FAST);
const Captions: React.FC<{ fast: boolean }> = ({ fast }) => {
  const frame = useCurrentFrame();
  const c = (fast ? CH_F : CH_N).find((x) => frame >= x.from && frame < x.to);
  if (!c) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <text x={540} y={1740} textAnchor="middle" fontFamily={EL_FONT} fontWeight={800} fontSize={72} letterSpacing={-1} fill={C.white} stroke="#000" strokeWidth={12} style={{ paintOrder: "stroke" }}>{c.text}</text>
    </svg>
  );
};

const Day2: React.FC<{ fast: boolean }> = ({ fast }) => {
  const frame = useCurrentFrame();
  const t = useContext(Ctx);
  const { at, end } = t;
  const cam = camAt(frame, at);
  const mapO = frame < at(9) ? ramp(frame, 0, 10) * (1 - ramp(frame, at(9) - 8, at(9))) : frame < at(40) ? 0 : ramp(frame, at(40), at(40) + 12);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile(fast ? "recordings/system-map-day2-fast.m4a" : "recordings/system-map-day2.m4a")} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 2700, opacity: mapO, transformOrigin: "0 0",
        transform: `translate(540px, ${cam.ay}px) scale(${cam.z}) translate(-540px, ${-cam.cy}px)` }}>
        <MapWorld />
      </div>
      <AbsoluteFill style={{ pointerEvents: "none", opacity: interpolate(cam.z, [0.7, 0.95], [0, 1], clamp),
        background: `linear-gradient(to bottom, ${C.bg} 0%, ${C.bg} 23%, rgba(9,9,9,0) 31%, rgba(9,9,9,0) 78%, ${C.bg} 85%, ${C.bg} 100%)` }} />
      <Timeline />
      <LateCard />
      <TypingBubble />
      <PhoneDown />
      {frame >= at(85) ? (
        <>
          <LeadsButton from={at(85) + 8} top={1300} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1470, textAlign: "center", fontFamily: EL_FONT, fontWeight: 700, fontSize: 44, letterSpacing: 2, color: C.white,
            opacity: ramp(frame, at(85) + 18, at(85) + 30) }}>elevate-mk-tg.com</div>
        </>
      ) : null}
      <Headline />
      {frame >= at(7) && frame < at(9) ? <BigX from={at(7)} to={at(9)} /> : null}
      <Stick pose="shrug" from={8} to={at(9)} x={760} y={1180} h={300} />
      <Stick pose="hand-down" from={at(37)} to={at(40)} x={445} y={1220} h={280} />
      <Stick pose="idea" from={at(40) + 4} to={at(49)} x={800} y={1210} h={300} />
      <Stick pose="thumb" from={at(80) + 6} to={at(85)} x={820} y={1330} h={260} />
      <Stick pose="point-left" from={at(85) + 14} to={end} x={850} y={1220} h={290} />
      <Captions fast={fast} />
    </AbsoluteFill>
  );
};

export const SystemMapDay2: React.FC<{ fast?: boolean }> = ({ fast = false }) => (
  <Ctx.Provider value={fast ? TF : TN}>
    <Day2 fast={fast} />
  </Ctx.Provider>
);
