# AI Video Editor

A workspace that turns Claude Code into a short-form video editor: drop raw footage in, get a captioned,
branded, motion-graphics reel out. Based on the "Claude x Remotion" workflow
(folders: raw footage / references / exports, tools: Remotion, HyperFrames, FFmpeg, Whisper, yt-dlp).

## One-time setup (on your Mac)

```bash
git clone <this repo> ai-video-editor && cd ai-video-editor
scripts/setup.sh        # installs FFmpeg, whisper.cpp + model (~1.6 GB), yt-dlp, Remotion, and tests each
scripts/selftest.sh     # renders a dummy reel end to end to prove the pipeline works
```

Then fill in `brand/brand-sheet.md` and the colors/font in `brand/brand.json`, add a few reels you like to
`references/` (`scripts/study_reference.sh <url>`), and put licensed music in `music/`.

## Editing a video

Put the clip in `raw-footage/`, open Claude Code in this folder, and say:

> Edit my new video into an Instagram Reel: `take1.mov` in my raw footage folder.
> 1. Cut every pause longer than 0.3 seconds.
> 2. Follow my brand sheet.
> 3. Add captions, music and motion graphics.
> 4. Use anything in my references folder.
>
> Show me a storyboard to review first, then export it to my exports folder.

(or just `/edit-reel take1.mov`). Claude follows `CLAUDE.md`: cut pauses → transcribe → plan graphics →
storyboard for your approval → render to `exports/`.

## What's where

- `scripts/cut_silences.py` – FFmpeg silence detection + cut (`--min-silence`, `--noise`, `--pad`)
- `scripts/transcribe.sh` – whisper.cpp word-level timestamps → `captions.json`
- `scripts/study_reference.sh` – yt-dlp download + contact sheet + cut timing + transcript of a reference
- `remotion/` – the reel template: animated word-by-word captions, hook title, callouts, lower thirds,
  punch-in zooms, b-roll, music, progress bar. `node render.mjs plan.json [--storyboard]`
- `brand/` – brand sheet (for Claude) + `brand.json` (for the renderer)
