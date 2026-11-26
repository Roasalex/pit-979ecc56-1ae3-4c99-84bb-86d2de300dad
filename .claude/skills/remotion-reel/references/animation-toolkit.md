# Animation toolkit

Use this when you build an effect. `motion-graphics.md` decides *what* each moment needs.
This file covers the *how*: the Remotion packages, open-source code worth reading, a catalogue
of ad effects with code sketches, and the pitfalls of headless rendering.
Colours, fonts and motifs always come from `brand/<brand>/theme.tsx`. The hex values below are
placeholders.

> **Creator vetoes win.** `motion-graphics.md` §6 rules out **slam-in stamp text**,
> **hand-drawn circles and underlines over cards**, purple, and glows pooled in the middle of the
> background. Effects #6 and #7 below are documented only because they were asked for. Use them
> only when the creator asks for them by name.

**How this was verified (Nov 2026).** Every package signature below was checked against the
4.0.539 type definitions: `npm pack @remotion/<pkg>@4.0.539`, then reading `dist/*.d.ts`.
www.remotion.dev and github.com could not be reached from the research session, so the docs links
are the canonical pages but were not re-read. GitHub READMEs and licences were read through
raw.githubusercontent.com.

**Installed today:** `remotion`, `@remotion/paths`, `@remotion/captions`, `@remotion/fonts`,
`@remotion/google-fonts`. The others need `npm i --save-exact @remotion/<pkg>@4.0.539`. Every
`@remotion/*` package must be on exactly the same version as `remotion`. Ask before adding one.

Also check `src/shared/` before you build anything: `StatCount`, `SegmentMeter`, `AssembleText`,
`ReviewWall`, `DataFlow` and others already exist.

---

## 1. Core primitives (from `remotion`)

```tsx
import { spring, interpolate, interpolateColors, Easing, random, measureSpring,
         useCurrentFrame, useVideoConfig, Sequence, Series, AbsoluteFill } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
// spring({ frame, fps, config?: {damping, mass, stiffness, overshootClamping}, from?, to?,
//          durationInFrames?, durationRestThreshold?, delay?, reverse? }) => number
const pop   = spring({ frame, fps, delay: 6, config: { damping: 12, stiffness: 180 } }); // overshoots
const glide = spring({ frame, fps, config: { damping: 200 } });                          // no bounce
const x = interpolate(frame, [0, 20], [-200, 0], {
  easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const c = interpolateColors(frame, [0, 15], ["#1A1A1A", "#FFD400"]);
const len = measureSpring({ fps, config: { damping: 12 } }); // frames until the spring settles
```

Spring presets for ads: **pop** `{damping: 12, stiffness: 180}` (overshoot about 10%), **slam**
`{damping: 18, stiffness: 400, mass: 0.6}`, **glide** `{damping: 200}`. When you need
`interpolate` easing, `Easing.bezier(0.16,1,0.3,1)` (expo-out) is the house feel. `Easing.back(1.7)`
gives a cheap overshoot.

---

## 2. Official packages

