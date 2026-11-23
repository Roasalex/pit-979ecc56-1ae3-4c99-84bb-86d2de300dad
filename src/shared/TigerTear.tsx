import * as React from "react"
import { useCurrentFrame, useVideoConfig } from "remotion"
import { fontFamily as loadFamily } from "../../styles/fonts"
import anton from "@fontsource/anton/files/anton-latin-400-normal.woff2"

// The web version names Anton but never loads it; in video it must be loaded or the word falls back to a system font.
const ANTON = loadFamily("TT Anton", [{ url: anton, weight: "400" }])

/**
 * VIDEO PORT of prompts/components/tiger-tear-reveal.tsx (generated from it: the drawing code below is
 * unchanged). Scroll, pointer and timers are replaced by the frame: the tear plays from `startFrame` over
 * `tearFrames`, the gaze wanders on a fixed path and blinks land on fixed frames, so every render matches.
 *
 * Original description:
 * Tiger Tear Reveal: a poster that rips in two as you scroll.
 *
 * The page starts as a plain slogan: a small tagline over one huge red word.
 * Scroll, and a crack runs out from the middle of the word, the sheet tears
 * in two along it, and the halves pull apart, the top lifting and the bottom
 * dropping, each tipping like real paper. From behind, a tiger rises into the
 * gap and opens its eyes. Once it is looking, the eyes follow your pointer and
 * blink; click and they squint at you. Scroll back up and the paper closes.
 *
 * Everything is SVG built from numbers: the fur, the stripes, the irises, the
 * torn paper. No images, no fonts to load, React is the only import.
 */

// #region tear
export type Pt = [number, number]

/** Seeded PRNG (mulberry32), so the tear and the fur are the same every visit. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x)

export function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** Overshoot ease: the eyes open a little too wide, then settle. */
export function easeOutBack(t: number) {
  const c = 1.70158
  const u = clamp01(t) - 1
  return 1 + (c + 1) * u * u * u + c * u * u
}

/** How far through the pinned scroll we are: 0 at the top, 1 when the stage lets go. */
export function scrollProgress(top: number, height: number, viewport: number) {
  const range = height - viewport
  if (range <= 0) return top <= 0 ? 1 : 0
  return clamp01(-top / range)
}

/** One scroll value drives five beats. */
export function stages(p: number) {
  return {
    crack: smooth(0.03, 0.2, p), // a crack runs out from the middle of the word
    open: smooth(0.18, 0.62, p), // the sheet tears and the halves pull apart
    rise: smooth(0.26, 0.74, p), // the tiger comes up from behind
    pop: smooth(0.58, 0.88, p), // and opens its eyes
    shake: smooth(0.16, 0.22, p) * (1 - smooth(0.26, 0.36, p)), // the jolt of the rip
  }
}

/**
 * The tear, left to right across the whole sheet: a slight rising diagonal,
 * a slow wander, fine fibres and the odd big tooth. `x` always increases.
 */
export function tearLine(seed = 11, from = -800, to = 1800, step = 9, cx = 500, cy = 318, angle = -7): Pt[] {
  const r = rng(seed)
  const slope = Math.tan((angle * Math.PI) / 180)
  const out: Pt[] = []
  for (let x = from; x <= to; x += step) {
    const fibre = (r() - 0.5) * 5
    const tooth = r() < 0.09 ? (r() - 0.5) * 26 : 0
    const wander = Math.sin(x * 0.019 + seed) * 10 + Math.sin(x * 0.053 + seed * 2) * 4
    out.push([x, cy + (x - cx) * slope + wander + fibre + tooth])
  }
  return out
}

/** Where each half goes as the tear opens. Both are still at open = 0. */
export function pieceMotion(open: number) {
  return {
    top: { dx: -10 * open, dy: -82 * open, rot: -2.6 * open },
    bottom: { dx: 12 * open, dy: 78 * open, rot: 2.1 * open },
  }
}

/** Width of the white paper core exposed along a torn edge. */
export function fibreWidths(n: number, open: number, seed = 5) {
  const r = rng(seed)
  const k = Math.min(1, open * 4)
  return Array.from({ length: n }, (_, i) => k * (2.5 + 6 * (0.5 + 0.5 * Math.sin(i * 0.37 + seed)) * (0.6 + r() * 0.8)))
}
// #endregion

// ---------------------------------------------------------------- geometry

