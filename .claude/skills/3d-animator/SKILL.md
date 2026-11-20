---
name: 3d-animator
description: Make cinematic 3D films and reels entirely in code, with no Blender. three.js scenes are rendered frame by frame in headless Chrome, with real camera moves, motion blur, depth of field, soft light, motion with weight, and sound timed to the picture. Use when the user wants a 3D animation, a desk, room or product scene, a "cinematic" shot, a code-only film, or says "no Blender" or "every frame in code".
---

# 3D Animator

You are the whole crew: director, camera operator, gaffer, animator and sound designer. Generic AI 3D looks flat for three reasons: everything is lit evenly, the camera floats, and nothing has weight. This skill fixes all three. Work through the stages in order, and show the user a result at the end of each one.

The `kit/` folder next to this file is a working starter: a 6-second film, a frame-exact renderer, a sound mixer and the phone-shake tools. Always start from it. Don't start from a blank file.

## The six rules

1. **Every frame is a pure function of time.** `renderAt(t)` must draw the same picture for the same `t`, in any order. That means no `Date.now()`, no `Math.random()` (use `hash(n)` from `kit/lib.js`), no physics that steps forward, and no state left over from the last frame. This is what lets you render any frame alone, re-render one shot, and trust what you see.
2. **Quality comes from sub-frames.** Draw each frame `n` times with tiny changes, add the results up in a float buffer, then grade once:
   - spread the time over the shutter → motion blur;
   - move the eye on a small disc → depth of field;
   - jitter the lights → soft shadows;
   - jitter by a sub-pixel → anti-aliasing.
   Use `n = 16` for stills, `4–8` for previews and `48` for the final. The kit already does this.
3. **One camera move = one lens, one Bezier curve, one eased progress value.** No zooming, no separate x/y/z keyframes, no shake inside the film.
4. **Light it like a real room.** Use one strong key with a reason to exist (sun through blinds, a desk lamp), a soft sky fill and practical lights you can see. Dark corners are good. Flat is the enemy.
5. **Sound is half the film.** The voice sets the clock. Every visible action gets a sound, and the picture lands on the word, 1–2 frames early.
6. **Show before you spend.** Do stills, then a fast preview, then the full-quality render. Before every long render, tell the user how long it will take.

## Setup (once per project)

```bash
node -v          # 20 or newer
ffmpeg -version  # any recent build
```

Copy `kit/` into a new project folder, then run:

```bash
npm install       # three.js + a Chrome build for rendering (about 170 MB, once)
                  # already have Chrome? PUPPETEER_SKIP_DOWNLOAD=1 npm install, then set CHROME_PATH
npm run stills    # renders 3 PNGs into stills/
```

Open one still and check it. The first line of the render log names the GPU. If it says SwiftShader or llvmpipe, rendering works but slowly, so keep previews at `--n=4`. To use an installed Chrome, set `CHROME_PATH=/path/to/chrome`.

If something is missing, tell the user the exact install step and wait: `brew install node ffmpeg` on a Mac; on Windows `winget install OpenJS.NodeJS.LTS` and `winget install Gyan.FFmpeg`, then open a new terminal.

You can watch the film live: run `python3 -m http.server 8080` in the project folder and open `http://localhost:8080/index.html?play=1` (preview quality). Use `?t=2.5` to view one frame at full quality.

## Stage 1: Plan (no code yet)

Ask at most 3 questions, and only if the answers aren't already clear: what the film is about, where it will be shown, and whether a voice or a music track already exists.

Then write `PLAN.md` and wait for the user's OK:

- **The idea in one line.**
- **Format.** Use 1920x1080 at 30 fps for a film that will play on a laptop and be filmed with a phone. Use 1080x1920 for a reel posted directly (change `W`/`H` in `lib.js` and the viewport in `render.mjs` and `index.html`). For a reel, 15–30 seconds.
- **The contrast** (for a reel or an ad; skip it for a plain film). Show the problem, then the fix. Example: the same prompt gives a flat grey cube "without the skill" and a warm, lit, cinematic room "with it". The bad version takes five minutes to make and makes the good one land.
- **Hook.** Something must move in the very first frame. A test cut that opened on a still lost about 80 % of viewers by second 3. A simple pop-in works: the hero object grows in about 0.25 s, squashes as it lands and settles, and the next object lands 0.2 s later.
- **Shot table.** One row per shot: start and end time, what we see, the camera move, what moves in the scene, the light, the words, and the sounds.
- **Look.** Two or three colours, one light idea (for example "late sun through blinds") and one texture idea (for example "beige 90s plastic").
- **Ending.** For a reel, one clear ask, written inside the scene. Example: the CRT screen types "COMMENT" and then the keyword. Don't use a sticker on top.

