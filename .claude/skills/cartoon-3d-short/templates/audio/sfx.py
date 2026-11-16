# Every sound effect + ambience bed of the bridge short as a cue list timed to the picture (timeline.py), rendered
# into one stereo SFX stem. Levels follow the user's standard mix: each EVENT has a "naive" level (LU relative to the
# voice stem, measured as the event's max momentary loudness) and is placed SFX_DB = -6 dB under it; ambience BEDS
# (integrated loudness) are not reduced. Distance to the camera adds gain, a low-pass and more valley reverb.
import math
import numpy as np
from dsp import (SR, ns, tt, rng, dbg, lp, hp, bp, peq, shelf, pan, st, place, fades, widen, make_ir, convolve_st,
                 momentary_max, integrated, colored, smooth_noise, modal)
import sfx_gen as G
import timeline as T

N = ns(T.DUR)
SFX_DB = -6.0


class Cue:
    def __init__(self, t, name, desc, gen, naive, kind="event", p=0.0, extra=0.0, lpf=None, send=0.12, group=None, cut=None):
        self.t, self.name, self.desc, self.gen, self.naive = t, name, desc, gen, naive
        self.kind, self.p, self.extra, self.lpf, self.send, self.cut = kind, p, extra, lpf, send, cut
        self.group = group or name
        self.applied = naive + (SFX_DB if kind == "event" else 0.0) + extra
        self.measured = None


