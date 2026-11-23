# Works Wheel (portfolio ring → drum)

- **For:** website (a portfolio/"our work" page: framing, decks, flooring, before/after) and video (several projects in one beat)
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt). No dependencies beyond `cn`.
- **Web code, as shared:** `prompts/components/works-wheel.tsx` (+ demo). **Use the fixed version:**
  `prompts/components/works-wheel.fixed.tsx` (same props, plus `captureWheel`)
- **Video version:** `src/shared/WorksWheel.tsx` → `<WorksWheelVideo items label />`; sample `WorksWheelSample`

## Problems in the pasted version (measured on a test page between a header and a contact section)

1. **Traps phone visitors.** The stage is `touch-action: pan-x`, so a vertical swipe on it never scrolls the page:
   six full swipes moved it **0px**. At full height on a phone the wheel fills the screen, so nobody gets past it to
   the contact form. This one alone rules out the pasted version on a client site.
2. **Holds the mouse wheel for ~10 screens.** It eats wheel scrolling until it has turned past every item
   (8,500px with 9 items) before the page moves on. A small flick (under half a notch-run) snaps back to the ring.
3. Its animation loop asks for a frame every frame forever, even at rest (cheap, but pointless on phones).
4. Keys by title (two projects with the same title collide); demo images hotlinked from crafterui.com.

It is otherwise well built: one rAF pass writing transforms directly, reduced motion respected, arrow keys, an index.

## Fixed version (all re-measured)

`touch-action: pan-y` + sideways swipe turns it (six swipes now scroll the page 1,607px); mouse wheel left to the
page unless `captureWheel` (use that only on a page that is just the portfolio); previous/next buttons (3 x Next →
3rd project, verified); the loop sleeps at rest (0 frames requested in 1s); keys by index.

Use real project photos with real titles (a framing company's actual builds), and `href` to each project page if
the site has them. Give the wrapper a height (`h-screen` or e.g. `h-[80svh]`); it fills its parent.

## Video

`WorksWheelVideo` runs the same geometry on frames: holds the ring with the label, opens into the drum, then steps
through each project (move 18 frames, hold 30) with its title under the front card. Sized for 9:16 (ring capped at
30% of the width; cards 760px wide).
