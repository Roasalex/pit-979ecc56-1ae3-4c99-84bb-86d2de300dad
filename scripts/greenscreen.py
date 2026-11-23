#!/usr/bin/env python3
"""Key out a green screen (and split side-by-side mouth pairs) for talking-character art.

    python3 scripts/greenscreen.py pair  in.webp out-open.png out-closed.png   # left half = mouth open, right = closed
    python3 scripts/greenscreen.py single in.webp out.png

Keys on "how much greener than red/blue" a pixel is, with a soft edge and green spill removed from the outline, so
the thick cartoon outlines stay clean. For pairs it also aligns the closed half onto the open half (the generator can
shift the second copy by a few pixels) and reports how far apart they were, so swapping them only moves the mouth.
"""
import sys

import numpy as np
from PIL import Image


def key(rgb: np.ndarray) -> np.ndarray:
    r, g, b = (rgb[..., i].astype(np.float32) for i in range(3))
    greenness = g - np.maximum(r, b)              # ~240 on the screen, <= 0 on the character
    alpha = np.clip(1 - (greenness - 40) / 80, 0, 1)  # fully transparent above 120, solid below 40
    out = np.dstack([rgb.astype(np.float32), alpha * 255])
    spill = np.clip(g - np.maximum(r, b), 0, None)    # pull leftover green out of edge pixels
    out[..., 1] -= spill * (1 - alpha) + np.minimum(spill, 30) * alpha * (greenness > 0)
    return np.clip(out, 0, 255).astype(np.uint8)


def shift_to_match(ref_a: np.ndarray, mov_a: np.ndarray, search: int = 12):
    """Best integer (dx, dy) moving `mov` onto `ref`, scored on the alpha silhouettes (the mouth barely counts)."""
    best = (0, 0, 1e18)
    ref = ref_a.astype(np.float32)
    for dy in range(-search, search + 1):
        for dx in range(-search, search + 1):
            m = np.roll(np.roll(mov_a, dy, 0), dx, 1).astype(np.float32)
            d = np.abs(ref - m)[search:-search, search:-search].mean()
            if d < best[2]:
                best = (dx, dy, d)
    return best


def main():
    mode = sys.argv[1]
    img = np.asarray(Image.open(sys.argv[2]).convert("RGB"))
    if mode == "single":
        Image.fromarray(key(img)).save(sys.argv[3])
        return
    h, w, _ = img.shape
    left, right = key(img[:, : w // 2]), key(img[:, w // 2 : w // 2 * 2])
    dx, dy, err = shift_to_match(left[..., 3], right[..., 3])
    right = np.roll(np.roll(right, dy, 0), dx, 1)
    Image.fromarray(left).save(sys.argv[3])
    Image.fromarray(right).save(sys.argv[4])
    # how different the two are outside the face: should be ~0 if only the mouth changed
    diff = np.abs(left[..., :3].astype(int) - right[..., :3].astype(int)).sum(2) > 60
    ys, xs = np.nonzero(diff & (left[..., 3] > 128))
    box = (xs.min(), ys.min(), xs.max(), ys.max()) if len(xs) else None
    print(f"{sys.argv[2]}: aligned closed half by dx={dx} dy={dy} (silhouette mismatch {err:.2f}); pixels that differ: "
          f"{diff.mean() * 100:.1f}% of frame, inside box {box}")


if __name__ == "__main__":
    main()
