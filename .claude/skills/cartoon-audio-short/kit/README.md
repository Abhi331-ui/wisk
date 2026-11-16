# cartoon-short-kit
Audio in, finished vertical cartoon short out. 2D bean-head cards in an inked, painted 3D world
(three.js in headless Chromium, no Remotion and no GPU needed), with a synthesized music bed and SFX.

- `engine/` renderer: world helpers, cards, ink pass, lens blur, grade (`main.js`), painted textures (`paint.js`),
  cast drawing (`roman.js` on top of the Pen library from mromidev/claude-animated-shorts, fetched by setup),
  motion helpers (`motion.js`).
- `example/soldier/` the worked example "The Soldier Who Never Left" (story.js shot plan + audio.py cue table).
- `tools/` setup.sh (new project), timing.py (word timings), render.mjs (frames), sheet.py (contact sheets), finish.sh (encode + QA).

Quick start: `bash tools/setup.sh ~/shorts/my-short && cd ~/shorts/my-short && python3 timing.py voice.mp3 script.txt --out work`
Built on github.com/mromidev/claude-animated-shorts (MIT): toon.ts, look values and readability rules.