def cues():
    C = []
    R = rng(1831)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append

    # ------------------------------------------------ ambience beds (not reduced by the -6 dB event rule)
    def amb_day(dur, river=0.5, flags=0.25, seed=1):
        def g():
            r = rng(seed)
            n = ns(dur)
            x = G.breeze(dur, r, 1.0, 0.15, 850)
            rv = bp(colored(n, r, 0.8), 180, 1800, 1) * river * (0.8 + 0.2 * smooth_noise(n, r, 0.3))
            x += st(rv)
            x += pan(G.bird_chirps(dur, r, 0.45, "sparrow") * 0.08, 0.5)
            x += pan(G.bird_chirps(dur, r, 0.3, "sparrow") * 0.05, -0.6)
            x += pan(G.flag_flutter(dur, r) * flags, 0.3)
            return fades(x, 0.4, 0.6), 0.0
        return g
    add(Cue(0.0, "amb_day", "daytime valley air: breeze, river below, sparrows, tower flags (shots 1-8)", _cut(amb_day(37.2, 0.55), 37.2, 0.4, 0.5),
            -30, "bed", send=0.0))
    wd = T.shot_t(11)[0] + T.XFADE[11] / T.FPS - T.DROP1          # from the impact to the end of the crossfade into shot 11
    add(Cue(T.DROP1, "amb_water", "river right around the soldiers sitting in it: flow, babble, lapping, sloshes, drips (shots 9-10)",
            _env(lambda: (G.water_bed(wd, rng(41), 1.0, 0.9), 0.0), wd, 0.35, 0.3), -19, "bed", send=0.0))
    add(Cue(43.3, "amb_golden", "golden-hour calm: soft breeze, blackbird phrases, faint crickets, distant river (shots 11-13)",
            _env(lambda: (_golden(14.65, rng(43)), 0.0), 14.65, 0.5, 0.4), -29, "bed", send=0.0))
    add(Cue(57.7, "amb_bank", "river bank: river close by, breeze, sparrows (shot 14)", _cut(amb_day(4.5, 1.3, 0.0, seed=44), 4.5, 0.25, 0.35),
            -26, "bed", send=0.0))
    add(Cue(61.95, "amb_town", "town day air on the rebuilt bridge: breeze, sparrows, flags, river (shot 15)", _cut(amb_day(5.55, 0.45, 0.3, seed=45), 5.55, 0.3, 0.05),
            -29, "bed", send=0.0))

    # ------------------------------------------------ marching column: one stomp per footfall while it is on screen
    for (t, shot, tau, foot) in T.footfalls():
        d = T.column_distance(t)
        g, lpf, send = T.dist_fx(d)
        inten = T.stomp(tau)
        a = T.amp(tau) / 0.55
        r = rr()
        cut = T.FLASH + 0.02 if shot == 1 else None      # the hook is a flash-forward: everything stops on the white flash
        if shot == 1 and t >= 3.5:
            g -= 3.0                                     # keep "...walking across it." on top

        def gen(r=r, inten=inten, foot=foot, d=d):
            x, pre = G.column_stomp(r, inten, foot, width=float(np.clip(5.0 / d, 0.15, 1.0)), boom_gain=0.6)
            return peq(x, 2400, 5.0, 0.7), pre
        add(Cue(t, "stomp", f"74 boots in step (shot {shot}, cam {d:.0f} m, stomp x{inten:.2f})", gen, -8,
                extra=max(g, -13.0) + 20 * math.log10(inten), lpf=lpf, send=send, group="stomps", cut=cut))
        if a > 0.02 and tau < T.SNAP:
            lvl = 6 * math.log10(min(a, 1.0))
            add(Cue(t, "deck_flex", f"deck flex whump + plank creak + hangers (bounce amp {T.amp(tau):.2f})",
                    (lambda r=r, a=a: (G.deck_flex(r, min(a, 1.0)), 0.0)), -10, extra=max(g, -13.0) * 0.6 + lvl, lpf=lpf, send=send,
                    group="deck", cut=cut))
    add(Cue(16.0, "bounce_first", "first big flex 'boing' + long plank groan - the bridge starts bouncing (faces react 16.17)",
            lambda: (G.deck_flex(rng(160), 0.9) + st(np.pad(G.creak(0.55, rng(161), 60, 140, G.TIMBER, rough=0.2) * 0.8, (0, ns(0.2)))), 0.0),
            -10, extra=-4, lpf=11000, send=0.18))

    # ------------------------------------------------ hook extras (shot 1 is the flash-forward at tau 29.5-33.8)
    add(Cue(0.0, "chain_groan_hook", "chains groaning under the bouncing column (hook)",
            lambda: (G.chain_groan(4.3, rng(11), 0.55, 0.8, 26, 34, beats=[k * 0.5 for k in range(9)])
                     * np.interp(tt(4.3), [0, 3.55, 4.1, 4.3], [1, 1, 0.5, 0.5]), 0.0), -10, p=-0.3, send=0.15))
    for tm, nm in [(T.fr(48), "push-in to the boots"), (T.fr(88), "push-in, boot level")]:
        add(Cue(tm, "whoosh_cam", f"camera {nm}", (lambda r=rr(): (G.whoosh(0.45, r, 0.07, 400, 2400, 0.8, 0.13, 0.2), 0.07)), -12, send=0.1))
    add(Cue(T.FLASH, "flash_whoosh", "reverse swell into the white flash (frame 130) + soft low whoomp",
            lambda: _flash(rng(130)), -5, send=0.2))

    # ------------------------------------------------ town crowd (shot 2)
    add(Cue(T.FLASH, "crowd_murmur", "townsfolk on both banks: murmur of ~22 voices, a few early hurrahs (shot 2)",
            lambda: (_murmur(6.0, rng(21), 22, early=True), 0.0), -10, lpf=3600, send=0.35))
    add(Cue(7.6, "crowd_cheer", "townsfolk cheer on 'pride of the whole town': hurrahs, kids, applause swell",
            lambda: (_cheer(3.4, rng(22)), 0.0), -6, lpf=5000, send=0.35))

    # ------------------------------------------------ camera-move / transition whooshes (ease-out bursts)
    for f, desc in [(283, "wide -> low front of the column"), (444, "cut to the side view"), (534, "swing round to the faces"),
                    (643, "push to the whistler's face"), (717, "crane up over the column"), (823, "low wide from behind"),
                    (987, "whip to the anchor bolt"), (1062, "crane out over the bridge"), (1685, "drift in (golden march)"),
                    (1770, "move to the sign"), (1905, "move along the tourists"), (1962, "crane out, ending")]:
        add(Cue(T.fr(f), "whoosh_cam", f"camera {desc}", (lambda r=rr(): (G.whoosh(0.6, r, 0.09, 330, 2000, 0.8, 0.18, 0.15), 0.09)),
                -11, send=0.12))
    for f, desc in [(1303, "crossfade to golden light"), (1411, "crossfade to the park"), (1620, "crossfade back to the bridge"),
                    (1735, "crossfade to the bank"), (1863, "crossfade to the rebuilt bridge")]:
        add(Cue(T.fr(f), "whoosh_xfade", desc, (lambda r=rr(): (G.whoosh(0.8, r, 0.32, 300, 1600, 0.9, 0.22, 0.1), 0.32)), -12, send=0.15))

    # ------------------------------------------------ chains + bolt (shots 7-8)
    beats = [k * 0.5 for k in range(58, 70)]
    add(Cue(28.9, "chain_groan", "suspension chains groaning, rising in pitch and strength with each footfall (28.9 -> snap)",
            lambda: (G.chain_groan(T.SNAP + 0.03 - 28.9, rng(29), 0.45, 1.0, 20, 46, beats=beats, t0=28.9), 0.0), -6, p=-0.35, send=0.12))
    add(Cue(29.95, "chain_groan_swell", "chains groan out loud right after the word 'groaning,' (swells on footfalls 30.0 + 30.5)",
            lambda: (G.chain_groan(1.1, rng(295), 0.9, 1.0, 22, 30, beats=[30.0, 30.5], t0=29.95), 0.0), -4, p=-0.35, send=0.15))
    for k, tm in enumerate([33.0, 33.5, 34.0, 34.5]):
        add(Cue(tm, "bolt_strain", f"bolt jerks with the footfall: metal strain creak {k + 1}/4 (close-up)",
                (lambda r=rr(), a=0.5 + 0.17 * k: (G.bolt_strain(r, a), 0.0)), -12 + k, p=-0.15, send=0.05, group="bolt_strain"))
    for tm in (T.SNAP - 0.31, T.SNAP - 0.15, T.SNAP - 0.05):
        add(Cue(tm, "bolt_tick", "metal fatigue tick", (lambda r=rr(): (G.clink(r, r.uniform(2600, 3600), 0.1), 0.0)), -14, p=-0.15, send=0.05,
                group="bolt_strain"))
    add(Cue(T.SNAP, "bolt_snap", "BOLT SNAPS: crack + two halves ringing as they fly (Doppler drop) + release thunk + chain jolt",
            lambda: (G.bolt_snap(rng(3462)), 0.0), 0, p=-0.2, send=0.18))
    add(Cue(T.SNAP, "chain_whip", "snapped backstay whips up: swish + rattle along the chain + clank as it flops",
            lambda: (G.chain_whip(rng(3463)), 0.0), -4, p=-0.4, send=0.2))
    for tm, pp in [(T.SNAP + 0.93, -0.5), (T.SNAP + 1.05, 0.1)]:
        add(Cue(tm, "bolt_land", "bolt half lands on the bank: tink, tink-tink", (lambda r=rr(): (_bounces(r), 0.0)), -16, p=pp, send=0.25))
    add(Cue(T.SNAP + 0.25, "column_halt", "column stops dead: boots scuff and shuffle", lambda: (_scuffle(rng(3487)), 0.0), -16, lpf=7000, send=0.25))

    # ------------------------------------------------ the drop (36.35) and the hit (36.95)
    add(Cue(T.DROP0 - 0.55, "timber_tear", "near half tears loose: huge timber creak + splintering that peaks as it lets go (DROP0 36.35)",
            lambda: (G.timber_tear(rng(3620), 0.62), 0.0), -6, p=0.1, send=0.2))
    add(Cue(T.DROP1, "fall_air", "air rush of the falling deck (accelerating DROP0 36.35 -> DROP1 36.95)",
            lambda: (G.whoosh(T.DROP1 - T.DROP0 + 0.06, rng(3635), T.DROP1 - T.DROP0, 220, 1300, 1.0, 0.05, 0.1), T.DROP1 - T.DROP0), -8, send=0.1))
    add(Cue(T.DROP1, "wood_crack", "deck slams the water: splintering crack + timber boom", lambda: (G.wood_crack(rng(3695)), 0.0), -4, send=0.15))
    add(Cue(T.DROP1, "splash_big", "BIG SPLASH: thump, slap, water body, bubble cloud, spray raining back (6 sources along the deck)",
            lambda: (_splashes(rng(3696)), 0.0), -2, send=0.15))
    add(Cue(T.DROP1 + 0.02, "oofs", "74 men landing in two feet of water: a dozen 'oof' / 'ugh' / 'oh' / 'ow'",
            lambda: (_oofs(rng(3697)), 0.0), -4, send=0.18))
    add(Cue(T.DROP1 + 0.1, "debris", "planks and kit clattering into the shallows", lambda: (_debris(rng(3705)), 0.0), -12, send=0.25))
    # shot 10 ("Unluckily..."): the same soldiers, hurt - a few real pained groans, the first one in the gap before the line
    add(Cue(40.42, "groans", "hurt soldiers sitting in the shallows: 'ugh' / 'ow' groans",
            lambda: (_groans(rng(4042), [(0.0, "ugh", 1.0), (0.09, "ow", 0.7), (0.2, "ugh", 0.5)]), 0.0), -12, lpf=5000, send=0.2,
            group="groans"))
    for tm, kd in [(41.95, "ow"), (42.7, "ugh")]:
        add(Cue(tm, "groans", "another groan from the river", (lambda r=rr(), kd=kd: (_groans(r, [(0.0, kd, 1.0)]), 0.0)), -18, lpf=4500,
                send=0.25, group="groans"))

    # ------------------------------------------------ sway (shot 11): the bridge on its own, 0.7 Hz
    for k in range(5):
        tm = 43.4 + (0.25 + k / 2) / 0.7
        add(Cue(tm, "sway_creak", "the bridge sways by itself (0.7 Hz): long soft creak at each extreme",
                (lambda r=rr(): (G.creak(0.55, r, 55, 95, G.TIMBER, [(0, 0), (0.4, 1), (0.8, 0.6), (1, 0)], 0.2, 0.04) * 0.8, 0.12)), -12,
                p=0.2 if k % 2 else -0.2, lpf=7000, send=0.3, group="sway_creak"))

    # ------------------------------------------------ swing (shot 12): squeak through each swing, push on each downbeat
    for k in range(-2, 7):
        tm = T.PUSH0 + 0.3875 + k * 0.775
        if tm > 53.95:
            continue
        a = T.swing_amp_deg(tm) / 50.0
        add(Cue(tm, "swing_squeak", f"swing hanger squeak ({'forward' if k % 2 == 0 else 'back'}, arc {T.swing_amp_deg(tm):.0f} deg)",
                (lambda r=rr(), a=a, fw=(k % 2 == 0): (G.swing_squeak(r, a, fw), 0.12 + 0.1 * a)), -12, extra=8 * math.log10(max(a, 0.12)),
                p=0.15, send=0.2, group="swing_squeak"))
    for k, tm in enumerate(T.PUSHES):
        add(Cue(tm, "swing_push", f"push {k + 1}/4: hands on the back + chain jingle", (lambda r=rr(): (G.push_thump(r), 0.0)), -14, p=0.1,
                send=0.15, group="swing_push"))

    # ------------------------------------------------ the rule (shot 14): hammer on the sign
    for k, th in enumerate(T.HITS):
        big = 1.0 if k < 2 else 1.25
        add(Cue(th - 0.09, "hammer_swish", "hammer swing", (lambda r=rr(): (G.whoosh(0.18, r, 0.08, 600, 2500, 0.6, 0.04, 0.2), 0.08)), -20,
                p=0.3, send=0.1, group="hammer"))
        add(Cue(th, "hammer", f"hammer blow {k + 1}/3 nailing the sign: steel 'tink' + board 'thock' + post", (lambda r=rr(), big=big: (G.hammer_hit(r, big), 0.0)),
                -5 if k < 2 else -4, p=0.3, send=0.22, group="hammer"))

    # ------------------------------------------------ tourists (shot 15): out-of-step strolling + light town murmur
    for (t, i, x, z, sp) in T.tourist_steps():
        if t < 61.97 or t > T.DUR - 0.05:
            continue
        cam = T.tourist_cam(t)
        d = float(np.linalg.norm(cam - np.array([x, 6.0, z])))
        g, lpf, send = T.dist_fx(d)
        pp = float(np.clip(-(x - cam[0]) / max(d, 1) * 1.6, -0.8, 0.8))
        add(Cue(t, "stroll_step", "tourist footstep, out of step (24 strollers, own pace each)",
                (lambda r=rr(): (shelf(G.stroll_step(r, r.uniform(0.2, 1.0)), 1500, 4.0, "high"), 0.0)),
                -9, p=pp, extra=max(g, -8.0) + float(R.uniform(-2, 1)), lpf=lpf, send=send, group="stroll_steps"))
    add(Cue(62.0, "town_murmur", "townsfolk chatting on the banks (shot 15)", lambda: (_murmur(5.5, rng(62), 14, early=False), 0.0), -11,
            lpf=3200, send=0.35))
    return C