### @remotion/transitions: scene-to-scene transitions
[docs](https://www.remotion.dev/docs/transitions). `TransitionSeries` replaces `Series`. Each
`<TransitionSeries.Transition>` overlaps the two scenes either side of it, so the **total length =
sum of the sequences − sum of the transitions**. `<TransitionSeries.Overlay durationInFrames offset?>`
(present in the 4.0.539 types) lays something across a cut *without* overlapping the scenes, e.g. a flash frame.

```tsx
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";   // {direction: 'from-left'|'from-right'|'from-top'|'from-bottom'}
import { wipe } from "@remotion/transitions/wipe";     // 8 directions incl. 'from-top-left'
import { pushCut } from "@remotion/transitions/push-cut";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}><Hook /></TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={slide({ direction: "from-bottom" })}
    timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })} />
  <TransitionSeries.Sequence durationInFrames={90}><Proof /></TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={pushCut({ flashColor: "#fff", flashOpacity: 0.8, flashFrames: 2 })}
    timing={linearTiming({ durationInFrames: 10, easing: Easing.out(Easing.cubic) })} />
  <TransitionSeries.Sequence durationInFrames={60}><Cta /></TransitionSeries.Sequence>
</TransitionSeries>
```

- **Safe in headless renders (CSS/SVG):** `fade`, `slide`, `wipe`, `flip`, `clock-wipe`
  (`{width,height}` required), `iris` (`{width,height}` required), `push-cut` (punch-in with an
  optional flash, which suits ads; props `outgoingScale`, `incomingStartScale`, `flashColor`,
  `flashFrames`…), `none`.
- **Shader set: avoid.** `blur-slide`, `book-flip`, `cross-zoom`, `crosswarp`, `dissolve`,
  `dreamy-zoom`, `film-burn`, `linear-blur`, `ripple`, `swap`, `zoom-blur`, `zoom-in-out`. They run
  on the experimental *HTML-in-canvas* API, and the source throws *"HTML in Canvas requires Chrome
  149 or newer with Canvas Draw Element enabled at chrome://flags/#canvas-draw-element"*. When you
  need a shader transition, use HyperFrames (`hyperframes-hybrid.md`).
- `useTransitionProgress()` inside a scene gives `{entering, exiting, isInTransitionSeries}`, so
  the scene's own content can animate along with the transition.

### @remotion/paths: draw any SVG path (installed)
[docs](https://www.remotion.dev/docs/paths). `evolvePath(progress, d) => {strokeDasharray,
strokeDashoffset}` draws a stroke on. Also useful: `getLength(d)`, `getPointAtLength(d, len)`,
`getTangentAtLength(d, len)` (move something along a path, or point an arrowhead the right way),
`interpolatePaths(t, [0,1], [dA, dB])` (morph one shape into another), `getBoundingBox`,
`scalePath`, `translatePath`, `reversePath`.

```tsx
import { evolvePath, getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
const d = "M 100 900 C 300 700, 700 1100, 900 850";
const t = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
const { strokeDasharray, strokeDashoffset } = evolvePath(t, d);
const L = getLength(d), p = getPointAtLength(d, L * t)!, tan = getTangentAtLength(d, L * t)!;
<svg width={1080} height={1920}>
  <path d={d} stroke="#FFD400" strokeWidth={10} fill="none" strokeLinecap="round"
        strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
  <g transform={`translate(${p.x} ${p.y}) rotate(${Math.atan2(tan.y, tan.x) * 180 / Math.PI})`}>
    <path d="M -22 -16 L 0 0 L -22 16" stroke="#FFD400" strokeWidth={10} fill="none" />
  </g>
</svg>
```

### @remotion/shapes: geometry as paths or components
[docs](https://www.remotion.dev/docs/shapes). Components: `<Circle radius>`, `<Rect>`, `<Ellipse
rx ry>`, `<Star points innerRadius outerRadius cornerRadius?>`, `<Triangle>`, `<Polygon>`,
`<Pie radius progress closePath? rotation?>`, `<Heart>`, `<Arrow length headWidth headLength
shaftWidth direction cornerRadius>`, `<Callout>`, `<Spark>`. Each takes normal SVG path props
(`fill`, `stroke`, `style`). The `make*` versions (`makeStar({points:5, innerRadius, outerRadius})`)
return `{path, width, height, transformOrigin, instructions}`. Feed `path` into `evolvePath` to get
a drawn-on shape. `makePie({radius, progress, closePath:false})` gives an open arc, which is a
ready-made progress ring.

```tsx
import { makeStar, Pie } from "@remotion/shapes";
const star = makeStar({ points: 5, innerRadius: 28, outerRadius: 60, cornerRadius: 6 });
<svg width={star.width} height={star.height}><path d={star.path} fill="#FFD400" /></svg>
<Pie radius={120} progress={t} closePath={false} fill="none" stroke="#FFD400" strokeWidth={18} rotation={-Math.PI / 2} />
```

### @remotion/noise: organic, deterministic wobble
[docs](https://www.remotion.dev/docs/noise). `noise2D(seed, x, y)`, `noise3D(seed, x, y, z)` and
`noise4D(seed, x, y, z, w)` return values in −1..1 (simplex noise). The output depends only on
its inputs, so it is safe to call with the frame number.

```tsx
import { noise2D } from "@remotion/noise";
const drift = (i: number) => ({ x: noise2D("x" + i, frame * 0.01, 0) * 12, y: noise2D("y" + i, frame * 0.01, 0) * 12 });
// handheld camera shake: noise2D("cam", frame * 0.05, 0) * amplitude
```

### @remotion/motion-blur: speed lines and smear
[docs](https://www.remotion.dev/docs/motion-blur). `<Trail layers lagInFrames trailOpacity>` (all
three props required) renders N lagged copies, which gives a ghosted trail.
`<CameraMotionBlur shutterAngle={180} samples={10}>` renders the children at sub-frame times and
blends them, which looks like real motion blur. **Cost: render time × samples.** Wrap only the
moving element, only for the frames it moves (inside a `<Sequence>`). `HtmlInCanvasMotionBlur` is
experimental and needs the same Chrome flag as the shader transitions: avoid it.

```tsx
import { CameraMotionBlur, Trail } from "@remotion/motion-blur";
<Sequence from={30} durationInFrames={12}>
  <CameraMotionBlur shutterAngle={240} samples={8}><WhipCard /></CameraMotionBlur>
</Sequence>
<Trail layers={6} lagInFrames={0.6} trailOpacity={0.9}><FlyingIcon /></Trail>
```

### @remotion/layout-utils: make text fit
[docs](https://www.remotion.dev/docs/layout-utils). `fitText({text, withinWidth, fontFamily,
fontWeight?, letterSpacing?, textTransform?}) => {fontSize}`, `measureText({text, fontFamily,
fontSize, fontWeight?}) => {width, height}`, `fitTextOnNLines({text, maxLines, maxBoxWidth,
fontFamily, maxFontSize?}) => {fontSize, lines}`, and `fillTextBox({maxBoxWidth, maxLines}).add(word)
=> {exceedsBox, newLine}`. **The font must already be loaded**, so load it with `@remotion/fonts`
before you measure. By default these functions check this (`validateFontIsLoaded`).

```tsx
import { fitText } from "@remotion/layout-utils";
const { fontSize } = fitText({ text: "BOOKED OUT", withinWidth: 860, fontFamily: brand.display, fontWeight: 900, textTransform: "uppercase" });
<div style={{ fontSize: Math.min(220, fontSize), fontFamily: brand.display }}>BOOKED OUT</div>
```

Use it for the 860 px headline rule in `motion-graphics.md`, and to size bubbles and highlights
(effects #1 and #14).

### @remotion/animation-utils: tween whole style objects
[docs](https://www.remotion.dev/docs/animation-utils). `interpolateStyles(input, inputRange,
stylesRange, options?)` returns CSSProperties. `makeTransform([scale(1.2), translateY(40),
rotate(-8)])` builds a transform string. All the CSS transform functions are exported (`rotate(n,
'deg')`, `translateX(n,'px')`…).

```tsx
import { interpolateStyles, makeTransform, scale, rotate } from "@remotion/animation-utils";
const style = interpolateStyles(frame, [0, 8, 14], [
  { opacity: 0, transform: "scale(2.4) rotate(-14deg)" },
  { opacity: 1, transform: "scale(0.92) rotate(-8deg)" },
  { opacity: 1, transform: "scale(1) rotate(-8deg)" },
]);
```

### @remotion/lottie: drop in After Effects animations
[docs](https://www.remotion.dev/docs/lottie). Needs the peer dependency `lottie-web@^5`. Props:
`animationData` (required), `loop`, `playbackRate`, `direction`, `renderer`, `style`. The player
is synced to the frame, so it is deterministic. Keep the JSON in `public/` and load it under
`delayRender`. Good for animated icons (a check burst, confetti, a ringing phone) from libraries
whose licence lets you use them in client ads. Recolour to the brand in the JSON or with a CSS filter.

```tsx
import { Lottie, LottieAnimationData } from "@remotion/lottie";
const [data, setData] = useState<LottieAnimationData | null>(null);
const { delayRender, continueRender, cancelRender } = useDelayRender();
const [h] = useState(() => delayRender("lottie"));
useEffect(() => { fetch(staticFile("lottie/check.json")).then(r => r.json())
  .then(j => { setData(j); continueRender(h); }).catch(cancelRender); }, []);
return data ? <Lottie animationData={data} loop={false} style={{ width: 300 }} /> : null;
```

### @remotion/captions: TikTok-style caption pages (installed)
[docs](https://www.remotion.dev/docs/captions). `createTikTokStyleCaptions({captions,
combineTokensWithinMilliseconds, breakOnSilenceAfterMilliseconds?}) => {pages: TikTokPage[]}`.
Each page has `{text, startMs, durationMs, tokens: [{text, fromMs, toMs}]}`. Our
`<video>.words.json` has `{text, startMs, endMs}` with no leading spaces, so map it to `Caption`
first. `captions.md` owns the chunking rules, so this is only the plumbing:

```tsx
import { createTikTokStyleCaptions, Caption } from "@remotion/captions";
const caps: Caption[] = words.map((w, i) => ({ text: (i ? " " : "") + w.text, startMs: w.startMs,
  endMs: w.endMs, timestampMs: (w.startMs + w.endMs) / 2, confidence: null }));
const { pages } = createTikTokStyleCaptions({ captions: caps, combineTokensWithinMilliseconds: 900 });
// per page: <Sequence from={ms2f(p.startMs)} durationInFrames={ms2f(p.durationMs)}>;
// active token: t.fromMs <= nowMs < t.toMs -> brand accent colour + scale pop
```

---

## 3. Open-source code worth reading

| Repo | Licence | Worth copying |
|---|---|---|
| [remotion-dev/template-tiktok](https://github.com/remotion-dev/template-tiktok) | UNLICENSED template + Remotion licence | `src/CaptionedVideo/Page.tsx`: `fitText` caps the caption size, `WebkitTextStroke: 20px black` + `paintOrder: "stroke"` makes a thick outline that doesn't eat the glyph, the active word is recoloured by ms, and the page enters with `makeTransform([scale, translateY])`. `load-font.ts`: a self-hosted font under `delayRender`. |
| [remotion-dev/github-unwrapped](https://github.com/remotion-dev/github-unwrapped) (+ `-2023`, `-2022`, `-2021`) | none stated; README invites forking "as a template" with legal disclaimers | Data-driven year-in-review scenes: big counters, a planet/space-camera journey, staggered stat cards, a parametrised composition rendered per user (the pattern for client-variant ads). |
| [remotion-dev/trailer](https://github.com/remotion-dev/trailer) | UNLICENSED, "a company license is needed" | Remotion's own launch trailer: tight spring choreography, 3D card flips, logo build. Read it for timing, don't copy assets. |
| [remotion-dev/template-audiogram](https://github.com/remotion-dev/template-audiogram) | UNLICENSED | Audio-reactive waveform bars (`visualizeAudio`) + captions: a "voice note" card. |
| [remotion-dev/template-code-hike](https://github.com/remotion-dev/template-code-hike) | UNLICENSED | Animated code/text morphing between snippets (token-level transitions). |
| [remotion-dev/template-prompt-to-video](https://github.com/remotion-dev/template-prompt-to-video) | UNLICENSED | Timeline JSON → scenes: Ken Burns on stills, caption sync. |
| [reactvideoeditor/remotion-templates](https://github.com/reactvideoeditor/remotion-templates) | MIT (README) | **81 single-file templates** using only `useCurrentFrame/interpolate/spring`: `notification-pop.tsx` (stacking toasts), `glitch-text.tsx` / `logo-glitch-reveal.tsx` (RGB split + decay), `typewriter-subtitle.tsx`, `text-highlight.tsx`, `stat-counter.tsx`, `circular-progress.tsx`, `bubble-pop-text.tsx`. The best quarry for this toolkit. |
| [reactvideoeditor/clippkit](https://github.com/reactvideoeditor/clippkit) | MIT | Copy-paste text effects, intros, loaders, blur overlays. |
| [stefanwittwer/remotion-animated](https://github.com/stefanwittwer/remotion-animated) | MIT | Declarative `<Animated animations={[Move({y:-40, start:10}), Scale({by:1.2})]}>`. Good for chaining moves. |
| [pskd73/remotion-animate-text](https://github.com/pskd73/remotion-animate-text) | MIT | `<AnimatedText>` splits by char or word and interpolates opacity/x/y/scale/rotate per part, with per-part durations. This is the letter-stagger pattern. |
| [av/remotion-bits](https://github.com/av/remotion-bits) | MIT | Text effects, gradient transitions, particles, 3D. Pull single bits through jsrepo instead of the whole package. |
| [Curvable/motion](https://github.com/Curvable/motion) | MIT | 14 launch-video scenes (floating stack, prompt input, stats grid). Copy its contract: deterministic per frame, **one `primary` hex → whole palette derived in HSL**, exported `Defaults` + `compute<Name>Duration`. A good model for our brand theme. |

There is no mature open-source iMessage component. Remotion's own "On-Screen Messages" element
(remotion.dev/elements, storytelling) and 21st.dev's "iMessage Chat Flow" are references for the
look. Build it in-house (effect #1).

**Remotion licence** ([LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md),
read from `node_modules/remotion/LICENSE.md`): the free licence covers individuals, **for-profit
organisations with up to 3 employees**, non-profits, and evaluation. Anyone else needs a **Company
License** ([remotion.pro/license](https://www.remotion.pro/license)). The licence says terms change
slightly in Remotion 5.0. A marketing agency over 3 people producing client ads needs a company
licence. Tell the creator once. It isn't our call. MIT component repos are fine to copy (keep the
licence notice in the file header). The `UNLICENSED` official templates are free to *learn from*
under the Remotion licence.

---

## 4. Effect catalogue

All sketches assume `const frame = useCurrentFrame(); const { fps } = useVideoConfig();` and are
written so that `frame` is local to a `<Sequence>`. Anchor each one's `<Sequence from>` to a word in
`words.json`, a few frames before the word (`motion-graphics.md` §5). Add a pop sound on each land and
a whoosh on each move (`audio.md`).

### Messages and UI

**1. iMessage/SMS thread with typing indicator.** Bubbles rise from the bottom one by one. Before
each incoming bubble, three dots pulse in a grey bubble. A sent bubble is blue and right-aligned,
with a tail. Older bubbles push up. Build: an array of `{from, text, at}`. Each bubble scales in
with a pop spring from its tail corner (`transformOrigin: "bottom right"`). The dots are a sine
wave offset by index, shown for `[at-18, at)`. Size each bubble with `measureText`.

```tsx
const Msg = ({ m, i }: { m: M; i: number }) => {
  const s = spring({ frame: frame - m.at, fps, config: { damping: 14, stiffness: 220 } });
  const typing = m.from === "them" && frame >= m.at - 18 && frame < m.at;
  const me = m.from === "me";
  return (<div style={{ alignSelf: me ? "flex-end" : "flex-start", transformOrigin: me ? "100% 100%" : "0 100%",
    transform: `scale(${typing ? 1 : s})`, opacity: typing || frame >= m.at ? 1 : 0, background: me ? "#0A84FF" : "#2C2C2E",
    color: "#fff", borderRadius: 38, padding: "22px 34px", fontSize: 44, maxWidth: 720 }}>
    {typing ? [0, 1, 2].map(d => <span key={d} style={{ display: "inline-block", width: 18, height: 18, margin: 6,
      borderRadius: 9, background: "#8E8E93", opacity: 0.4 + 0.6 * Math.max(0, Math.sin((frame - d * 4) / 4)) }} />) : m.text}
  </div>);
};
// Column: flex-direction column, justify-content flex-end; translateY the column by -(sum of
// visible bubble heights) with a glide spring so the old messages scroll up.
```

**2. Notification banner (iOS-style).** A frosted card drops from the top with app icon, title,
"now" and two lines of body text, then holds and slides back up. Stack them with a 6-frame stagger and
scale earlier ones to 0.95 behind. Build: a spring for `translateY` from -260, plus `backdropFilter`
(costly, see §5. A flat `rgba(30,30,30,.92)` card with no blur looks nearly the same).

```tsx
const inS = spring({ frame, fps, config: { damping: 16, stiffness: 200 } });
const outS = spring({ frame: frame - 70, fps, config: { damping: 200 } });
const y = interpolate(inS - outS, [0, 1], [-260, 0]);
<div style={{ position: "absolute", top: 300, left: 90, width: 900, transform: `translateY(${y}px)`,
  background: "rgba(28,28,30,.94)", borderRadius: 40, padding: 32, display: "flex", gap: 24,
  boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
  <Img src={staticFile("images/app-icon.png")} style={{ width: 96, height: 96, borderRadius: 22 }} />
  <div><b>New booking</b> <span style={{ opacity: .6 }}>now</span><div>Sarah booked Tue 10:00</div></div>
</div>
```

**3. Checklist ticking.** Rows slide in, then each box fills and a check mark draws itself, and
the row text dims to "done" or gets struck through. Build: `evolvePath` on the check path, with
start frames offset per row.

```tsx
{items.map((it, i) => { const at = 10 + i * 14;
  const tick = interpolate(frame, [at, at + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const box = spring({ frame: frame - at, fps, config: { damping: 12 } });
  const ck = evolvePath(tick, "M 14 34 L 28 48 L 54 18");
  return <div key={i} style={{ display: "flex", gap: 28, alignItems: "center" }}>
    <svg width={68} height={68}><rect x={2} y={2} width={64} height={64} rx={14} fill={tick > 0 ? "#FFD400" : "none"}
      stroke="#FFD400" strokeWidth={4} style={{ transform: `scale(${0.8 + 0.2 * box})`, transformOrigin: "center" }} />
      <path d="M 14 34 L 28 48 L 54 18" stroke="#111" strokeWidth={8} fill="none" strokeLinecap="round" {...ck} /></svg>
    <span style={{ opacity: 1 - 0.4 * tick }}>{it}</span></div>; })}
```

**4. Calendar slot fill.** A week grid of empty slots. Slots fill one by one with the brand colour
(a scale-pop and a client name), with a counter ("12 booked") above. Build: a CSS grid. Each slot's
`at` comes from a seeded shuffle, so the fill order looks organic but is the same on every render:
`random("slot"+i)`.

```tsx
const order = slots.map((_, i) => i).sort((a, b) => random("s" + a) - random("s" + b));
{slots.map((s, i) => { const at = 8 + order.indexOf(i) * 3;
  const p = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 240 } });
  return <div key={i} style={{ borderRadius: 14, border: "2px solid #333", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 4, borderRadius: 10, background: "#FFD400", transform: `scale(${p})` }} />
  </div>; })}
```

**5. Star rating fill.** Five stars pop in one after another, then fill left to right (partial
fills allowed, e.g. 4.8). Build: `makeStar`, with a `clipPath` rect whose width animates over a
gold copy laid on a grey copy. Show a real rating only (CLAUDE.md: no invented stats).

```tsx
const star = makeStar({ points: 5, innerRadius: 30, outerRadius: 64, cornerRadius: 6 });
const fill = interpolate(frame, [12, 40], [0, rating], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
<svg width={star.width * 5 + 80} height={star.height}>
  <defs><clipPath id="fill"><rect width={fill * (star.width + 20)} height={star.height} /></clipPath></defs>
  {[0, 1, 2, 3, 4].map(i => { const s = spring({ frame: frame - i * 3, fps, config: { damping: 10 } });
    return <g key={i} transform={`translate(${i * (star.width + 20)} 0)`}>
      <path d={star.path} fill="#333" transform={`scale(${s})`} style={{ transformOrigin: star.transformOrigin }} /></g>; })}
  <g clipPath="url(#fill)">{[0,1,2,3,4].map(i => <path key={i} d={star.path} fill="#FFD400" transform={`translate(${i * (star.width + 20)} 0)`} />)}</g>
</svg>
```

### Emphasis marks

**6. Stamp slam with shake (creator veto: only on request).** A rotated, bordered word ("SOLD",
"APPROVED") drops from scale 2.5 and opacity 0 to scale 1 at −8° in about 6 frames. On impact the
whole frame shakes for about 8 frames with decaying noise. Add ink texture with a grain mask.

```tsx
const s = spring({ frame, fps, config: { damping: 18, stiffness: 400, mass: 0.6 } });
const scaleV = interpolate(s, [0, 1], [2.5, 1]);
const hit = 6, k = Math.max(0, 1 - (frame - hit) / 8) * (frame >= hit ? 1 : 0);
const shake = { x: noise2D("sx", frame * 0.9, 0) * 18 * k, y: noise2D("sy", frame * 0.9, 0) * 18 * k };
<AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>{children}
  <div style={{ transform: `rotate(-8deg) scale(${scaleV})`, opacity: Math.min(1, s * 2), border: "10px solid #E5484D",
    color: "#E5484D", padding: "10px 40px", fontSize: 160, fontWeight: 900, borderRadius: 18 }}>BOOKED</div>
</AbsoluteFill>
```

**7. Hand-drawn circle around a thing (creator veto over cards: only on request).** A wobbly loop
draws around a number, then overshoots its start a little like a real pen. Build: generate the
ellipse with noise on the radius and about 1.15 turns, then `evolvePath`.

```tsx
const pts = Array.from({ length: 60 }, (_, i) => { const a = (i / 59) * Math.PI * 2 * 1.15 - 0.4;
  const r = 1 + noise2D("loop", i * 0.15, 0) * 0.06; return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]; });
const d = "M " + pts.map(p => p.join(" ")).join(" L ");
const { strokeDasharray, strokeDashoffset } = evolvePath(interpolate(frame, [0, 18], [0, 1],
  { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }), d);
<path d={d} fill="none" stroke="#FFD400" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round"
  strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
```

**8. Arrow / connector drawing.** A curved arrow draws from a caption to the thing it means, and its
head rides the tip. The code is in the `@remotion/paths` snippet in §2: `evolvePath` plus a
`getPointAtLength`/`getTangentAtLength` head. For a straight block arrow, use `makeArrow({length,
shaftWidth, headWidth, direction})` and reveal it with a `clipPath` rect growing along the arrow's
direction.

**9. Highlight-marker sweep under words.** A brand-colour bar wipes left to right behind a
key phrase, slightly skewed and with rounded ends, like a marker. Build: a span with a
`::before`-style absolute div whose `scaleX` goes 0 to 1 from `transformOrigin: left`. Use
`measureText` to get the word's width.

```tsx
const p = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
<span style={{ position: "relative", display: "inline-block" }}>
  <span style={{ position: "absolute", left: -10, right: -10, top: "55%", height: "42%", background: "#FFD400",
    borderRadius: 12, transform: `scaleX(${p}) skewX(-8deg)`, transformOrigin: "left center", zIndex: 0 }} />
  <span style={{ position: "relative", color: p > 0.5 ? "#111" : "#fff" }}>{word}</span>
</span>
```

### Kinetic typography

**10. Word-by-word slam.** Each word lands on its spoken `startMs`, comes in from scale 1.6 to 1
with a 2-frame white flash, and the previous words shrink and dim. Build: map `words.json` to
frames and give each word its own spring.

```tsx
{ws.map((w, i) => { const at = Math.round((w.startMs / 1000) * fps) - 2;
  const s = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 400, mass: 0.6 } });
  if (frame < at) return null;
  return <span key={i} style={{ display: "inline-block", marginRight: 24, transform: `scale(${interpolate(s, [0, 1], [1.6, 1])})`,
    opacity: s, color: frame - at < 2 ? "#fff" : i === ws.length - 1 ? "#FFD400" : "#fff" }}>{w.text}</span>; })}
