# Generate narration lines with Kokoro (local, free) and write timings.json
import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
model_dir, out_dir = sys.argv[1], sys.argv[2]
cfg = json.load(open(f"{out_dir}/script.json")); lines = cfg["lines"]; ats = cfg.get("at"); total = cfg.get("length")
k = Kokoro(f"{model_dir}/kokoro-v1.0.onnx", f"{model_dir}/voices-v1.0.bin")
sr = 24000; gap = 0.25; audio = []; t = 0.0; timing = []
for i, ln in enumerate(lines):
    if ats:
        pad = ats[i] - t
        if pad > 0: audio.append(np.zeros(int(pad*sr))); t = ats[i]
    s, sr = k.create(ln, voice="am_michael", speed=1.05, lang="en-us")
    # trim silence
    idx = np.where(np.abs(s) > 0.01)[0]; s = s[max(idx[0]-200,0):idx[-1]+400]
    d = len(s)/sr
    words = ln.split(); w = [len(x)+2 for x in words]; tot = sum(w); c = t
    wt = []
    for word, ww in zip(words, w):
        dd = d*ww/tot; wt.append([word, round(c,3), round(c+dd,3)]); c += dd
    timing.append({"text": ln, "start": round(t,3), "end": round(t+d,3), "words": wt})
    audio.append(s); t += d
    if not ats: audio.append(np.zeros(int(gap*sr))); t += gap
if total and total > t: audio.append(np.zeros(int((total-t)*sr))); t = total
sf.write(f"{out_dir}/vo.wav", np.concatenate(audio), sr)
json.dump(timing, open(f"{out_dir}/timings.json","w"), indent=1)
print("total", round(t,2))
