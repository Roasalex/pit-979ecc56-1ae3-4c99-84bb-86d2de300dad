// Elevate ad, script v4: the creator's AI voice clone, captions on his words and a pop-up for every beat. One
// composition, two cuts: with his talking cartoon character (ElevateAd4) and visuals only (ElevateAd4Visuals).
// Every graphic only states what the voice-over says. Cues hang off word indices (i) from words.ts.
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EL, EL_FONT } from "../../brand/elevate/theme";
import { WORDS, type W } from "./words";
import { StatCount } from "../shared/StatCount";
import { DotPattern } from "../shared/DotPattern";
import MOUTH from "./mouth.json"; // scripts/mouth_envelope.py on the voice-over: per-frame level + mouth open/shut

const FPS = 30;
const f = (ms: number) => Math.round((ms / 1000) * FPS);
const byI = new Map(WORDS.map((w) => [w.i, w]));
/** Frame where original word index i starts (falls back to the next kept word). */
export const at = (i: number) => {
  for (let k = i; k < i + 5; k++) if (byI.has(k)) return f(byI.get(k)!.startMs);
  throw new Error(`no word near ${i}`);
};
export const END = f(WORDS[WORDS.length - 1].endMs) + 45;

// ---------------------------------------------------------------- captions (skill: 1-3 words, <=17 chars, casual case)
const KEEP: Record<string, string> = { i: "I", "i'm": "I'm", "i'll": "I'll", colorado: "Colorado", meta: "Meta", google: "Google" };
const RED = /^(two|minutes|follow-up|late|first|60|seconds|booked|clicks|900|600|\$3,000|results|15|holes|30|\$20,000|679|\$9\.50|late\.)$/i;
const casual = (t: string) => {
  const core = t.replace(/[,.?!]+$/, "");
  return (KEEP[core.toLowerCase()] ?? core.toLowerCase()) + t.slice(core.length);
};
type Chunk = { from: number; to: number; words: string[] };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: W[] = [];
  const flush = () => {
    if (!cur.length) return;
    const last = cur[cur.length - 1];
    out.push({ from: f(cur[0].startMs), to: f(Math.min(last.endMs, last.startMs + 550)) + 3, words: cur.map((w) => casual(w.text).replace(/\.$/, "")) });
    cur = [];
  };
  for (const w of WORDS) {
    const cand = [...cur, w].map((x) => x.text).join(" ");
    if (cur.length >= 3 || (cur.length > 0 && cand.length > 17)) flush();
    cur.push(w);
    if (/[.?!,]$/.test(w.text)) flush();
  }
  flush();
  return out;
})();

const Captions: React.FC<{ y: number }> = ({ y }) => {
  const frame = useCurrentFrame();
  let cur: Chunk | null = null;
  for (const c of CHUNKS) if (frame >= c.from && frame < c.to) cur = c;
  if (!cur) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <text x={540} y={y} textAnchor="middle" fontFamily={EL_FONT} fontWeight={800} fontSize={84} letterSpacing={-2}
        stroke="#000" strokeWidth={12} style={{ paintOrder: "stroke" }}>
        {cur.words.map((w, k) => (
          <tspan key={k} fill={RED.test(w.replace(/[,.?!]+$/, "")) ? EL.red : "#fff"}>{w}{k < cur!.words.length - 1 ? " " : ""}</tspan>
        ))}
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------- building blocks
/** Visuals-only cut (ElevateVslVisuals): no character and no scenes; cards move up to the middle of the frame. */
const VO = createContext(false);
const useIn = (from: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - from, fps, config: { damping: 15, stiffness: 170 } });
};