```

**11. Scale-pop (one hero word).** One huge word pops in with an overshoot (scale 0 → 1.08 → 1) and a
slight rotate settle, then breathes (scale 1 → 1.03 over the hold). Build: a pop spring plus a slow
`interpolate` for the breathing.

```tsx
const s = spring({ frame, fps, config: { damping: 10, stiffness: 200 } });
const breathe = interpolate(frame, [15, 90], [1, 1.03], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
<div style={{ fontSize, transform: `scale(${s * breathe}) rotate(${interpolate(s, [0, 1], [-6, 0])}deg)` }}>FREE</div>
```

**12. Letter stagger.** Letters rise from below with blur and opacity, offset by 1.5 frames each,
then settle. Build: split into graphemes. Each letter gets `spring({frame: frame - i*1.5})`. Drop the
blur for long text (see §5 on cost).

```tsx
{[...text].map((ch, i) => { const s = spring({ frame: frame - i * 1.5, fps, config: { damping: 14 } });
  return <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: s,
    transform: `translateY(${(1 - s) * 80}px)`, filter: `blur(${(1 - s) * 8}px)` }}>{ch}</span>; })}
```

**13. Mask reveal (text rises out of a line).** Each line slides up from behind an invisible edge.
Build: an `overflow: hidden` wrapper per line with an inner `translateY(100% → 0)`, lines
staggered 4 frames apart. A variant: a `clipPath: inset(0 ${100-p*100}% 0 0)` wipe that follows a
solid bar.

```tsx
{lines.map((l, i) => { const s = spring({ frame: frame - i * 4, fps, config: { damping: 200 } });
  return <div key={i} style={{ overflow: "hidden", lineHeight: 1.05 }}>
    <div style={{ transform: `translateY(${(1 - s) * 110}%)` }}>{l}</div></div>; })}