# ================================================================ helpers for composite cues
def _cut(gen, dur, fin, fout):
    def g():
        x, a = gen()
        return fades(x, fin, fout), a
    return g


def _env(gen, dur, fin, fout):
    return _cut(gen, dur, fin, fout)


def _golden(dur, r):
    n = ns(dur)
    x = G.breeze(dur, r, 0.7, 0.1, 650)
    x += st(lp(bp(colored(n, r, 0.8), 150, 1400, 1), 1200) * 0.35)
    x += pan(G.bird_chirps(dur, r, 0.35, "blackbird") * 0.06, -0.5)
    x += pan(G.bird_chirps(dur, r, 0.25, "blackbird") * 0.04, 0.6)
    x += widen(G.crickets(dur, r, 3) * 0.008, r, 9, 1.0)
    return x


def _flash(r):
    dur = 0.75
    y = G.whoosh(dur, r, 0.33, 500, 4200, 0.9, 0.09, 0.4)
    t = tt(dur)
    boom = np.where(t > 0.33, np.exp(-(t - 0.33) / 0.12) * np.sin(2 * np.pi * 62 * (t - 0.33)), 0) * 0.8
    return widen(y + boom, r, 12, 0.9), 0.33


def _murmur(dur, r, voices, early=False):
    n = ns(dur)
    out = np.zeros((2, n))
    for v in range(voices):
        kind = r.uniform()
        base, scale = ((r.uniform(95, 140), r.uniform(0.95, 1.05)) if kind < 0.45 else
                       (r.uniform(175, 235), r.uniform(1.12, 1.2)) if kind < 0.85 else (r.uniform(260, 330), r.uniform(1.25, 1.35)))
        y = G.babble(dur, r, base, scale, r.uniform(3.6, 4.8), r.uniform(0.55, 0.8), fmax=3400)
        y = lp(y, r.uniform(2200, 3600), 1) * r.uniform(0.3, 1.0)
        out += pan(y, r.uniform(-0.85, 0.85))
    if early:
        for k in range(4):
            h = G.hurrah(r, r.uniform(110, 230), r.uniform(1.0, 1.18))
            place(out, pan(lp(h, 3000, 1) * 0.5, r.uniform(-0.8, 0.8)), r.uniform(0.2, 1.6))
    return fades(out, 0.25, 0.8)


