import json, re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from beats import V
norm = lambda t: re.sub(r"[^a-z0-9']", "", t.lower().replace("’", "'"))
VO = os.path.join(os.path.dirname(__file__), "..", "voice")
out = {}
for key, v in V.items():
    words = json.load(open(f"{VO}/{v['take']}_trim.words.json"))
    toks = [norm(w["w"]) for w in words]
    dur = words[-1]["e"]; i0 = 0; beats = []
    for anchor, shot, flag in v["beats"]:
        a = [norm(x) for x in anchor.split()]
        hit = next((i for i in range(i0, len(toks) - len(a) + 1) if toks[i:i + len(a)] == a), None)
        if hit is None:
            sys.exit(f"{key}: anchor not found after word {i0}: {anchor!r}")
        beats.append({"t": words[hit]["s"], "say": "", "shot": shot, "hero": flag == "H", "wi": hit}); i0 = hit + 1
    for n, b in enumerate(beats):
        end = beats[n + 1]["wi"] if n + 1 < len(beats) else len(words)
        b["say"] = " ".join(w["w"] for w in words[b["wi"]:end]); del b["wi"]
    gaps = [beats[n + 1]["t"] - beats[n]["t"] for n in range(len(beats) - 1)]
    out[key] = dict(title=v["title"], palette=v["palette"], audio=f"{key}.mp3", dur=round(dur, 2), beats=beats)
    print(f"{key}: {len(beats)} beats over {dur:.1f}s, avg {sum(gaps)/len(gaps):.2f}s, max {max(gaps):.2f}s")
json.dump(out, open(os.path.join(os.path.dirname(__file__), "timeline.json"), "w"), indent=1)
