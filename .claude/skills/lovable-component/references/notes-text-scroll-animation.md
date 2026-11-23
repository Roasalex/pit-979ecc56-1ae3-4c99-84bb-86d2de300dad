# Text Scroll Animation ("Skiper31") → Scroll Assemble

- **For:** video first (a punchy headline beat); website only as one short, contained section
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt). Dependencies as shared: `framer-motion`, `lenis`.
- **Web code, as shared:** `prompts/components/text-scroll-animation.tsx` (+ demo). **Use the fixed version:**
  `prompts/components/scroll-assemble.tsx` (needs only `framer-motion`)
- **Video version:** `src/shared/AssembleText.tsx` → `<AssembleText text="..." />` (or `images`); sample `AssembleTextSample`

## Problems in the pasted version (seen on a test page)

1. **It takes over the whole site's scrolling:** `<ReactLenis root>` turns on smooth-scroll for the entire page
   (`lenis` class on `<html>`) the moment this section mounts, changing how every page scrolls and able to fight
   anchor links and other scroll effects. If a site wants smooth scrolling, that's one decision in the layout,
   not a side effect of a section.
2. **The "Scroll to see more" hint escapes into the site header** (positioned against the page, not the section).
3. **Very long:** one tagline adds ~4.4 screens of scrolling (210vh blocks overlapped with negative margins).
4. Hard-coded demo content (text "see more from", "integrate with your fav tech stack", 12 icons hotlinked from
   cdn.21st.dev), a second `<main>`, a `font-geist` class no site loads, orange hard-coded, no reduced motion.

## Fixed version (verified on a test page, desktop and 390px)

Props for `text` or `images` (with alt), `caption`, `variant` ("tilt" | "rise" | "spin"), `height`; no Lenis; one
`<section>` with a sticky stage (page went from 5.8 to 3.0 screens with the same surroundings); hint inside it;
plain text in the HTML for search and screen readers; words wrap whole on phones ("HAULED AWAY / TODAY", never
mid-word); reduced motion shows it assembled.

## Video

`AssembleText` plays the same assemble on frames over `durationFrames` (default 36 = 1.2s), with the three variants.
Good on the hook or on a key line, landing on the word as it's spoken.
