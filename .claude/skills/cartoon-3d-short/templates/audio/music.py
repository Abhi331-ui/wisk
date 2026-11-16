# Original light comedic military march for the bridge short, composed and synthesized here (Bb major, 120 bpm:
# one quarter note = one footfall, the beat grid t = k * 0.5 s is the soldiers' step grid in every marching shot).
# Sections follow the picture: hook tutti + whistlers | story march (band) | whistler solo -> column chorus -> nervous
# falter | tension climb, dead stop on "Then," | (silence through the snap, the drop and the deadpan joke) |
# warm sway (84 bpm = the bridge's 0.7 Hz sway) | music-box waltz locked to the swing pushes | golden march + whistlers |
# rule stabs on the hammer blows | lazy swung tourist version ending on "tourists".
import numpy as np
from dsp import SR, ns, rng, pan, place, fades, dbg, make_ir, convolve_st, integrated, lp, hp
import instruments as I
import timeline as T

N = ns(T.DUR)
Q = 0.5  # quarter note (s)

# theme A: (bar, beat, length in quarters, midi)  - whistle / fife register
THEME = [
    (1, 0, 1, 82), (1, 1, .75, 82), (1, 1.75, .25, 84), (1, 2, 1, 86), (1, 3, 1, 82),
    (2, 0, 1, 77), (2, 1, .5, 79), (2, 1.5, .5, 81), (2, 2, 1, 82), (2, 3.5, .5, 77),
    (3, 0, .75, 79), (3, .75, .25, 81), (3, 1, .5, 82), (3, 1.5, .5, 79), (3, 2, 1, 87), (3, 3, .5, 86), (3, 3.5, .5, 84),
    (4, 0, 2, 84), (4, 3.5, .5, 77),
    (5, 0, 1, 82), (5, 1, .75, 82), (5, 1.75, .25, 84), (5, 2, 1, 86), (5, 3, 1, 89),
    (6, 0, .5, 87), (6, .5, .5, 86), (6, 1, .5, 84), (6, 1.5, .5, 82), (6, 2, 1, 81), (6, 3, .5, 82), (6, 3.5, .5, 84),
    (7, 0, .75, 86), (7, .75, .25, 84), (7, 1, .5, 82), (7, 1.5, .5, 81), (7, 2, 1, 79), (7, 3, 1, 84),
    (8, 0, 1, 82), (8, 1, .5, 77), (8, 1.5, .5, 74), (8, 2, 1, 70),
]
PICKUP3 = [(0, 2.5, .5, 74), (0, 3, .5, 75), (0, 3.5, .5, 77)]
CHB = {1: ["Bb"] * 4, 2: ["F", "F", "Bb", "Bb"], 3: ["Cm", "Cm", "Eb", "Eb"], 4: ["F7"] * 4, 5: ["Bb"] * 4,
       6: ["Eb", "Eb", "F", "F"], 7: ["Gm", "Gm", "Cm", "F7"], 8: ["Bb"] * 4}
CH = {
    "Bb": dict(oom=(34, 41), pah=[53, 58, 62], hi=[58, 62, 65]),
    "F": dict(oom=(41, 36), pah=[53, 57, 60], hi=[57, 60, 65]),
    "F7": dict(oom=(41, 36), pah=[51, 57, 60], hi=[57, 60, 63]),
    "Cm": dict(oom=(36, 43), pah=[55, 60, 63], hi=[60, 63, 67]),
    "Eb": dict(oom=(39, 46), pah=[55, 58, 63], hi=[58, 63, 67]),
    "Gm": dict(oom=(43, 38), pah=[55, 58, 62], hi=[58, 62, 67]),
    "F#o7": dict(oom=(42, 42), pah=[54, 57, 60, 63], hi=[57, 60, 63]),
    "G#o7": dict(oom=(44, 44), pah=[56, 59, 62, 65], hi=[59, 62, 65]),
}
F = I.m2f

