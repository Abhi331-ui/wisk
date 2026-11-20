#!/usr/bin/env python3
"""Measure real hand shake from a phone clip you filmed yourself (hold the phone like you are filming a laptop,
20-30 s, don't walk). Tracks two static patches frame to frame by phase correlation and writes one row per frame:
frame, x, y (fractions of the frame width, accumulated), rot (radians).

usage: python3 phone_motion.py <phone.mp4> <motion.csv> [start_s] [dur_s]
env BOXES="x0,y0,x1,y1;x0,y1,..." picks the two patches as fractions of the frame (default: left and right of the
lower-middle area, which is usually the keyboard/desk). Pick patches that do NOT move on their own (not a screen).
Needs: numpy, ffmpeg.
"""
import os, subprocess, sys
import numpy as np

src, out = sys.argv[1], sys.argv[2]
start = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
dur = float(sys.argv[4]) if len(sys.argv) > 4 else 30.0
probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:stream_side_data=rotation',
                        '-of', 'csv=p=0', src], capture_output=True, text=True).stdout.split()
w0, h0 = [int(v) for v in probe[0].split(',')[:2]]
W = 480; H = int(round(W * h0 / w0 / 2)) * 2           # analyse small: fast, and shake is large-scale anyway
BOXES = [tuple(float(v) for v in b.split(',')) for b in os.environ.get('BOXES', '0.04,0.62,0.47,0.95;0.53,0.62,0.96,0.95').split(';')]

cmd = ['ffmpeg', '-v', 'error', '-ss', str(start), '-t', str(dur), '-i', src,
       '-vf', f'fps=30,scale={W}:{H}:flags=area,format=gray', '-f', 'rawvideo', '-']
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)

def crop(img, b):
    x0, y0, x1, y1 = int(b[0] * W), int(b[1] * H), int(b[2] * W), int(b[3] * H)
    c = img[y0:y1, x0:x1].astype(np.float64); c -= c.mean()
    return c * np.outer(np.hanning(c.shape[0]), np.hanning(c.shape[1]))

def shift(a, b):
    """Sub-pixel shift of b relative to a (phase correlation + parabola peak fit)."""
    F = np.fft.fft2(a) * np.conj(np.fft.fft2(b))
    r = np.fft.ifft2(F / (np.abs(F) + 1e-9)).real
    iy, ix = np.unravel_index(np.argmax(r), r.shape)
    def sub(m, i, n):
        l, c, rr = m[(i - 1) % n], m[i], m[(i + 1) % n]; d = l - 2 * c + rr
        return i + (0.5 * (l - rr) / d if abs(d) > 1e-12 else 0.0)
    fy = sub(r[:, ix], iy, r.shape[0]); fx = sub(r[iy, :], ix, r.shape[1])
    if fy > r.shape[0] / 2: fy -= r.shape[0]
    if fx > r.shape[1] / 2: fx -= r.shape[1]
    return -fx, -fy

centers = [((b[0] + b[2]) / 2 * W, (b[1] + b[3]) / 2 * H) for b in BOXES]
span = centers[1][0] - centers[0][0]
prev = None; x = y = rot = 0.0; rows = []; i = 0
while True:
    buf = p.stdout.read(W * H)
    if len(buf) < W * H: break
    img = np.frombuffer(buf, np.uint8).reshape(H, W)
    cur = [crop(img, b) for b in BOXES]
    if prev is not None:
        s = [shift(a, b) for a, b in zip(prev, cur)]
        x += (s[0][0] + s[1][0]) / 2 / W; y += (s[0][1] + s[1][1]) / 2 / W; rot += (s[1][1] - s[0][1]) / span
    rows.append((i, x, y, rot)); prev = cur; i += 1
p.wait()
with open(out, 'w') as f:
    f.write('frame,x,y,rot\n')
    for r in rows: f.write('%d,%.6f,%.6f,%.7f\n' % r)
a = np.array(rows)
print(f'{len(rows)} frames -> {out}; drift x {a[:,1].min():+.4f}..{a[:,1].max():+.4f}  y {a[:,2].min():+.4f}..{a[:,2].max():+.4f} (frame widths), '
      f'roll {np.degrees(a[:,3]).min():+.2f}..{np.degrees(a[:,3]).max():+.2f} deg')
