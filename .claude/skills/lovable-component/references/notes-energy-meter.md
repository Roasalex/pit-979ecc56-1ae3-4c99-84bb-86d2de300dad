# Energy Meter (segmented gauge)

- **For:** video first (audit-style beats: "your Google profile: 18%"), a client dashboard/portal, an audit result page
- **Added:** 2026-11-23 (21st.dev "integrate this component" prompt). No dependencies beyond `cn`.
- **Web code, as shared:** `prompts/components/energy-meter.tsx` + `.css` + demo. **Use the fixed version:**
  `prompts/components/energy-meter.fixed.tsx` (same props)
- **Video version:** `src/shared/SegmentMeter.tsx` → `<SegmentMeter value label />`; sample `SegmentMeterSample`

## Problems in the pasted version (seen in a browser)

1. **The CSS snippet replaces the site's whole theme.** Its `:root` block redefines `--background`, `--foreground`,
   `--card`, `--primary`, `--border`, `--ring`: added to a client's `src/styles.css` it turned the entire test site,
   header included, dark sci-fi cyan. It also re-imports Tailwind. The component needs none of it: skip the snippet.
   (Without it the meter picks up the site's own `primary`, which looks right.)
2. **Wrong number after a value change.** The % counter's animation is never cancelled; changing `value` from 82 to
   20 mid-animation left it showing **"82%" with 2 of 10 segments lit**.
3. **Screen readers** get loose text ("Reactor Output 82%"), or nothing when `showValue` is off: no meter role/value.
4. It animates on page load (finished before anyone scrolls to it); the critical pulse ignores reduced motion.

## Fixed version (verified)

Both animations cancel and restart on change (82 → 20 now shows 20% with 2 segments); `role="meter"` with
`aria-valuenow/min/max` and the label as its name (accessibility snapshot: `meter "Power Reserve"`); fills when it
scrolls into view; reduced motion: no stagger, no counting, no pulse.

**Honest numbers.** The colour thresholds (red under 30, amber to 60) read as a verdict. Only show a score that was
actually measured (a real audit result), labelled with what it measures, never a made-up "you're at 18%" for drama.

## Video

`SegmentMeter` lights segments on frames (`stagger` 3 frames each) while the percent counts up; colour by value; low
values pulse. Dark by default, `dark={false}` for light backgrounds, `accent` for the brand colour.