const VIEW_W = 1000
const CX = 500
const CY = 318
const FAR = 4000 // the paper halves reach well past any screen
// the visible frame: cropped to the artwork, with room for the halves to part
const FRAME = "36 44 928 468"
const EYES: Pt[] = [
  [-138, 6],
  [138, -4],
]

const d = (pts: Pt[], close = true) =>
  "M" + pts.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1)).join("L") + (close ? "Z" : "")

/** A stripe: a quadratic spine with a width that tapers to points at both ends. */
function stripe(p0: Pt, p1: Pt, p2: Pt, w: number, n = 18) {
  const left: Pt[] = []
  const right: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const m = 1 - t
    const x = m * m * p0[0] + 2 * m * t * p1[0] + t * t * p2[0]
    const y = m * m * p0[1] + 2 * m * t * p1[1] + t * t * p2[1]
    const dx = 2 * m * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
    const dy = 2 * m * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
    const l = Math.hypot(dx, dy) || 1
    const h = (w / 2) * Math.pow(Math.sin(Math.PI * t), 0.6)
    left.push([x - (dy / l) * h, y + (dx / l) * h])
    right.push([x + (dy / l) * h, y - (dx / l) * h])
  }
  return d(left.concat(right.reverse()))
}

/** The face's stripes, and the body stripes running off both sides. Deterministic. */
function buildStripes() {
  const r = rng(29)
  const j = (a: number) => (r() - 0.5) * a
  const out: string[] = []
  // forehead: a fan of short stripes converging above the nose
  for (const k of [-2, -1, 0, 1, 2]) {
    out.push(stripe([k * 27 + j(8), -205], [k * 21 + j(6), -140], [k * 11, -72 + Math.abs(k) * 10], 13 - Math.abs(k) * 2))
  }
  for (const s of [-1, 1]) {
    // brow arcs over the white patches
    out.push(stripe([s * 50, -108], [s * 138, -140 + j(8)], [s * 228, -96], 13))
    out.push(stripe([s * 72, -158], [s * 150, -188 + j(8)], [s * 250, -150], 11))
    // cheek bars reaching in from the sides
    for (const y of [-160, -104, -48, 14, 76, 138]) {
      out.push(stripe([s * 350, y + j(10)], [s * 292, y + j(26)], [s * (222 + r() * 30), y + j(34)], 18 + r() * 8))
    }
    // under-eye streaks
    out.push(stripe([s * 212, 38], [s * 256, 72], [s * 330, 98], 14))
    out.push(stripe([s * 182, 74], [s * 226, 120], [s * 312, 156], 12))
    // sides of the nose
    out.push(stripe([s * 64, 22], [s * 50, 88], [s * 42, 178], 8))
    // the ruff and body beyond the face, out past the edge of any screen
    for (let k = 0; k < 16; k++) {
      const x = s * (390 + k * 70 + j(30))
      out.push(stripe([x + j(40), -330], [x + s * 30 + j(40), j(60)], [x + s * 10 + j(40), 330], 20 + r() * 14))
    }
  }
  return out.join("")
}

/** Short hairs flowing outward from the nose, in three tones. */
function buildHairs() {
  const r = rng(53)
  const tones = ["", "", ""]
  for (let i = 0; i < 2600; i++) {
    const x = (r() - 0.5) * 1900
    const y = (r() - 0.5) * 480
    const a = Math.atan2(y - 150, x) + (r() - 0.5) * 0.5
    const l = 9 + r() * 12
    const seg = "M" + x.toFixed(1) + " " + y.toFixed(1) + "l" + (Math.cos(a) * l).toFixed(1) + " " + (Math.sin(a) * l).toFixed(1)
    tones[r() < 0.45 ? 0 : r() < 0.7 ? 1 : 2] += seg
  }
  return tones
}

/** Fine radial fibres in an iris. */
function buildFibres() {
  const r = rng(71)
  let s = ""
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2 + r() * 0.08
    const r0 = 12 + r() * 4
    const r1 = 30 + r() * 5
    s += "M" + (Math.cos(a) * r0).toFixed(1) + " " + (Math.sin(a) * r0).toFixed(1) + "L" + (Math.cos(a) * r1).toFixed(1) + " " + (Math.sin(a) * r1).toFixed(1)
  }
  return s
}

// An almond eye: sharp outer corner, inner corner dipping toward the nose
// (drawn for the right eye; the left one is mirrored).
const ALMOND = "M-78 10 C-52 -40 30 -56 80 -8 C44 40 -30 50 -78 10Z"