```

**14. Typewriter with cursor.** Characters appear at about 2 per frame, a block cursor blinks
on a 16-frame period, and the cursor stops blinking while typing. Build: `text.slice(0,
Math.floor(frame * cps / fps))`. Pair it with a "prompt box" card (Curvable `prompt-input`, RVE
`typewriter-subtitle.tsx`). Keep the layout fixed by rendering the untyped rest with
`visibility: hidden`, so the text doesn't reflow.

### Numbers and progress

**15. Counter / odometer.** A rolling counter: each digit is a vertical strip 0–9 that rolls to
its target, and the higher digits land last. The simple version is `Math.round(interpolate(...))`
with `toLocaleString`. `src/shared/StatCount.tsx` already exists, so reuse it. Use real figures only.

```tsx
const Digit = ({ d, delay }: { d: number; delay: number }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 90 } });
  return <div style={{ height: 200, overflow: "hidden" }}><div style={{ transform: `translateY(${-s * d * 200}px)` }}>
    {Array.from({ length: 10 }, (_, n) => <div key={n} style={{ height: 200, lineHeight: "200px" }}>{n}</div>)}</div></div>;
};
// String(value).split("").map((c, i, a) => <Digit d={+c} delay={(a.length - i) * 3} />)
// fontVariantNumeric: "tabular-nums" so the digits don't jitter
```

**16. Progress / timer ring.** A ring fills clockwise with a number in the middle, for "30 days" or
"60-second setup". Build: `<Pie progress closePath={false}>` or a `<circle>` with
`strokeDasharray = C` and `strokeDashoffset = C*(1-p)`. Add a glowing head dot at the arc end
(cos/sin of the angle).

```tsx
const C = 2 * Math.PI * 160, p = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
<svg width={400} height={400} style={{ transform: "rotate(-90deg)" }}>
  <circle cx={200} cy={200} r={160} stroke="#222" strokeWidth={24} fill="none" />
  <circle cx={200} cy={200} r={160} stroke="#FFD400" strokeWidth={24} fill="none" strokeLinecap="round"
    strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