# where each section of the music sits (used for the cue sheet and the level automation)
SECTIONS = [
    ("hook", 0.0, T.FLASH), ("town", T.FLASH, 9.0), ("march", 9.0, 15.0), ("bounce", 15.0, 21.0),
    ("whistle", 21.0, 27.43), ("tension", 27.43, 33.0), ("dropout", 33.0, 43.43), ("sway", 43.43, 47.24),
    ("swing", 47.24, 54.0), ("march2", 54.0, 57.83), ("rule", 57.83, 62.0), ("tourists", 62.0, T.DUR),
]


def swingb(b):
    fl = np.floor(b)
    fr_ = b - fl
    return fl + (2 / 3 if fr_ in (0.5, 0.75) else (1 / 3 if fr_ == 0.25 else fr_))


def theme(t_bar1, bars=range(1, 9), transpose=0, pickup=False, swing=False, late=0.0):
    ev = []
    for (b, beat, d, m) in THEME + (PICKUP3 if pickup else []):
        if b == 0 and not pickup:
            continue
        if b != 0 and b not in bars:
            continue
        bb = swingb(beat) if swing else beat
        ev.append((t_bar1 + (b - 1) * 4 * Q + bb * Q + late, d * Q, m + transpose))
    return sorted(ev)


class Band:
    def __init__(self):
        self.tr = {}
        self.send = {}
        self.cues = []

    def track(self, name, send):
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N))
            self.send[name] = send
        return self.tr[name]

    def add(self, name, x, t, p=0.0, g=1.0, send=0.15):
        buf = self.track(name, send)
        place(buf, pan(x, p) if np.ndim(x) == 1 else x, t, g)


R = rng(1831)


def _r():
    return rng(int(R.integers(1 << 30)))


def oompah(b, t_bar, chords, vel=0.6, every=True, pah_vel=0.4, bounce=False, pah=True):
    """tuba on the beats (root/fifth alternating) + after-beat horns on the &s; bounce = octave eighths"""
    for beat in range(4):
        c = CH[chords[beat]]
        t = t_bar + beat * Q
        if bounce:
            lo = c["oom"][0] if c["oom"][0] >= 36 else c["oom"][0] + 12
            b.add("tuba", I.brass(F(lo), 0.2, vel, _r(), "tuba", scoop=-30), t, -0.1)
            b.add("tuba", I.brass(F(lo + 12), 0.16, vel * 0.85, _r(), "tuba", scoop=-45), t + Q / 2, -0.1)
        elif every or beat in (0, 2):
            m = c["oom"][beat % 2] if every else c["oom"][0 if beat == 0 else 1]
            b.add("tuba", I.brass(F(m), 0.3, vel * (1.0 if beat in (0, 2) else 0.88), _r(), "tuba"), t, -0.1)
        if pah:
            if every:
                for k, m in enumerate(c["pah"]):
                    b.add("pah", I.brass(F(m), 0.15, pah_vel, _r(), "horn", scoop=-12), t + Q / 2 + 0.004 * k, 0.32 - 0.12 * k)
            elif beat in (1, 3):
                for k, m in enumerate(c["pah"]):
                    b.add("pah", I.brass(F(m), 0.17, pah_vel, _r(), "horn", scoop=-12), t + 0.004 * k, 0.32 - 0.12 * k)


SN = {
    "light": [1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 1, 1],
    "march": [3, 0, 1, 1, 2, 0, 1, 0, 3, 0, 1, 1, 2, 0, 1, 0],
    "drive": [2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1],
}


def snare_bar(b, t_bar, pat, vel, steps=range(16), cres=0.0):
    for s in steps:
        v = SN[pat][s]
        if not v:
            continue
        t = t_bar + s * Q / 4
        vv = vel * (1 + cres * s / 16) * {1: 0.5, 2: 0.9, 3: 0.95}[v] * R.uniform(0.93, 1.05)
        if v == 3:
            b.add("snare", I.snare(vv * 0.4, _r()), t - 0.026, 0.05)
        b.add("snare", I.snare(vv, _r()), t + R.normal(0, 0.002), 0.05)


