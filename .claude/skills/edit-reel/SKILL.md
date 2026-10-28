---
name: edit-reel
description: Edit a raw talking-head clip from raw-footage/ into a branded vertical reel (cut pauses, captions, music, motion graphics), show a storyboard for approval, then export to exports/. Use when the user asks to edit a video, make a reel/short/TikTok, or names a file in raw-footage/.
---

# Edit a reel

Input: a file in `raw-footage/` (ask which one only if there are several and the user didn't say), plus any
overrides in the request (pause threshold, length target, music, specific graphics).

Follow the pipeline in `CLAUDE.md` exactly, in order:

1. Read `brand/brand-sheet.md`, `brand/brand.json`, and study every item in `references/`.
2. Cut pauses with `scripts/cut_silences.py` (user's threshold, else 0.3s).
3. Transcribe with `scripts/transcribe.sh`, then correct `captions.json`.
4. Write `work/<p>/plan.json`: hook, zooms on emphasis words, callouts, lower third/CTA, music.
5. Render the storyboard (`node render.mjs ... --storyboard` from `remotion/`), show it, and **wait for approval**.
6. On approval, render to `exports/<p>.mp4`, verify it (ffprobe + a few frames), and report the path,
   final length and what was done.

If any tool is missing, run `scripts/setup.sh` and say what it installed.
