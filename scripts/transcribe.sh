#!/usr/bin/env bash
# Word-level transcript of a clip with whisper.cpp, converted to captions.json for Remotion.
#   scripts/transcribe.sh work/take1/cut.mp4
# Writes captions.json next to the input. Uses the first model in tools/models/ unless WHISPER_MODEL is set.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IN="$1"
DIR="$(dirname "$IN")"
MODEL="${WHISPER_MODEL:-$(ls "$ROOT"/tools/models/*.bin 2>/dev/null | head -1)}"
BIN="$(command -v whisper-cli || true)"
[ -n "$BIN" ] || { echo "whisper-cli not installed - run scripts/setup.sh first" >&2; exit 1; }

[ -n "$MODEL" ] && [ -f "$MODEL" ] || { echo "Whisper model not found at $MODEL - run scripts/setup.sh first" >&2; exit 1; }

ffmpeg -hide_banner -loglevel error -y -i "$IN" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$DIR/audio16k.wav"
# --max-len 1 + --split-on-word gives one segment per word, which is what karaoke captions need.
"$BIN" -m "$MODEL" -f "$DIR/audio16k.wav" --max-len 1 --split-on-word --output-json -of "$DIR/whisper" -l "${WHISPER_LANG:-en}"
python3 "$ROOT/scripts/whisper_to_captions.py" "$DIR/whisper.json" "$DIR/captions.json"
