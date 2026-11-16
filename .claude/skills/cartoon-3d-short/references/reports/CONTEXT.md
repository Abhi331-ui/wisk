# Look-match study: shared context for every agent (read fully before starting)

## Goal
Our original 67 s vertical short "The Bridge That Fell for a Song" (1831 Broughton bridge, 74 marching soldiers) is
rendered in three.js and currently looks flat, pastel and cheap next to the reference channel (the reference channel, studied
privately). The user wants our picture to be as close as possible in QUALITY and STYLE: colourful, high contrast,
"targeted" colours, black ink outlines on the 3D world, painted textures, real shading/lighting on characters and
world, deep blurred backgrounds, lively movement, better character shapes (heads not perfect circles, better body
structure). Story, script, characters and voice stay OURS: derive general rules and numbers, never trace or copy his
specific characters, props or shots.

## Reference material (private study only: never upload, publish or send any of it anywhere)
- 20 reference shorts, 720x1280, 30 fps: `references/vids/NN_<id>.mp4` (01 = newest).
- Contact sheets, each = 2 s = 60 frames: `references/measure/NN_<id>_sheets/sNN.jpg`.
- Earlier summary: `references/STYLE_BIBLE.md`. Quick overview sheet: `references/refs_sheet.jpg`.
- Extract frames yourself, e.g. `ffmpeg -v error -ss 12.4 -i references/vids/01_Mz72MuPgnGY.mp4 -frames:v 1 out.png`
  (use PNG for measurements; JPEG is fine for viewing). Crop/zoom with PIL (nearest-neighbour upscales for line widths).
- Burned-in captions: one white bold word with a black outline, centred, roughly 60-74 % of frame height. MASK that band
  (or detect the white+black text) before any statistics, and do not mistake caption outlines for scene ink lines.

## Our current frames (state before this pass)
- `your Remotion project/out/bridge/test/` b_*.jpg, c_*.jpg (540x960 stills, frame number in the name), contact sheets
  `sheet_c1.jpg`, `sheet_c2.jpg`. Shots: 1-7 soldiers marching on a plank suspension bridge (day), 8 bolt snaps + deck
  drops, 9-10 soldiers sitting in the river, 11-13 golden hour (bridge, park swing, side view), 14 bank + officer
  hammering a sign, 15 tourists strolling (day).
- Do NOT render new stills and do NOT edit anything under `your Remotion project` (other agents and the lead are editing it).

## Our stack (so recommendations are implementable)
- `your Remotion project` Remotion 4.0.290 + three 0.175 + @react-three/fiber 9.1.2 + @react-three/postprocessing 3.0.4 +
  postprocessing 6.37.2, composition `BridgeShort` 1080x1920 30 fps. Source in `src/videos/bridge/` of your Remotion project:
  - `story.ts` timeline, cameras (CAMS), lights (LIGHTS day/golden: sun dir/colour/intensity, hemisphere, fill, sky colours).
  - `world.ts` World: gradient sky sphere, HemisphereLight + DirectionalLight sun (4096 shadow map) + fill, Fog(90,560),
    sprite clouds, water mesh, procedural bridge, per-frame posing; `build.ts` town (boxy gabled houses with canvas
    facade textures, Kenney CC0 low-poly GLB props converted to MeshLambertMaterial); `paint.ts` procedural Canvas2D
    textures (grass, cobble, stone, planks, beam, water, roof, brick, chain, facades).
  - `toon.ts` characters drawn with Canvas2D (a `Pen` helper: poly/ell/line/stroke) on a 600x1000 design canvas,
    soles at y=975: bodyFront / bodySide, outfits (rifleman with shako, officer, kid, parent, townsfolk), expressions,
    effect sprites (notes, bursts, splash, stars...). Current heads are perfect circles, thick uniform outline, flat fills.
  - `cast.ts` sprite pool; each character = camera-facing billboard plane, MeshLambertMaterial with the drawing as
    map + emissiveMap (emissive about 0.36, so it looks pasted-on), alphaTest 0.5; casts shadows via a depth material.
  - `ink.ts` current outline: screen-space Laplacian of 1/viewZ only (no normals), threshold 0.06 -> almost no lines.
  - `Bridge.tsx` EffectComposer chain: Ink -> DepthOfField -> Bloom(0.3, threshold 0.86) -> ToneMapping NEUTRAL, MSAA 4.
- Tools on this machine: python (numpy 2.4, PIL 12, scipy 1.18; no OpenCV), ffmpeg/ffprobe. Do not pip-install anything,
  do not download code or tools from the internet.

## Deliverable (each agent)
1. Work only inside `references/<your-topic>/` (scripts, crops, side-by-side images).
2. Write `references/reports/<your-topic>.md`:
   - measured numbers (tables) from MANY reference frames across the 20 videos (frame-by-frame where it matters),
     and the same measurements on our stills, with the gap stated plainly;
   - paths of the comparison crops / side-by-sides you made;
   - a concrete implementation recipe for OUR stack: exact parameter values, hex colours, GLSL / TypeScript snippets,
     which file/function to change;
   - the top 5 changes ranked by visual impact.
3. Final message: at most 200 words summary + the report path.
