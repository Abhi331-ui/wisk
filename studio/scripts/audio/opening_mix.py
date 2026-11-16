# Soundtrack for the spaghetti opening (0 -> END s): voice + an original light 1950s-style bed (pizzicato strings,
# celesta-like bells, soft pad, brushed shuffle) ducked under the voice + whooshes on the whips + a faint TV hum.
import numpy as np, json, subprocess, sys
SR = 48000; END = float(sys.argv[1]) if len(sys.argv) > 1 else 12.11
ROOT = '/home/user/wisk'
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()
N = int(END * SR) + SR // 2
voice = load(f'{ROOT}/shorts/voice/take1_final.wav')[:N]; voice = np.pad(voice, (0, N - len(voice)))
t = np.arange(N) / SR
def env(n, a=0.005, d=0.25):
    e = np.exp(-np.arange(n) / SR / d); k = int(a * SR); e[:k] *= np.linspace(0, 1, k); return e
def note(f, dur, kind='pluck'):
    n = int(dur * SR); x = np.arange(n) / SR
    if kind == 'pluck': s = (np.sin(2*np.pi*f*x) + 0.4*np.sin(4*np.pi*f*x) + 0.15*np.sin(6*np.pi*f*x)) * env(n, 0.003, 0.18)
    elif kind == 'bell': s = (np.sin(2*np.pi*f*x) + 0.5*np.sin(2*np.pi*f*2.76*x) + 0.25*np.sin(2*np.pi*f*5.4*x)) * env(n, 0.002, 0.6)
    else: s = (np.sin(2*np.pi*f*x) + 0.3*np.sin(2*np.pi*f*2.001*x)) * np.minimum(1, x / 0.3) * np.exp(-x / 2.5)
    return s
music = np.zeros(N); BPM = 112; beat = 60 / BPM
def add(sig, at, g):
    i = int(at * SR); j = min(N, i + len(sig))
    if i < N: music[i:j] += sig[:j - i] * g
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [(60, [0, 4, 7]), (65, [0, 4, 7]), (67, [0, 4, 7, 10]), (60, [0, 4, 7])]  # C F G7 C, two bars each
mel = [76, 79, 81, 79, 76, 74, 72, 74, 76, 76, 79, 84, 81, 79, 77, 76]
for bar in range(int(END / (4 * beat)) + 2):
    root, ch = prog[(bar // 2) % 4]; t0 = bar * 4 * beat
    for b in range(4):  # oom-pah pizzicato
        add(note(mtof(root - 12 if b % 2 == 0 else root - 5), 0.4), t0 + b * beat, 0.32)
        for k in ch[:3]: add(note(mtof(root + k), 0.3), t0 + b * beat + beat / 2, 0.11)
    add(note(mtof(root), 4 * beat * 1.1, 'pad'), t0, 0.07); add(note(mtof(root + 7), 4 * beat * 1.1, 'pad'), t0, 0.05)
    for q in range(4):
        m = mel[(bar * 4 + q) % len(mel)]; add(note(mtof(m), 0.9, 'bell'), t0 + q * beat + (beat / 2 if q % 2 else 0), 0.09)
    for q in range(8):  # brushed shuffle
        n = int(0.08 * SR); add(np.random.default_rng(bar * 8 + q).normal(0, 1, n) * env(n, 0.001, 0.03), t0 + q * beat / 2, 0.05 if q % 2 else 0.03)
# duck the bed under the voice (envelope follower)
ve = np.convolve(np.abs(voice), np.ones(2400) / 2400, mode='same'); duck = 1 - 0.55 * np.clip(ve / (ve.max() * 0.35 + 1e-9), 0, 1)
music *= duck; music *= 10 ** (3 / 20) * 0.5   # "music +3 dB" against the bed reference
fade = np.ones(N); fade[:int(0.4 * SR)] = np.linspace(0, 1, int(0.4 * SR)); music *= fade
# SFX: whooshes on the whips (set changes), TV hum in the room
sfx = np.zeros(N)
BE = json.load(open(f'{ROOT}/studio/data/spaghetti.beats.json'))['beats']
sets = ['room', 'city', 'room', 'room', 'room', 'city', 'room', 'room', 'room']
for i in range(1, 9):
    if sets[i] != sets[i - 1]:
        n = int(0.45 * SR); x = np.arange(n) / SR; noise = np.random.default_rng(i).normal(0, 1, n)
        # band-swept noise: simple one-pole low-pass with a moving cutoff
        y = np.zeros(n); a = 0.0
        for k in range(n):
            c = 0.02 + 0.25 * np.sin(np.pi * k / n); a += c * (noise[k] - a); y[k] = a
        add_at = int((BE[i]['t'] - 0.22) * SR); y *= np.sin(np.pi * x / x[-1]) ** 2
        sfx[max(0, add_at):add_at + n] += y[:max(0, min(n, N - add_at))] * 0.9
hum = (0.6 * np.sin(2 * np.pi * 50 * t) + 0.3 * np.sin(2 * np.pi * 100 * t) + 0.15 * np.sin(2 * np.pi * 15625 / 8 * t)) * 0.012
inroom = np.zeros(N)
for i in range(9):
    a, b = BE[i]['t'], (BE[i + 1]['t'] if i + 1 < len(BE) else END)
    if sets[i] == 'room': inroom[int(a * SR):int(b * SR)] = 1
inroom = np.convolve(inroom, np.ones(4800) / 4800, mode='same'); sfx += hum * inroom
sfx *= 10 ** (-6 / 20)
mix = voice + music * 0.55 + sfx
mix = mix[:int(END * SR)]; mix /= max(1e-9, np.abs(mix).max() / 0.89)
out = f'{ROOT}/studio/public/audio/spaghetti_opening_mix.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s24le', out], input=mix.astype(np.float32).tobytes())
print('ok', out, round(len(mix) / SR, 2), 's')