/** 4:5 cartoon art in the 9:16 frame: blurred fill behind, art full width, slow push-in across the beat. */
const Scene: React.FC<{ src: string; from: number; to: number; pos?: string }> = ({ src, from, to, pos = "center" }) => {
  const frame = useCurrentFrame();
  if (useContext(VO)) return <Ink />;
  const z = interpolate(frame, [from, to], [1.0, 1.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: EL.ink, overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.5)", transform: "scale(1.2)" }} />
      <div style={{ position: "absolute", left: 0, top: 285, width: 1080, height: 1350, overflow: "hidden" }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${z})`, transformOrigin: "50% 40%" }} />
      </div>
    </AbsoluteFill>
  );
};

const Ink: React.FC = () => {
  const vo = useContext(VO);
  const frame = useCurrentFrame();
  if (!vo) return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #161616, ${EL.ink} 70%)` }} />;
  // visuals-only: drifting dot grid + a red glow that breathes with the voice
  const l = (lvl(frame) + lvl(frame - 1) + lvl(frame - 2) + lvl(frame - 3)) / 4;
  return (
    <AbsoluteFill style={{ background: EL.ink, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: -60, transform: `translate(${(frame * 0.35) % 34}px, ${(frame * 0.2) % 34}px)` }}>
        <DotPattern gap={34} dot={1.7} color="rgba(255,255,255,0.09)" />
      </div>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, rgba(245,47,57,${0.1 + 0.12 * l}), transparent ${52 + 8 * l}%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, transparent 45%, ${EL.ink} 95%)` }} />
    </AbsoluteFill>
  );
};


/** The cartoon character cut out on black. Mouth flaps with the voice (open/closed art pairs), and the body bobs and
 *  tilts with the voice level so it reads as talking. Bottom edge fades into the black where the art is cropped. */
type Pose = "closeup" | "standing" | "sitting" | "presenting" | "hands";
const ART: Record<Pose, { open: string; closed?: string; w: number; h: number }> = {
  closeup: { open: "closeup-open", closed: "closeup-closed", w: 887, h: 887 },
  standing: { open: "standing-open", closed: "standing-closed", w: 887, h: 887 },
  sitting: { open: "sitting-open", closed: "sitting-closed", w: 887, h: 887 },
  presenting: { open: "presenting", w: 948, h: 1659 },
  hands: { open: "closeup-hands", w: 1290, h: 1219 },
};
const lvl = (fr: number) => (MOUTH.level[Math.max(0, Math.min(MOUTH.level.length - 1, fr))] ?? 0) / 100;
const Talker: React.FC<{ pose: Pose; from: number; top?: number; width?: number; x?: number }> = ({ pose, from, top = 260, width = 940, x = 540 }) => {
  const frame = useCurrentFrame();
  const vo = useContext(VO);
  const a = ART[pose];
  const s = useIn(from);
  const l = (lvl(frame) + lvl(frame - 1) + lvl(frame - 2)) / 3; // a touch of smoothing so the bob isn't jittery
  const open = !a.closed || MOUTH.open[frame] === "1";
  const bob = -l * 16 + Math.sin(frame / 22) * 4;                // talk bounce + slow breathing
  const tilt = Math.sin(frame / 5.5) * 1.6 * l + Math.sin(frame / 37) * 0.6;
  const h = (width * a.h) / a.w;
  if (vo) return null;
  const img = (n: string, vis: boolean) => (
    <Img src={staticFile(`images/elevate-vsl/char/${n}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: vis ? 1 : 0 }} />
  );
  return (
    <div style={{ position: "absolute", left: x - width / 2, top, width, height: h, transformOrigin: "50% 90%",
      transform: `translateY(${bob + (1 - s) * 60}px) rotate(${tilt}deg) scale(${(0.94 + 0.06 * s) * (1 + l * 0.015)})`, opacity: s,
      WebkitMaskImage: "linear-gradient(to bottom, #000 78%, transparent 99%)", maskImage: "linear-gradient(to bottom, #000 78%, transparent 99%)" }}>
      {img(a.open, open)}
      {a.closed ? img(a.closed, !open) : null}
    </div>
  );
};

