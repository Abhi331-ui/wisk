---
name: cartoon-3d-short
description: Make a ~55-70 s vertical cartoon story short in the "2D characters in a colourful 3D world" style (flat bean-head cartoon cards with ink outlines and hair, set in an ULTRA-REALISTIC, highly detailed 3D world built to match the script: realistic sky, clouds, sunlight, trees, grass, wind, birds, animals, vehicles, ships and physics, depth-of-field backgrounds, gliding cameras, voice narration, synthesized SFX + march-style music), rendered with three.js inside Remotion. Proven on "The Bridge That Fell for a Song" (2026-10-31). Use when the user asks for another video "like the bridge video", "like the soldiers/bridge short", "in that cartoon 3D style", a history/science story short with cartoon characters in 3D, or says "use the cartoon short skill".
---

# Cartoon 3D story short (three.js + Remotion)

Proven example: **The Bridge That Fell for a Song**. It is an original 67 s short about the 1831 Broughton bridge and 74 soldiers marching in step.
- Code: `src/videos/bridge/` of your Remotion project (composition `BridgeShort`, 1080x1920, 30 fps).
- Script, voice and sound: `~/bridge-short/`.
- Style research: `references/`.

The style reference is a channel studied privately (`references/`: STYLE_BIBLE.md, reports/*.md, frames/).
- Those videos are private study material. Never upload, publish or send them.
- Never copy their scripts, characters or shots. Story, characters and voice are always OUR OWN.
- Never say the channel's name in a voice-over or description.

User rules that apply:
- No captions or labels in the video.
- English only.
- Voice: energetic and playful. Use ElevenLabs v3 tags like [excited], [playful], [mischievously], [cheerfully], [amazed], [sarcastic], [chuckles]. Never use [pause], [thoughtful], [sighs], [hesitates], [whispers], "..." or dashes, because they add silence.
- **Always remove silence from a voice-over the user sends** (see Pipeline step 3).
- **Camera follows the words:** every concrete word in the script drives the camera. "Trees" means the camera moves to the trees, "clouds" means it moves to the clouds. The camera never stops moving, sits at the characters' waist height, and lands on a new subject every ~1.5 s. Characters glow. See "Word-driven camera" below.
- **Stunning shots are the goal.** The user gives unlimited time for quality. Every frame should be good enough to be a wallpaper. Spend the time on more local still iterations (cheap), not on more agents or voice credits. See "Stunning shot standard" below.
- **Budget mode (the user is on a tight budget):** follow "Credit-saving rules" below on every video.
- Jokes are researched real facts.
- Standard mix: music +3 dB, SFX -6 dB, voice unchanged.
- Final export 2K vertical: 1440x2560, `--scale 1.3333`.
- One verifier pass per video (not every check), see Credit-saving rules.
- Save after every step.
- "Just do it" once the script is approved.
- **Ultra-realistic world:** every environment element (sky, clouds, sunlight, trees, grass, terrain, water, birds, animals, cars, ships, wind, motion, physics) must look super realistic and highly detailed. See "Ultra-realistic world and script-matched scenes" below. It overrides any conflicting "painted/storybook" value later in this file.
- **The whole world is real, all the way to the horizon.** Nothing is skipped because it's far from the camera. Distant mountains, cities, forests, sea, sky and crowds are fully built and life-like. See "Full world, no shortcuts" below.
- **Characters have hair.** Every character gets a hairstyle suited to their role, age and era. Hair moves.
- **Everything matches the script.** Every setting, prop, vehicle, animal, weather, time of day and action comes from the script of THIS video. Never reuse the bridge town or props unless the script calls for them.

## Ultra-realistic world and script-matched scenes (TOP PRIORITY, overrides older look values)
The characters stay 2D cartoon cards. Everything around them is photoreal, so the contrast is the style.

**0. Script → scene list first.** Before writing any world code, turn `SCRIPT.md` into `SCENES.md`: for every beat, list
location, era, time of day, weather, season, every object/vehicle/animal/plant visible, what moves and why (wind,
physics, characters), and which word it lands on. Every item on screen must be justified by a line of the script, and
every concrete noun/action in the script that can be shown should be shown. Check period accuracy (1831 = no cars;
a 1912 ship has coal smoke; etc.). Build `story.ts`, `build.ts` and `cast.ts` from SCENES.md, not from the bridge.

**0b. Full world, no shortcuts (applies to every shot).**
- Build the ENTIRE visible world, not just what's near the camera: every direction the camera can see, to the horizon.
  Distant mountains are real terrain (heightmap/erosion, snow, rock, forest cover), distant towns have real buildings
  with roofs, windows and chimneys, distant forests are real tree instances, the sea runs to a real horizon with waves.
- No flat painted backdrops, no blurry cards standing in for scenery, no empty ground, and no fog or blur used to HIDE
  missing detail. Fog and depth of field are only there for realism (aerial perspective, lens), and the detail behind
  them must exist.
- Distance LOD is allowed only when it's invisible: lower-poly models, baked impostors rendered FROM the real models,
  and grass that turns into a matching textured ground at range. The far result must look exactly like real distant
  scenery in a photo: correct scale, colour shifted by atmosphere, still with texture and shapes.
- Life in the distance too: smoke from far chimneys, far birds, boats on the lake, cars or carts on far roads (period
  correct), clouds and their shadows moving over distant hills, trees swaying on far slopes, distant people walking.
- Interiors are complete too: what's seen through windows and doors (streets, gardens, neighbouring buildings) is
  fully built, not a flat image.
- Check: every still is reviewed at 100 % on the far third of the frame as carefully as the subject. Anything that
  looks flat, smeared, repeated (visible tiling) or empty fails the quality gate.

**1. Rendering.**
- `renderer.toneMapping = ACESFilmicToneMapping` (or AgX), physically correct lights, `outputColorSpace = SRGB`,
  shadows on (PCFSoft / VSM, 2048-4096 maps, cascaded for big scenes), SSAO/GTAO, subtle bloom only on true HDR.
- Image-based lighting: a CC0 HDRI (Poly Haven) matching the script's time of day/weather via `PMREMGenerator`
  as `scene.environment`; sun direction matches the HDRI sun.
- Materials: `MeshPhysicalMaterial`/`MeshStandardMaterial` with full PBR sets (albedo, normal, roughness, AO,
  displacement) from Poly Haven / ambientCG (CC0) at 2K-4K. No flat colours, no painted canvas textures on the world.
- Models: detailed CC0 / properly licensed glTF (Poly Haven, Sketchfab CC0/CC-BY with credit, Quaternius, Kenney only
  as blockout). Optimise with Draco/meshopt + KTX2. Add bevels, wear, dirt, moss, puddles, decals so nothing looks new
  or clean-CG.
- World ink outlines are OFF by default (they make realism look cartoony). Ink stays only on character cards.
- Lens: real depth of field (bokeh), light filmic grade, slight chromatic aberration/vignette, motion blur on fast
  moves (accumulated sub-frames or a velocity pass). Keep grain off (file size).

**2. Sky, sun and clouds.**
- Physical sky (`three/examples Sky` Preetham/Hosek or an atmosphere scattering shader) or the HDRI as background.
- Volumetric or layered raymarched clouds that drift with the wind direction; cloud shadows sweep over the ground.
- Sun: correct elevation for the script's time, warm/cool colour shift, god rays / light shafts through trees and
  haze, aerial perspective (distance fog tinted by the sky, denser in the morning or over water).

**3. Vegetation, grass and wind.**
- One global `wind(t, pos)` function (direction + strength + gusts from noise) drives EVERYTHING: grass, trees,
  leaves, flags, hair, smoke, clouds, water ripples, dust. Strength follows the script (calm, breeze, storm).
- Grass: GPU-instanced blades (100k-1M) with vertex-shader sway, colour variation, tip translucency, clumps,
  flowers, weeds; far grass switches to a matching textured ground that still looks like grass in a photo (rule 0b); ground scatter (rocks, twigs, leaves).
- Trees: real models or procedural (ez-tree style) with trunk bend, branch sway and per-leaf flutter in the shader;
  subsurface-ish leaf translucency when backlit; species right for the place and season.

**4. Water.** Ocean/river via Gerstner/FFT waves, reflections + refraction, foam at shores and wakes, caustics in
shallows. Ships ride the waves (buoyancy: sample wave height at hull points → pitch/roll/heave), leave wakes and smoke.

**5. Living things and vehicles.**
- Birds: flocks with boids (separation/alignment/cohesion), animated flapping/gliding glTF, scale-correct, react to
  events (scatter on a loud sound or impact).
- Animals: rigged glTF with real gait cycles (walk/trot/run blended by speed), feet planted on terrain, head/ear/tail
  secondary motion, idle breathing.
- Cars/carts/trains: wheels rotate by distance travelled (`angle = dist / r`), suspension bounce, dust/exhaust,
  headlights when dark, correct period models.
- Background life: smoke from chimneys, drifting dust/pollen in sunbeams, insects, flags, laundry, ambient people.

**6. Physics.** Use a real solver for anything that falls, breaks, collides or floats: Rapier (`@dimforge/rapier3d-compat`)
or cannon-es, **deterministic and pre-baked** (simulate frame by frame at a fixed 1/30 or 1/60 step, cache transforms
per frame to JSON, play back by frame) because Remotion renders frames out of order and in parallel. Destruction via
pre-fractured meshes; cloth (flags, sails) via verlet; particles (splashes, debris, sparks, dust) seeded per event.

**7. Characters with hair (still 2D cards, now with realistic motion).**
- Add a hair layer in `toon.ts`: a hairstyle library (short crop, side part, curly, bun, ponytail, long, braids,
  beard/moustache, bald with sides, period styles like powdered wigs, bonnets, military cuts). Draw with the same plum
  ink outline, 2-3 tones of the hair colour, a few strand lines, and hair layered behind and in front of the head
  (back hair under the head, fringe over it). Hats sit on top of hair.
- Hair moves: back strands/ponytails/long hair swing with walk bob, head turns and the global `wind()`, with spring
  lag (a damped spring per strand group); bounce on impacts.
- Pick hair per character from SCENES.md (age, job, era, personality); vary colour and style across crowds.
- Movement: weight shift, anticipation, follow-through, feet planted on the real terrain height, shadows from the real
  sun, cards receive the scene lighting so they sit inside the photoreal world.

**8. Detail and verification.**
- No empty or flat area in frame: every shot has foreground, midground and background detail.
- Verifier checks every still for: realism of sky/light/materials/vegetation/water, wind consistency across all
  moving things, physics plausibility, hair present and moving on every character, and that every object on screen
  matches SCENES.md / the script.
- Cost: photoreal scenes render much slower (expect 0.5-2 fps at 2K). Use instancing, LODs, frustum culling and
  baked physics; render stills at 0.5 for look checks.

## Word-driven camera (TOP PRIORITY, overrides older camera values)
1. **Every word has a camera meaning.** From `words.json`, tag every concrete noun/verb in the script (trees, clouds,
   fridge, ceiling tile, iceberg, phone ringing, cat, croissant...) with a camera target in `SCENES.md`: which object,
   and which word it lands on. The camera arrives on that subject 0-3 frames before the word is spoken. Abstract
   words go to the character saying or feeling them (face/gesture), or to an object that shows the idea. If a word
   names something, it MUST be on screen when it's said, with the camera moving to it.
2. **A new beat every 1.5 s (45 frames at 30 fps).** The camera reaches a new subject or framing about every 1.5 s through
   the whole video. A 60 s short has ~40 camera beats. Build `CAMS` as a key every ~45 f, snapped to the nearest word
   onset in `words.json`. Fast words can pull beats closer (≥ 30 f). Never leave the same framing for more than 60 f.
3. **The camera never stops.** No static holds, ever: between keys it always drifts, pushes, orbits, cranes or tracks
   (minimum ~0.3 %/f push or ~0.1°/f orbit). Get from one subject to the next with continuous moves: glide, whip pan
   with motion blur, follow an object (a phone call travelling down a wire, a sound wave through water), fly-through
   (window, ceiling tile, leaves). Hard cuts only at a big place or time change, max ~2 per video, with a whip or flash.
   Use Catmull-Rom splines through the keys (position AND look target) so speed never drops to zero at a key.
4. **Waist-height camera.** The default lens height is the characters' waist (≈ 0.9-1.1 m for adults, lower for kids,
   cats and raccoons: waist of the subject in frame), looking level or slightly up, framing waist-up on characters.
   Go higher only when the word demands it (a word about clouds, sky, birds, rooftops, an aerial establishing line):
   crane up to it, then come back down to waist height for the next character beat.
5. **Characters glow.** Every character card gets a soft glow: a blurred halo of the card's silhouette (Gaussian ~12-20 px at
   1080, opacity .35-.5, warm white by day / peach at golden / cool at night) behind the card, plus a subtle inner
   rim light. It must be a SOFT blurred halo, never a hard offset copy of the outline (that reads as a picture frame).
   Brighten it a little on the character's key word. The glow lives on the card layer, so world ink/blur don't touch it.

## Stunning shot standard (every camera beat must pass)
**Composition**
- Three depth layers in every frame: a sharp or softly blurred FOREGROUND element (leaves, grass, a branch, a window
  frame, a mug), the subject in the midground, and a detailed, atmospheric background (mountains, skyline, sea, sky).
- Rule of thirds / golden ratio for subjects and horizons. Leading lines (roads, rows of trees, rails, wakes, shelves)
  point to the subject. Never centre the horizon; tilt it 3-6° only for drama or comedy beats.
- Frame within a frame whenever the set allows it: doorways, windows, branches, the fridge door, a porthole.
- Scale shots: tiny character against huge nature (ocean, mountains, iceberg) for the "wow" lines.
- Vertical 9:16: put the subject in the upper-middle third and use the height (tall trees, sky, depth below the surface).

**Light (the biggest lever)**
- Prefer golden hour, blue hour, backlight and side light over flat noon. Backlit subjects with rim light and glowing
  translucent leaves, grass and hair. Visible light shafts (god rays) through trees, windows, dust and water.
- Motivated light everywhere indoors: window light pools, fridge light spill, TV glow, a phone screen on a face.
- Contrast with soft rolloff: deep, rich (not crushed) shadows, bright highlights with bloom only on true light sources.
- Colour story per video: one dominant palette plus one complementary accent (teal/orange, blue/gold, green/pink).
  Each act shifts the palette (day → golden → night) with the story.

**Lens and movement**
- Lens choice per beat: 18-24 mm for scale and wides (with parallax), 35-50 mm for characters, 85-135 mm for compressed
  reveal shots and beauty close-ups. Shallow depth of field with round bokeh on close-ups, deep focus on wides.
- Movement with parallax: always move the camera THROUGH space (dolly/crane/orbit), not just a rotation, so the foreground
  slides against the background. Speed ramps: ease into fast whips, then decelerate on the subject.
- Atmosphere in every shot: haze, mist, drifting particles (dust, pollen, spray, snow), moving clouds, wind in foliage.
- Subtle lens character: a little chromatic aberration at the edges, vignette, sparing anamorphic-style flares on
  direct sun or bright lights, and motion blur on fast moves.

**Signature shots:** each video plans 3-5 hero shots in `SCENES.md` (the shots that become the thumbnail and the
loop moments) and gets the most detail and iteration time.

**Quality gate (cheap, local, repeat until it passes):** for every camera beat, render one still at 0.5 scale and check it
against this list: 3 depth layers? motivated, dramatic light? clear focal point within 0.5 s? atmosphere? nothing
flat, empty, clipped or CG-clean? word target on screen? Fix and re-render until every beat passes. Only then use the
single verifier pass (Credit-saving rules), on contact sheets of the hero shots.

**Hardware:** photoreal work needs a GPU (WebGL with hardware acceleration) and access to CC0 asset hosts (polyhaven.com,
ambientcg.com). Without a GPU, render with `--gl=angle`/swiftshader at a much slower rate and build assets procedurally.
Final 2K renders belong on a GPU machine.

## Credit-saving rules (always on)
**ElevenLabs credits:**
- Default: the user generates the voice themselves from the tagged script and sends the file. Don't generate voice unless they ask.
- If asked to generate: ONE take per script (`generations_count: 1`, which overrides the connector's default of two), the whole script in
  one call, never a retry call. To fix one line, regenerate only that line and splice it in, never the full script.
- Never generate test or preview voices, voice designs or SFX/music with ElevenLabs. SFX and music are synthesized locally (step 8).
- Word timings: use local speech-to-text (e.g. faster-whisper/whisper.cpp on CPU), not ElevenLabs transcription.

**Claude usage:**
- No fleet of sandbox agents and no Opus max on every check. Work in the main project, with at most ONE verifier agent per video
  (on a 3-still sheet, ≤150-word verdict), and only after stills look right to you.
- Stills: 3-4 frames per look check at `--scale 0.5`, not full sweeps. Only re-render the shots that changed.
- Reuse code across videos (wind, sky, water, hair, boids, physics) instead of rewriting it. Build shared modules once.
- Keep replies and file reads short. Don't re-read big files you already have in context.

## Pipeline
1. **Topic and facts.** Pick one surprising true story with a physical cause and effect (it should be visual), plus a simple everyday analogy that explains it.
   - Write the facts with their source at the top of `SCRIPT.md`.
2. **Script** (~3.7 words/s, 55-70 s). Beat formula from the bridge short:
   - **Hook:** the absurd fact in one line ("Seventy-four soldiers knocked down an iron bridge just by walking across it.").
   - **Setting:** year, place, pride.
   - **Action:** escalation over three or four beats, each a little bigger.
   - **Snap:** the moment it breaks.
   - **Deadpan double line:** "Luckily ... / Unluckily ...".
   - **Explanation:** one physics idea through an everyday analogy (the kid on a swing).
   - **Consequence:** the rule it created.
   - **Callback twist:** the ending.
   - Never describe on screen what the viewer already sees.
3. **Voice.** Record or generate `voice.wav`, then make its word timings `words.json` (any speech-to-text with word times).
   - **Whenever the user sends a voice-over, remove the silence first, automatically, without asking:**
     `python -I templates/scripts/trim_silence.py <their file> <project>/voice/voice.wav`
     It trims the start and end, and shortens every pause to ~0.14 s (`--min-gap 0.08 --keep 0.04`) without cutting words.
     Read its report. If it warns about a long gap that's left, listen there: a breath or room noise is above the threshold.
     Re-run with `--thresh-db -40`. Keep the user's original file untouched. Make `words.json` from the TRIMMED file only.
   - Put them in the project folder, e.g. `~/bridge-short/voice/`.
   - Hand-fix the word timings. Everything is timed to words.json.
4. **Shot plan** in `story.ts`: copy `templates/bridge/` (the final bridge source, same as `src/videos/bridge/` of your Remotion project) to `src/videos/<name>/`, register a new composition next to `BridgeShort` in `src/Root.tsx`, and rename it.
   - `SHOTS`: id, a/b frames, light day/golden, crowd mode, `tau` story time.
   - `XFADE`: crossfades at place/time changes.
   - `FLASH_AT`: a white flash after the hook.
   - `CAMS`: per-shot keys `{f, dur?, cut?, s: f => {pos, look, fov, roll}}`.
   - `KICKS`: impact flip-shakes.
   - `DOF`/`dofAt`: lens blur per beat.
   - `FOREGROUND`: near framing props.
   - Every visual reaction lands 0-3 frames before its word.
   - `CAMS` follows the "Word-driven camera" rules: a key per ~1.5 s on a word target, waist height, never static.
5. **World** (build to SCENES.md and the ultra-realistic rules above; the bridge files are only a code skeleton).
   - `lights.ts`: LIGHTS plus the LOOK sky/river/cloud palette per light.
   - `shade.ts`: two-tone shading and `untone()`.
   - `build.ts`: town, houses and Kenney CC0 kit props, recoloured, with sight-line culling of anything blocking a camera.
   - `paint.ts`: HD Canvas2D painted textures with seams painted in as dark tints.
   - `world.ts`: sky shader, fog = horizon colour, river, per-frame posing, sun frozen per shot and camera-relative.
6. **Characters** (every character has hair from the hairstyle library; hair and clothes respond to motion and wind).
   - `toon.ts`: the Canvas2D `Pen` drawing API, 600x1000 design canvas, soles at y = 975, bean heads, stick limbs, plum variable-width outline, face library.
   - `cast.ts`: camera-facing billboards, crowds, effect cards, blinks, walk cycles. All billboards go on the `NOINK` layer.
   - `cardshade.ts`: cards lit by the scene light, no emissive.
7. **Post** (`Bridge.tsx` + `ink.ts` + `lensblur.ts` + `grade.ts`).
   - Composer order: ink → lens pre → lens main → bloom → NEUTRAL tone map → grade (MSAA 4).
   - Every pixel parameter scales with output height / 1920.
8. **Sound** (`~/bridge-short/audio/`: timeline.py, sfx_gen.py, sfx.py, music.py, instruments.py, dsp.py, mix.py).
   - Event table → synthesized SFX plus an original score ducked under the voice.
   - Output: mix.wav (48 kHz, exact length), stems and cues.md.
   - Lock the picture's time constants before the sound is made. Any later timing change means re-running the sound.
9. **Look checks.** Run `node scripts/bridge-stills.mjs out/<name>/x_ 100,400 0.5`.
   - Set `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx` to render a sandbox copy.
   - Make side-by-sides against reference frames with `python scripts/sbs_sheet.py out.jpg --ours ... --ref ...`.
   - Send them to an Opus max verifier: 1-3 images, a ≤200-word verdict.
10. **Final render.**
    - `npx remotion render src/index.ts <Comp> out/<name>/video.mp4 --codec h264 --crf 16 --scale 1.3333`
    - Mux with `-map 0:v:0 -map 1:a:0` (Remotion writes a silent audio track).
    - QA: `python scripts/short_qa.py final.mp4 out/<name>/qa shots.json` checks every frame for black, white, frozen and pop frames, plus loudness and sheets.
    - Fix anything it finds, then run a deep Opus audit.
11. **Deliver.** SendUserFile the final mp4, update memory, write notes.

## Final look values (bridge after 4 verifier rounds; all in `templates/bridge/`)
> Legacy painted-world values. For the world, the ultra-realistic section above wins wherever they conflict (ink on world, painted textures, storybook albedos). Character card values still apply.
Start every new short from `templates/bridge/` (copy to `src/videos/<name>/`): the look lives in these values, the
story lives in story.ts / build.ts layout / cast.ts roles. Opus max scores at the end: colour day 7, golden 5-6,
lighting 5-6, ink 6, textures 5-6, characters 7, depth 6-7, composition 6-7 (from 5/3/4/5/4/7/4/6 at the start).
- **Light presets** (`lights.ts`, sun camera-relative and frozen per shot):
  - day: az 75 / el 48, lit [1.58,1.5,1.33], shade [.30,.29,.36], lift [.05,.06,.11] (cool tint ONLY in shade), sky
    top #3e7fd2 → horizon #b8d0ec, fog = horizon, 25→300 m, uSat 1.08, ~15 % blue haze past 60 m.
  - golden: az 6 / el 7 (backlit low sun), key toward #FFB36B ×1.5, violet-blue shade (facade ≈ #444380), sky
    #ffc47c → #8a6f8a, peach fog only past 50 m, sun disc #ffcf9e + bloom, contact blobs + real card shadows.
- **Albedos** (`paint.ts`/`build.ts`): muted brick / cream / ochre / terracotta houses with plinth, cornice, sills,
  hoods, door step, chimney + pot, heights 7 / 8.4 / 9.8 m; warm grey/beige stone (saturation −35 % from "storybook");
  ochre wood deck C* ~51-58 with near-black seams; iron dark and desaturated. Never lemon, never lavender lit faces.
- **Ink** (`ink.ts`): #030303, 5.1 px near (6 m) → 3.3 px far (90 m) at 1080x1920, creases ×0.8 from 35°, depth
  jumps from 1 %, fog tint 0.3 only far; character cards on layer `NOINK` (they carry their own plum ink).
- **Lens** (`lensblur.ts` + `dofAt` in story.ts): cInf px at 1080: hook/river CU 15-16, close-ups 12-14, MS 10-12,
  park 7, golden sway 5, wides/aerials 0. Focus on the eyes of the front row.
- **Post** (`Bridge.tsx`): ink → lens pre → lens main → bloom (thr 1.0, int .5, 6 levels, radius .6) → NEUTRAL tone
  map → grade; MSAA 4. Film grain exists but is OFF (reference measures no grain; it quadruples the file size).
- **Characters** (`toon.ts`/`cast.ts`/`cardshade.ts`): bean heads h/w .94, plum ink #241726, eyes .26 W apart, no blush,
  14 expressions; adults 3.5 head-heights; walk bob 5 %, lean 1-7°, planted 0.8 m stride; blinks 0.5-2.3 s; tight
  contact shadow ~.5 under the feet + sun-direction tail by day; golden rim inner only (never an offset outer copy).
- **Camera** (`story.ts`, legacy; "Word-driven camera" wins): cuts on big jumps, smootherstep glides 18-40 f, every hold creeps (no static hold ≥4 f),
  flip kicks decaying over 7 f on impacts, 4-4.6° rolls, foreground props (`FOREGROUND`) in ~1/3 of shots.

## Look targets (measured from the reference; see references/reports/)
- **Ink:**
  - World lines: about 3 px at 1080 wide, near-black #0b0a0c, nearly constant with distance. Silhouettes, depth jumps and normal creases only. No line on wall/floor joins or the horizon. Character cards are never outlined by the world ink.
  - Character ink: dark plum #201628-#2f1d28, thicker on the bottom/shadow side.
- **Colour:**
  - Day median luma ~.57. Non-ink p5 ~.23 (no crushed blacks). Lit chroma C* p90 ~55. Day sky top ~#5e93d9, horizon 1.28x brighter.
  - Golden: peach horizon #ffd08a, violet-blue shadows (never brown), backlit sun.
- **Depth:**
  - DOF on about 1/3 of screen time (CU, MS, inserts), cInf 10-16 px at 1080, focus on the eyes. Establishing and wide shots stay sharp.
  - Fog = horizon colour, 25→420 m day, 20→360 m golden.
  - Bloom only on HDR emissives: threshold 1.0.
- **Camera:**
  - Hard cuts on big jumps. Everything else is a smootherstep glide of 18-40 f, peak ≤ 25 px/f at 720p.
  - Every hold pushes in 0.15-0.35 %/f, with 0.6 %/f on punch words.
  - Rolls of 4-5°.
  - No hand-held float. Impact shakes flip sign every frame and decay over 7 f.
- **Characters:**
  - About 3.5 head-heights tall, legs 1.4 HH.
  - Stick limbs about 0.055 of head width, ink-dot hands.
  - Bean head (h/w ~0.93, narrower chin, pointier crown).
  - No blush or eye highlights. Faces at brightness ~.93.
  - Walk bob 3-7 %, lean 1-7°, planted feet.
  - Blinks every 0.5-2.3 s, lasting 4 f.

## Look-match loop (how the bridge look was reached; reuse for any "make it look like X" pass)
1. **Measure the reference first.** One analysis agent per topic (motion, depth, textures, characters, lighting, outlines, grade), each writing numbers, not adjectives, to `references/reports/<topic>.md`. Shared brief: `compare/CONTEXT.md`. Reports are the source of truth for every agent after.
2. **Sandboxes, one owner per file.** Copy the project folder to `src/videos/<name>_{cam,world,mat,char,post}` with entries `src/sandboxes/<n>/index.tsx` (same `index.tsx` as main, only the import path changed). Ownership used for the bridge:
   - cam: story.ts (camera keys, cuts, kicks, DOF table, foreground props)
   - world: world.ts, lights.ts, shade.ts, grade.ts (sun, sky, fog, river, colour, grade)
   - mat: paint.ts, build.ts (painted textures, buildings, props)
   - char: toon.ts, cast.ts, cardshade.ts (character drawing, posing, card lighting, fx cards)
   - post: ink.ts, Bridge.tsx, lensblur.ts (outline pass, composer, lens blur, bloom)
   Agents only edit their own files in their own sandbox and render stills with `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx node scripts/bridge-stills.mjs out/<name>/<n>/x_ <frames> 0.5`.
3. **Merge** with `python scripts/bridge_merge.py [cam,world,mat,char,post]` (backs main up to `backup/bridge_<time>/`, copies owned files only). Then `npx tsc --noEmit` (filter to the project folder), then **re-sync every sandbox from main** (`cp -f src/videos/<name>/* src/videos/<name>_<n>/`) before the next round.
4. **Verify** with a fresh Opus max agent: side-by-side sheets (`python scripts/sbs_sheet.py out.jpg --ours a b --ref r1 r2`), score each area out of 10 (colour day / golden, lighting, ink, textures, characters, depth, composition) plus a numbered fix list with frame numbers. Map each fix to the file owner and resume that owner's agent with SendMessage (keeps its context). Bridge scores: round 1 5/3/4/5/4/7/4/6 → round 2 5/4/5/6/4/7/6/6 → round 3 see notes.
5. Contracts between owners live in exported constants (e.g. `NOINK` layer from ink.ts, `dofAt`/`FOREGROUND` from story.ts, `LIGHTS`/`LOOK` from lights.ts). Changing a contract means telling every owner that reads it.

## Gotchas
- Kenney nature-kit materials are teal: recolour them by material name in build.ts.
- Cameras end up inside houses: the sight-line culler in build.ts/world.ts removes anything blocking any camera ray.
- Ink in the same merged effect pass as DOF gets overwritten. Ink must be its own pass before the blur.
- Pixel-sized post parameters must scale with resolution: stills are at 0.5, the final at 1.333. R3F clamps dpr to ≥ 1, so `--scale 0.5` stills still render a 1080x1920 buffer.
- **Disk:** every Remotion bundle copies `public/` (~1.3 GB) into `the temp folder\remotion-webpack-bundle-*` and never deletes it. 60+ GB filled the system drive during the bridge passes and a render died with ENOSPC. Always render with `export TEMP='<big drive>/remotion-tmp' TMP='<big drive>/remotion-tmp'` (bridge-stills.mjs sets it itself) and ask the user before deleting old bundle folders in the shared the temp folder (auto mode blocks the sweep). <big drive>/remotion-tmp fills too (~500 folders / 110 GB after the 4 bridge rounds): when a project is finished and nothing is rendering, delete its `remotion-webpack-bundle-*` and `puppeteer_dev_chrome_profile-*` folders there.
- In JS strings write `"<big drive>/remotion-tmp"`, never `"<big drive>\remotion-tmp"` (`\r` becomes a carriage return).
- Remotion writes a silent audio track: mux with `-map 0:v:0 -map 1:a:0`.
- Sub-agents can't write report files in this harness: ask them for a ≤150-word final message and save it yourself to `out/<name>/<n>/REPORT.md`.
- Scratch `.ts` files inside `out/` break `tsc`: name them `.txt`.
- 2K renders run ~4 fps (≈10 min for 67 s). Stills at 0.5 take 3-8 s each after a ~40 s bundle.
- Film grain at 2.5 % made the 2K file 910 MB instead of ~250 MB and will turn to mush on YouTube; the reference has none. Keep it off.

## Readability traps the verifier caught (check every new prop/shot for these)
- **A swing drawn as one rope that disappears behind the kid reads as a HANGING.** Always two ropes to a wide plank
  with the kid between them (`swingKid` in toon.ts), and a frame whose legs clear the arc (A-frame at each end).
- Props or flotsam closer than ~2 m to a lens become huge cut-off blobs at the frame edge. When a camera moves, re-check
  every prop near its new position (the river cameras moved into the floating hats).
- A foreground bush cut by the frame edge reads as a "green ball"; a foreground prop must be recognisable or gone.
- Flags: red + yellow star/diamond reads as Vietnam's. Use a period-correct flag (St George's cross for England 1831).
- Painted signs lit by a side sun go grey-blue and unreadable: give the sign face an unlit material.
- Golden rim light done as an offset outer copy turns every hat into a picture frame: inner rim + the soft blurred glow halo only.
- Balcony/railing rails at chest height through characters: put the lens ~2.5 m up so rails cross legs, not torsos.
- Flat holds read as freezes in QA (frozen span ≥12 f): every hold needs a creeping push-in.