// ---------------------------------------------------------------- the tiger

const Fur = React.memo(function Fur({ id, fur }: { id: string; fur: string }) {
  const stripes = React.useMemo(buildStripes, [])
  const hairs = React.useMemo(buildHairs, [])
  return (
    <g>
      <rect x={-2600} y={-420} width={5200} height={840} fill={fur} />
      <rect x={-2600} y={-420} width={5200} height={840} fill={"url(#" + id + "-shade)"} />
      <rect x={-2600} y={-420} width={5200} height={840} fill={"url(#" + id + "-vignette)"} />
      <g filter={"url(#" + id + "-soft)"} fill="#fbf6ec">
        {EYES.map(([x, y], i) => (
          <React.Fragment key={i}>
            <ellipse cx={x} cy={y - 52} rx={78} ry={22} />
            <ellipse cx={x} cy={y + 44} rx={64} ry={15} opacity={0.9} />
          </React.Fragment>
        ))}
        <ellipse cx={0} cy={188} rx={96} ry={52} opacity={0.85} />
      </g>
      <g filter={"url(#" + id + "-rough)"}>
        <path d={stripes} fill="#140b05" />
      </g>
      <path d={hairs[0]} stroke="#3b1c07" strokeWidth={1.4} opacity={0.35} strokeLinecap="round" />
      <path d={hairs[1]} stroke="#f7c46e" strokeWidth={1.2} opacity={0.35} strokeLinecap="round" />
      <path d={hairs[2]} stroke="#fff6e4" strokeWidth={1} opacity={0.22} strokeLinecap="round" />
    </g>
  )
})

function Eye({
  id,
  x,
  y,
  flip,
  look,
  blink,
  pupil,
  scale,
  fibres,
}: {
  id: string
  x: number
  y: number
  flip: boolean
  look: Pt
  blink: number
  pupil: number
  scale: number
  fibres: string
}) {
  const clip = id + (flip ? "-cl" : "-cr")
  const lx = look[0] * (flip ? -1 : 1)
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + (flip ? -scale : scale) + " " + scale + ")"}>
      <clipPath id={clip}>
        <path d={ALMOND} />
      </clipPath>
      {/* dark skin around the eye, and the tear-mark toward the nose */}
      <path d={ALMOND} fill="#0c0603" stroke="#0c0603" strokeWidth={11} strokeLinejoin="round" />
      <path d="M-80 8 C-86 20 -96 30 -98 44 C-90 34 -80 24 -70 18Z" fill="#0c0603" />
      <g clipPath={"url(#" + clip + ")"}>
        <ellipse cx={0} cy={0} rx={80} ry={52} fill="#3d1a05" />
        <g transform={"translate(" + (lx * 13).toFixed(2) + " " + (4 + look[1] * 7).toFixed(2) + ")"}>
          <circle r={38} fill={"url(#" + id + "-iris)"} />
          <path d={fibres} stroke="#6b2d05" strokeWidth={1} opacity={0.35} />
          <circle r={38} fill="none" stroke="#3a1602" strokeWidth={3} opacity={0.8} />
          <circle r={13 * pupil} fill="#050302" />
          <ellipse cx={-12} cy={-13} rx={7.5} ry={5.5} fill="#fff" opacity={0.92} />
          <circle cx={9} cy={10} r={2.6} fill="#fff" opacity={0.6} />
        </g>
        {/* the upper lid's shadow, and the lid itself when it closes */}
        <ellipse cx={0} cy={-46} rx={90} ry={34} fill={"url(#" + id + "-lid)"} />
        <g transform={"translate(0 " + (-62 + blink * 72).toFixed(2) + ")"}>
          <rect x={-90} y={-80} width={180} height={80} fill="#9c5212" />
          <path d="M-90 0 H90" stroke="#0c0603" strokeWidth={8} />
        </g>
      </g>
    </g>
  )
}

// ---------------------------------------------------------------- the paper

// Where the paper curls back over the gap: [x along the tear, half-width, depth].
const CURLS: Record<"top" | "bottom", [number, number, number][]> = {
  top: [
    [300, 44, 30],
    [575, 30, 20],
    [790, 52, 34],
  ],
  bottom: [
    [205, 50, 32],
    [470, 34, 22],
    [690, 40, 28],
  ],
}