def _cheer(dur, r):
    n = ns(dur)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for v in range(26):
        kid = v % 6 == 5
        base = r.uniform(270, 340) if kid else (r.uniform(105, 160) if v % 2 else r.uniform(180, 250))
        scale = 1.3 if kid else (1.0 if v % 2 else 1.15)
        for rep in range(1 + int(r.uniform() < 0.4)):
            h = G.hurrah(r, base * r.uniform(0.97, 1.05), scale, kid)
            tm = r.uniform(0.25, 1.1) + rep * r.uniform(0.75, 1.0)
            place(out, pan(lp(h, 4000, 1) * r.uniform(0.35, 1.0), r.uniform(-0.9, 0.9)), tm)
    env = np.interp(t, [0, 0.4, 1.0, 1.9, 3.4], [0.0, 0.5, 1.0, 0.75, 0.0])
    out += G.applause(dur, r, 40, env) * 0.9
    return fades(out, 0.05, 0.5)


def _bounces(r):
    y = np.zeros(ns(0.6))
    for k, (tm, a) in enumerate([(0.0, 1.0), (0.11, 0.45), (0.19, 0.25), (0.24, 0.12)]):
        c = G.clink(r, r.uniform(2600, 3400), 0.12) * a
        y[ns(tm): ns(tm) + len(c)] += c[: len(y) - ns(tm)]
    return y


