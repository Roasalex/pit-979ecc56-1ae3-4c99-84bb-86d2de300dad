#!/usr/bin/env bash
# One-time setup on the editing machine (macOS with Homebrew, or Debian/Ubuntu). Safe to re-run.
# Installs ffmpeg, the Remotion project, whisper.cpp (built into bin/whisper.cpp) with the base.en and
# small models, the Python bits the skill's scripts use, then checks HyperFrames and Google Chrome.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
MAC=0; [[ "$(uname)" == "Darwin" ]] && MAC=1

say "ffmpeg"
if ! command -v ffmpeg >/dev/null; then
  if [ $MAC = 1 ]; then brew install ffmpeg; else sudo apt-get update && sudo apt-get install -y ffmpeg; fi
fi

say "Remotion project (npm install)"
npm install

say "whisper.cpp -> bin/whisper.cpp"
command -v cmake >/dev/null || { if [ $MAC = 1 ]; then brew install cmake; else sudo apt-get install -y cmake build-essential; fi; }
[ -d bin/whisper.cpp/.git ] || git clone --depth 1 https://github.com/ggml-org/whisper.cpp bin/whisper.cpp
cmake -S bin/whisper.cpp -B bin/whisper.cpp/build -DCMAKE_BUILD_TYPE=Release
cmake --build bin/whisper.cpp/build -j --config Release
# base.en: transcribe.mjs. small: the skill's retime-captions.py.
for m in base.en small; do
  [ -f "bin/whisper.cpp/models/ggml-$m.bin" ] || bash bin/whisper.cpp/models/download-ggml-model.sh "$m"
done

say "Python packages for the skill's measuring scripts"
python3 -c "import numpy, PIL" 2>/dev/null || python3 -m pip install --user numpy pillow

say "HyperFrames"
npx hyperframes telemetry disable >/dev/null 2>&1 || true

say "Checks"
ok=1
check() { if eval "$2" >/dev/null 2>&1; then echo "  [ok]   $1"; else echo "  [FAIL] $1"; ok=0; fi; }
check "ffmpeg / ffprobe"           "ffmpeg -version && ffprobe -version"
check "whisper-cli built"          "bin/whisper.cpp/build/bin/whisper-cli --help"
check "base.en model"              "test -s bin/whisper.cpp/models/ggml-base.en.bin"
check "small model"                "test -s bin/whisper.cpp/models/ggml-small.bin"
check "whisper transcribes"        "bin/whisper.cpp/build/bin/whisper-cli -m bin/whisper.cpp/models/ggml-base.en.bin -f bin/whisper.cpp/samples/jfk.wav -np"
check "TypeScript builds"          "npx tsc --noEmit"
check "Remotion bundles"           "npx remotion bundle --out-dir \"$(mktemp -d)\" --log=error"
check "numpy + Pillow"             "python3 -c 'import numpy, PIL'"
check "HyperFrames runs"           "npx hyperframes --help"
if [ $MAC = 1 ]; then
  check "Google Chrome installed"  "test -x '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'"
else
  check "Google Chrome installed"  "command -v google-chrome || command -v google-chrome-stable"
fi

if [ "$ok" = 1 ]; then say "All good. Drop clips in public/recordings/ and ask Claude for an edit."
else say "Some checks failed (above). Chrome: https://www.google.com/chrome/ (HyperFrames renders with it)"; exit 1; fi
