# Tiger Tear Reveal

- **For:** website (scroll section) and video (reveal moment)
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt)
- **Web code, as shared:** `prompts/components/tiger-tear-reveal.tsx` (type-checks unchanged; React is the only dependency)
- **Video version:** `src/shared/TigerTear.tsx` → `<TigerTearVideo word tagline startFrame tearFrames />`; sample
  composition `TigerTearSample` (6s: poster, ~2.5s tear, tiger looks around and blinks)

## What it is

A poster (small tagline over one huge red word) that cracks, tears in two and pulls apart; a tiger rises into the gap
and opens its eyes. On the web it plays on scroll, the eyes follow the pointer, click makes them squint. All SVG, no images.

## Notes from integrating it

- **Fonts:** the comment says "no fonts to load", but the word is set in `"Anton"`, which is never loaded, so most
  visitors get Impact or Arial Black instead. On a Lovable site, load Anton (or pass the site's own display font as
  `fontFamily`). The video version bundles Anton.
- **Props worth changing per use:** `word`, `tagline`, `ink`, `paper`, `taglineColor`. Keep `word` short (it is
  stretched to a fixed width: 4-8 letters reads best). Don't put a claim in `word`/`tagline` the business can't back.
- **Web:** needs a page with room to scroll (it pins for `height + scrollDistance`, 260svh by default); `progress`
  drives it manually instead. Works with TanStack Start SSR (browser APIs only run in effects). Heavy SVG (2,600 hair
  strokes): one per page.
- **Video:** the artwork is landscape, so in a 9:16 frame it fills a band across the middle (`zoom` 0.9 keeps the word
  inside the safe area). Use it as a full-screen beat with captions above or below the band, or `zoom` > 1 for a
  bigger tiger if cropping the word's ends is fine. Fully deterministic per frame; renders ~6s in ~20s here.
- No Unsplash images or lucide icons needed: the component draws everything itself.
