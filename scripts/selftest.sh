#!/usr/bin/env bash
# End-to-end check without real footage: synthetic clip -> cut pauses -> fake captions -> storyboard -> export.
# Output: exports/selftest.mp4 (delete it afterwards). Doesn't exercise Whisper; setup.sh tests that.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
W="$ROOT/work/selftest"
mkdir -p "$W"
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "testsrc2=size=1080x1920:rate=30:duration=8" \
  -f lavfi -i "sine=frequency=440:duration=8" -af "volume='if(lt(mod(t,2),1.2),1,0)':eval=frame" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$W/source.mp4"
python3 "$ROOT/scripts/cut_silences.py" "$W/source.mp4" --name selftest
cat > "$W/captions.json" <<'JSON'
[{"text":"Stop","startMs":0,"endMs":300},{"text":"losing","startMs":300,"endMs":600},{"text":"leads.","startMs":600,"endMs":1000},
 {"text":"Here's","startMs":1300,"endMs":1600},{"text":"the","startMs":1600,"endMs":1900},{"text":"fix","startMs":1900,"endMs":2400},
 {"text":"Reply","startMs":2600,"endMs":3000},{"text":"in","startMs":3000,"endMs":3300},{"text":"five","startMs":3300,"endMs":3600},
 {"text":"minutes","startMs":3600,"endMs":4000},{"text":"every","startMs":4100,"endMs":4500},{"text":"time!","startMs":4500,"endMs":5000}]
JSON
cat > "$W/plan.json" <<'JSON'
{
  "video": "work/selftest/cut.mp4",
  "captions": "work/selftest/captions.json",
  "overlays": [
    { "type": "hook", "startMs": 0, "endMs": 2200, "text": "Your leads are going cold" },
    { "type": "zoom", "startMs": 1300, "endMs": 2400, "scale": 1.2 },
    { "type": "callout", "startMs": 2600, "endMs": 4000, "text": "Reply in < 5 min" },
    { "type": "lowerThird", "startMs": 4000, "endMs": 5000, "text": "Your Name", "subtext": "Your Brand" }
  ]
}
JSON
cd "$ROOT/remotion"
node render.mjs ../work/selftest/plan.json --storyboard
node render.mjs ../work/selftest/plan.json ../exports/selftest.mp4
ffprobe -v error -show_entries stream=codec_name,width,height -of compact "$ROOT/exports/selftest.mp4"
echo "Self-test passed. Storyboard: work/selftest/storyboard/storyboard.html  Video: exports/selftest.mp4"