def _scuffle(r):
    y = np.zeros((2, ns(0.6)))
    for k in range(18):
        s = G.stroll_step(r, r.uniform(0.6, 1.2)) * r.uniform(0.3, 1.0)
        place(y, pan(s, r.uniform(-0.6, 0.6)), r.uniform(0, 0.3))
    return y


def _whoas(r):
    out = np.zeros((2, ns(0.75)))
    for v in range(9):
        w = G.whoa(r, dur=r.uniform(0.35, 0.5))
        place(out, pan(w * r.uniform(0.4, 1.0), r.uniform(-0.8, 0.8)), r.uniform(0.0, 0.18))
    return out


def _splashes(r):
    out = np.zeros((2, ns(2.8)))
    for k, (p, g, dt) in enumerate([(0.0, 1.0, 0.0), (-0.55, 0.75, 0.025), (0.5, 0.7, 0.04), (-0.3, 0.55, 0.06), (0.35, 0.5, 0.075), (0.75, 0.35, 0.09)]):
        s = G.splash_big(r)
        if k:
            s = lp(s, 9000, 1)
        place(out, pan(s * g, p), dt)
    return out


def _oofs(r):
    out = np.zeros((2, ns(0.9)))
    kinds = ["oof", "oof", "ugh", "oh", "oof", "ow", "ugh", "oof", "oh", "oof", "ugh", "ow"]
    for v, k in enumerate(kinds):
        o = G.oof(r, k)
        tm = abs(r.normal(0.06, 0.08)) + (0.0 if v < 5 else 0.1)
        place(out, pan(o * r.uniform(0.45, 1.0), r.uniform(-0.85, 0.85)), min(tm, 0.45))
    return out


