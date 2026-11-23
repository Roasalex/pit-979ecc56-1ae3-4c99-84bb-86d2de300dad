# Prompts library

Prompts, components and recipes the creator has shared for making Elevate's ads and videos. **Before planning any
ad or video, read every file here** and use what fits: these are the creator's standing instructions, not optional
reading.

- One file per prompt: `prompts/<short-name>.md`, holding the prompt exactly as shared, plus a short header:
  what it's for (video / ad / website / any), date added, and anything that didn't work or was adapted when used.
- Code shared with a prompt (a component, a script) goes next to it or into the place it's used
  (`src/shared/`, a skill's `references/`), and the prompt file says where.
- Newer prompts win when two disagree; ask if it isn't clear.
- When a prompt asks for something this setup can't do (a blocked site, a tool that isn't installed), say so
  rather than silently skipping it.

## Index

| File | For | Added | Notes |
|---|---|---|---|
| (skill) `.claude/skills/remotion-reel/` | video | 2026-10-28 | The Claude x Remotion editing workflow |
| (skill) `.claude/skills/lovable-component/` | website, video | 2026-11-23 | Pasted shadcn components → Lovable sites or video graphics; worked example AnimatedRoadmap |
| `tiger-tear-reveal.md` | website, video | 2026-11-23 | Poster tears open, tiger looks through; video port `src/shared/TigerTear.tsx` |
| `card-fan-carousel.md` | website, video | 2026-11-23 | Fanned cards; **paste was missing its CSS** (we wrote it); video port `src/shared/CardFan.tsx` |
| `dot-pattern-1.md` | website, video | 2026-11-23 | Dot texture + framed quote; **demo has 4 `<h1>`s** (fix on sites); video `QuoteFrame` |
