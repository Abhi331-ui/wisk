# Picture timeline mirrored (read-only) from your Remotion project/src/videos/bridge/story.ts + cast.ts so every sound lands on
# the frame: shots, story time tau per shot, march phase (footfalls at tau = k * 0.5 s), bounce amp(), stomp(),
# snap / drop / water, swing pushes, hammer hits, tourists' own stroll phases, and the camera's distance to the column.
import math
import numpy as np

FPS = 30
TOTAL = 2025
DUR = TOTAL / FPS            # 67.5 s exactly
fr = lambda f: f / FPS

SNAP, DROP0, DROP1 = 34.62, 36.35, 36.95
FLASH = fr(130)
HITS = [59.79, 60.33, 61.69]
SWING_T, PUSH0 = 1.55, 48.79
PUSHES = [PUSH0 + k * SWING_T for k in range(4)]
TOURIST_T0 = 62.08

# id: (first frame, end frame, light, crowd)
SHOTS = {
    1: (0, 130, "day", "march"), 2: (130, 283, "day", "march"), 3: (283, 444, "day", "march"),
    4: (444, 534, "day", "march"), 5: (534, 643, "day", "march"), 6: (643, 823, "day", "march"),
    7: (823, 987, "day", "march"), 8: (987, 1134, "day", "fall"), 9: (1134, 1212, "day", "water"),
    10: (1212, 1303, "day", "water"), 11: (1303, 1411, "golden", "none"), 12: (1411, 1620, "golden", "none"),
    13: (1620, 1735, "golden", "march"), 14: (1735, 1863, "day", "bank"), 15: (1863, TOTAL, "day", "tourists"),
}
XFADE = {9: 6, 11: 8, 12: 8, 13: 8, 14: 8, 15: 8}


def shot_t(i):
    a, b = SHOTS[i][:2]
    return fr(a), fr(b)


def shot_at(t):
    f = t * FPS
    for i, (a, b, *_r) in SHOTS.items():
        if a <= f < b:
            return i
    return 15


def tau_of(shot, t):
    return 29.5 + t if shot == 1 else (t - 31 if shot == 13 else t)


def _lin(pts, x):
    return float(np.interp(x, [p[0] for p in pts], [p[1] for p in pts]))


AMP = [(14.85, 0), (17.8, 0.07), (21.4, 0.13), (27.4, 0.26), (33.0, 0.46), (SNAP, 0.55), (SNAP + 0.35, 0.0)]
STOMP = [(21.4, 1.0), (27.4, 1.35), (33, 1.5)]


def amp(tau):
    return _lin(AMP, tau) if tau >= AMP[0][0] else 0.0


def stomp(tau):
    return _lin(STOMP, tau)


def hh(i, s=0):
    """same hash as cast.ts (IEEE doubles, so it reproduces the JS values)"""
    v = math.sin(i * 127.1 + s * 311.7) * 43758.5453
    return v - math.floor(v)


def easeout(u):
    u = min(1.0, max(0.0, u))
    return 1 - (1 - u) ** 4


# camera -> marching column distance (m) per shot, from the camera keys in story.ts (frame, move frames, metres)
COLUMN_CAM = {
    1: [(0, 0, 15.2), (48, 9, 6.7), (88, 9, 4.3)],
    2: [(126, 0, 80.0), (190, 10, 66.0), (246, 10, 51.0)],
    3: [(280, 0, 51.0), (283, 14, 6.45), (353, 10, 3.55)],
    4: [(440, 0, 3.55), (444, 13, 11.6), (497, 10, 7.9)],
    5: [(530, 0, 7.9), (534, 13, 5.0), (585, 10, 3.9)],
    6: [(640, 0, 3.9), (643, 11, 3.3), (717, 12, 11.9), (768, 10, 7.0)],
    7: [(820, 0, 7.0), (823, 12, 11.4), (871, 11, 7.4), (925, 11, 4.1)],
    8: [(984, 0, 4.1), (987, 12, 19.5), (1039, 8, 18.5), (1062, 18, 25.0), (1099, 1, 8.5)],
    13: [(1614, 0, 9.0), (1685, 10, 6.9)],
}


def column_distance(t):
    s = shot_at(t)
    keys = COLUMN_CAM.get(s)
    if not keys:
        return 60.0
    f = t * FPS
    ld = math.log(keys[0][2])
    for kf, dur, d in keys[1:]:
        if f < kf:
            break
        ld = ld + (math.log(d) - ld) * easeout((f - kf) / max(dur, 1))
    return math.exp(ld)


def dist_fx(d):
    """distance -> (gain dB, low-pass Hz, reverb send) used for all column sounds"""
    d = max(d, 3.5)
    g = -14.0 * math.log10(d / 3.5)
    lpf = float(np.clip(17000 * (3.5 / d) ** 0.55, 1800, 17000))
    send = 0.06 + 0.45 * float(np.clip(math.log(d / 3.5) / math.log(25), 0, 1))
    return g, lpf, send


def footfalls():
    """every footfall of the marching column while it is on screen: (t, shot, tau, foot 0/1)"""
    out = []
    for k in range(0, int(DUR * 2) + 1):
        t = k * 0.5
        s = shot_at(t)
        if SHOTS[s][3] not in ("march", "fall"):
            continue
        tau = tau_of(s, t)
        if s == 8 and tau > SNAP + 0.25:     # column stops ("stand") at SNAP + 0.25
            continue
        out.append((t, s, tau, k % 2))
    return out


def tourist_steps():
    """shot 15: 24 soldiers strolling out of step, each with its own speed and phase (cast.ts tourists())"""
    t0 = TOURIST_T0
    a, b = shot_t(15)
    steps = []
    for i in range(24):
        sp = 0.55 + hh(i) * 0.5
        ph0 = hh(i, 5)
        x = (hh(i, 3) - 0.5) * 4.0
        k = 0
        while True:
            # phase = ((t - t0) * sp / 1.4 + ph0) % 1; a footfall at phase 0 and 0.5
            t = t0 + (k * 0.5 - ph0) * 1.4 / sp
            k += 1
            if t < a - 0.1:
                continue
            if t > DUR:
                break
            z = -4 + (i / 24) * 28 + hh(i, 2) * 1.5 - sp * (t - t0)
            steps.append((t, i, x, z, sp))
    return steps


def tourist_cam(t):
    """approx camera position in shot 15 (story.ts keys 1857 / 1905 / 1962)"""
    f = t * FPS
    p = np.array([1.7, 7.75, -15.5]) + np.array([0, 0, 0.006]) * (f - 1857)
    if f >= 1905:
        q = np.array([-1.3, 7.6, -13]) + np.array([0, 0, 0.006]) * (f - 1905)
        p = p + (q - p) * easeout((f - 1905) / 10)
    if f >= 1962:
        q = np.array([17, 15, -44]) + np.array([-0.01, 0.004, 0]) * (f - 1962)
        p = p + (q - p) * easeout((f - 1962) / 24)
    return p


def swing_amp_deg(t):
    s = lambda x: (lambda u: u * u * (3 - 2 * u))(min(1.0, max(0.0, x)))
    return 6 + sum(11 * s((t - tp) / 0.3) for tp in PUSHES)


def words(path):
    import json
    return json.load(open(path, encoding="utf-8"))