def _groans(r, parts):
    out = np.zeros((2, ns(0.9)))
    for tm, kd, g in parts:
        o = G.oof(r, kd, base=r.uniform(90, 125), scale=r.uniform(0.95, 1.05))
        place(out, pan(o * g, r.uniform(-0.6, 0.6)), tm)
    return out


def _debris(r):
    out = np.zeros((2, ns(1.2)))
    for k in range(7):
        knock = modal(0.3, [(r.uniform(180, 320), 1.0, 0.04), (r.uniform(450, 900), 0.6, 0.02), (r.uniform(1200, 2400), 0.3, 0.01)], r)
        sp = G.bubbles(0.3, r, 120, 400, 2200, (0.005, 0.02), np.exp(-tt(0.3) / 0.08)) * 0.5
        place(out, pan((knock + sp) * r.uniform(0.3, 1.0), r.uniform(-0.8, 0.8)), r.uniform(0, 0.8))
    return out


# ================================================================ render
def render(v_ref, on_event=None):
    """v_ref = integrated loudness of the voice stem (stereo). Returns (stereo stem, cue list with measured levels).
    on_event(cue, x, t0) is called with every placed (dry) event, for analysis."""
    C = cues()
    out = np.zeros((2, N))
    send = np.zeros(N)
    for c in C:
        x, anchor = c.gen()
        x = np.asarray(x, float)
        x = pan(x, c.p) if x.ndim == 1 else x
        if c.cut is not None:
            k = ns(c.cut - (c.t - anchor))
            if 0 < k < x.shape[1]:
                x = fades(x[:, :k], 0.0, 0.02)
        tgt = v_ref + c.applied
        cur = momentary_max(x) if c.kind == "event" else integrated(x)
        if np.isfinite(cur):
            x = x * dbg(tgt - cur)
        if c.lpf:
            x = lp(x, c.lpf, 1)
        c.measured = momentary_max(x) - v_ref if c.kind == "event" else integrated(x) - v_ref
        t0 = c.t - anchor
        place(out, x, t0)
        if on_event:
            on_event(c, x, t0)
        if c.send > 0:
            G._place_mono(send, c.send * x.mean(0), t0)
    valley = make_ir(1.1, 77, pre=0.01, hf=1.6, early=[(0.09, 0.45, -0.5), (0.14, 0.3, 0.6), (0.23, 0.2, -0.2)])
    out += 0.55 * convolve_st(send, valley)
    out = hp(out, 25, 2)
    end = ns(T.DUR - 0.12)
    out[:, end:] *= np.linspace(1, 0, N - end)[None, :] ** 2
    return out, C
