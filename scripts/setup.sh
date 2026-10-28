#!/usr/bin/env bash
# Installs and tests the editing toolchain: FFmpeg, whisper.cpp (+ model), yt-dlp, Remotion.
# macOS uses Homebrew; Debian/Ubuntu uses apt + pip. Safe to re-run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODEL_NAME="${WHISPER_MODEL_NAME:-ggml-large-v3-turbo.bin}"   # ~1.6 GB; use ggml-small.en.bin for a faster, smaller model
MODEL="$ROOT/tools/models/$MODEL_NAME"

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

say "Installing system tools"
if [[ "$(uname)" == "Darwin" ]]; then
  command -v brew >/dev/null || { echo "Install Homebrew first: https://brew.sh"; exit 1; }
  brew install ffmpeg yt-dlp whisper-cpp node
else
  sudo apt-get update && sudo apt-get install -y ffmpeg nodejs npm python3-pip cmake build-essential
  pip install --user -U yt-dlp
  if ! command -v whisper-cli >/dev/null; then
    git clone --depth 1 https://github.com/ggml-org/whisper.cpp "$ROOT/tools/whisper.cpp"
    cmake -S "$ROOT/tools/whisper.cpp" -B "$ROOT/tools/whisper.cpp/build" -DCMAKE_BUILD_TYPE=Release
    cmake --build "$ROOT/tools/whisper.cpp/build" -j --config Release
    sudo ln -sf "$ROOT/tools/whisper.cpp/build/bin/whisper-cli" /usr/local/bin/whisper-cli
  fi
fi

say "Downloading Whisper model ($MODEL_NAME)"
mkdir -p "$ROOT/tools/models"
[ -f "$MODEL" ] || curl -L --fail -o "$MODEL" "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/$MODEL_NAME"

say "Installing Remotion"
(cd "$ROOT/remotion" && npm install)

say "Optional: HyperFrames agent skills (HTML motion graphics / 3D)"
echo "Run this yourself if you want them:  npx skills add heygen-com/hyperframes"

say "Testing each tool"
ok=1
check() { if eval "$2" >/dev/null 2>&1; then echo "  [ok]   $1"; else echo "  [FAIL] $1  ($2)"; ok=0; fi; }
check "FFmpeg"       "ffmpeg -version"
check "yt-dlp"       "yt-dlp --version"
check "whisper.cpp"  "whisper-cli --help"
check "Whisper model" "test -s '$MODEL'"
check "Node"         "node --version"
check "Remotion"     "cd '$ROOT/remotion' && npx remotion versions"

T="$(mktemp -d)"
ffmpeg -hide_banner -loglevel error -f lavfi -i "sine=frequency=300:duration=2" -ar 16000 -ac 1 "$T/t.wav"
check "Whisper runs" "whisper-cli -m '$MODEL' -f '$T/t.wav' -np"
rm -rf "$T"

[ "$ok" = 1 ] && say "Ready. Drop a clip in raw-footage/ and ask Claude to edit it." || { say "Some checks failed (see above)"; exit 1; }