From then on, add a few lines to `NOTES.md` for every version: what changed, why, and the exact numbers. When the work passes to another session or another agent, this file is what saves the hours.

## Stage 2: Build the set

Start from `film.js` (copied from the kit) and replace its props with yours. Keep the renderer, the sub-frame loop and the grade.

When you change the length, set `total`. The camera move and the fade-out follow it. The story beats are still fixed times in `renderAt` (lamp on at 1.2 s, typing 1.9–3.0 s, the mug hop at 4.7 s), and so are `CAPTIONS` and the focus point (`LOOK_B`). Move or delete each one.

- **Work in metres, at real scale.** A mug is 9.5 cm tall, a monitor about 36 cm and a desk 75 cm high. Wrong scale is the fastest way to look fake.
- **Build props from primitives:** box, cylinder, sphere, `LatheGeometry` (bottles, lamps, pots), `ExtrudeGeometry` (logos, frames) and `RoundedBoxGeometry` from `three/addons`. Perfectly sharp edges look like CG, so bevel them. Use `InstancedMesh` for repeats like keys, books and tiles.
- **Screens and UI are a 2D canvas drawn from `t`,** shown as a `CanvasTexture` on a `MeshBasicMaterial`. Set its colour above 1 (for example 1.7) so it glows and blooms. Load fonts before `__ready`. Add scanlines, a blinking cursor and typing. Use a full-cell block cursor: a thin bar after a word reads as an extra letter ("SKILL" became "SKILLI").
- **Seat every prop.** A keyboard 2.7 cm above the desk was obvious from a low angle. Put a soft dark contact patch under each object on a surface, or it floats.
- **Don't leave a window blank.** Put a street or a sky outside it (`references/light.md` shows how).
- **Spend detail where the camera looks.** Look through the final camera positions first, then add detail only there.
- **Organic props** like plants, hands and food are the hardest. Try a procedural version first (`kit/film.js` builds its plant from flattened spheres). If it still looks fake after two tries, load a free CC-BY `.glb` model with `GLTFLoader` and tell the user that the post caption must credit the author, because the licence requires it. When you measure a loaded model, read its vertices: some files share one vertex list between parts, so the bounding box of a part can be wrong.
- **Check:** render stills at 3–5 key times, open them, and fix what looks wrong before moving on.

## Stage 3: Camera

Details and code are in `references/camera.md`.

- **Pick one lens (vertical FOV) for the film** and keep it: 35–40° feels like a product shot, 50–55° like a person in the room. A zoom reads as fake. Move the camera instead.
- **Each move is one `CubicBezierCurve3`.** Animate one progress value, `p = easeInOut(seg(t, start, end))`, and blend the look-at target with the same `p`. Move the control points to change the path, never the timing. A curved path (a dolly with a little orbit) reads as a real operator. Going right and then forward reads as a robot.
- **End on a slow push into the hero object,** looking at the ask.
- **Depth of field:** focus on the subject, with an aperture of 4–10 mm (scene units are metres). Pull it in as the camera gets closer. Small apertures look real. Huge blur looks like a miniature.
- **Shutter:** 0.5/30 s (180°) for normal moves. Raise it to 0.8/30 s on fast whips so they smear like a real camera.
- **Comfort:** no FPV slaloms or sudden turns. Measure camera speed per frame (print `eye.distanceTo(prevEye)` at 30 fps) and smooth any spike. Hold 0.3–0.5 s at the start and end of a move. Cut on motion, not on stillness.
- **Give each section its own clock** (`tSection = t - sectionStart`), so changing one shot never shifts the others. If you trim the start of the film, map output time to source time in one function (`sourceTimeAt`) rather than editing every cue.

## Stage 4: Light

Details are in `references/light.md`.

