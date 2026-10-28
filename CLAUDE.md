# AI Video Editor

Vertical short-form reels (1080x1920 @ 30fps) built in code with Remotion, ffmpeg, whisper.cpp and
(for a few special looks) HyperFrames. **The workflow lives in the `remotion-reel` skill**
(`.claude/skills/remotion-reel/SKILL.md`): follow it for every edit. This file only adds what's specific
to this project.

## Layout

| Path | What |
|---|---|
| `public/recordings/` | Talking-head takes as filmed, plus the cut take (`<name>.mp4`), `<name>.cuts.json` and `<name>.words.json` |
| `public/screen-recordings/` | Screen captures (always muted in the edit) |
| `public/images/` | Stills, screenshots, logos |
| `public/sound pack/`, `public/music pack/` | The creator's sound effects and music. Use the original files; trim and level in code |
| `brand/BRAND.md` | The brand sheet. If it doesn't exist, offer to set it up before the first edit (skill: `references/brand-sheet.md`) |
| `src/<video>/` | One folder + one composition per video, registered in `src/Root.tsx` |
| `hyperframes/` | One HyperFrames project per asset (skill: `references/hyperframes-hybrid.md`) |
| `out/` | Finished mp4s and storyboard pages only |
| `bin/whisper.cpp/` | Built whisper.cpp with `models/ggml-base.en.bin` and `models/ggml-small.bin` |

## Step 0: cut the dead air (before the skill's ingest)

The skill assumes a take that's already cut. Ours aren't: the creator films with pauses and retakes and
expects every gap longer than 0.1s gone. So before the skill's step 1:

```bash
python3 scripts/cut_silences.py public/recordings/<take1> [<take2> ...] --name <video> --dry-run   # report first
python3 scripts/cut_silences.py public/recordings/<take1> [<take2> ...] --name <video>
node scripts/transcribe.mjs public/recordings/<video>.mp4
```

- This also does the skill's ingest: H.264, 30fps, iPhone HDR tone-mapped to SDR, resolution kept
  (4K stays 4K so punch-ins stay sharp). Several takes are joined in the order given.
- `--min-silence 0.1` is the default. If the result feels breathless or clips word endings, raise
  `--pad` (0.08) or `--min-silence` (0.2) and say so; if it leaves pauses in, the room is noisy: try `--noise -30dB`.
- `<video>.cuts.json` → `joinFrames` lists every jump cut on the new timeline. Use them as the take's
  cuts in the skill's step 3 (scene detection misses jump cuts on the same framing), and punch in on them.
- Retakes: read the transcript for repeated sentences or false starts, tell the creator which ones you'd
  remove, and cut them out of the cut take with ffmpeg before anchoring anything to words.
  Removing anything after transcription means re-transcribing (the skill: never re-transcribe an
  unchanged file; this file *has* changed).

## Rules

- Never modify or delete the creator's original takes or audio files.
- Graphics only state what's said in the video or written in the brand sheet. No invented stats or claims.
- Storyboard review before the final render unless the creator says to skip it (skill: `references/storyboard.md`).
- Tools: `bin/whisper.cpp/build/bin/whisper-cli`; HyperFrames is pinned in `package.json`, so `npx hyperframes`
  runs the local copy. Telemetry stays off and never run `hyperframes feedback` or `publish`.
