# 3D Testimonials (marquee wall)

- **For:** website ("what customers say") and video (a reviews beat)
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt). Deps as shared: `@radix-ui/react-avatar`
  (+ shadcn `card`, `avatar`, which Lovable projects already have: don't overwrite them with the pasted copies).
- **Web code, as shared:** `prompts/components/3d-testimonials.tsx` + `.css` + demo. **Use the fixed version:**
  `prompts/components/testimonials-wall.tsx` (needs only `lucide-react`, plus the keyframes below)
- **Video version:** `src/shared/ReviewWall.tsx` → `<ReviewWall reviews />`; sample `ReviewWallSample`

## Real reviews only

The demo's nine reviewers ("Ava Green, 🇦🇺 Australia: Cascade AI made my workflow 10x faster!") are invented. On a
client site or in a client's video, use only the client's actual reviews, word for word, with the reviewer's name as
the source shows it (Google Business Profile, Facebook...). The FTC's 2024 rule bans fake or AI-written reviews and
testimonials, with civil penalties per violation. No "representative" or tidied-up reviews either.

## Problems in the pasted version (seen in a browser)

1. **Every review is in the page 12 times** (4 columns x 3 copies); screen readers read each one 12 times.
2. **The edge fades are inside the tilted wall,** so they rotate with the cards and wash out cards in the middle
   instead of fading the box edges.
3. Never stops for reduced motion; 4 keyboard tab stops on scrolling text; typos (`text-econdary-foreground`, every
   avatar's alt is "@reui_io").
4. **The CSS snippet starts with `@import "tailwindcss"` and `@import "tw-animate-css"`.** Lovable's `src/styles.css`
   already has both: add only the `@theme` lines and the two `@keyframes`, or the whole of Tailwind loads twice.

## Fixed version (`testimonials-wall.tsx`, verified)

Reviews as props (`name`, `body`, `rating`, `source`, `date`, `img`); stars; each review read once by screen readers
(scrolling copies `aria-hidden`; checked with an accessibility snapshot); fades on the box; 0 tab stops; reduced motion
stops it; loop copies added after load (server HTML has the list + one copy per column, 5 instead of 12); a visible
`title`. Reviewer photos only if the source shows them.

Don't add Review schema (stars in Google results) for the business's own reviews on its own site: Google doesn't
show self-serving review stars for local businesses, and marking them up can draw a manual action.

## Video

`ReviewWall` scrolls 3 columns in opposite directions on a 3D tilt at `speed` px/s, with top/bottom fades. Real
reviews only; a screenshot of the actual Google review (in an edit) is even stronger proof than a re-typed card.