- **Render in linear HDR** (`NoToneMapping`, `LinearSRGBColorSpace`, `HalfFloat` targets), then grade once at the end: slight chromatic fringe, ACES, vignette, sRGB, fine grain. Bloom should only catch values above 1, such as screens and bulbs.
- **Key light:** a warm `DirectionalLight` "sun", jittered by about 0.15 m per sub-frame so shadow edges go soft. To get light shapes, put slats (blinds) or a window frame between the sun and the room, out of frame. They paint stripes across the wall and desk, and that does most of the cinematic work.
- **Sky fill:** a cool `DirectionalLight` at low intensity, moved to a new cosine-weighted point on the sky every sub-frame. Over 48 sub-frames this adds up to soft sky light with contact shadows, a cheap kind of ambient occlusion.
- **Practicals:** a desk lamp, a monitor glow or a bulb you can see. Switch them on during the film (a short flicker, then on) and give the switch a sound.
- **Dust in the light:** 200–400 deterministic points that drift as a function of `t`, with additive blending, brighter in the light. They live in the world, not as an overlay. Let them drift at 12–40 mm/s, with about a third sinking. At 2–6 mm/s they looked frozen at phone size.
- **The "bad" render** for the contrast is easy: flat ambient light, no shadows, grey materials, no blur, a hard cut.
- **Check:** render the same 3–5 times before and after each light change and compare them side by side. Match by eye. Don't tune numbers to the decimal.

## Stage 5: Motion

Details are in `references/motion.md`.

- **Nothing moves linearly** unless it's a machine. Use `easeInOut` for travel, `backOut` for pops and `spring()` for landings and wobbles.
- **Use anticipation, action, overshoot and settle.** The kit's mug squashes before it hops, then lands with a damped spring.
- **Things react.** When the render finishes, the mug hops. When the lamp turns on, the desk warms. Every action needs a reason in the story.
- **Add secondary motion:** leaves sway, dust drifts, a cable swings. Keep it small, slow, and different for each object (offset its phase with `hash(i)`).
- **Stagger groups:** 2–4 frames between items, never all at once.
- **Time to the voice:** an action starts on its word or 1–2 frames before it. A picture that leads feels sharp, and one that lags feels broken.

## Stage 6: Sound

Details are in `references/sound.md`. The mixer is `kit/mix.py`.

1. **Voice first,** because it sets the clock. Use ElevenLabs text-to-speech with timestamps, or the user's own recording. Read `ELEVENLABS_API_KEY` from a git-ignored `.env` file and never print it. Keep the voice at its natural speed; fix timing with pauses and separate takes, never with time-stretching or pitch changes. If a word sounds croaky or broken, check that word's take first and re-generate it, before you touch the edit. Keep each take's natural tail: trimming at −40 dB cut off a final "t".
2. **Word timings → captions.** Save `[word, start]` pairs and draw them in the grade pass, word by word (`CAPTIONS` in `kit/film.js`). Whisper's times land about 0.15 s early, so check them against the waveform. Whenever the voice changes, re-sync the captions and any typing to the new words (2 frames per typed letter works).
3. **Music:** use a track the user has the rights to, or a royalty-free one. Get the real file: music pulled out of someone else's video with stem separation sounded bad. Sound effects alone with no bed sound empty, so always use a music bed when there's no voice. Duck it under the voice (`mix.py` does this).
4. **One sound effect per visible action:** key typing, the switch, the floppy latch, whooshes on camera moves, a pop on each UI element. Use one notification sound per bubble, not one for the group. Never crop a sound effect so short that its tail is cut.
5. **Make it work on phone speakers:** they play almost nothing below 200 Hz.
   - Whooshes made of sub-bass disappear on a phone. Pick or layer ones with air in them, around 2–8 kHz.
   - Keyboard typing must be clearly audible: it's the main "I made this" sound.
   - Rule of thumb in the 1–8 kHz band: each effect at about voice −6 dB, or ducked music +7 dB, whichever is louder. With no voice, use music +7 dB.
   - All the effects summed together (before the voice and music) should peak under −10 dBFS.
6. **Master** to −14 LUFS integrated with a peak limit near −1.5 dB. `python3 mix.py sound/cues.json sound/mix.wav` does it, prints the loudness and true peak (dBTP), and lists when each sound starts. Then listen on a phone.

**No voice?** Then the music sets the clock: pick the track first, find its beats, and cut and move on them. Skip steps 1–2.

## Styles (12 looks, one flag)

The same film can be re-dressed in another look with one flag: `--style=<name>` on `render.mjs`, or `?style=<name>` in the browser.
The looks: `lit` (as built), `clay`, `paper`, `shadow` (shadow puppet), `blueprint`, `toon`, `voxel`, `thermal`, `synth` (synthwave),
`chrome` (liquid chrome), `neon` (night) and `mix` (a different look per object). When the user asks for a style, switch the style
instead of rebuilding the scene. To flip looks inside the film on the beat, to mix looks per object, and to tune each one, see
`references/styles.md`. The code is `kit/styles.js`.

## Stage 7: Render and check

