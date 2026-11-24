#!/usr/bin/env python3
"""Per-frame talking envelope for a voice track, for cartoon mouth flaps and talk bob.

usage: mouth_envelope.py <audio> <out.json> [--words <words.json>] [--fps 30]
writes {"fps", "level": [0..100 per frame], "open": "0101..."}.

The mouth opens once per spoken syllable, so it flaps as fast as the voice actually talks (slower on drawn-out
words, shut in pauses). With --words (the transcript, [{text,startMs,endMs}]), each word's syllables are counted
from its spelling and each one gets a flap at its loudest moment inside the voiced part of the word. Without it,
syllables are found as peaks of the voice-band (300-3000 Hz) energy alone."""
import argparse, json, subprocess
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("audio"); ap.add_argument("out"); ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--words")
a = ap.parse_args()
SR, HOP, WIN = 16000, 160, 512                      # 10 ms hop, 32 ms window
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", a.audio, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
n = (len(x) - WIN) // HOP
frames = np.lib.stride_tricks.sliding_window_view(x, WIN)[::HOP][:n] * np.hanning(WIN)
spec = np.abs(np.fft.rfft(frames, axis=1)) ** 2
freqs = np.fft.rfftfreq(WIN, 1 / SR)
band = spec[:, (freqs >= 300) & (freqs <= 3000)].sum(1)
db = 10 * np.log10(band + 1e-10)
db = np.convolve(db, np.ones(4) / 4, mode="same")     # ~40 ms smoothing
ref = np.percentile(db, 95)
floor = ref - 28                                      # below this it's a pause or breath

# syllable nuclei: local maxima above the floor that rise >= 3 dB over the dips on both sides
peaks = []
for k in range(1, n - 1):
    if db[k] < floor or db[k] < db[k - 1] or db[k] < db[k + 1]: continue
    lo = max(0, k - 15); hi = min(n, k + 16)           # look 150 ms each way
    left = db[lo:k].min() if k > lo else db[k]; right = db[k + 1:hi].min() if hi > k + 1 else db[k]
    if db[k] - max(left, right) < 3 and db[k] - min(left, right) < 6: continue
    if peaks and k - peaks[-1] < 11:                  # nuclei closer than 110 ms: keep the louder
        if db[k] > db[peaks[-1]]: peaks[-1] = k
        continue
    peaks.append(k)

def syllables(t, dur_s):
    import re
    if re.search(r"\d", t): return max(1, round(dur_s / 0.2))     # numbers: by spoken length
    w = re.sub(r"[^a-z]", "", t.lower())
    if not w: return 1
    c = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and not w.endswith(("le", "ee")) and c > 1: c -= 1   # silent e
    return max(1, c)

if a.words:
    peaks = []
    for wd in json.load(open(a.words)):
        s0, e0 = int(wd["startMs"] / 10), min(n, int(wd["endMs"] / 10) + 1)
        voiced = np.nonzero(db[s0:e0] > floor)[0]
        if not len(voiced): continue
        vs, ve = s0 + voiced[0], s0 + voiced[-1] + 1
        c = min(syllables(wd["text"], (ve - vs) / 100), max(1, (ve - vs) // 9))   # never faster than ~11/s
        edges = np.linspace(vs, ve, c + 1).astype(int)
        for lo, hi in zip(edges[:-1], edges[1:]):
            if hi > lo: peaks.append(lo + int(np.argmax(db[lo:hi])))
    peaks = sorted(set(peaks))

open10 = np.zeros(n, bool)
for p, k in enumerate(peaks):
    start = max(0, k - 4)
    end = k + 1
    nxt = peaks[p + 1] if p + 1 < len(peaks) else n
    while end < min(n, k + 13, nxt - 3) and db[end] > db[k] - 7 and db[end] > floor: end += 1
    open10[start:end] = True

fps = a.fps
nf = int(len(x) / SR * fps)
t10 = lambda fr: int(round((fr + 0.5) / fps * 100))
opened = "".join("1" if open10[min(n - 1, t10(fr))] else "0" for fr in range(nf))
# hold the mouth open at most 4 frames in a row: a long vowel still reads as talking if it blinks shut
runs, k = list(opened), 0
for fr in range(nf):
    k = k + 1 if runs[fr] == "1" else 0
    if k > 4: runs[fr], k = "0", 0
opened = "".join(runs)
lvl = np.clip((db - floor) / (ref - floor), 0, 1)
level = [int(round(100 * lvl[min(n - 1, t10(fr))])) for fr in range(nf)]
json.dump({"fps": fps, "level": level, "open": opened}, open(a.out, "w"))
o = np.array([c == "1" for c in opened])
talk = np.array(level) > 0
print(f"{nf} frames, {len(peaks)} syllables ({len(peaks) / (talk.sum() / fps):.1f}/s of voiced time), open {o.mean():.0%}, flaps {np.sum(o[1:] & ~o[:-1])}")