</svg>
```

**17. Bar race / segmented meter.** Bars grow on a stagger, with values counting at their tips.
`src/shared/SegmentMeter.tsx` exists. RVE `chart-animation.tsx` / `progress-bars.tsx` are references.

### Camera and space

**18. Virtual camera over a big canvas.** Lay out a 3240×5760 "board" (cards, screenshots, reviews)
and move one transform across it: push in on card A, pan to B, pull out to show everything. Build:
keyframes `{x, y, zoom}` and interpolate between them with expo-in-out. Apply
`translate(-x,-y) scale(z)` to the canvas inside a 1080×1920 `overflow:hidden` frame. Add
`CameraMotionBlur` only during fast moves. `screen-recordings.md` has the camera engine for
screen captures. Reuse its easing.

```tsx
const K = [{ f: 0, x: 1620, y: 2880, z: 0.34 }, { f: 30, x: 700, y: 1500, z: 1 }, { f: 75, x: 2400, y: 3900, z: 1 }];
const at = (k: "x" | "y" | "z") => interpolate(frame, K.map(q => q.f), K.map(q => q[k]),
  { easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateRight: "clamp" });
<AbsoluteFill style={{ overflow: "hidden" }}>
  <div style={{ position: "absolute", width: 3240, height: 5760, transformOrigin: "0 0",
    transform: `translate(${540 - at("x") * at("z")}px, ${960 - at("y") * at("z")}px) scale(${at("z")})` }}>{board}</div>
