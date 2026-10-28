#!/usr/bin/env python3
"""Remove pauses from a talking-head clip and re-encode it as a vertical-ready MP4.

    python3 scripts/cut_silences.py raw-footage/take1.mov --min-silence 0.3

Writes work/<name>/cut.mp4 and work/<name>/segments.json (the kept ranges, in source seconds).
A pause is any stretch quieter than --noise for at least --min-silence seconds; --pad seconds of it
are kept on each side so word endings and breaths don't get clipped.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def detect_silences(path, noise, min_silence):
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-vn",
         "-af", f"silencedetect=noise={noise}:d={min_silence}", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", proc.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", proc.stderr)]
    return list(zip(starts, ends + [None] * (len(starts) - len(ends))))


def keep_ranges(silences, total, pad, min_keep):
    ranges, cursor = [], 0.0
    for start, end in silences:
        end = total if end is None else end
        cut_from, cut_to = max(0.0, start + pad), min(total, end - pad)
        if cut_to <= cut_from:
            continue
        if cut_from - cursor >= min_keep:
            ranges.append((cursor, cut_from))
        cursor = cut_to
    if total - cursor >= min_keep:
        ranges.append((cursor, total))
    return ranges


def render(src, ranges, out, work):
    parts, labels = [], []
    for i, (a, b) in enumerate(ranges):
        parts.append(f"[0:v]trim=start={a:.3f}:end={b:.3f},setpts=PTS-STARTPTS[v{i}];")
        parts.append(f"[0:a]atrim=start={a:.3f}:end={b:.3f},asetpts=PTS-STARTPTS[a{i}];")
        labels.append(f"[v{i}][a{i}]")
    parts.append(f"{''.join(labels)}concat=n={len(ranges)}:v=1:a=1[v][a]")
    script = work / "cut_filter.txt"
    script.write_text("\n".join(parts))
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-y", "-loglevel", "error", "-i", str(src),
         "-filter_complex_script", str(script), "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)],
        check=True,
    )


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input")
    p.add_argument("--min-silence", type=float, default=0.3, help="shortest pause to cut, seconds (default 0.3)")
    p.add_argument("--noise", default="-35dB", help="silence threshold (default -35dB; raise toward -30dB for noisy rooms)")
    p.add_argument("--pad", type=float, default=0.04, help="seconds of pause kept on each side of a cut")
    p.add_argument("--min-keep", type=float, default=0.12, help="drop kept fragments shorter than this")
    p.add_argument("--name", help="project name under work/ (default: input file stem)")
    p.add_argument("--dry-run", action="store_true", help="print the cut list without rendering")
    args = p.parse_args()

    src = Path(args.input).resolve()
    work = ROOT / "work" / (args.name or src.stem)
    work.mkdir(parents=True, exist_ok=True)

    total = duration(src)
    ranges = keep_ranges(detect_silences(src, args.noise, args.min_silence), total, args.pad, args.min_keep)
    if not ranges:
        sys.exit("Nothing left after cutting; the --noise threshold is probably too high for this recording.")
    kept = sum(b - a for a, b in ranges)
    print(f"{src.name}: {total:.1f}s -> {kept:.1f}s ({len(ranges)} segments, {total - kept:.1f}s of pauses removed)")

    (work / "segments.json").write_text(json.dumps(
        {"source": str(src), "settings": vars(args), "sourceDuration": total, "keptDuration": kept,
         "segments": [{"start": round(a, 3), "end": round(b, 3)} for a, b in ranges]}, indent=2))
    if args.dry_run:
        return
    out = work / "cut.mp4"
    render(src, ranges, out, work)
    print(f"Wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