// Default top keeps cards under the character's face (faces sit in the upper-middle of every scene).
const Card: React.FC<{ from: number; top?: number; kicker?: string; children: React.ReactNode }> = ({ from, top, kicker, children }) => {
  const s = useIn(from);
  const vo = useContext(VO);
  top = vo ? (top === undefined || top >= 800 ? 560 : top) : (top ?? 900);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top, background: "rgba(15,15,15,0.94)", borderTop: `6px solid ${EL.red}`, borderRadius: 18,
      padding: "36px 46px", fontFamily: EL_FONT, color: EL.paper, boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      opacity: s, transformOrigin: "50% 0%", transform: `translateY(${(1 - s) * 40}px) scale(${(0.96 + 0.04 * s) * (vo ? 1.1 : 1)})` }}>
      {kicker ? <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: EL.grey, marginBottom: 18 }}>{kicker}</div> : null}
      {children}
    </div>
  );
};

const Row: React.FC<{ from: number; mark?: "check" | "cross" | string; strike?: boolean; size?: number; children: React.ReactNode }> = ({ from, mark = "check", strike, size = 40, children }) => {
  const s = useIn(from);
  const frame = useCurrentFrame();
  if (frame < from) return <div style={{ height: size * 1.32, marginTop: 10 }} />;
  const sym = mark === "check" ? "✓" : mark === "cross" ? "✗" : mark;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 10, opacity: s, transform: `translateX(${(1 - s) * -30}px)` }}>
      <span style={{ color: EL.red, fontWeight: 800, fontSize: size, minWidth: size * 0.9 }}>{sym}</span>
      <span style={{ fontWeight: 700, fontSize: size, lineHeight: 1.18, textDecoration: strike ? "line-through" : undefined, textDecorationColor: EL.red }}>{children}</span>
    </div>
  );
};

const Big: React.FC<{ from: number; children: React.ReactNode; size?: number; color?: string }> = ({ from, children, size = 120, color = EL.paper }) => {
  const s = useIn(from);
  return <div style={{ fontWeight: 800, fontSize: size, letterSpacing: -size * 0.04, lineHeight: 0.98, color, opacity: s, transform: `scale(${0.9 + 0.1 * s})`, transformOrigin: "left center" }}>{children}</div>;
};

const Hook: React.FC<{ lines: string[]; from: number; top?: number }> = ({ lines, from, top = 110 }) => {
  const s = useIn(from);
  const vo = useContext(VO);
  if (vo) top = 560;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, textAlign: "center", fontFamily: EL_FONT, opacity: s, transform: `translateY(${(1 - s) * -30}px) scale(${vo ? 1.18 : 1})` }}>
      {lines.map((l, k) => (
        <div key={k} style={{ display: "inline-block", margin: "6px 8px", padding: "10px 24px", background: k === lines.length - 1 ? EL.red : EL.paper,
          color: k === lines.length - 1 ? "#fff" : EL.ink, fontWeight: 800, fontSize: 50, letterSpacing: -1.2, borderRadius: 10 }}>{l}</div>
      ))}
    </div>
  );
};

const Chips: React.FC<{ items: [string, number][] }> = ({ items }) => (
  <div style={{ position: "absolute", left: 70, right: 70, top: 1210, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, fontFamily: EL_FONT }}>
    {items.map(([t, from]) => <Chip key={t} t={t} from={from} />)}
  </div>
);
const Chip: React.FC<{ t: string; from: number }> = ({ t, from }) => {
  const s = useIn(from);
  return <span style={{ opacity: s, transform: `translateY(${(1 - s) * 20}px)`, background: "rgba(3,3,3,0.85)", border: `2px solid ${EL.red}`, color: EL.paper, fontWeight: 700, fontSize: 38, padding: "10px 24px", borderRadius: 999 }}>{t}</span>;
};

// ---------------------------------------------------------------- v4 pop-ups
/** A phone outline for mock screens. */
const Phone: React.FC<{ x: number; y: number; w?: number; from: number; label?: string; children: React.ReactNode; tilt?: number }> = ({ x, y, w = 400, from, label, children, tilt = 0 }) => {
  const s = useIn(from);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, fontFamily: EL_FONT, opacity: s, transform: `translateY(${(1 - s) * 80}px) rotate(${tilt * s}deg) scale(${0.9 + 0.1 * s})` }}>
      {label ? <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 5, color: EL.paper, textAlign: "center", marginBottom: 14 }}>{label}</div> : null}
      <div style={{ height: w * 1.9, borderRadius: 54, border: "10px solid #2b2b2b", background: "#0b0b0b", boxShadow: "0 40px 90px rgba(0,0,0,0.7)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: "50%", top: 14, width: 110, height: 28, marginLeft: -55, borderRadius: 20, background: "#000" }} />
        {children}
      </div>
    </div>
  );
};