```bash
node render.mjs --stills=1,3.5,5 --n=16                    # look
node render.mjs --video --n=4 --out=out/preview.mp4         # timing
node render.mjs --video --n=48 --audio=sound/mix.wav --out=out/final.mp4   # final
```

- **Estimate first.** Render 30 frames, note the time, multiply, and tell the user before the full render. As a guide, the starter takes about 0.6 s per frame at `n=8` and 1.1 s per frame at `n=48` on an M4 MacBook Air. That makes about 2 minutes for a 6-second preview, 3–4 minutes for the final, and 10–15 minutes for a 20-second final. Bigger scenes and slower machines take longer, so always measure.
- **Check the encoded file, not the browser.** Confirm frame count = seconds × fps and duration = the plan. Grab frames from the MP4 at key times and look at them. Watch it once with sound on a phone.
- **Read the log.** A shader with an error still renders, just without that effect. After every shader change, look for `Shader Error` in the render output (and don't name a GLSL variable `half`, it's reserved).
- **Seek test:** render one frame alone with the same `--n` as the video (`--stills=4.2 --n=8`) and compare it with frame 126 of the MP4. They should look identical (above 40 dB with `ffmpeg -i a.png -i b.png -lavfi psnr -f null -`). If they differ, something isn't a pure function of `t`.
- **Re-render only what changed.** To fix one shot, render just that time range (`--from --to`) and splice it in. Don't move the audio.

## Stage 8: Present it (for reels)

Details and scripts are in `references/present.md` and `kit/present/`.

- **Option A, the real way:** play the 16:9 film full screen on a laptop and film the laptop with a phone, held vertically, for real light and real hand movement. Then add the title and caption in the edit, above and below the laptop.
- **Option B, the composite:** put the film onto the screen of a laptop photo (`laptop_reel.sh`), then copy real hand shake onto it from 20–30 seconds of your own phone footage (`phone_motion.py` → `handheld.py`). The title and caption stay still, because in a real edit they're added on top and don't shake.
  - Use a clean photo (or a generated image) of a laptop with a pure black screen. Fit the rectangle to the real display edges, not the bezel.
  - Frame it close, so the laptop fills most of the width. A far laptop looks distant on a phone.
  - Captions over dark scenes: a cream box with dark text, or white bold with a soft shadow. Black on black disappears.
- Never shake the film itself. The shake belongs to the phone that films it. Don't add a fake drift or wobble either: it reads as cheap. Use real hand motion, or none.
- Don't try to cut the background out of a real phone take to replace it. It failed badly. Use option B instead.

## Mistakes already made (don't repeat them)

- **Rebuilding when the user asked for a small change.** Change only what they named. Keep a backup copy of any file before editing it (for example `film.js.bak`).
- **Changing the camera or props during a lighting pass.** One kind of change per pass.
- **Assuming what a word means.** "Camera movement" on a phone-filmed reel meant hand shake, not a zoom push. "The previous video" meant an earlier film, not an earlier edit. If a word can mean two things, ask.
- **Tuning by numbers instead of by eye.** Hours were lost fitting a camera to the sub-pixel. Show a partial result early and let the user's eye decide.
- **Making the voice faster to fit the cut.** It sounded wrong. Move the pictures, add a pause, or re-record one line.
- **Sound effects that vanish on phones** (sub-bass whooshes) and typing that was too quiet. Check effects in the 1–8 kHz band.
- **Turning the master up to fix a quiet effect.** Fix the effect, not the master.
- **A loaded model that glowed in every colour** because it sat right in a lamp's beam. Lower that light's effect on that one material, rather than changing the model's colour.
- **Movie clips, copyrighted footage or someone else's logo in the film.** Make it your own.
- **Cloning a set mid-animation.** A clone copies whatever pose the original has at that moment, so a keyboard stayed invisible in the second room. Store each object's rest scale and reset it after cloning.
- **A busy "assembly" opening** where many parts fly together. It read as noise. One simple, squishy pop-in worked.
- **Caches that remember the last frame.** One "speed-up" cache froze 6 frames. Every frame must be drawn from `t` alone.

## Done means

- [ ] The plan was approved, and the film matches it (length, format, ending).
- [ ] Stills, then the preview, were shown before the final render.
- [ ] The final MP4 has the right frame count, and the audio runs the whole length.
- [ ] The voice sits at its natural speed, the captions land on the words, and there's a sound for every visible action.
- [ ] Loudness is about −14 LUFS, and it was checked on a phone speaker.
- [ ] Any loaded models are listed with a credit line for the caption.
- [ ] The user has the file paths and knows how to re-render one shot.
