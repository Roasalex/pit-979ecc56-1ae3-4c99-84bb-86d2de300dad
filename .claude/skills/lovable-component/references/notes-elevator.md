# Elevator (Hairline)

- **For:** website (a quiet interactive drawing beside a step-by-step or "how it works" section) and video (a clip)
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt)
- **Web code, as shared:** `prompts/components/elevator.tsx`: **does not build**, see below.
- **Use instead:** `npm i @lucasmarkes/hairline` and `import { Elevator } from "@lucasmarkes/hairline/react"`
- **Video:** `node scripts/capture-hairline.mjs Elevator --seconds 8` → `public/hairline/elevator.mp4`, used in an edit
  like any clip (`<OffthreadVideo muted>`); sample composition `HairlineSample`

## Notes from integrating it

- **The paste can't build:** it imports `./elevator-utils/mount` and `./elevator-utils/elevator-engine`, which weren't
  included. It is the React wrapper cut out of the npm package `@lucasmarkes/hairline` (v0.5.1, MIT, no dependencies,
  no network calls or install scripts; checked). Installing the package gives the same component, maintained, plus 32
  sibling figures (Laptop, Phone, Terminal, Keyboard, Terrain...).
- Verified in a browser: pointer near the top sends the car to floor 3, near the bottom to the ground floor, passing
  the floors between (`onRead` reports "floor 3", "floor 2", "floor 1", "ground").
- **Options:** `intensity` (0-1, car speed), `theme` ("auto" follows the site's `.dark` class), `label`/`aria-label`,
  `onRead` (caption text), `play` (tours on its own until hovered; rests under reduced motion). Fills its parent's
  width at 5:4, so give it a width (`className="w-full max-w-sm"`).
- **Colours:** six CSS variables (`--hairline-plate`, `-hi`, `-edge`, `-mid`, `-lo`, `-stroke`). Set `--hairline-plate`
  to the section's background colour, or the plates show as boxes. There's also a shadcn registry wrapper that reads
  the site's tokens: `npx shadcn@latest add https://hairline.lucasmarkes.com/r/hairline.json` (not tried: that host is
  blocked in this session).
- Fit: a fine line drawing reads as "systems / process". Good beside "how your leads move through the system"; too
  quiet for a hero on a local-service site.

## Video

The engine runs on the browser clock, so it can't render frame by frame inside Remotion. `scripts/capture-hairline.mjs`
plays any of the 33 figures with `play` in headless Chromium under Playwright's fake clock (every frame exactly 1/30 s)
and encodes the frames, with thicker (2.6px) and brighter strokes than the web defaults so the lines survive a phone
screen. `--light` for a white version. Setup installs the browser (`npx playwright install chromium`).
