#!/usr/bin/env bash
# Download a reel/short you want to learn from and break it down so Claude can study its editing.
#   scripts/study_reference.sh "https://www.instagram.com/reel/..." [name]
# Writes references/<name>/: video.mp4, contact.jpg (1 frame/sec grid), cuts.txt (detected scene cuts),
# and captions.json if whisper is installed. Instagram/TikTok may need: export YTDLP_COOKIES=chrome
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="$1"
NAME="${2:-ref-$(date +%Y%m%d-%H%M%S)}"
OUT="$ROOT/references/$NAME"
mkdir -p "$OUT"

yt-dlp ${YTDLP_COOKIES:+--cookies-from-browser "$YTDLP_COOKIES"} -f "bv*+ba/b" --merge-output-format mp4 -o "$OUT/video.mp4" "$URL"
ffmpeg -hide_banner -loglevel error -y -i "$OUT/video.mp4" -vf "fps=1,scale=216:-1,tile=8x8" -frames:v 1 "$OUT/contact.jpg"
# Scene-change timestamps: a quick read on how often the editor cuts.
ffmpeg -hide_banner -i "$OUT/video.mp4" -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 \
  | grep -o 'pts_time:[0-9.]*' | cut -d: -f2 > "$OUT/cuts.txt" || true
echo "$(wc -l < "$OUT/cuts.txt") cuts in $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/video.mp4")s"
if command -v whisper-cli >/dev/null; then "$ROOT/scripts/transcribe.sh" "$OUT/video.mp4"; fi
echo "Saved to references/$NAME"