function Half({
  id,
  side,
  line,
  open,
  children,
}: {
  id: string
  side: "top" | "bottom"
  line: Pt[]
  open: number
  children: React.ReactNode
}) {
  const up = side === "top"
  const m = pieceMotion(open)[side]
  const shape = up
    ? [[line[0][0], -FAR] as Pt, [line[line.length - 1][0], -FAR] as Pt, ...[...line].reverse()]
    : [...line, [line[line.length - 1][0], FAR] as Pt, [line[0][0], FAR] as Pt]
  const widths = fibreWidths(line.length, open, up ? 5 : 8)
  // the white paper core along the edge, on this half's side of it
  const core = line.concat(line.map(([x, y], i) => [x, y + (up ? -widths[i] : widths[i])] as Pt).reverse())
  const curls = CURLS[side].map(([cx, hw, depth]) => {
    const pts = line.filter(([x]) => Math.abs(x - cx) <= hw)
    const back = pts.map(([x, y]) => {
      const s = Math.cos(((x - cx) / hw) * (Math.PI / 2))
      return [x + (up ? 6 : -6) * s * open, y + (up ? 1 : -1) * depth * s * s * Math.min(1, open * 2.5)] as Pt
    })
    return d(pts.concat(back.reverse()))
  })
  const transform =
    "translate(" + m.dx.toFixed(2) + " " + m.dy.toFixed(2) + ") rotate(" + m.rot.toFixed(3) + " " + CX + " " + CY + ")"
  const clip = id + "-" + side
  return (
    <g transform={transform}>
      {/* the half's own shadow on the tiger */}
      {open > 0 ? (
        <path
          d={d(line, false)}
          fill="none"
          stroke="#000"
          strokeOpacity={0.55 * Math.min(1, open * 3)}
          strokeWidth={22}
          transform={"translate(0 " + (up ? 10 : -10) + ")"}
          filter={"url(#" + id + "-soft)"}
        />
      ) : null}
      <clipPath id={clip}>
        <path d={d(shape)} />
      </clipPath>
      <g clipPath={"url(#" + clip + ")"}>{children}</g>
      {open > 0 ? (
        <>
          <path d={d(core)} fill="#ffffff" />
          {curls.map((c, i) => (
            <path key={i} d={c} fill={"url(#" + id + "-curl-" + side + ")"} stroke="#fff" strokeWidth={1} />
          ))}
        </>
      ) : null}
    </g>
  )
}

// ---------------------------------------------------------------- video component

export interface TigerTearVideoProps {
  word?: string
  tagline?: string
  ink?: string
  paper?: string
  taglineColor?: string
  eyeColor?: string
  furColor?: string
  fontFamily?: string
  /** Frame the crack starts, and how long the whole tear takes (crack -> eyes open). */
  startFrame?: number
  tearFrames?: number
  /** Scale of the artwork across the 1080 width: 0.9 keeps the word inside the reel safe area (x 90-990);
   *  >1 makes the tiger bigger but crops the word's ends. */
  zoom?: number
  /** Frames (relative to the eyes opening) where the tiger blinks. */
  blinks?: number[]
}

