#!/usr/bin/env python3
"""Apply real hand shake (a phone_motion.py CSV) to a stream of raw rgb24 frames: stdin -> stdout, one frame at a time.

usage: ffmpeg ... -f rawvideo -pix_fmt rgb24 - | python3 handheld.py <motion.csv> <W> <H> <anchor_x> <anchor_y> [scale] [rot_gain] [drift_keep] | ffmpeg ...
  anchor     the point the hand "holds" still-ish, e.g. the centre of the laptop screen, in pixels
  scale      overscan zoom so the frame edges never show (default 1.10 = 10 %)
  rot_gain   share of the measured roll kept (default 0.6)
  drift_keep share of the slow wander kept (default 0.4; the sway and shake stay at 100 %)
Needs: numpy, pillow.
"""
import sys
import numpy as np
from PIL import Image

csv = sys.argv[1]; W, H = int(sys.argv[2]), int(sys.argv[3]); AX, AY = float(sys.argv[4]), float(sys.argv[5])
S = float(sys.argv[6]) if len(sys.argv) > 6 else 1.10
RG = float(sys.argv[7]) if len(sys.argv) > 7 else 0.6
DK = float(sys.argv[8]) if len(sys.argv) > 8 else 0.4

m = np.loadtxt(csv, delimiter=',', skiprows=1)
x, y, r = m[:, 1] * W, m[:, 2] * W, m[:, 3] * RG

def smooth(a, sigma=90):
    k = np.exp(-0.5 * (np.arange(-3 * sigma, 3 * sigma + 1) / sigma) ** 2); k /= k.sum()
    return np.convolve(np.pad(a, 3 * sigma, mode='edge'), k, mode='same')[3 * sigma:-3 * sigma]

x = x - (1 - DK) * smooth(x); y = y - (1 - DK) * smooth(y); r = r - (1 - DK) * smooth(r)   # keep sway + shake, damp the wander
x -= x.mean(); y -= y.mean(); r -= r.mean()
ramp = np.clip(np.arange(len(x)) / 15.0, 0, 1); ramp = ramp * ramp * (3 - 2 * ramp)           # ease in over 0.5 s
x *= ramp; y *= ramp; r *= ramp

def coeffs(tx, ty, th):
    c, s = np.cos(th), np.sin(th); a, b, d, e = c / S, s / S, -s / S, c / S
    return (a, b, AX - (a * (AX + tx) + b * (AY + ty)), d, e, AY - (d * (AX + tx) + e * (AY + ty)))

worst = 0.0
for i in range(len(x)):
    a, b, c, d, e, f = coeffs(x[i], y[i], r[i])
    for px, py in ((0, 0), (W, 0), (0, H), (W, H)):
        sx, sy = a * px + b * py + c, d * px + e * py + f
        worst = max(worst, -sx, sx - W, -sy, sy - H)
sys.stderr.write(f'handheld: {len(x)} frames, edges {"OK" if worst <= 0 else f"SHOW by {worst:.1f} px: raise scale"}\n')

i = 0; inp, out = sys.stdin.buffer, sys.stdout.buffer
while True:
    buf = inp.read(W * H * 3)
    if len(buf) < W * H * 3: break
    k = min(i, len(x) - 1)
    img = Image.frombuffer('RGB', (W, H), buf, 'raw', 'RGB', 0, 1)
    out.write(img.transform((W, H), Image.AFFINE, coeffs(x[k], y[k], r[k]), resample=Image.BICUBIC).tobytes()); i += 1
out.flush()
