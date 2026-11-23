# Count Up (stat counter / odometer)

- **For:** website (stats sections: "2,000+ jobs since 2023") and video (stat beats)
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt). Dependencies: `motion`, `react-use-measure`.
- **Web code, as shared:** `prompts/components/count-up.tsx` (+ demo). **Use the fixed version:**
  `prompts/components/count-up.fixed.tsx` (same props, plus `prefix`/`suffix`)
- **Video version:** `src/shared/StatCount.tsx` → `<StatCount to={2000} suffix="+" label="jobs" />`; sample `StatCountSample`

## Problems in the pasted version (all seen in a browser)

1. **`duration` isn't a duration.** It tunes a spring that takes ~11s to settle a 7-digit number; in slide mode the
   digits sit half-rolled ("1,00?,834") long after the 2s you asked for.
2. **Slide mode breaks decimals:** 99.9 ends as "10.0".
3. **The demo's "issues" counter (from 5, to 0, direction down) counts 0 → 5** and ends on 5.
4. **Crawlers and screen readers get junk:** in slide mode the text is "001234567890,001234567890..."; in the default
   mode the number is empty in the HTML until JavaScript runs. Bad for the SEO work on Elevate's sites.
5. No reduced-motion handling.

## Fixed version (verified in a browser)

Eases over a real `duration` and lands exactly on `to`; odometer digits carry like a real odometer (a digit turns
only while the digits below roll 9 → 0, so decimals work: 99.9 shows 99.9); counts `from` → `to` (count down with
`from={5} to={0}`); the final number (with `prefix`/`suffix`) is in the HTML via an `sr-only` span (server render
checked: "1,000,000", "99.9%", "2,000+"), animated digits are `aria-hidden`; reduced motion shows the final number.

**Only real numbers.** Use the client's own, true stats (Spotless Homes' site says 2,000+ jobs since 2023: that
kind), never round guesses. A count-up makes a number feel bigger; it has to be one the client can back up.

## Video

`StatCount` counts on frames with the same easing and carry logic, odometer or plain, with a label. While counting
up to a 7-digit number the odometer shows a leading "0," until the first digit rolls (like a real odometer).
