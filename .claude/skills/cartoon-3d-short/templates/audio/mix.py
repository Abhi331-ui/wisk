# Final mix of "The Bridge That Fell for a Song": the voice (gain only) + original march score (ducked under speech,
# per-section level automation relative to the voice) + synthesized SFX stem. Master gain to -15 LUFS integrated,
# own 4x-oversampled look-ahead limiter for <= -1 dBTP, exactly 67.500 s / 48 kHz / stereo / 24-bit.
# Writes mix.wav + stem_voice/music/sfx.wav (at mix gain, pre-limiter), cues.md (every SFX event, music map,
# loudness report). Rendered stems are cached in _cache/ so a crash never costs a full re-render.
import os
import sys
import time
import json
import subprocess
import numpy as np
from scipy import ndimage, signal
from dsp import (SR, ns, st, dbg, read_wav, write_wav, integrated, momentary, momentary_max, short_term, lra, true_peak, fades)
import timeline as T

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "_cache")
N = ns(T.DUR)                    # 3,240,000 samples = 67.500 s
TARGET_LUFS = -15.0
CEIL_DBTP = -1.2                 # limiter ceiling (spec: true peak <= -1 dBTP)
DUCK_DB = -3.0                   # music dip while the voice speaks (key = words.json, not the audio)

# music level per section, LU relative to the voice in that section (after ducking); "+3 dB music" standard
# (user standard: bed -10 instead of the old -13; sway/swing deliberately softer and warmer, rule/tourists leave room
# for the hammer blows and the strolling footsteps)
MUSIC_TARGET = {"hook": -9.5, "town": -10.5, "march": -10.0, "bounce": -10.0, "whistle": -9.5, "tension": -10.0,
                "sway": -12.0, "swing": -11.5, "march2": -10.5, "rule": -11.5, "tourists": -11.0}

# music rides (start, end, dB): keep the quiet sentence-final words on top; the band blooms again in the gap after them
DIPS = [(3.65, 4.30, -3.0),     # hook fill under "...walking across it."
        (26.95, 27.36, -2.0),   # whistling column under "...every step."
        (32.20, 32.77, -4.0),   # tension crescendo under "...breaks step." -> blooms into the dead stop before "Then,"
        (61.25, 61.98, -3.0)]   # rule roll under "...in step." 

# report sections = shots
_s = lambda i: T.shot_t(i)
REPORT = [("hook (1)", 0.0, _s(1)[1]), ("town (2)", *_s(2)), ("march (3)", *_s(3)), ("bounce (4-5)", _s(4)[0], _s(5)[1]),
          ("whistle (6)", *_s(6)), ("groan (7)", *_s(7)), ("snap+fall (8)", *_s(8)), ("water (9-10)", _s(9)[0], _s(10)[1]),
          ("sway (11)", *_s(11)), ("swing (12)", *_s(12)), ("march2 (13)", *_s(13)), ("rule (14)", *_s(14)),
          ("tourists (15)", _s(15)[0], T.DUR)]


def log(*a):
    print(f"[{time.strftime('%H:%M:%S')}]", *a, flush=True)


def cached(name, fn):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, name + ".npy")
    if os.path.exists(p):
        log("cache hit", name)
        return np.load(p).astype(np.float64)
    x = fn()
    np.save(p, np.asarray(x, np.float32))
    return x


# ================================================================ voice
def load_voice():
    x, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    assert sr == SR, sr
    v = x[0] if x.shape[0] == 1 else x.mean(0)
    out = np.zeros(N)
    out[: min(N, len(v))] = v[:N]
    return st(out)


def speech_spans(words, merge=0.3):
    sp = []
    for w in words:
        s, e = float(w["s"]), float(w["e"])
        if sp and s - sp[-1][1] < merge:
            sp[-1][1] = max(sp[-1][1], e)
        else:
            sp.append([s, e])
    return sp


def duck_db(spans, depth=DUCK_DB, pre=0.08, post=0.12, att=0.07, rel=0.45):
    ctrl = 1000
    nc = int(T.DUR * ctrl) + 2
    va = np.zeros(nc)
    for s, e in spans:
        va[max(0, int((s - pre) * ctrl)): int((e + post) * ctrl)] = 1.0
    ka, kr = 1 - np.exp(-1 / (att * ctrl)), 1 - np.exp(-1 / (rel * ctrl))
    env = np.zeros(nc)
    e = 0.0
    for i in range(nc):
        tgt = va[i]
        e += (tgt - e) * (ka if tgt > e else kr)
        env[i] = e
    return np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, depth * env)