const Bubble: React.FC<{ from: number; me?: boolean; children: React.ReactNode }> = ({ from, me, children }) => {
  const s = useIn(from);
  if (useCurrentFrame() < from) return null;
  return (
    <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginTop: 14, opacity: s, transform: `scale(${0.8 + 0.2 * s})`, transformOrigin: me ? "right bottom" : "left bottom" }}>
      <div style={{ maxWidth: "82%", padding: "14px 20px", borderRadius: 24, fontSize: 25, lineHeight: 1.3, fontWeight: 500, background: me ? "#1f7aff" : "#262626", color: "#fff" }}>{children}</div>
    </div>
  );
};
const Blur: React.FC<{ w: number }> = ({ w }) => <span style={{ display: "inline-block", width: w, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.55)", filter: "blur(5px)", verticalAlign: "middle" }} />;

/** The system as a flow that draws itself, one box per phrase. */
const Flow: React.FC<{ steps: [string, number][]; x: number; y: number; w: number }> = ({ steps, x, y, w }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, fontFamily: EL_FONT }}>
      {steps.map(([t, from], k) => {
        const on = frame >= from;
        const p = interpolate(frame, [from, from + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const lit = on && (k === steps.length - 1 || frame < steps[k + 1][1] + 12);
        return (
          <div key={t}>
            {k > 0 ? <div style={{ marginLeft: 40, width: 6, height: 34 * p, background: EL.red, opacity: 0.8 }} /> : null}
            {k > 0 && p < 1 ? <div style={{ height: 34 * (1 - p) }} /> : null}
            <div style={{ padding: "16px 24px", borderRadius: 14, fontWeight: 800, fontSize: 32, letterSpacing: 1, opacity: 0.2 + 0.8 * p,
              border: `3px solid ${lit ? EL.red : "rgba(255,255,255,0.18)"}`, background: lit ? "rgba(245,47,57,0.16)" : "rgba(15,15,15,0.9)",
              color: EL.paper, transform: `scale(${lit ? 1.04 : 1})`, transformOrigin: "left center", boxShadow: lit ? "0 0 40px rgba(245,47,57,0.35)" : "none" }}>{t}</div>
          </div>
        );
      })}
    </div>
  );
};

const Col: React.FC<{ title: string; rows: [string, number][]; from: number; mark: string }> = ({ title, rows, from, mark }) => {
  const s = useIn(from);
  return (
    <div style={{ flex: 1, background: "rgba(15,15,15,0.94)", borderTop: `6px solid ${mark === "check" ? EL.red : "#555"}`, borderRadius: 18, padding: "28px 28px 32px",
      opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
      <div style={{ fontWeight: 800, fontSize: 40, letterSpacing: 4, color: mark === "check" ? EL.red : EL.grey }}>{title}</div>
      {rows.map(([r, f]) => <Row key={r} from={f} mark={mark} size={32}>{r}</Row>)}
    </div>
  );
};
const TwoCol: React.FC<{ left: [string, number][]; right: [string, number][]; from: number; rightFrom: number; top?: number }> = ({ left, right, from, rightFrom, top = 860 }) => {
  const vo = useContext(VO);
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: vo ? 560 : top, display: "flex", gap: 22, fontFamily: EL_FONT, color: EL.paper, alignItems: "flex-start" }}>
      <Col title="FOR" rows={left} from={from} mark="check" />
      {frame >= rightFrom ? <Col title="NOT FOR" rows={right} from={rightFrom} mark="cross" /> : <div style={{ flex: 1 }} />}
    </div>
  );
};

