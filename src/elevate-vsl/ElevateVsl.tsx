// Elevate ad, v2: the creator's voice-over over his talking cartoon character on black (two cartoon scenes he liked
// stay: filming the car, at the desk), captions on his words, and a graphic for
// each script beat (brand/elevate: black cards, off-white type, one red accent). Every graphic only states what is said.
// Cues hang off word indices (i) from words.ts, so they move with the words if the transcript is re-timed.
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EL, EL_FONT } from "../../brand/elevate/theme";
import { WORDS, type W } from "./words";
import { DataFlow } from "../shared/DataFlow";
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
const RED = /^(two|minutes|follow-up|late|first|60|seconds|booked|clicks|900|600|\$600|\$3,000|results|15|holes|first\.)$/i;
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

// ---------------------------------------------------------------- the ad
const S = [0, 54, 129, 184, 269, 300, 350, 371, 390, 457].map((i) => at(i)); // section starts: §1-§8, §10, §11

export const ElevateVsl: React.FC<{ visualsOnly?: boolean }> = ({ visualsOnly = false }) => (
  <VO.Provider value={visualsOnly}>
    <Ad />
  </VO.Provider>
);

/** Big outlined section number above the card (visuals-only cut): fills the space the character used to. */
const SectionMark: React.FC<{ n: number; from: number }> = ({ n, from }) => {
  const s = useIn(from);
  return (
    <div style={{ position: "absolute", left: 90, top: 230, fontFamily: EL_FONT, opacity: s, transform: `translateX(${(1 - s) * -40}px)` }}>
      <div style={{ fontWeight: 800, fontSize: 230, lineHeight: 1, letterSpacing: -10, color: "transparent", WebkitTextStroke: "3px rgba(245,243,240,0.55)" }}>{String(n).padStart(2, "0")}</div>
      <div style={{ width: 120 * s, height: 8, background: EL.red, marginTop: 14 }} />
    </div>
  );
};

/** Thin red progress bar along the top (visuals-only cut). */
const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: (1080 * frame) / END, background: EL.red }} />;
};

const MARKED = [1, 2, 4, 5, 6, 7, 9]; // sections that get a number (the hook, the system and the plans have their own big graphic)