def roll(b, t0, t1, v0, v1, accent=None, at=None):
    for t, v in I.snare_roll(t0, t1, v0, v1, _r()):
        b.add("snare", I.snare(v, _r(), dur=0.14, buzz=True), t, 0.05)
    if accent:
        at = t1 if at is None else at
        b.add("snare", I.snare(accent * 0.4, _r()), at - 0.026, 0.05)
        b.add("snare", I.snare(accent, _r()), at, 0.05)


def melody(b, name, notes, vel, transpose=0, fn="glock", p=0.0, gate=0.9):
    for (t, d, m) in notes:
        m = m + transpose
        if fn == "glock":
            x = I.glock(F(m), vel * R.uniform(0.92, 1.05), _r())
        elif fn == "fife":
            x = I.fife(F(m), d * gate, vel * R.uniform(0.94, 1.04), _r())
        elif fn == "vibes":
            x = I.vibes(F(m), vel * R.uniform(0.92, 1.05), _r(), dur=max(1.2, d + 0.8), damp=d + 0.35)
        elif fn == "musicbox":
            x = I.musicbox(F(m), vel * R.uniform(0.92, 1.05), _r())
        b.add(name, x, t, p)


def chorus(b, name, notes, voices, seed, joins=None, falters=None, spread=0.75, vel=1.0, solo_gain=1.0):
    """several soldiers whistling the same tune: own detune, timing, vibrato, breath and place in the column"""
    rr = rng(seed)
    for v in range(voices):
        rv = rng(seed * 101 + v)
        nv = [(t, d, m, vel * rv.uniform(0.85, 1.0)) for (t, d, m) in notes if joins is None or t >= joins[v] - 1e-6]
        if not nv:
            continue
        fal = (falters[v], -rv.uniform(1.2, 3.2)) if falters else None
        t0, y = I.whistle(nv, rv, detune=rv.uniform(-11, 11) if v else 0.0, jit=0.010, lag=rv.uniform(0, 0.022) if v else 0.0,
                          vib_rate=rv.uniform(5.0, 6.6), vib_depth=rv.uniform(10, 22), breath=rv.uniform(0.04, 0.07), falter=fal)
        g = (solo_gain if v == 0 else rv.uniform(0.45, 0.8))
        p = 0.0 if v == 0 else spread * rr.uniform(-1, 1)
        if v:  # the rest of the column is further away: a little duller
            y = lp(y, rv.uniform(5000, 9000), 1)
        b.add(name, y, t0, p, g)


