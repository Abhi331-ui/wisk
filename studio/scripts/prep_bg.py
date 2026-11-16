"""Downscale Poly Haven tonemapped backgrounds to 8192x4096 JPG (GPU texture limit)."""
import glob, os
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
for f in glob.glob(os.path.join(os.path.dirname(__file__), "..", "public/assets/hdri/*_bg_full.jpg")):
    out = f.replace("_bg_full.jpg", "_bg.jpg")
    if os.path.exists(out): continue
    im = Image.open(f); im.draft("RGB", (8192, 4096)); im = im.convert("RGB").resize((8192, 4096), Image.LANCZOS)
    im.save(out, quality=90); print("ok", os.path.basename(out))