# ================================================================ music level automation
def section_db(m_ducked, v):
    import music
    secs = music.SECTIONS
    gains = {}
    for name, a, b in secs:
        if name == "dropout":
            continue
        seg = slice(ns(a), ns(b))
        Lm, Lv = integrated(m_ducked[:, seg]), integrated(v[:, seg])
        gains[name] = (Lv + MUSIC_TARGET[name] - Lm) if np.isfinite(Lm) else 0.0
    gains["dropout"] = gains["tension"]          # the dead stop's hall tail decays at the tension level
    # switch points: music is silent at the flash cut and at the end of the dropout, so those switch instantly
    pts = []
    for i, (name, a, b) in enumerate(secs):
        pts.append((a, gains[name]))
    curve = np.zeros(N)
    t = np.arange(N) / SR
    for i, (a, g) in enumerate(pts):
        a_eff = 43.1 if secs[i][0] == "sway" else a
        curve[t >= a_eff] = g
    # smooth the steps that fall inside music (0.4 s), keep the silent ones (flash, end of dropout) hard
    sm = ndimage.uniform_filter1d(curve, ns(0.4), mode="nearest")
    hard = np.zeros(N, bool)
    for tb in (T.FLASH, 43.1):
        hard[ns(tb - 0.25): ns(tb + 0.25)] = True
    curve = np.where(hard, curve, sm)
    for a, b, db in DIPS:
        d = np.zeros(N)
        d[ns(a): ns(b)] = db
        curve += ndimage.uniform_filter1d(d, ns(0.06), mode="nearest")
    return curve, gains


