# CPU Architecture (circuit lines into a chip)

- **For:** website ("everything flows into one system" section) and video (same idea as a beat)
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt)
- **Web code, as shared:** `prompts/components/cpu-architecture.tsx` + `.css` (+ demo). **Use the fixed version:**
  `prompts/components/cpu-architecture.fixed.tsx` + `cpu-architecture.fixed.css` (CSS goes in `src/styles.css`; the
  prompt says `globals.css`, which Lovable projects don't have). No dependencies beyond `cn`.
- **Video version:** `src/shared/DataFlow.tsx` → `<DataFlow label="YOUR CRM" />`; sample composition `DataFlowSample`

## Problems in the pasted version (seen in a browser, light and dark site themes)

1. **Invisible lines on light sites:** strokes use `text-muted`, which on a light theme is nearly the background
   colour, so only floating black dots show. Most client sites are light.
2. **Labels overflow:** the text starts at a fixed x, so anything longer than "CPU" ("LEADS", "YOUR CRM") runs off
   the chip.
3. **Shared ids:** masks/gradients use fixed ids (`cpu-mask-1`...), duplicated when two are on a page.
4. Generic keyframe name `animation-path` could clash with another component's CSS; no reduced-motion handling.

## Fixed version

Per-instance ids (`useId`), lines from `text-foreground/25` (visible on light and dark, verified), label centred and
shrunk to fit (verified with "YOUR CRM"), renamed keyframes, lights hidden under reduced motion. Same look otherwise.
Label must be short and true for the client ("LEADS", "YOUR CRM", their business name), not "CPU".

## Video

`DataFlow` redraws it on frames: lines draw in over 1s, lights run on the web version's timings (start delays scaled by
`delayScale` 0.35 so all eight are running within ~3s instead of 9s), the label's sheen sweeps like the web gradient.
Heavier 0.5 strokes. The easing curve undershoots below 0 at the start (as in the CSS): positions are clamped.
