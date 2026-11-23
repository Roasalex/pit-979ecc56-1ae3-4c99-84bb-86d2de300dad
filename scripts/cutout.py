#!/usr/bin/env python3
"""Cut a cartoon/anime character out of its background with the anime-seg ISNet model (skytnt/anime-seg, Apache-2.0).

    python3 scripts/cutout.py public/images/elevate-vsl/scene-2.webp public/images/elevate-vsl/cutout-2.png

Writes an RGBA PNG (same size as the input) with the background transparent. Model: set CUTOUT_MODEL, default
bin/models/isnetis.onnx (download: https://huggingface.co/skytnt/anime-seg/resolve/main/isnetis.onnx).
Check every result: props the character holds or leans on (a car, a chair) may be kept or dropped.
"""
import os
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SIZE = 1024


def mask_for(img: Image.Image, session) -> np.ndarray:
    w, h = img.size
    s = SIZE / max(w, h)
    nw, nh = int(round(w * s)), int(round(h * s))
    canvas = np.zeros((SIZE, SIZE, 3), np.float32)
    px, py = (SIZE - nw) // 2, (SIZE - nh) // 2
    canvas[py:py + nh, px:px + nw] = np.asarray(img.convert("RGB").resize((nw, nh), Image.LANCZOS), np.float32) / 255
    out = session.run(None, {session.get_inputs()[0].name: canvas.transpose(2, 0, 1)[None]})[0][0][0]
    m = out[py:py + nh, px:px + nw]
    return np.asarray(Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS))


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    model = os.environ.get("CUTOUT_MODEL", str(ROOT / "bin" / "models" / "isnetis.onnx"))
    session = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
    img = Image.open(sys.argv[1]).convert("RGBA")
    a = mask_for(img, session)
    rgba = np.asarray(img).copy()
    rgba[..., 3] = a
    Image.fromarray(rgba).save(sys.argv[2])
    print(f"{sys.argv[2]}: {img.size[0]}x{img.size[1]}, {100 * (a > 127).mean():.0f}% kept")


if __name__ == "__main__":
    main()