# ================================================================ limiter
def limiter(x, ceil_db=CEIL_DBTP, look=0.003, rel=0.08):
    """4x-oversampled peak detection, look-ahead min filter, release one-pole, centred smoothing -> gain curve"""
    c = dbg(ceil_db)
    n = x.shape[1]
    up = np.abs(signal.resample_poly(x, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    La = max(1, ns(look))
    g1 = ndimage.minimum_filter1d(gr, 2 * La + 1, mode="nearest")
    g2 = g1.copy()
    idx = np.flatnonzero(g1 < 1.0)
    if len(idx):
        # one-pole release, run only over clusters of reduced samples (elsewhere the gain is 1)
        kr = 1 - np.exp(-1 / (rel * SR))
        gap = ns(rel * 8)
        brk = np.flatnonzero(np.diff(idx) > gap)
        starts = np.concatenate([[idx[0]], idx[brk + 1]])
        ends = np.concatenate([idx[brk], [idx[-1]]])
        for a, b_ in zip(starts, ends):
            e = min(n, b_ + gap)
            seg = g1[a:e]
            out = np.empty(len(seg))
            g = 1.0
            for k in range(len(seg)):
                g = min(seg[k], g + (1 - g) * kr)
                out[k] = g
            g2[a:e] = out
    g3 = ndimage.uniform_filter1d(g2, 2 * La + 1, mode="nearest")
    g3 = np.minimum(g3, 1.0)
    return x * g3[None, :], g3


# ================================================================ report helpers
def lufs(x):
    v = integrated(x)
    return v if np.isfinite(v) else -99.0


def section_table(v, m, s, words):
    Mv, Mb = momentary(v), momentary(m + s)
    tc = np.arange(len(Mv)) * 0.01 + 0.2                   # centre of each 400 ms window
    speak = np.zeros(len(tc), bool)                        # window centred on a spoken word, voice actually present
    for w in words:
        speak |= (tc >= float(w["s"]) + 0.03) & (tc <= float(w["e"]) - 0.03)
    speak &= Mv > lufs(v) - 10
    rows = []
    for name, a, b in REPORT:
        seg = slice(ns(a), ns(b))
        Lv, Lm, Ls, Lb = lufs(v[:, seg]), lufs(m[:, seg]), lufs(s[:, seg]), lufs(m[:, seg] + s[:, seg])
        k = speak & (tc >= a) & (tc < b) & np.isfinite(Mb) & (Mb > -70)
        p10 = float(np.percentile(Mv[k] - Mb[k], 10)) if k.sum() > 5 else float("nan")
        med = float(np.median(Mv[k] - Mb[k])) if k.sum() > 5 else float("nan")
        rows.append((name, a, b, Lv, Lm, Ls, Lb, Lv - Lb, p10, med))
    return rows


def ffmpeg_ebur(path):
    try:
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                           capture_output=True, text=True, timeout=300)
        txt = r.stderr
        i = txt.rfind("Summary:")
        if i < 0:
            return txt[-1500:]
        out = []
        for line in txt[i:].splitlines():
            out.append(line.rstrip())
            if line.strip().startswith("Peak:"):
                break
        return chr(10).join(l for l in out if l)
    except Exception as e:  # noqa
        return f"ffmpeg check failed: {e}"


# ================================================================ main
def main():
    t_start = time.time()
    words = T.words(os.path.join(ROOT, "voice", "words.json"))
    spans = speech_spans(words)
    v = load_voice()
    v_ref = integrated(v)
    log(f"voice: {v_ref:.2f} LUFS (as stereo), TP {true_peak(v):.2f} dBTP")

    # ---------------- music
    import music
    b = music.build()

    def _m():
        out, levels = music.render(b, ref=-20.0)
        return out
    m_raw = cached("music_raw", _m)
    log("music rendered", f"{lufs(m_raw):.2f} LUFS raw")
    dk = duck_db(spans)
    m_d = m_raw * dbg(dk)[None, :]
    sec_curve, sec_gains = section_db(m_d, v)
    m = m_d * dbg(sec_curve)[None, :]
    end = ns(T.DUR - 0.03)
    m[:, end:] *= np.linspace(1, 0, N - end)[None, :]

    # ---------------- sfx
    import sfx
    C_holder = {}

    def _s():
        out, C = sfx.render(v_ref)
        C_holder["C"] = C
        return out
    s_st = cached("sfx", _s)
    if "C" not in C_holder:                      # cache hit: rebuild the cue list (levels are deterministic)
        C_holder["C"] = sfx.cues()
        for c in C_holder["C"]:
            c.measured = None
    C = C_holder["C"]
    log("sfx rendered", f"{lufs(s_st):.2f} LUFS")

    # ---------------- master
    mix0 = v + m + s_st
    G = TARGET_LUFS - lufs(mix0)
    for it in range(5):
        y, g3 = limiter(mix0 * dbg(G))
        L = lufs(y)
        log(f"master iter {it}: gain {G:+.2f} dB -> {L:.2f} LUFS, TP {true_peak(y):.2f} dBTP, max GR {-20 * np.log10(g3.min()):.2f} dB")
        if abs(L - TARGET_LUFS) < 0.02:
            break
        G += TARGET_LUFS - L
    y = fades(y, 0.0, 0.03)
    assert y.shape == (2, N)
    gv, gm, gs = v * dbg(G), m * dbg(G), s_st * dbg(G)
    write_wav(os.path.join(HERE, "mix.wav"), y)
    write_wav(os.path.join(HERE, "stem_voice.wav"), gv)
    write_wav(os.path.join(HERE, "stem_music.wav"), gm)
    write_wav(os.path.join(HERE, "stem_sfx.wav"), gs)
    log("wrote mix + stems")

    # ---------------- measure
    I, TP, LRA = lufs(y), true_peak(y), lra(y)
    Mmax, Smax = float(np.max(momentary(y))), float(np.max(short_term(y)))
    grdb = -20 * np.log10(g3)
    gr_stats = dict(max=float(grdb.max()), pct_over_0_5=float((grdb > 0.5).mean() * 100), pct_over_0_1=float((grdb > 0.1).mean() * 100))
    peaks = {k: 20 * np.log10(np.abs(x).max() + 1e-12) for k, x in (("voice", gv), ("music", gm), ("sfx", gs))}
    rows = section_table(gv, gm, gs, words)
    eb = ffmpeg_ebur(os.path.join(HERE, "mix.wav"))
    stats = dict(I=I, TP=TP, LRA=LRA, Mmax=Mmax, Smax=Smax, G=G, gr=gr_stats, peaks=peaks, v_ref=v_ref,
                 voice_I=lufs(gv), music_I=lufs(gm), sfx_I=lufs(gs), sec_gains=sec_gains)
    log(json.dumps({k: (round(v_, 2) if isinstance(v_, float) else v_) for k, v_ in stats.items() if k not in ("gr", "peaks", "sec_gains")}))
    log("GR", gr_stats, "stem peaks dBFS", {k: round(p, 2) for k, p in peaks.items()})
    for r in rows:
        log(f"{r[0]:<15} voice {r[3]:6.1f}  music {r[4]:6.1f}  sfx {r[5]:6.1f}  bed {r[6]:6.1f}  margin {r[7]:5.1f}  speech med {r[9]:5.1f} p10 {r[8]:5.1f}")
    print(eb)
    write_cues(C, b, stats, rows, eb, v_ref, G)
    log(f"done in {time.time() - t_start:.0f} s")


def write_cues(C, b, st_, rows, eb, v_ref, G):
    vI = v_ref + G
    L = []
    w = L.append
    w("# The Bridge That Fell for a Song - soundtrack cue sheet")
    w("")
    w("All sound is original: synthesized in numpy/scipy by `sfx_gen.py` / `instruments.py`, placed by `sfx.py` / `music.py`, mixed by `mix.py`.")
    w("Voice = `voice/voice.wav`, gain only (no EQ, no compression, no pitch).")
    w("")
    w("## Files")
    w("| file | content |")
    w("|---|---|")
    w("| `mix.wav` | final mix, 48 kHz, stereo, 24-bit, 3,240,000 samples = 67.500 s |")
    w("| `stem_voice.wav` / `stem_music.wav` / `stem_sfx.wav` | stems at mix gain (they sum to the mix before the master limiter) |")
    w("")
    w("## Master loudness (own BS.1770-4 meter)")
    w(f"- Integrated **{st_['I']:.1f} LUFS**, true peak **{st_['TP']:.1f} dBTP**, LRA {st_['LRA']:.1f} LU, "
      f"max momentary {st_['Mmax']:.1f} LUFS, max short-term {st_['Smax']:.1f} LUFS")
    w(f"- Stems: voice {st_['voice_I']:.1f} LUFS, music {st_['music_I']:.1f} LUFS, sfx {st_['sfx_I']:.1f} LUFS "
      f"(voice gain {G:+.2f} dB, same gain on every stem)")
    gr = st_["gr"]
    w(f"- Master limiter (4x oversampled look-ahead, ceiling {CEIL_DBTP} dBTP): max gain reduction {gr['max']:.2f} dB, "
      f"active (>0.1 dB) on {gr['pct_over_0_1']:.2f} % of samples, >0.5 dB on {gr['pct_over_0_5']:.2f} %")
    w("")
    w("ffmpeg ebur128 cross-check:")
    w("```")
    w(eb)
    w("```")
    w("")
    w("## Voice on top: per-section loudness (LUFS, integrated per stem, at mix gain)")
    w("bed = music + sfx. margin = voice - bed (integrated over the section). speech median / p10 = median and 10th percentile of "
      "the 400 ms momentary margin (voice - bed) over windows centred on spoken words.")
    w("")
    w("| section (shots) | time s | voice | music | sfx | bed | margin LU | speech median LU | speech p10 LU |")
    w("|---|---|---|---|---|---|---|---|---|")
    for r in rows:
        f = lambda x: "-" if x <= -98 else f"{x:.1f}"
        w(f"| {r[0]} | {r[1]:.2f}-{r[2]:.2f} | {f(r[3])} | {f(r[4])} | {f(r[5])} | {f(r[6])} | {r[7]:.1f} | {r[9]:.1f} | {r[8]:.1f} |")
    w("")
    w("## Music map (original march, Bb major, 120 bpm: quarter note = footfall)")
    w("Music target per section, LU under the voice (after a -3 dB speech duck keyed from words.json): " +
      ", ".join(f"{k} {v:+.1f}" for k, v in MUSIC_TARGET.items()) + ". Applied section gains (dB): " +
      ", ".join(f"{k} {v:+.1f}" for k, v in st_["sec_gains"].items()) + ".")
    w("")
    w("Rides (music only, dB): " + ", ".join(f"{a:.2f}-{b:.2f} s {db:+.1f}" for a, b, db in DIPS) +
      " - so quiet sentence-final words stay on top and the band blooms in the gaps after them. "
      "The hook's last two footfalls (3.5, 4.0) are also 3 dB lower in the SFX for '...walking across it.'")
    w("")
    w("| time s | frame | music |")
    w("|---|---|---|")
    for t, d in sorted(b.cues):
        w(f"| {t:.2f} | {int(round(t * T.FPS))} | {d} |")
    w("")
    w("## SFX events")
    w(f"Level convention: every EVENT has a naive level (LU vs the voice stem, as the event's max momentary loudness); "
      f"applied = naive - 6 dB (standard mix rule) + distance/intensity offsets. BEDS are integrated loudness, not reduced. "
      f"'mix LUFS' = the event's max momentary loudness in the final mix (voice stem = {vI:.1f} LUFS integrated). "
      f"Column sounds also get the camera-distance low-pass and more valley reverb.")
    w("")
    w("| # | time s | frame | cue | what | naive LU | applied LU | mix LUFS | pan |")
    w("|---|---|---|---|---|---|---|---|---|")
    for i, c in enumerate(sorted(C, key=lambda c: (c.t, c.name))):
        kind = " (bed, integrated)" if c.kind == "bed" else ""
        meas = c.measured if c.measured is not None else c.applied
        w(f"| {i + 1} | {c.t:.3f} | {c.t * T.FPS:.1f} | {c.name}{kind} | {c.desc} | {c.naive:+.0f} | {c.applied:+.1f} | {vI + meas:.1f} | {c.p:+.2f} |")
    w("")
    open(os.path.join(HERE, "cues.md"), "w", encoding="utf-8").write("\n".join(L))


if __name__ == "__main__":
    main()
