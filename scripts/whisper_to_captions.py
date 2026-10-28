#!/usr/bin/env python3
"""Convert whisper.cpp --output-json (run with --max-len 1 --split-on-word) into captions.json:
[{"text": "Hello", "startMs": 0, "endMs": 320}, ...]
Edit captions.json by hand (or ask Claude) to fix misheard words before rendering."""
import json
import sys


def main(src, dst):
    data = json.load(open(src, encoding="utf-8"))
    words = []
    for seg in data.get("transcription", []):
        text = seg["text"].strip()
        if not text or (text.startswith("[") and text.endswith("]")):  # skip [BLANK_AUDIO], [Music] etc.
            continue
        start, end = seg["offsets"]["from"], seg["offsets"]["to"]
        # Punctuation-only tokens attach to the previous word instead of flashing on their own.
        if words and all(not ch.isalnum() for ch in text):
            words[-1]["text"] += text
            words[-1]["endMs"] = max(words[-1]["endMs"], end)
            continue
        words.append({"text": text, "startMs": start, "endMs": max(end, start + 80)})
    json.dump(words, open(dst, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"{len(words)} words -> {dst}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: whisper_to_captions.py whisper.json captions.json")
    main(sys.argv[1], sys.argv[2])
