#!/usr/bin/env python3
"""Level-locked mix: music at 50 % (-6 dB) of the voice's gated RMS, SFX at 50 % with peaks <= 0.7 x voice peak.
One linear gain on the whole mix + a peak limit; no ducking/compression.  python3 mix.py voice.mp3 music.wav sfx.wav"""
import sys, subprocess, numpy as np, wave
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
def gated_rms(x, win=0.4, gate_db=-40):
    n = int(win * SR); k = len(x) // n
    if k == 0: return np.sqrt(np.mean(x ** 2) + 1e-12)
    r = np.sqrt(np.mean(x[:k * n].reshape(k, n) ** 2, 1) + 1e-12)
    rel = r[r > r.max() * 10 ** (gate_db / 20)]
    return np.sqrt(np.mean(rel ** 2))
db = lambda a: 20 * np.log10(a + 1e-12)
v, m, s = (load(p) for p in sys.argv[1:4])
N = len(v); m = np.pad(m, (0, max(0, N - len(m))))[:N]; s = np.pad(s, (0, max(0, N - len(s))))[:N]
rv = gated_rms(v)
m *= 0.5 * rv / gated_rms(m)
s *= 0.5 * rv / gated_rms(s)
cap = 0.7 * np.abs(v).max()
if np.abs(s).max() > cap: s *= cap / np.abs(s).max()
mix = v + m + s
g = min(1.0, 0.89 / np.abs(mix).max()); mix *= g  # one linear gain, peak <= -1 dBFS
print(f"voice gated RMS {db(rv):.1f} dBFS | music vs voice {db(gated_rms(m)) - db(rv):+.1f} dB | sfx vs voice {db(gated_rms(s)) - db(rv):+.1f} dB, sfx peak {db(np.abs(s).max()) - db(np.abs(v).max()):+.1f} dB vs voice peak | mix gain {db(g):+.1f} dB")
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open("mix_raw.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("mix_raw.wav", len(mix) / SR)
