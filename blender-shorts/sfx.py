# Build a simple SFX + music bed track with numpy, then mix under the voiceover.
import sys, json, numpy as np, soundfile as sf
d = sys.argv[1]; cfg = json.load(open(f"{d}/sfx.json"))
sr = 48000; L = cfg["length"]; n = int(L * sr); t = np.arange(n) / sr
mix = np.zeros(n)
rng = np.random.default_rng(1)
def place(sig, at, gain):
    i = int(at * sr); j = min(n, i + len(sig)); mix[i:j] += gain * sig[: j - i]
def whoosh(dur=0.45):
    m = int(dur * sr); x = rng.standard_normal(m)
    # sweep a one-pole lowpass for a 'swish'
    y = np.zeros(m); a = np.linspace(0.02, 0.35, m); a = np.concatenate([a[: m // 2], a[: m // 2][::-1], [0.02] * (m - 2 * (m // 2))])
    for k in range(1, m): y[k] = y[k - 1] + a[k] * (x[k] - y[k - 1])
    env = np.sin(np.linspace(0, np.pi, m)) ** 2
    return y * env / (np.abs(y).max() + 1e-9)
def tick(hi=True):
    m = int(0.05 * sr); tt = np.arange(m) / sr
    return np.sin(2 * np.pi * (2400 if hi else 1900) * tt) * np.exp(-tt * 140) + 0.3 * rng.standard_normal(m) * np.exp(-tt * 400)
for w in cfg.get("whoosh", []): place(whoosh(), max(0, w - 0.22), 0.35)
for i, k in enumerate(cfg.get("ticks", [])): place(tick(i % 2 == 0), k, 0.25)
# music bed: soft minor pad + light pluck, ducked a bit
bed = np.zeros(n)
chords = [[220, 261.6, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [196, 246.9, 293.7]]
seg = L / len(chords)
for ci, ch in enumerate(chords):
    i0, i1 = int(ci * seg * sr), int((ci + 1) * seg * sr); tt = t[i0:i1] - t[i0]
    env = np.minimum(1, tt / 0.4) * np.minimum(1, (tt[-1] - tt) / 0.4 + 0.05)
    for f in ch: bed[i0:i1] += np.sin(2 * np.pi * f * tt) * env * 0.33
    for b in range(4):  # plucks
        s0 = i0 + int(b * seg / 4 * sr); m = min(int(0.6 * sr), n - s0); tp = np.arange(m) / sr
        bed[s0:s0 + m] += 0.5 * np.sin(2 * np.pi * ch[b % 3] * 2 * tp) * np.exp(-tp * 6)
fade = np.minimum(1, t / 0.5) * np.minimum(1, (L - t) / 0.8)
mix += 0.09 * bed / np.abs(bed).max() * fade
vo, vsr = sf.read(f"{d}/vo.wav")
if vo.ndim > 1: vo = vo.mean(1)
vo = np.interp(np.arange(n) / sr, np.arange(len(vo)) / vsr, vo, right=0)
out = vo * 0.95 + mix
out /= max(1.0, np.abs(out).max() / 0.95)
sf.write(f"{d}/mix.wav", out, sr)
print("ok")
