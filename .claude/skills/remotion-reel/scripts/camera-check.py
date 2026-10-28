#!/usr/bin/env python3
"""Replay a screen-recording camera path and report the worst per-frame motion.

Edit KEYS, SRC_W/SRC_H and MAX_BLEED to match the pane, then run it before you
render. It catches two things: a clamp that snaps the framing, and a pan that is
simply too fast to read.

A lateral pan over fine UI text reads as smooth at under about 25 output px per
frame. Anything over 50 will be called out as a jump.
"""
FRAME_W, FRAME_H = 1080, 1920
SRC_W, SRC_H = 3024, 1898
MAX_BLEED = 400

# (frame, windowWidth, centreX, centreY) in SOURCE pixels
KEYS = [
    (0, 1450, 1388, 800),
    (40, 1430, 1388, 1120),
    (140, 1220, 2385, 1040),
]


def ease_in_out_cubic(t):
    return 4 * t * t * t if t < 0.5 else 1 - ((-2 * t + 2) ** 3) / 2


def cam_at(keys, f):
    if f <= keys[0][0]:
        return keys[0][1:]
    if f >= keys[-1][0]:
        return keys[-1][1:]
    for i in range(len(keys) - 1):
        if keys[i][0] <= f <= keys[i + 1][0]:
            a, b = keys[i], keys[i + 1]
            break
    t = ease_in_out_cubic((f - a[0]) / (b[0] - a[0]))
    return [a[j] + (b[j] - a[j]) * t for j in (1, 2, 3)]


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def main():
    last = KEYS[-1][0]
    prev = None
    worst_corner = worst_corner_f = 0
    worst_pan = worst_pan_f = 0
    for f in range(last + 1):
        w, cx, cy = cam_at(KEYS, f)
        wh = w * FRAME_H / FRAME_W
        cxc = clamp(cx, w / 2, SRC_W - w / 2)
        cyc = clamp(cy, wh / 2 - MAX_BLEED, SRC_H - wh / 2 + MAX_BLEED)
        k = FRAME_W / w
        corners = [(FRAME_W / 2 - cxc * k, FRAME_H / 2 - cyc * k),
                   (FRAME_W / 2 + (SRC_W - cxc) * k, FRAME_H / 2 + (SRC_H - cyc) * k)]
        if prev:
            d = max(((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2) ** 0.5
                    for p, q in zip(corners, prev[0]))
            if d > worst_corner:
                worst_corner, worst_corner_f = d, f
            pan = abs(cxc - prev[1]) * k
            if pan > worst_pan:
                worst_pan, worst_pan_f = pan, f
        prev = (corners, cxc)

    print(f"worst corner motion  {worst_corner:6.1f} output px/frame  at f{worst_corner_f}")
    print(f"worst lateral pan    {worst_pan:6.1f} output px/frame  at f{worst_pan_f}")
    if worst_pan > 25:
        print("  pan is fast; lengthen the move or reduce the zoom change")
    crossing = [f for f in range(last + 1)
                if abs(cam_at(KEYS, f)[0] * FRAME_H / FRAME_W - SRC_H) < 30]
    if crossing:
        print(f"  note: the window height passes through the source height near f{crossing[0]}; "
              "confirm the clamp allows bleed, or a hard clamp will snap here")


if __name__ == "__main__":
    main()