def build():
    b = Band()
    for name, send in [("whistle", 0.0), ("fife", 0.16), ("glock", 0.22), ("tuba", 0.10), ("pah", 0.18), ("snare", 0.13),
                       ("cymbal", 0.16), ("stab", 0.16), ("timpani", 0.18), ("pad", 0.25), ("vibes", 0.26), ("musicbox", 0.26),
                       ("pluck", 0.18), ("brush", 0.12), ("triangle", 0.25)]:
        b.track(name, send)

    # ============ HOOK 0 - 4.33: tutti + whistling column, drum fill under "...across it.", band cut by the white flash,
    # button hit ON the flash (after the last word, so it never masks the hook line)
    h = theme(0.0, bars=[1, 2])
    chorus(b, "whistle", h, 7, 11)
    melody(b, "glock", h, 0.5, 12, "glock", -0.35)
    for bar in (1, 2):
        tb = (bar - 1) * 2.0
        oompah(b, tb, CHB[bar], 0.68, True, 0.42)
        snare_bar(b, tb, "march", 0.62, steps=range(16) if bar == 1 else range(8))
    roll(b, 3.0, 4.28, 0.25, 0.62)
    b.add("cymbal", I.cymbal(0.45, _r()), 0.0, 0.0)
    b.cues.append((0.0, "hook: theme A1-A2 tutti, 7 whistlers, tuba/after-beats/snare; snare fill 3.0-4.3 under 'across it.'"))
    hook_cut = np.ones(N)
    a, z = ns(T.FLASH - 0.03), ns(T.FLASH + 0.015)
    hook_cut[a:z] = np.linspace(1, 0, z - a)
    hook_cut[z:] = 0
    for k in b.tr:
        b.tr[k] *= hook_cut[None, :]
    for m in [46, 53, 58, 62, 65]:
        b.add("stab", I.brass(F(m), 0.2, 0.8, _r(), "stab", scoop=-15), T.FLASH, (m - 56) / 20)
    b.add("tuba", I.brass(F(34), 0.25, 0.8, _r(), "tuba"), T.FLASH, -0.1)
    b.add("glock", I.glock(F(94), 0.6, _r()), T.FLASH, -0.35)
    b.add("cymbal", I.cymbal(0.4, _r(), dur=1.2), T.FLASH, 0.0)
    b.cues.append((T.FLASH, "Bb button + light clash exactly on the white flash (frame 130), then the band is gone"))

    # ============ STORY MARCH 4.5 - 21: band plays theme A (bars at odd seconds so "Then," = 33.0 is a downbeat)
    roll(b, 4.5, 4.96, 0.15, 0.5, accent=0.55, at=5.0)
    s0 = 5.0
    a12 = theme(s0, bars=[1, 2])
    melody(b, "glock", a12, 0.36, 12, "glock", -0.35)
    melody(b, "fife", a12, 0.42, 0, "fife", 0.25)
    for bar in (1, 2):
        tb = s0 + (bar - 1) * 2
        oompah(b, tb, CHB[bar], 0.5, False, 0.34)
        snare_bar(b, tb, "light", 0.36)
    b.cues.append((s0, "story: theme A1-A2 light (glock + fife, tuba on 1/3, horns on 2/4, light snare)"))
    a38 = theme(s0, bars=range(3, 9))
    melody(b, "glock", a38, 0.5, 12, "glock", -0.35)
    melody(b, "fife", a38, 0.58, 0, "fife", 0.25)
    b.add("cymbal", I.cymbal(0.42, _r()), 9.0, 0.0)
    for bar in range(3, 9):
        tb = s0 + (bar - 1) * 2
        oompah(b, tb, CHB[bar], 0.64, True, 0.44, bounce=tb >= 15.0)
        snare_bar(b, tb, "march", 0.58, steps=range(16) if bar < 8 else range(12))
    roll(b, 20.5, 20.96, 0.25, 0.55, accent=0.6, at=21.0)
    b.cues.append((9.0, "full band: theme A3-A8 (cymbal), boots are the bass drum"))
    b.cues.append((15.0, "tuba switches to bouncing octaves as the bridge starts bouncing"))
    # vamp: the band waits for the whistler
    oompah(b, 21.0, ["Bb"] * 4, 0.58, True, 0.38)
    snare_bar(b, 21.0, "light", 0.45)
    b.cues.append((21.0, "vamp bar, no melody: room for 'Somebody starts whistling'"))

    # ============ WHISTLE 22.25 - 29.7: one soldier, then the column joins (23.75+), nervous falter at 29.2-29.7
    w0 = 23.0
    wn = theme(w0, bars=[1, 2, 3], pickup=True) + [(29.0, 1.0, 84)]
    joins = [0.0] + list(np.linspace(23.75, 24.75, 8))
    falters = [29.42, 29.22, 29.3, 29.36, 29.25, 29.5, 29.33, 29.45, 29.28]
    chorus(b, "whistle", wn, 9, 22, joins=joins, falters=falters, spread=0.8, solo_gain=1.05)
    b.cues.append((22.25, "solo whistler: 3-note pickup D-Eb-F into theme A on 23.0 (in Bb, on the beat)"))
    b.cues.append((23.75, "the column joins the whistling (8 more whistlers by 24.75)"))
    b.cues.append((29.22, "whistlers falter one by one (pitch droops, 29.2-29.7): faces turn nervous"))
    b.add("cymbal", I.cymbal(0.3, _r()), w0, 0.0)
    for bar in (1, 2, 3):
        tb = w0 + (bar - 1) * 2
        oompah(b, tb, CHB[bar], 0.6 + 0.04 * bar, True, 0.4 + 0.03 * bar)
        snare_bar(b, tb, "march", 0.52 + 0.06 * bar)

    # ============ TENSION 29 - 33: dominant pedal, chromatic climb, snare drive + roll, DEAD STOP on 33.0
    oompah(b, 29.0, ["F7"] * 4, 0.7, True, 0.5)
    snare_bar(b, 29.0, "march", 0.66, steps=range(8))
    snare_bar(b, 29.0, "drive", 0.55, steps=range(8, 16), cres=0.4)
    climb = [("F7", 31.0), ("F#o7", 31.5), ("Gm", 32.0), ("G#o7", 32.5)]
    for i, (c, t) in enumerate(climb):
        m = CH[c]["oom"][0]
        for k in range(2):
            b.add("tuba", I.brass(F(m), 0.2, 0.7 + 0.05 * i, _r(), "tuba"), t + k * 0.25, -0.1)
        for k, mm in enumerate(CH[c]["pah"]):
            b.add("pah", I.brass(F(mm), 0.14, 0.5 + 0.05 * i, _r(), "horn"), t + 0.25 + 0.004 * k, 0.32 - 0.12 * k)
        for k in range(4):
            b.add("glock", I.glock(F(96 + i), 0.22 + 0.04 * i, _r(), dur=0.5), t + k * Q / 4, -0.35)
    snare_bar(b, 31.0, "drive", 0.6, steps=range(8), cres=0.5)
    roll(b, 32.0, 33.0, 0.45, 1.0)
    stop = np.ones(N)
    a = ns(32.985)
    stop[a:a + ns(0.012)] = np.linspace(1, 0, ns(0.012))
    stop[a + ns(0.012):] = 0
    for k in b.tr:
        if k != "whistle":
            b.tr[k] *= stop[None, :]
    b.cues.append((29.5, "tension: F7 pedal, tuba eighths, snare drive"))
    b.cues.append((31.0, "chromatic climb F7 - F#dim7 - Gm - G#dim7, glock ticking 16ths, snare roll crescendo"))
    b.cues.append((33.0, "DEAD STOP on 'Then,' - music silent through the bolt, the drop and the two-feet-deep joke"))
    late = {}

    # ============ SWAY 43.4 - 47.3: warm pad + vibes pendulum on the bridge's own 0.7 Hz sway (beats at the extremes)
    sway_beats = [43.4 + (0.25 + k / 2) / 0.7 for k in range(5)]
    trem = lambda t0: (lambda t: 1 + 0.1 * np.sin(2 * np.pi * 0.7 * (t + t0 - 43.4)))
    chords = [(43.3, 44.47, [46, 58, 62, 65]), (44.47, 45.9, [46, 55, 63, 67]), (45.9, 46.61, [46, 58, 62, 65]), (46.61, 47.4, [41, 57, 60, 63])]
    for (ta, tb_, ms) in chords:
        b.add("pad", I.pad([F(m) for m in ms], tb_ - ta, 0.55, _r(), att=0.5 if ta < 43.5 else 0.25, rel=0.6, trem=trem(ta)), ta, 0.0)
    for (ta, tb_, ms) in chords:
        b.add("tuba", I.brass(F(ms[0] - 12 if ms[0] > 40 else ms[0]), tb_ - ta - 0.05, 0.32, _r(), "soft", scoop=-8), ta + 0.05, -0.1)
    for tb_, m in zip(sway_beats, [86, 82, 87, 82, 84]):
        b.add("vibes", I.vibes(F(m), 0.5, _r(), dur=1.4, damp=0.7, trem_depth=0.12), tb_, -0.25)
    b.cues.append((43.43, "warm return: pad Bb - Eb/Bb - Bb - F7, soft low brass, vibes pendulum on each sway extreme (84 bpm)"))

    # ============ SWING 47.24 - 54: music-box waltz, one bar per swing cycle, downbeat = each push
    bar_t = [T.PUSH0 + (k - 1) * T.SWING_T for k in range(5)]   # 47.24 intro, then the four pushes
    beat = T.SWING_T / 3
    ch3 = ["Bb", "Bb", "Eb", "F7", "Bb"]
    bass = [46, 46, 39, 41, 46]
    up = [[None, None, 77], [82, 86, 89], [87, 91, 94], [89, 93, 96], [94, None, None]]
    for k, tb_ in enumerate(bar_t):
        b.add("pluck", I.pluck(F(bass[k]), 0.8, _r(), dur=1.0), tb_, -0.05)
        if k < 4:
            for j in (1, 2):
                for mm in CH[ch3[k]]["hi"][1:]:
                    b.add("pluck", I.pluck(F(mm), 0.4, _r(), dur=0.5, bright=0.6), tb_ + j * beat, 0.25)
        for j, m in enumerate(up[k]):
            if m:
                b.add("musicbox", I.musicbox(F(m), 0.62, _r()), tb_ + j * beat, 0.2)
        if k >= 1:
            b.add("triangle", I.triangle(0.35, _r()), tb_, 0.35)
    for j, m in enumerate([98, 101, 106]):  # "higher and higher": music-box run up into the march
        b.add("musicbox", I.musicbox(F(m), 0.5 + 0.08 * j, _r()), 53.62 + 0.13 * j, 0.2)
    for (ta, tb_, ms) in [(47.1, 50.34, [58, 62, 65]), (50.34, 51.89, [58, 63, 67]), (51.89, 53.44, [57, 60, 63]), (53.44, 54.05, [58, 62, 65])]:
        b.add("pad", I.pad([F(m) for m in ms], tb_ - ta, 0.32, _r(), att=0.3, rel=0.4), ta, 0.0)
    b.cues.append((47.24, "music-box waltz (116 bpm, 3/4): one bar per swing cycle, pizzicato oom-pah-pah"))
    b.cues.append((48.79, "pushes 48.79 / 50.34 / 51.89 / 53.44 = downbeats (tiny triangle ting), melody climbs each bar"))
    b.cues.append((53.62, "music-box run up 'higher and higher' into the march"))

    # ============ MARCH 2 54 - 57.5: golden, soft, the column whistles again
    m2 = theme(54.0, bars=[1, 2])
    m2 = [n for n in m2 if n[0] < 57.6]
    chorus(b, "whistle", m2, 6, 54, spread=0.7, vel=0.8, solo_gain=0.8)
    melody(b, "glock", m2, 0.32, 12, "glock", -0.35)
    b.add("cymbal", I.cymbal(0.22, _r()), 54.0, 0.0)
    for bar in (1, 2):
        tb = 54.0 + (bar - 1) * 2
        oompah(b, tb, CHB[bar], 0.48, False, 0.32)
        snare_bar(b, tb, "light", 0.32, steps=range(16) if bar == 1 else range(12))
    b.cues.append((54.0, "march returns soft and golden, 6 whistlers, theme A1-A2"))

    # ============ RULE 58.9 - 62: snare roll into brass stabs + timpani on the three hammer blows (I - V - I)
    roll(b, 58.85, 59.77, 0.12, 0.55)
    roll(b, 60.5, 61.67, 0.1, 0.6)
    stabs = [(T.HITS[0], [46, 53, 58, 62, 65], 46, 0.7), (T.HITS[1], [41, 53, 57, 60, 65], 41, 0.72), (T.HITS[2], [46, 53, 58, 62, 65, 70], 46, 0.75)]
    for (th, ms, tm, v) in stabs:
        for m in ms:
            b.add("stab", I.brass(F(m), 0.18, v, _r(), "stab", scoop=-12), th, (m - 56) / 22)
        b.add("timpani", I.timpani(F(tm), v, _r()), th, -0.1)
    b.add("cymbal", I.cymbal(0.25, _r(), dur=1.2), T.HITS[2], 0.0)
    b.cues.append((58.85, "snare roll pp-mf into the rule"))
    b.cues.append((T.HITS[0], "brass stab Bb + timpani on hammer blow 1 ('rule'), F on blow 2 ('Never'), Bb + cymbal on blow 3 ('step')"))

    # ============ TOURISTS 62 - 67.5: lazy swung version, vibes melody laid back, walking pizz bass, brushes
    tn = theme(62.0, bars=[1, 2], swing=True, late=0.025)
    tn += [(66.0 + 0.025, Q, 82), (66.5 + 0.025, Q / 2, 77), (66.5 + Q * 2 / 3 + 0.025, Q / 2, 74), (67.0 + 0.02, 0.5, 70)]
    melody(b, "vibes", tn, 0.6, 0, "vibes", -0.25)
    walk = [46, 50, 53, 50, 41, 45, 46, 48, 46, 41, 34]
    for k, m in enumerate(walk):
        b.add("pluck", I.pluck(F(m), 0.85 if k < 10 else 0.95, _r(), dur=0.9 if k < 10 else 0.6), 62.0 + k * Q, -0.05)
    for k in range(10):
        t = 62.0 + k * Q
        b.add("brush", I.brush(0.55 if k % 2 else 0.35, _r(), dur=0.42, swish=True), t - 0.05, 0.1)
        b.add("brush", I.brush(0.35, _r()), t + Q * 2 / 3, 0.15)
    for (t, c) in [(62.5, "Bb"), (63.5, "Bb"), (64.5, "F"), (65.5, "Bb")]:
        for mm in CH[c]["hi"]:
            b.add("vibes", I.vibes(F(mm), 0.22, _r(), dur=0.9, damp=0.3, trem_depth=0.2), t + 0.02, 0.3)
    for mm in [58, 62, 65, 70]:
        b.add("vibes", I.vibes(F(mm), 0.32, _r(), dur=0.6, damp=None, trem_depth=0.3), 67.0, 0.2)
    b.add("triangle", I.triangle(0.25, _r(), dur=0.5), 67.0, 0.3)
    b.cues.append((62.0, "relaxed tourist version: swung, laid-back vibes melody, walking pizzicato bass, brushes"))
    b.cues.append((67.0, "final Bb chord on 'tourists' (66.72-67.24), rings out, faded to silence at 67.5"))
    end = np.ones(N)
    a = ns(67.3)
    end[a:] = np.linspace(1, 0, N - a) ** 1.5
    for k in b.tr:
        b.tr[k] *= end[None, :]
    return b


