# Dot Pattern (+ framed quote demo)

- **For:** website (subtle background texture; the framed quote section) and video (framed quote / statement beat)
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt)
- **Web code, as shared:** `prompts/components/dot-pattern-1.tsx` (needs only `cn` from `@/lib/utils`, which every
  Lovable project has) and its demo `prompts/components/dot-pattern-1.demo.tsx`
- **Video versions:** `src/shared/DotPattern.tsx` (the texture) and `src/shared/QuoteFrame.tsx` (the demo's framed quote,
  words appearing on the frames they're spoken); sample composition `QuoteFrameSample`

## Notes from integrating it

- Works as pasted (type-checked and rendered in a browser at 1400px and 390px). The parent must be `relative`.
- **SEO: the demo uses four `<h1>`s for one quote.** Every page must keep exactly one `<h1>` (Elevate's sites have SEO
  and schema work); on a client site the bold words are `<span className="font-semibold">`, the quote a `<blockquote>`.
- **Colours:** `fill-slate-500/...`, `border-red-500`, `bg-red-500`, `text-red-500` are hard-coded; on a site use the
  brand tokens (`fill-muted-foreground/40`, `border-primary`, `bg-primary`, `text-primary`).
- `id="pattern-circle"` repeats if the pattern is used twice on a page (invalid HTML, harmless): drop the attribute.
- All props are typed `any`; fine to use, nothing to fix for a site.
- The demo quote ("Design should be easy to understand...") is placeholder copy: use a real quote from the client or
  a real review, attributed, never invented.
- **Video:** this frame is the same motif as the notecards style's dark statement panel (dot grid + red corner
  squares), in a light version. `QuoteFrame` takes `words` with `{ text, bold, at, br }`; set each `at` to the word's
  start frame from the transcript so the quote builds as the creator says it. Sized for the reel safe area
  (box x 90-990, y 470-1450; 96px type fits ~4 short lines).
