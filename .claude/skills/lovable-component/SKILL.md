---
name: lovable-component
description: Add a React/shadcn component (from 21st.dev, a "copy-paste this component" prompt, or any snippet) to one of Elevate's Lovable client websites, and/or port it into a Remotion video graphic. Use when the user pastes a component with "integrate this", names a client site or Lovable project to put it on, or wants a web animation turned into a reel graphic.
---

# Lovable component

The user runs Elevate, an agency that builds client websites in Lovable and makes short-form videos.
A pasted component can go two places; ask which only if the request doesn't say:

- **Website**: a Lovable project (a client's site or Elevate's own).
- **Video**: a Remotion graphic in the video-editor repo (only when working in that repo).

## What Lovable projects run on (verified Nov 2026 on 3 of their projects)

TanStack Start + Vite, React 19, TypeScript, **Tailwind v4**, shadcn (new-york). `components.json` aliases
`@/components/ui` and `@/lib/utils`; the stylesheet is `src/styles.css`, colours are **oklch** CSS variables
(`--primary: oklch(...)`), and many sites add brand tokens (`--heading`, `--ink`, `--gradient-hero`). Lovable's
`styles.css` header says all colours must be oklch. Older projects may differ: **always check before editing**.

## Website workflow

1. **Find the project.** Lovable MCP: `list_workspaces` → `list_projects` (search by client name). Confirm the
   project name with the user if more than one matches. Never edit a project the user didn't name.
2. **Read before changing.** `read_file` on `package.json`, `components.json`, `src/styles.css`, and the page or
   route where it will go (`src/routes/...`). Note: Tailwind version, colour format, which shadcn components already
   exist in `src/components/ui/`, which libraries are installed (framer-motion is usually **not**).
3. **Fix the component before sending it.** Pasted components are written for a generic shadcn setup. Check every item:
   - `hsl(var(--x))` → `var(--x)` (oklch tokens; `hsl()` around oklch renders nothing).
   - Hard-coded Tailwind colours (`bg-green-500`, `text-blue-600`) → the site's tokens (`bg-primary`, `text-accent`) unless
     the colour means something (status green is fine).
   - String-literal union props: demo data needs `as const` or an explicit type, or TypeScript fails.
   - `"use client"` is a Next.js directive; harmless in TanStack Start, leave or drop.
   - Anything reading `window`/`document` at module load breaks server rendering; move it into an effect.
   - Animations: respect reduced motion (`useReducedMotion()` from framer-motion) since the sites already disable CSS motion for it.
   - External images (third-party hotlinks like thiings.co) → the client's own images in the project, or remove. Don't invent stock
     URLs; if there's no image, make the prop optional and drop it.
   - Animation driven by React state every frame (`setState` inside `requestAnimationFrame`): re-renders the whole
     component 60x/s forever, even offscreen. Move continuous motion to CSS animations or framer-motion values.
   - `absolute inset-0` backgrounds whose parent isn't `relative`: they paint over the rest of the page. Add `relative isolate`.
   - `<main>`/`<header>`/`<footer>` inside a component: the page layout already has them. Use `<section>`/`<div>`.
   - Fixed pixel sizes inside a box that shrinks on phones: check at 390px that nothing runs off-screen.
   - Hard-coded demo content with no props (logo lists, sample copy): make it props before it goes on a client site.
   - Headings: demos often use `<h1>` for styling (one had four in a single quote). A page keeps exactly one `<h1>`;
     Elevate's sites carry SEO and schema work, so restyle extra ones as `<span>`/`<p>` and check the page's heading order.
   - Class names with no CSS behind them (e.g. `fan-card`, `fan-layout`: not Tailwind utilities, not in the paste).
     21st.dev pastes sometimes leave out a stylesheet the component depends on, and the component then renders as
     nothing. Grep every non-Tailwind class; write the missing CSS and **look at it in a browser** before sending.
   - Fonts the component names but never loads (e.g. `"Anton"` in a font stack): load them on the site, or pass the
     site's own display font. Otherwise visitors get a fallback font and the design breaks.
   - File name matches the export (`animated-roadmap.tsx` for `AnimatedRoadmap`).
   - Demo copy is generic SaaS text: rewrite for the client's business **using only facts on their site**. No invented
     stats, guarantees or prices.
4. **Send it to Lovable.** Lovable edits through its own agent: `send_message` with the fixed file contents, the exact
   path (`src/components/ui/<name>.tsx`), the dependency to add (`framer-motion`), where it goes on which page, and
   "don't change anything else". Use `plan_mode: true` first for anything bigger than one section. Each message
   **spends the workspace's Lovable credits**; tell the user before the first send on a project.
   If the reply is `awaiting_input`, show the user the pending approval and use `respond_to_approval`, never `send_message`.
5. **Verify.** `get_diff` on the message: only the expected files changed, the component file matches what you sent
   (Lovable's agent sometimes "improves" it), the dependency was added. Then `get_project` for the preview URL and
   give it to the user. Don't publish (`deploy_project`/`publish`) unless the user asks.

## Video workflow (video-editor repo only)

Web components animate on **scroll or hover**; a video has neither. Port, don't paste:

- `useScroll`/`whileInView`/`useTransform(scrollYProgress)` → `useCurrentFrame()` + `interpolate()` over a frame range.
- framer-motion `transition`/`initial`/`animate` → `spring()` or `interpolate()` from a start frame. No framer-motion in Remotion.
- Tailwind classes → inline styles; `hsl(var(--primary))` → the brand sheet's hex values.
- Size for 1080x1920 and the reel safe area (x 90-990, y 285-1635).
- Delays tied to ids → tie them to the frame the spoken word lands on (the remotion-reel skill).
- Put reusable ports in `src/shared/`, render a sample, and look at the frames before using it in an edit.

Worked examples (see `prompts/*.md` in the video-editor repo for each one's measured problems and fixes): `references/animated-roadmap.md` (web fix + the video port in `src/shared/AnimatedRoadmap.tsx`).
In the video-editor repo, `prompts/` holds every component the creator has shared (e.g. `tiger-tear-reveal.md`, ported to
`src/shared/TigerTear.tsx` by keeping the drawing code and replacing scroll/pointer/timers with the frame).