</AbsoluteFill>
```

Interpolating zoom on its own is linear in scale and feels like it speeds up as it goes. For long
zooms, interpolate `Math.log(z)` and take `exp` of the result.

**19. Slow push-in on talking head.** Scale 1.0 → 1.06 over a beat. On a `joinFrames` cut, jump to
1.12 with a 1-frame flash (CLAUDE.md: punch in on jump cuts). Pure `interpolate` on the
`<OffthreadVideo>` wrapper. Use `transformOrigin` at the eyes, not the centre.

**20. Parallax depth stack.** Background, mid cards and foreground cards move at 0.3×, 0.6× and
1× of the same pan, and the foreground gets a `drop-shadow`. Add a little `noise2D` drift per
layer so it never freezes.

### Transitions and finish

**21. Glitch / flash transition.** 4–6 frames: RGB-split copies offset ±12 px in red and cyan with
`mixBlendMode: "screen"`, random horizontal slice offsets (`clipPath: inset()` bands shifted by
`random("g"+frame+i)`), then a white flash frame, then cut. Build it as a `<TransitionSeries.Overlay>`
across the cut, or use `pushCut({flashColor})` for the clean version. RVE `glitch-text.tsx` is a
reference.

```tsx
const on = frame < 6, off = (i: number) => (random(`g${frame}-${i}`) - 0.5) * 80;
{on && [0, 1, 2, 3, 4].map(i => <AbsoluteFill key={i} style={{ clipPath: `inset(${i * 20}% 0 ${80 - i * 20}% 0)`,
  transform: `translateX(${off(i)}px)` }}>{scene}</AbsoluteFill>)}
