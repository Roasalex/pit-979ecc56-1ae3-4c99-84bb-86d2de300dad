#!/usr/bin/env python3
"""Cut the dead air out of one or more talking-head takes and join them into one edit-ready take.

    python3 scripts/cut_silences.py public/recordings/IMG_0412.MOV public/recordings/IMG_0413.MOV --name tools-video

Writes public/recordings/<name>.mp4 (H.264, 30fps, SDR: the skill's ingest step done for you) and
public/recordings/<name>.cuts.json: the kept ranges per source clip and every join as a frame on the
new timeline. Those joins are jump cuts: punch in on them, and treat them as cuts when measuring.

A pause is anything quieter than --noise for at least --min-silence seconds; --pad seconds of it are
kept on each side so word endings and breaths aren't clipped. The originals are never modified.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
HDR_TRANSFERS = {"arib-std-b67", "smpte2084"}  # HLG (iPhone) and PQ
# HDR -> Rec.709 with a gentle tonemap so skin tones don't go orange/grey.
TONEMAP = ("zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,"
           "zscale=t=bt709:m=bt709:r=tv,")


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
        capture_output=True, text=True, check=True,
    )
    info = json.loads(out.stdout)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    if not any(s["codec_type"] == "audio" for s in info["streams"]):
        sys.exit(f"{path.name} has no audio track; can't detect pauses.")
    w, h = int(v["width"]), int(v["height"])
    rotation = int(float(v.get("tags", {}).get("rotate", 0)))
    for sd in v.get("side_data_list", []):
        rotation = int(sd.get("rotation", rotation))
    if abs(rotation) % 180 == 90:  # phones store portrait as rotated landscape
        w, h = h, w
    return {"duration": float(info["format"]["duration"]), "width": w, "height": h,
            "hdr": v.get("color_transfer") in HDR_TRANSFERS}


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


def render(clips, size, out, script_path):
    w, h = size
    parts, labels, n = [], [], 0
    for i, clip in enumerate(clips):
        vchain = (TONEMAP if clip["hdr"] else "") + \
            f"fps={FPS},scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},setsar=1,format=yuv420p"
        for a, b in clip["ranges"]:
            parts.append(f"[{i}:v]trim=start={a:.3f}:end={b:.3f},setpts=PTS-STARTPTS,{vchain}[v{n}];")
            parts.append(f"[{i}:a]atrim=start={a:.3f}:end={b:.3f},asetpts=PTS-STARTPTS,"
                         f"aresample=48000,aformat=channel_layouts=stereo[a{n}];")
            labels.append(f"[v{n}][a{n}]")
            n += 1
    parts.append(f"{''.join(labels)}concat=n={n}:v=1:a=1[v][a]")
    script_path.write_text("\n".join(parts))
    cmd = ["ffmpeg", "-hide_banner", "-y", "-loglevel", "error"]
    for clip in clips:
        cmd += ["-i", str(clip["path"])]
    cmd += ["-filter_complex_script", str(script_path), "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", str(FPS),
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("inputs", nargs="+", help="takes, joined in this order")
    p.add_argument("--name", help="output name (default: first input's name + '-cut')")
    p.add_argument("--min-silence", type=float, default=0.1, help="shortest pause to cut, seconds (default 0.1)")
    p.add_argument("--noise", default="-35dB", help="silence threshold (default -35dB; try -30dB in a noisy room)")
    p.add_argument("--pad", type=float, default=0.05, help="seconds of pause kept each side of a cut (default 0.05)")
    p.add_argument("--min-keep", type=float, default=0.15, help="drop kept fragments shorter than this (breaths, clicks)")
    p.add_argument("--dry-run", action="store_true", help="report what would be cut without rendering")
    args = p.parse_args()

    clips = []
    for raw in args.inputs:
        path = Path(raw).resolve()
        info = probe(path)
        ranges = keep_ranges(detect_silences(path, args.noise, args.min_silence), info["duration"], args.pad, args.min_keep)
        if not ranges:
            sys.exit(f"{path.name}: nothing left after cutting; --noise is probably too high for this recording.")
        kept = sum(b - a for a, b in ranges)
        print(f"{path.name}: {info['duration']:.1f}s -> {kept:.1f}s ({len(ranges)} pieces"
              f"{', HDR -> SDR' if info['hdr'] else ''})")
        clips.append({**info, "path": path, "ranges": ranges, "kept": kept})

    # Joins on the new timeline, in frames. Each is a jump cut (or a new take).
    joins, t = [], 0.0
    for clip in clips:
        for a, b in clip["ranges"]:
            if t > 0:
                joins.append(round(t * FPS))
            t += b - a
    total = sum(c["duration"] for c in clips)
    print(f"Total: {total:.1f}s -> {t:.1f}s, {len(joins)} jump cuts")

    name = args.name or Path(args.inputs[0]).stem + "-cut"
    out = ROOT / "public" / "recordings" / f"{name}.mp4"
    (out.parent / f"{name}.cuts.json").write_text(json.dumps({
        "settings": {k: getattr(args, k) for k in ("min_silence", "noise", "pad", "min_keep")},
        "fps": FPS,
        "sourceSeconds": round(total, 3),
        "editSeconds": round(t, 3),
        "joinFrames": joins,
        "clips": [{"source": str(c["path"].relative_to(ROOT)) if c["path"].is_relative_to(ROOT) else str(c["path"]),
                   "hdr": c["hdr"],
                   "kept": [{"start": round(a, 3), "end": round(b, 3)} for a, b in c["ranges"]]} for c in clips],
    }, indent=2))
    if args.dry_run:
        return
    size = (clips[0]["width"], clips[0]["height"])
    render(clips, size, out, out.parent / f".{name}.filter.txt")
    (out.parent / f".{name}.filter.txt").unlink()
    print(f"Wrote {out.relative_to(ROOT)} ({size[0]}x{size[1]} @ {FPS}fps)")


if __name__ == "__main__":
    main()
