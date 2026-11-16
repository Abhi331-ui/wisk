"""Fetch CC0 assets from Poly Haven into public/assets. usage: python -I scripts/fetch_assets.py manifest.json"""
import json, os, sys, urllib.request, concurrent.futures as cf
o=urllib.request.build_opener(); o.addheaders=[("User-Agent","studio-asset-fetch/1.0")]; urllib.request.install_opener(o)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets")
def get(url, dst):
    if os.path.exists(dst) and os.path.getsize(dst) > 0: return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    urllib.request.urlretrieve(url, dst + ".part"); os.replace(dst + ".part", dst)
def files(aid): return json.load(urllib.request.urlopen(f"https://api.polyhaven.com/files/{aid}"))
jobs = []
def hdri(aid, res="2k", bg=False):
    f = files(aid); jobs.append((f["hdri"][res]["hdr"]["url"], f"{ROOT}/hdri/{aid}_{res}.hdr"))
    if bg: jobs.append((f"https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/{aid}.jpg", f"{ROOT}/hdri/{aid}_bg_full.jpg"))
def tex(aid, res="2k"):
    f = files(aid)
    for k, name in [("Diffuse", "diff"), ("col_1", "diff"), ("col_01", "diff"), ("nor_gl", "nor"), ("Rough", "rough"), ("AO", "ao"), ("arm", "arm")]:
        if k in f and res in f[k]: jobs.append((f[k][res]["jpg"]["url"], f"{ROOT}/tex/{aid}/{name}.jpg"))
def model(aid, res="1k"):
    g = files(aid)["gltf"][res]["gltf"]
    jobs.append((g["url"], f"{ROOT}/models/{aid}/{aid}.gltf"))
    for rel, inc in g["include"].items(): jobs.append((inc["url"], f"{ROOT}/models/{aid}/{rel}"))
m = json.load(open(sys.argv[1]))
for a in m.get("hdri", []): hdri(**a) if isinstance(a, dict) else hdri(a)
for a in m.get("tex", []): tex(a)
for a in m.get("models", []): model(a) if isinstance(a, str) else model(*a)
with cf.ThreadPoolExecutor(12) as ex: list(ex.map(lambda j: get(*j), jobs))
print(len(jobs), "files ok")