const Center: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <div style={{ position: "absolute", left: 60, right: 60, top, textAlign: "center", fontFamily: EL_FONT }}>{children}</div>
);
const Rule: React.FC<{ from: number }> = ({ from }) => {
  const s = useIn(from);
  return <div style={{ width: 140 * s, height: 3, background: "rgba(255,255,255,0.25)", margin: "34px auto" }} />;
};

// ---------------------------------------------------------------- the ad
//          §1 §2  §3  §4   §5   §6   §7   §8   §9   §10
const S = [0, 32, 75, 121, 185, 258, 278, 311, 330, 389].map((i) => at(i));
const MARKED = [1, 2, 4, 5, 7, 9];

export const ElevateAd4: React.FC<{ visualsOnly?: boolean }> = ({ visualsOnly = false }) => (
  <VO.Provider value={visualsOnly}>
    <Ad />
  </VO.Provider>
);

const SectionMark: React.FC<{ n: number; from: number }> = ({ n, from }) => {
  const s = useIn(from);
  return (
    <div style={{ position: "absolute", left: 90, top: 230, fontFamily: EL_FONT, opacity: s, transform: `translateX(${(1 - s) * -40}px)` }}>
      <div style={{ fontWeight: 800, fontSize: 230, lineHeight: 1, letterSpacing: -10, color: "transparent", WebkitTextStroke: "3px rgba(245,243,240,0.55)" }}>{String(n).padStart(2, "0")}</div>
      <div style={{ width: 120 * s, height: 8, background: EL.red, marginTop: 14 }} />
    </div>
  );
};
const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: (1080 * frame) / END, background: EL.red }} />;
};

