# soften same-room cuts: 3-frame dissolve from the last frame of the outgoing shot
import sys, numpy as np
from PIL import Image
starts = [int(x) for x in sys.argv[1].split(",")]
for a in starts:
    prev = np.asarray(Image.open(f"frames/f{a-1:04d}.jpg"), dtype=np.float32)
    for k, w in enumerate((0.66, 0.4, 0.18)):
        p = f"frames/f{a+k:04d}.jpg"; cur = np.asarray(Image.open(p), dtype=np.float32)
        Image.fromarray(np.clip(prev * w + cur * (1 - w), 0, 255).astype(np.uint8)).save(p, quality=95)
print("dissolved", starts)
