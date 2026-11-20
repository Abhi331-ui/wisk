# Present it as a reel

Many code films are posted as "a laptop playing the film, filmed by a phone": vertical 1080x1920, the laptop in the middle, a title above, a caption below. Two ways to make it.

## A. Film it for real (best)
1. Render the 16:9 film. Play it full screen on a laptop at full brightness, in a dim room with one warm lamp.
2. Film it with the phone held vertically, 30 fps, 20–40 cm above the keyboard, for the whole film. Keep the hand natural; don't walk.
3. Put the clean soundtrack (`sound/mix.wav`) on in the editor instead of the phone's microphone.
4. Add the title above the laptop and the caption below in the edit (CapCut, Premiere, or ffmpeg `overlay`).

## B. Composite into a laptop photo
1. Get a vertical 1080x1920 photo of a laptop, screen facing the camera: take one, or generate one if your agent can make images (keep the screen pure black). Frame it close: the laptop should fill most of the width.
2. Measure the screen rectangle in pixels (SX SY SW SH) from the real edges of the lit display, not the bezel (the first try covered the left bezel). The film is scaled to the width and centred in it.
3. Film 20–30 s of your own phone hand movement pointing at any desk (start recording, wait 2 s, then hold still like you are filming; skip the first 2 s where you raise the phone).
4. Run:
```bash
python3 present/phone_motion.py phone.mp4 motion.csv 2 30        # measure the shake (start at 2 s)
sh present/laptop_reel.sh laptop.png out/final.mp4 142 636 790 490 out/reel.mp4 motion.csv overlay.png
```
- `overlay.png` = a transparent 1080x1920 PNG with the title and caption. It stays still; only the laptop picture moves.
- Caption style that stays readable over a dark film: a cream box (#FFF0D6) with dark text (#18120F), or white bold text with a soft shadow. Black on black disappears.
- Don't add a fake drift or wobble. It reads as cheap. Use the real hand motion, or keep it still.
- Don't cut the background out of a real phone take to swap it. It failed badly; this composite is the fix.
- If `handheld.py` says the edges show, raise the scale (6th argument of handheld.py, e.g. 1.14) or use a calmer part of the phone clip.
- Defaults that looked real: 10 % overscan, roll kept at 60 %, slow wander kept at 40 %, sway and shake kept at 100 %, 0.5 s ease-in.
- Needs `numpy` and `pillow` (`pip install numpy pillow`).

## Before posting
- Credit any CC-BY models in the caption: `3D model: "<name>" by <author> (CC BY 4.0)`.
- Untick auto-generated captions if your film already has its own.
- The ask at the end (the keyword to comment) should also be in the caption's first line.