const Ad: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = useContext(VO);
  const seg = (k: number) => [S[k], k + 1 < S.length ? S[k + 1] : END] as const;
  const show = (k: number) => frame >= seg(k)[0] && frame < seg(k)[1];
  const cta = useIn(at(433));
  return (
    <AbsoluteFill style={{ background: EL.ink, fontFamily: EL_FONT }}>
      <Audio src={staticFile("recordings/elevate-ad4.m4a")} />

      {/* §1 hook */}
      {show(0) && (
        <>
          <Ink />
          <Talker pose="closeup" from={0} top={330} />
          <Hook from={0} lines={["Paying for ads?", "Calendar still", "has holes?"]} />
          <Chips items={[["Colorado", at(8)], ["local service", at(4)], ["2 minutes", at(22)]]} />
        </>
      )}

      {/* §2 for / not for */}
      {show(1) && (
        <>
          <Ink />
          {frame < at(56) ? <Talker pose="standing" from={at(32)} top={150} width={1250} /> : <Talker pose="closeup" from={at(56)} />}
          <TwoCol from={at(32)} rightFrom={at(56)}
            left={[["Already doing jobs", at(38)], ["Good reviews", at(41)], ["Room for 5–10 more a week", at(47)]]}
            right={[["Brand-new, no reviews", at(60)], ["Hoping $500/mo fixes everything", at(67)]]} />
        </>
      )}

      {/* §3 the problem: a phone timeline, then the line */}
      {show(2) && (
        <>
          <Ink />
          {frame < at(90) ? <Talker pose="sitting" from={at(75)} top={170} width={1200} /> : frame < at(114) ? <Talker pose="standing" from={at(90)} top={60} width={1250} /> : <Talker pose="closeup" from={at(114)} />}
          {frame < at(90) ? (
            <Card from={at(75)} kicker="Most owners think">
              <Row from={at(80)} mark="cross" strike size={58}>An ad problem</Row>
              <Row from={at(86)} size={58}>A follow-up problem</Row>
            </Card>
          ) : frame < at(114) ? (
            <Phone x={vo ? 320 : 560} y={vo ? 520 : 640} w={vo ? 440 : 420} from={at(90)} tilt={vo ? 0 : 3}>
              <div style={{ padding: "70px 22px 0", color: EL.paper }}>
                <div style={{ textAlign: "center", color: EL.grey, fontSize: 22, fontWeight: 700 }}>New lead</div>
                <TL t="11:00 AM" from={at(91)}>Form filled</TL>
                <TL t="11:05 AM" from={at(97)}>You're on a job</TL>
                <TL t="6:00 PM" from={at(101)}>You call back</TL>
                <TL t="" from={at(107)} red>Already booked whoever texted first</TL>
              </div>
            </Phone>
          ) : (
            <Center top={vo ? 640 : 1090}>
              <Big from={at(114)} size={vo ? 92 : 76}>The lead wasn't bad.</Big>
              {frame >= at(118) ? <div style={{ marginTop: 20 }}><Big from={at(118)} size={vo ? 120 : 100} color={EL.red}>It was late.</Big></div> : null}
            </Center>
          )}
        </>
      )}

      {/* §4 the system: the flow draws itself, then the text they get */}
      {show(3) && (
        <>
          <Ink />
          <Flow x={60} y={170} w={560} steps={[["AD", at(126)], ["FORM", at(134)], ["TEXT · UNDER 60 SEC", at(140)], ["FOLLOW-UPS · DAY 1 · 3 · 7", at(161)], ["BOOKED", at(166)], ["REMINDER", at(171)], ["REVIEW ASK", at(176)]]} />
          {frame >= at(147) && frame < at(179) ? (
            <Phone x={640} y={430} w={400} from={at(147)} tilt={4}>
              <div style={{ padding: "64px 18px 0" }}>
                <div style={{ textAlign: "center", color: EL.grey, fontSize: 20, fontWeight: 700 }}>Text Message · Today</div>
                <Bubble from={at(147)} me>Hi <Blur w={80} />! Thanks for asking about <b>ceramic tint</b>. Want to grab a time this week?</Bubble>
                <Bubble from={at(161)} me>Day 3: still want that quote?</Bubble>
                <div style={{ marginTop: 18, textAlign: "center", fontSize: 18, letterSpacing: 3, color: EL.grey, fontWeight: 700 }}>EXAMPLE</div>
              </div>
            </Phone>
          ) : null}
          {frame >= at(179) ? (
            <Center top={1180}><Big from={at(179)} size={70} color={EL.red}>You don't touch any of it.</Big></Center>
          ) : null}
        </>
      )}

      {/* §5 the ads: your clip -> our ad, then the ticks */}
      {show(4) && (
        <>
          {vo ? <Ink /> : frame < at(215) ? <Scene src="images/elevate-vsl/scene-4.webp" from={at(185)} to={at(215)} /> : <Scene src="images/elevate-vsl/scene-1.webp" from={at(215)} to={seg(4)[1]} />}
          {frame < at(215) ? (
            <>
              <Phone x={vo ? 70 : 110} y={vo ? 420 : 640} w={vo ? 430 : 360} from={at(194)} label="YOUR CLIP" tilt={-3}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #3a3a3a, #141414)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: EL.paper }}>
                  <div style={{ fontSize: 110 }}>▶</div><div style={{ fontWeight: 800, fontSize: 40 }}>2:00</div><div style={{ fontSize: 24, color: EL.grey, marginTop: 6 }}>on the job, on your phone</div>
                </div>
              </Phone>
              {frame >= at(209) ? (
                <Phone x={vo ? 580 : 610} y={vo ? 420 : 640} w={vo ? 430 : 360} from={at(209)} label="OUR AD" tilt={3}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #2a0d0f, #0b0b0b)" }}>
                    <div style={{ position: "absolute", left: 24, right: 24, top: 90, background: EL.red, color: "#fff", fontWeight: 800, fontSize: 34, padding: "12px 16px", borderRadius: 10, textAlign: "center" }}>HOOK</div>
                    <div style={{ position: "absolute", left: 24, top: 190, display: "flex", gap: 10 }}>
                      <span style={{ background: EL.paper, color: EL.ink, fontWeight: 800, fontSize: 24, padding: "6px 12px", borderRadius: 8 }}>YOUR CITY</span>
                      <span style={{ background: EL.paper, color: EL.ink, fontWeight: 800, fontSize: 24, padding: "6px 12px", borderRadius: 8 }}>$ PRICE</span>
                    </div>
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", color: "#fff", fontWeight: 800, fontSize: 36, WebkitTextStroke: "1px #000" }}>captions on</div>
                  </div>
                </Phone>
              ) : null}
            </>
          ) : (
            <Card from={at(215)} top={vo ? undefined : 860} kicker="Every ad">
              <Row from={at(215)} size={38}>Hook in the first second</Row>
              <Row from={at(220)} size={38}>Your city + price on screen</Row>
              <Row from={at(227)} size={38}>Captions (sound off)</Row>
              <Row from={at(236)} size={38}>Live in about a week</Row>
              <Row from={at(241)} size={30} mark="·">Only your zip codes</Row>
              <Row from={at(246)} size={30} mark="·">Ad spend straight to Meta, never marked up</Row>
            </Card>
          )}
        </>
      )}

      {/* §6 scorecard */}
      {show(5) && (
        <>
          <Ink />
          <Talker pose="closeup" from={at(258)} top={200} />
          <Card from={at(258)} top={880} kicker="Every Monday · your scorecard">
            <Row from={at(264)} mark="1">Leads</Row>
            <Row from={at(265)} mark="2">Booked jobs</Row>
            <Row from={at(267)} mark="3">Money booked</Row>
            {frame >= at(269) ? (
              <div style={{ marginTop: 26 }}>
                <Big from={at(269)} size={50}>Judged on <span style={{ color: EL.red }}>booked jobs</span>,</Big>
                <Big from={at(276)} size={50}>not <span style={{ textDecoration: "line-through", textDecorationColor: EL.red }}>clicks</span>.</Big>
              </div>
            ) : null}
          </Card>
        </>
      )}

      {/* §7 results: stacked count-ups, as spoken */}
      {show(6) && (
        <>
          <Ink />
          {frame < at(303) ? (
            <Center top={150}>
              <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: 6, color: EL.grey }}>ONE SHOP WE WORK WITH</div>
              <StatCount to={30} startFrame={at(288)} durationFrames={30} size={190} label="PAID JOBS" labelColor={EL.paper} style={{ marginTop: 30 }} />
              {frame >= at(291) ? <><Rule from={at(291)} /><StatCount to={20264} prefix="$" startFrame={at(291)} durationFrames={40} size={170} color={EL.red} label="IN PAID JOBS" labelColor={EL.paper} /></> : null}
              {frame >= at(295) ? <><Rule from={at(295)} /><StatCount to={30} startFrame={at(295)} durationFrames={25} size={190} label="DAYS" labelColor={EL.paper} /></> : null}
              {frame >= at(298) ? <div style={{ marginTop: 34 }}><Big from={at(298)} size={46} color={EL.grey}>from about $3,300 in ads</Big></div> : null}
            </Center>
          ) : (
            <Center top={330}>
              <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: 6, color: EL.grey }}>SAME SHOP</div>
              <StatCount to={679} startFrame={at(305)} durationFrames={35} size={230} label="LEADS" labelColor={EL.paper} style={{ marginTop: 30 }} />
              {frame >= at(307) ? <><Rule from={at(307)} /><Big from={at(307)} size={170} color={EL.red}>$9.50</Big><div style={{ fontWeight: 500, fontSize: 41, color: EL.paper, marginTop: 20 }}>ABOUT, PER LEAD</div></> : null}
            </Center>
          )}
        </>
      )}

      {/* §8 your part */}
      {show(7) && (
        <>
          <Ink />
          <Talker pose="sitting" from={at(311)} top={170} width={1200} />
          <Card from={at(311)} kicker="Your part · two things">
            <Row from={at(316)} mark="1">Answer the jobs that book</Row>
            <Row from={at(322)} mark="2">Tell me what each one paid</Row>
            {frame >= at(328) ? <div style={{ marginTop: 18 }}><Big from={at(328)} size={64} color={EL.red}>That's it.</Big></div> : null}
          </Card>
        </>
      )}

      {/* §9 the plans */}
      {show(8) && (
        <>
          <Ink />
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: EL_FONT, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: EL.grey }}>THREE WAYS TO WORK WITH US</div>
          <Plan from={at(336)} top={250} name="Leads" price="$900/mo" sub="+ $600 setup · month to month · you answer your own leads" />
          <Plan from={at(353)} top={600} name="Growth Partner" price="$600/mo" sub="+ a piece of the jobs we bring you · pay on results" />
          <Plan from={at(372)} top={950} name="Full Service" price="from $3,000" sub="ads · a video shoot every month · website · Google · every review answered" />
        </>
      )}

      {/* §10 the call + CTA */}
      {show(9) && (
        <>
          <Ink />
          {frame < at(433) ? <Talker pose="closeup" from={at(389)} /> : <Talker pose="presenting" from={at(433)} top={180} width={620} x={560} />}
          {frame < at(417) ? (
            <Card from={at(389)} kicker="On the 15-minute call">
              <Row from={at(399)} mark="1">What's a job worth to you?</Row>
              <Row from={at(406)} mark="2">How many more can you take?</Row>
              <Row from={at(413)} mark="3">Who answers the phone?</Row>
            </Card>
          ) : frame < at(433) ? (
            <Card from={at(417)} kicker="Then">
              <Big from={at(417)} size={56}>Straight answer on which plan fits.</Big>
              {frame >= at(425) ? <div style={{ marginTop: 16 }}><Big from={at(425)} size={46} color={EL.red}>Even if it's none of them.</Big></div> : null}
            </Card>
          ) : (
            <div style={{ position: "absolute", left: 60, right: 60, top: vo ? 700 : 1080, textAlign: "center", fontFamily: EL_FONT, opacity: cta, transform: `scale(${0.9 + 0.1 * cta})` }}>
              <div style={{ display: "inline-block", background: EL.red, color: "#fff", fontWeight: 800, fontSize: 66, padding: "28px 48px", borderRadius: 16, boxShadow: "0 20px 50px rgba(245,47,57,0.45)" }}>
                BOOK A 15-MINUTE CALL ↓
              </div>
            </div>
          )}
        </>
      )}

      {vo ? MARKED.map((k, n) => (show(k) ? <SectionMark key={k} n={n + 1} from={S[k]} /> : null)) : null}
      {vo ? <Progress /> : null}
      <Captions y={1450} />
    </AbsoluteFill>
  );
};

