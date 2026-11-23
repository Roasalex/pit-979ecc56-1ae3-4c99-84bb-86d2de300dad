#!/usr/bin/env python3
"""Per-frame talking envelope for a voice track, for cartoon mouth flaps and talk bob.

usage: mouth_envelope.py <audio> <out.json> [--fps 30]
writes {"fps", "level": [0..100 per frame], "open": "0101..."} where open = mouth-open frame (flaps at a cartoon
talking rate while the voice is above the speech floor, shut in pauses)."""
import argparse, json, subprocess
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("audio"); ap.add_argument("out"); ap.add_argument("--fps", type=int, default=30)
a = ap.parse_args()
SR = 16000
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", a.audio, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
hop = SR // a.fps
n = len(x) // hop
rms = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
db = 20 * np.log10(rms)
ref = np.percentile(db, 95)
level = np.clip((db - (ref - 30)) / 30, 0, 1)          # 0 at 30 dB under loud speech, 1 at loud speech
# syllable flaps (~5/s, a cartoon talking rate): open on speech, hold up to 3 frames, then shut at least 2 frames
out, is_open, run = [], False, 0
for k in range(n):
    talking = level[k] > 0.35
    if is_open and (not talking or run >= 3): is_open, run = False, 0
    elif not is_open and talking and run >= 2: is_open, run = True, 0
    run += 1
    out.append("1" if is_open else "0")
json.dump({"fps": a.fps, "level": [int(round(v * 100)) for v in level], "open": "".join(out)}, open(a.out, "w"))
o = np.array([c == "1" for c in out])
print(f"{n} frames, talking {np.mean(level > 0.35):.0%}, open {o.mean():.0%}, flaps {np.sum(o[1:] & ~o[:-1])}")
