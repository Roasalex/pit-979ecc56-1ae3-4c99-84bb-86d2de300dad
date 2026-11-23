# Card Fan Carousel ("SocialCards")

- **For:** website (gallery / portfolio / reviews section) and video (showing several screenshots at once)
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt)
- **Web code, as shared:** `prompts/components/card-fan-carousel.tsx` + **the missing CSS we wrote:**
  `prompts/components/card-fan-carousel.css`. Dependency: `gsap`.
- **Video version:** `src/shared/CardFan.tsx` → `<CardFan images startFrame cycleEvery />`; sample composition
  `CardFanSample` (placeholder numbered cards; swap in real screenshots)

## What it is

Up to 7 cards fanned like a hand of cards; they spring in from below on load, spread apart when you hover one, and with
more than 7 cards, arrows and dots step through the deck.

## Notes from integrating it

- **Broken as pasted:** it styles cards with `.fan-card` / `.fan-layout`, but the paste has no CSS for them, so every
  card is 0px tall and nothing shows. `card-fan-carousel.css` supplies it (heights follow the breakpoints in the
  component's own comments; card size 9-17rem wide, 3:4). Verified in a real browser: desktop fan, Next button, 390px
  phone. Add it to the site's `src/styles.css`.
- **Images:** the demo hotlinks `cdn.21st.dev`. Use the client's own images (project photos, screenshots, reviews), never
  hotlinks. Give every card a real `alt`. No Unsplash needed.
- **Phones:** under ~400px the outer cards run past the screen edge (the section has only `px-4`). Fine for a showcase;
  if it matters, add `overflow-hidden` to the section or use 5 cards on mobile.
- **Smaller issues:** no swipe, keyboard or reduced-motion handling (arrows only, and only with 8+ cards); GSAP tweens
  aren't killed on unmount; `NodeJS.Timeout` needs `@types/node` (Lovable projects have it). GSAP is free for commercial use.
- **Video:** frame-driven, same fan geometry. 260px cards with `unit` 10.5 match the web spacing and keep the fan
  inside the reel safe area (measured x 89-989); `cycleEvery` steps the deck. Put screenshots in `public/images/`.
