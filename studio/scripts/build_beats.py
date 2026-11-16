"""Map the camera beats (shorts/preview/beats.py) onto the FINAL voice timings → studio/data/<video>.beats.json"""
import json, re, sys, os, importlib.util
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
spec = importlib.util.spec_from_file_location("beats", f"{ROOT}/shorts/preview/beats.py"); B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)
norm = lambda t: re.sub(r"[^a-z0-9']", "", t.lower().replace("’", "'"))
for key, v in B.V.items():
    words = json.load(open(f"{ROOT}/shorts/voice/{v['take']}_final.words.json"))
    toks = [norm(w["w"]) for w in words]; i0 = 0; beats = []
    for n, (anchor, shot, flag) in enumerate(v["beats"]):
        a = [norm(x) for x in anchor.split()]
        hit = next(i for i in range(i0, len(toks)) if toks[i:i + len(a)] == a)
        beats.append({"id": n, "t": words[hit]["s"], "wi": hit, "shot": shot, "hero": flag == "H"}); i0 = hit + 1
    for n, b in enumerate(beats):
        end = beats[n + 1]["wi"] if n + 1 < len(beats) else len(words)
        b["say"] = " ".join(w["w"] for w in words[b["wi"]:end])
        b["t1"] = beats[n + 1]["t"] if n + 1 < len(beats) else words[-1]["e"] + 0.25
    dur = words[-1]["e"] + 0.25
    json.dump({"video": key, "take": v["take"], "dur": dur, "beats": beats, "words": words},
              open(f"{ROOT}/studio/data/{key}.beats.json", "w"), indent=1)
    print(key, len(beats), "beats", round(dur, 2), "s")