const Ad: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = useContext(VO);
  const seg = (k: number) => [S[k], k + 1 < S.length ? S[k + 1] : END] as const;
  const show = (k: number) => frame >= seg(k)[0] && frame < seg(k)[1];
  const cta = useIn(at(485));
  return (
    <AbsoluteFill style={{ background: EL.ink, fontFamily: EL_FONT }}>
      <Audio src={staticFile("recordings/elevate-vsl-edit.m4a")} />

      {/* §1 hook: who it's for and the promise */}
      {show(0) && (
        <>
          <Ink />
          <Talker pose="closeup" from={0} top={330} />
          <Hook from={0} lines={["Paying for ads?", "Calendar still", "has holes?"]} />
          <Chips items={[["Colorado", at(8)], ["tint", at(9)], ["flooring", at(10)], ["cleaning", at(11)], ["trades", at(13)]]} />
        </>
      )}

      {/* §2 who it's for / not for */}
      {show(1) && (
        <>
          <Ink />
          {frame < at(97) ? <Talker pose="standing" from={at(54)} top={150} width={1250} /> : <Talker pose="closeup" from={at(97)} />}
          {frame < at(97) ? (
            <Card from={at(54)} kicker="Who this is for">
              <Row from={at(58)}>Already doing jobs</Row>
              <Row from={at(62)}>Good reviews</Row>
              <Row from={at(67)}>Room for 5–10 more a week</Row>
              <Row from={at(80)}>Answer fast, or want a system that does</Row>
            </Card>
          ) : (
            <Card from={at(97)} kicker="Who it's not for">
              <Row from={at(101)} mark="cross">Brand-new, no reviews yet</Row>
              <Row from={at(109)} mark="cross">Hoping $500/mo fixes everything</Row>
              <Row from={at(124)} mark="cross" size={34}>Then don't book the call yet</Row>
            </Card>
          )}
        </>
      )}

      {/* §3 the real problem: follow-up, not ads */}
      {show(2) && (
        <>
          <Ink />
          {frame < at(152) ? <Talker pose="sitting" from={at(129)} top={170} width={1200} /> : <Talker pose="standing" from={at(152)} top={60} width={1250} />}
          {frame < at(152) ? (
            <Card from={at(136)} kicker="Most owners think">
              <Row from={at(141)} mark="cross" strike size={58}>An ad problem</Row>
              <Row from={at(148)} size={58}>A follow-up problem</Row>
            </Card>
          ) : (
            <Card from={at(152)} kicker="What actually happens">
              <Row from={at(156)} mark="11:00">Form filled</Row>
              <Row from={at(159)} mark="·">You're on a job</Row>
              <Row from={at(166)} mark="6:00">You call back</Row>
              <Row from={at(169)} mark="✗">Already booked whoever texted first</Row>
              {frame >= at(177) ? <div style={{ marginTop: 16 }}><Big from={at(181)} size={64} color={EL.red}>It was late.</Big></div> : null}
            </Card>
          )}
        </>
      )}

      {/* §4 the system */}
      {show(3) && (
        <>
          <Ink />
          <div style={{ position: "absolute", left: 0, right: 0, top: -230 }}>
            <DataFlow label="ONE PLACE" startFrame={at(199)} lineColor="rgba(255,255,255,0.22)" y={380} />
          </div>
          <Card from={at(184)} top={760} kicker="Week one · we build your system">
            <Row from={at(199)}>Every lead lands in one place</Row>
            <Row from={at(212)}>A text in under 60 seconds</Row>
            <Row from={at(233)}>Follow-ups: day 1 · 3 · 7</Row>
            <Row from={at(242)}>Reminder before the job</Row>
            <Row from={at(247)}>Review ask after</Row>
          </Card>
          {frame >= at(257) ? (
            <div style={{ position: "absolute", left: 90, right: 90, top: 1330, fontFamily: EL_FONT, textAlign: "center" }}>
              <Big from={at(257)} size={62} color={EL.red}>The shop that texts back first.</Big>
            </div>
          ) : null}
        </>
      )}

      {/* §5 the ads: you film, I edit */}
      {show(4) && (
        <>
          <Scene src="images/elevate-vsl/scene-4.webp" from={seg(4)[0]} to={seg(4)[1]} />
          <Card from={at(272)} kicker="The ads">
            <Row from={at(273)} mark="cross">No film crew</Row>
            <Row from={at(279)}>2 minutes on your phone</Row>
            <Row from={at(294)}>I turn it into the ad</Row>
          </Card>
        </>
      )}

      {/* §6 what goes in every ad */}
      {show(5) && (
        <>
          <Scene src="images/elevate-vsl/scene-1.webp" from={seg(5)[0]} to={seg(5)[1]} />
          <Card from={at(300)} top={840} kicker="Every ad">
            <Row from={at(300)} size={34}>Hook in the first second</Row>
            <Row from={at(305)} size={34}>Your city + price on screen</Row>
            <Row from={at(312)} size={34}>Captions (sound off)</Row>
            <Row from={at(321)} size={34}>One clear thing to do</Row>
            <Row from={at(326)} size={34}>Live in about a week</Row>
            <Row from={at(333)} size={34}>Only your zip codes</Row>
            <Row from={at(338)} size={34}>Ad spend straight to Meta, never marked up</Row>
          </Card>
        </>
      )}

      {/* §7 the Monday scorecard */}
      {show(6) && (
        <>
          <Ink />
          <Talker pose="closeup" from={at(350)} top={200} />
          <Card from={at(350)} top={880} kicker="Every Monday · your scorecard">
            <Row from={at(356)} mark="1">Leads</Row>
            <Row from={at(357)} mark="2">Booked jobs</Row>
            <Row from={at(359)} mark="3">Money booked</Row>
            {frame >= at(362) ? (
              <div style={{ marginTop: 30, fontWeight: 800, fontSize: 52 }}>
                <Big from={at(362)} size={52}>Judged on <span style={{ color: EL.red }}>booked jobs</span>,</Big>
                <Big from={at(369)} size={52}>not <span style={{ textDecoration: "line-through", textDecorationColor: EL.red }}>clicks</span>.</Big>
              </div>
            ) : null}
          </Card>
        </>
      )}

      {/* §8 your part */}
      {show(7) && (
        <>
          <Ink />
          <Talker pose="sitting" from={at(371)} top={170} width={1200} />
          <Card from={at(371)} kicker="Your part · two things">
            <Row from={at(376)} mark="1">Answer the jobs that book</Row>
            <Row from={at(382)} mark="2">Tell me what each one paid</Row>
          </Card>
        </>
      )}

      {/* §10 three ways to work with us (as spoken) */}
      {show(8) && (
        <>
          <Ink />
          <Card from={at(390)} top={300} kicker="Three ways to work with us">
            <div style={{ opacity: frame >= at(396) ? 1 : 0.15 }}>
              <Big from={at(396)} size={64}>Leads · <span style={{ color: EL.red }}>$900/mo</span></Big>
              <div style={{ fontSize: 34, color: EL.grey, marginTop: 8 }}>+ $600 setup · month to month · you answer your leads</div>
            </div>
            <div style={{ height: 2, background: "rgba(255,255,255,0.12)", margin: "30px 0" }} />
            <div style={{ opacity: frame >= at(414) ? 1 : 0.15 }}>
              <Big from={at(414)} size={64}>Growth Partner · <span style={{ color: EL.red }}>$600/mo</span></Big>
              <div style={{ fontSize: 34, color: EL.grey, marginTop: 8 }}>+ a piece of the jobs we bring you · pay on results</div>
            </div>
            <div style={{ height: 2, background: "rgba(255,255,255,0.12)", margin: "30px 0" }} />
            <div style={{ opacity: frame >= at(434) ? 1 : 0.15 }}>
              <Big from={at(434)} size={64}>Full Service · <span style={{ color: EL.red }}>$3,000</span></Big>
              <div style={{ fontSize: 34, color: EL.grey, marginTop: 8 }}>ads · video shoot every month · website · Google · every review answered</div>
            </div>
          </Card>
        </>
      )}

      {/* §11 the call + CTA */}
      {show(9) && (
        <>
          <Ink />
          {frame < at(485) ? <Talker pose="closeup" from={at(457)} /> : <Talker pose="presenting" from={at(485)} top={180} width={620} x={560} />}
          {frame < at(485) ? (
            <Card from={at(457)} kicker="On the 15-minute call">
              <Row from={at(467)} mark="1">What's a job worth to you?</Row>
              <Row from={at(474)} mark="2">How many more can you take?</Row>
              <Row from={at(481)} mark="3">Who answers the phone?</Row>
            </Card>
          ) : (
            <div style={{ position: "absolute", left: 90, right: 90, top: vo ? 720 : 1040, textAlign: "center", fontFamily: EL_FONT, opacity: cta, transform: `scale(${0.9 + 0.1 * cta})` }}>
              <div style={{ fontWeight: 800, fontSize: 56, color: EL.paper, textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>Straight answer on which plan fits.</div>
              <div style={{ display: "inline-block", marginTop: 34, background: EL.red, color: "#fff", fontWeight: 800, fontSize: 64, padding: "26px 50px", borderRadius: 16, boxShadow: "0 20px 50px rgba(245,47,57,0.45)" }}>
                Book the 15-min call ↓
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