<AbsoluteFill style={{ transform: "translateX(12px)", mixBlendMode: "screen", opacity: on ? 0.7 : 0,
  filter: "url(#red-only)" }}>{scene}</AbsoluteFill>   {/* or tint with a coloured overlay */}
<AbsoluteFill style={{ background: "#fff", opacity: frame === 5 ? 0.9 : 0 }} />
```

**22. Light sweep / sheen across a card.** A skewed white gradient band passes across a card once
when it lands, clipped to the card's border radius. Build: `overflow: hidden` on the card, plus an
absolute div with `linear-gradient(105deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%)`
whose `translateX` goes −120% → 120% over 18 frames. Use `mixBlendMode: "overlay"` on dark cards.

```tsx
const sx = interpolate(frame, [8, 26], [-120, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
<div style={{ position: "relative", overflow: "hidden", borderRadius: 36 }}>{card}
  <div style={{ position: "absolute", inset: 0, transform: `translateX(${sx}%)`,
    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%)" }} /></div>
```

**23. Pop-up card with shadow settle.** The default "pop-up card": it rises 60 px with a pop
spring, and its shadow grows from tight to soft as it "lifts". Pair it with #22 when it lands.
`boxShadow: 0 ${8+30*s}px ${20+60*s}px rgba(0,0,0,${.6-.2*s})`.

**24. Whip pan between cards.** Translate 1200 px in 8 frames with an expo-in-out ease, wrapped in
`CameraMotionBlur samples={6}`. Add a whoosh sound. A cheaper option: `slide()` +
`linearTiming({easing: Easing.inOut(Easing.exp)})` with a `blur(12px)` on the moving container,
only during the move.

**25. Film grain overlay.** A static grain PNG looks frozen. Instead, shift the tile each frame by
`random("grain"+frame)` px, at opacity 0.06–0.1, with `mixBlendMode: "overlay"`. The creator asks
for texture (§6 "flat ground plus grain").

---

## 5. Headless-render pitfalls

- **Fonts: self-host and wait.** Use `styles/fonts.ts` (`@remotion/fonts` `loadFont({family,
  url, weight})` with files from `@fontsource/*`/`staticFile`). `loadFont` returns a Promise and
  holds the render until the font is ready. Don't fetch Google Fonts at render time: a slow or
  blocked network means a fallback font or a timeout, and `fitText`/`measureText` measure the
  wrong face. `@remotion/google-fonts` is installed but downloads from Google on every render.
  Prefer @fontsource files.
- **Determinism.** A frame can be rendered in any order, on any of several parallel tabs. Never use
  `Math.random()`, `Date.now()`, `new Date()` or any state that accumulates across frames
  (`useState` counters, `setInterval`). Use `random(seed)` from `remotion` (same seed gives the
  same value) and seed it by index *and* frame when it should change per frame (`random("g"+frame)`).
  Use `noise2D(seed, frame*k, 0)` for smooth randomness. CSS animations and transitions
  (`@keyframes`, `transition:`) don't follow the frame. Compute every value from
  `useCurrentFrame()`.
- **Hooks order.** Call `useCurrentFrame`, `useVideoConfig`, `useDelayRender` and `useState` at the
  top level of the component, never inside `.map`, conditions or after an early `return null`. To
  get per-item springs, compute `spring()` (a plain function, not a hook) inside the map, or make
  each item its own component. `useCurrentFrame()` inside a `<Sequence>` is relative to that
  sequence.
- **Async assets.** Use `useDelayRender()` (`{delayRender, continueRender, cancelRender}`) for
  fetches such as Lottie JSON or word lists, and give each handle a label. `<Img>`, `<OffthreadVideo>`
  and `<Audio>` already wait for their media. Plain `<img>` and CSS `background-image` don't, so
  they can render blank frames. Use `staticFile()` for anything in `public/`. Paths with spaces
  (`sound pack/`) need `staticFile` (it URL-encodes them).
- **Performance.** `filter: blur()`, `backdrop-filter` and big `box-shadow` blur radii are
  rasterised per frame per element. 60 letters each blurring = slow renders. Animate the blur only
  while it changes (0 at rest, then drop the property). Prefer `opacity` and `transform`. Bake static
  textures into PNGs. `CameraMotionBlur`/`Trail` multiply the cost of their children by
  `samples`/`layers`, so keep them tight around the moving element and limited in time. Use
  `<OffthreadVideo>` for footage. Large SVGs with filters (`feTurbulence`) are very slow. Use a grain
  PNG instead.
- **Shader/experimental APIs.** The HTML-in-canvas transitions and `HtmlInCanvasMotionBlur` need a
  Chrome flag, so leave them out of the default render. For shaders and 3D, use HyperFrames.
- **Spring sub-frame values.** Springs and staggers like `frame - i*1.5` give fractional frames.
  That's fine. But `Math.floor` anything that indexes arrays (typewriter `slice`, digit strips).
- **Safe area and IG crop.** Everything sits in x 90–990, y 285–1635 (`motion-graphics.md`).
  Measure the render, don't trust the layout code.

---

## 6. Quick picker for dark, bold ad reels

| Moment | Reach for |
|---|---|
| Hook line | #10 word slam or #13 mask reveal, + #22 sheen on the key card |
| Social proof | #2 notification stack, #5 star fill, #1 text thread |
| Offer / process | #3 checklist, #4 calendar fill, #16 timer ring |
| Numbers | #15 odometer (StatCount), #17 meter |
| Moving between ideas | #18 virtual camera, #24 whip, `pushCut` flash, #21 glitch (sparingly) |
| Texture everywhere | #25 grain, #23 card shadow settle |
