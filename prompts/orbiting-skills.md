# Orbiting Skills → Orbiting Items

- **For:** website ("what we do" / services / integrations section) and video (services or tools beat)
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt)
- **Web code, as shared:** `prompts/components/orbiting-skills.tsx` (+ demo). **Use the fixed version instead:**
  `prompts/components/orbiting-items.tsx` (no extra dependencies; icons from lucide-react, already in Lovable projects)
- **Video version:** `src/shared/Orbit.tsx` → `<Orbit items center />`; sample composition `OrbitSample`

## Why the pasted version shouldn't go on a client site (all measured in a browser)

1. **Re-renders 60 times a second, forever**, even scrolled out of view (360 style updates/s for 6 icons): it moves
   the icons by updating React state every animation frame. Battery drain on phones and worse page-speed scores.
2. **Its background leaks onto the rest of the page:** `absolute inset-0` inside a `<main>` that isn't `relative`,
   so the grey blobs paint over whatever positioned ancestor is above (seen on the next section in the test page).
3. **Icons cut off on phones:** the box shrinks to `100vw - 40px` but the orbits stay 100px/180px, so on a 390px screen
   the outer ring's icons run off the edges.
4. **A second `<main>`:** pages already have one in the layout.
5. **Hard-coded content:** six developer logos (HTML, CSS, React...) with no props; meaningless to a client's visitors.
6. Smaller: hover pauses everything; no reduced-motion handling; a global `id="gradient"` that collides if used twice.

## The fixed version (`orbiting-items.tsx`)

Items via props (`{ id, icon, label, ring: 0 | 1 }`), any centre content, CSS animations (0 re-renders; verified),
scales to fit phones (verified no icon off-screen at 390px), `<section>` with its background contained, hover pauses,
reduced motion stops it, screen readers get a plain list. Colours come from the site's `primary`/`card`/`border` tokens.
Use the client's real services or tools as items; logos of other companies (Google, Meta) only where the client really
uses them.

## Video

`Orbit` runs on frames: rings pop in, items spring in one by one, inner ring turns one way and outer the other,
labels under each icon. Default look is the original's cyan/purple glow on dark; pass `colors` for the brand.
Fits the reel safe area at the default radii (190/340px).