const TL: React.FC<{ t: string; from: number; red?: boolean; children: React.ReactNode }> = ({ t, from, red, children }) => {
  const s = useIn(from);
  if (useCurrentFrame() < from) return null;
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "baseline", marginTop: 26, opacity: s, transform: `translateX(${(1 - s) * 30}px)` }}>
      <div style={{ minWidth: 120, fontWeight: 800, fontSize: 28, color: EL.red }}>{t || "✗"}</div>
      <div style={{ fontWeight: 700, fontSize: 30, lineHeight: 1.2, color: red ? EL.red : EL.paper }}>{children}</div>
    </div>
  );
};

const Plan: React.FC<{ from: number; top: number; name: string; price: string; sub: string }> = ({ from, top, name, price, sub }) => {
  const s = useIn(from);
  const on = useCurrentFrame() >= from;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, background: "rgba(15,15,15,0.95)", borderRadius: 20, padding: "34px 40px", fontFamily: EL_FONT,
      border: `3px solid ${on ? EL.red : "rgba(255,255,255,0.1)"}`, opacity: on ? 0.3 + 0.7 * s : 0.25, transform: `scale(${on ? 0.95 + 0.05 * s : 0.95})` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: 800, fontSize: 58, color: EL.paper, letterSpacing: -1.5 }}>{name}</span>
        <span style={{ fontWeight: 800, fontSize: 54, color: EL.red }}>{price}</span>
      </div>
      <div style={{ fontSize: 32, color: EL.grey, marginTop: 12, lineHeight: 1.3 }}>{sub}</div>
    </div>
  );
};