export function TigerTearVideo({
  word = "COURAGE",
  tagline = "HAVE NO FEAR",
  ink = "#cf2e3d",
  paper = "#f2f1ee",
  taglineColor = "#2a2a2a",
  eyeColor = "#f0a526",
  furColor = "#d9832c",
  fontFamily = '"' + ANTON + '", Impact, sans-serif',
  startFrame = 0,
  tearFrames = 75,
  zoom = 0.9,
  blinks = [40, 110],
}: TigerTearVideoProps) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const id = "ttv" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const fibres = React.useMemo(buildFibres, [])
  const line = React.useMemo(() => tearLine(), [])

  const p = clamp01((frame - startFrame) / tearFrames)
  const s = stages(p)
  const pop = easeOutBack(s.pop)
  const openFrame = startFrame + Math.round(tearFrames * 0.88)
  const t = (frame - openFrame) / fps
  // a slow wandering gaze, the same on every render
  const look: Pt = frame < openFrame ? [0, 0] : [Math.sin(t * 1.3) * 0.7, Math.sin(t * 0.9 + 1) * 0.35]
  let blinkNow = 0
  for (const b of blinks) {
    const k = frame - openFrame - b
    if (k >= 0 && k < 3) blinkNow = Math.max(blinkNow, k / 3)
    else if (k >= 3 && k < 7) blinkNow = Math.max(blinkNow, 1 - (k - 3) / 4)
  }

  const eyeScale = 0.9 + 0.1 * pop
  const pupil = 1.3 - 0.5 * s.pop
  const blink = Math.max(1 - clamp01(pop), blinkNow)
  const rise = (1 - s.rise) * 150
  const shake = Math.sin(p * 900) * 6 * s.shake
  const crackReach = s.crack * 620
  const crack = line.filter(([x]) => Math.abs(x - CX) <= crackReach)
  const tiger =
    "translate(" + CX + " " + (CY + rise).toFixed(2) + ") rotate(-7) scale(" + (1.34 - 0.06 * s.rise).toFixed(4) + ")"

  const sheet = (
    <>
      <rect x={-FAR} y={-FAR} width={FAR * 2 + VIEW_W} height={FAR * 2} fill={paper} />
      {tagline ? (
        <text x={CX} y={150} textAnchor="middle" fill={taglineColor}
          style={{ font: '700 32px "Helvetica Neue", Helvetica, Arial, sans-serif', letterSpacing: "0.42em" }}>
          {tagline}
        </text>
      ) : null}
      <text x={CX} y={404} textAnchor="middle" textLength={880} lengthAdjust="spacingAndGlyphs" fill={ink}
        style={{ fontFamily, fontSize: 250, fontWeight: 400, letterSpacing: 0 }}>
        {word}
      </text>
    </>
  )

  // Vertical frame: the 928x468 poster sits centred, scaled to the width times `zoom`; paper fills above and below.
  const [fx, fy, fw, fh] = FRAME.split(" ").map(Number)
  const vw = fw / zoom
  const vh = vw * (height / width)
  const viewBox = [fx + (fw - vw) / 2, fy + fh / 2 - vh / 2, vw, vh].map((v) => v.toFixed(2)).join(" ")

  return (
    <svg viewBox={viewBox} width={width} height={height} style={{ position: "absolute", inset: 0, display: "block", background: paper }}>
      <defs>
        <linearGradient id={id + "-shade"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1203" stopOpacity={0.45} />
          <stop offset="0.45" stopColor="#ffd08a" stopOpacity={0.12} />
          <stop offset="1" stopColor="#2a1203" stopOpacity={0.5} />
        </linearGradient>
        <radialGradient id={id + "-vignette"} cx="0.5" cy="0.5" r="0.5" gradientTransform="translate(0.5 0.5) scale(0.25 1) translate(-0.5 -0.5)">
          <stop offset="0.5" stopColor="#1a0a02" stopOpacity={0} />
          <stop offset="1" stopColor="#1a0a02" stopOpacity={0.55} />
        </radialGradient>
        <radialGradient id={id + "-iris"}>
          <stop offset="0" stopColor="#fff0a8" />
          <stop offset="0.35" stopColor={eyeColor} />
          <stop offset="0.8" stopColor="#b8570f" />
          <stop offset="1" stopColor="#4d1f03" />
        </radialGradient>
        <linearGradient id={id + "-lid"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.75} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={id + "-curl-top"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9d4cb" />
        </linearGradient>
        <linearGradient id={id + "-curl-bottom"} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9d4cb" />
        </linearGradient>
        <filter id={id + "-soft"} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={id + "-rough"} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="9" />
        </filter>
        <filter id={id + "-glow"} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform={"translate(" + shake.toFixed(2) + " " + (shake * 0.4).toFixed(2) + ")"}>
        {s.open > 0 ? (
          <g transform={tiger}>
            <Fur id={id} fur={furColor} />
            <g filter={s.pop > 0.02 ? "url(#" + id + "-glow)" : undefined}>
              {EYES.map(([x, y], i) => (
                <Eye key={i} id={id} x={x} y={y} flip={i === 0} look={look} blink={blink} pupil={pupil} scale={eyeScale} fibres={fibres} />
              ))}
            </g>
          </g>
        ) : null}
        {s.open > 0 ? (
          <>
            <Half id={id} side="top" line={line} open={s.open}>{sheet}</Half>
            <Half id={id} side="bottom" line={line} open={s.open}>{sheet}</Half>
          </>
        ) : (
          sheet
        )}
        {s.crack > 0 && s.open < 0.15 && crack.length > 1 ? (
          <path d={d(crack, false)} fill="none" stroke="#1d0f07" strokeWidth={2.4} strokeLinejoin="bevel" opacity={1 - s.open / 0.15} />
        ) : null}
      </g>
    </svg>
  )
}