TARGET = {  # relative balance inside the band (LU, measured on each track's own active span)
    "whistle": 0.0, "fife": -3.0, "glock": -6.0, "tuba": -2.5, "pah": -7.5, "snare": -5.5, "cymbal": -11.0,
    "stab": -3.0, "timpani": -5.0, "pad": -3.5, "vibes": -2.0, "musicbox": -1.5, "pluck": -4.0, "brush": -13.0, "triangle": -15.0,
}


def render(b, ref=-20.0):
    hall = make_ir(1.5, 7, pre=0.018, hf=1.4)
    yard = make_ir(0.9, 8, pre=0.008, hf=1.8, early=[(0.11, 0.5, -0.4), (0.19, 0.35, 0.5)])
    dry = np.zeros((2, N))
    wet_hall = np.zeros((2, N))
    wet_yard = np.zeros((2, N))
    levels = {}
    for k, x in b.tr.items():
        if not np.any(x):
            continue
        L = integrated(x)
        g = dbg(ref + TARGET.get(k, -6) - L)
        levels[k] = (round(L, 1), round(ref + TARGET.get(k, -6), 1))
        x = x * g
        b.tr[k] = x
        dry += x
        if k == "whistle":
            wet_yard += 0.16 * x
        else:
            wet_hall += b.send[k] * x
    out = dry + 0.7 * convolve_st(wet_hall.mean(0), hall) + 0.8 * convolve_st(wet_yard.mean(0), yard)
    out = hp(out, 30, 2)
    return out, levels
