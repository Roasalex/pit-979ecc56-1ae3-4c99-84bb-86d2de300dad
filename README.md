# AI Video Editor

Claude Code as a short-form video editor, following the "Claude x Remotion" guide: you film, drop clips
into `public/recordings/`, describe the edit, review a storyboard, and get an mp4 in `out/`.

## Setup (once, on the Mac you edit on)

```bash
git clone <this repo> ai-video-editor && cd ai-video-editor
scripts/setup.sh
```

This installs ffmpeg, builds whisper.cpp into `bin/whisper.cpp` (base.en + small models), installs the
Remotion project and HyperFrames, and checks that Google Chrome is installed. Open Claude Code in this folder
and the `remotion-reel` skill loads automatically from `.claude/skills/`. (In the Claude app, upload the
original `remotion-reel.zip` under Customize → Skills instead.)

Then, before the first edit:
1. **Brand sheet:** "Set up my brand sheet. Pull the colours and fonts from my website <url>." → `brand/BRAND.md`
2. **Sounds and music:** `.mp3` sound effects into `public/sound pack/` and music into `public/music pack/`,
   named by what they sound like (`woosh.mp3`, `pop.mp3`, `riser.mp3`). Use only audio you have the rights to.

## Editing

> Edit these clips into one reel. Cut the dead air, add my captions, and plan motion graphics for each
> beat in my brand. Lay it out in a storyboard for me to review.

Film tips: leave room above your head for titles, film in 4K if you can, say the key words clearly,
and don't worry about pauses or retakes.

## What's here

- `.claude/skills/remotion-reel/`: the editing skill from the guide (workflow, references, measuring scripts, components)
- `scripts/cut_silences.py`: cuts gaps over 0.1s, joins several takes, converts iPhone HDR, outputs jump-cut frames
- `scripts/transcribe.mjs`: whisper.cpp → `[{ text, startMs, endMs }]`
- `CLAUDE.md`: project layout and the dead-air step the skill doesn't cover
