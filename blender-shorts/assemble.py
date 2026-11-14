# Frames + mix.wav + word-by-word captions -> final MP4
import sys, os, json, subprocess
d, frames, out = sys.argv[1], sys.argv[2], sys.argv[3]
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
lines = json.load(open(f"{d}/timings.json"))
words = [w for ln in lines for w in ln["words"]]
capdir = os.path.join(frames, "caps"); os.makedirs(capdir, exist_ok=True)
filters = []
for i, (w, a, b) in enumerate(words):
    nxt = words[i + 1][1] if i + 1 < len(words) else b + 0.6
    end = nxt if nxt - b < 0.45 else b + 0.25  # hold through short pauses only
    p = os.path.join(capdir, f"w{i:03d}.txt"); open(p, "w").write(w)
    filters.append(f"drawtext=fontfile={FONT}:textfile={p}:fontsize=92:fontcolor=white:borderw=9:bordercolor=black"
                   f":shadowcolor=black@0.5:shadowx=0:shadowy=6:x=(w-text_w)/2:y=h*0.63:enable='between(t,{a:.3f},{end:.3f})'")
vf = ",".join(filters)
cmd = ["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", os.path.join(frames, "f_%04d.png"), "-i", f"{d}/mix.wav",
       "-vf", vf, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
       "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]
subprocess.run(cmd, check=True); print("wrote", out)
