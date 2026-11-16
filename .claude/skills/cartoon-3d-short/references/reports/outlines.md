# Outlines (black ink lines on the 3D world): reference vs ours

Work folder: `references/outlines/` (scripts, crops, sheets, results, recipe, toy test harness).
Private study only. Nothing under `your Remotion project` was edited; no new stills were rendered.

## 1. The gap in one paragraph

In the reference, **74 % of the geometry edges I scanned carry a black line (36 of 49)**: silhouettes against sky,
depth jumps between objects, convex creases (box corners, table tops, wall tops, window frames) and contacts
(object on floor). Lines are **~3 px wide at 1080p**, near-black in focus, crisp (anti-aliased only), and they
**stay about the same width on screen** as objects get smaller, so the depth of field later blurs them along with
the background. **In our stills, 0 of 20 scans across the same kinds of edges show a line.** The "lines" you see
in our frames are the characters' own Canvas2D outlines and texture strokes. The current `ink.ts` cannot work in
the current chain: the DOF in the same merged EffectPass erases it, and its Laplacian of 1/z cannot see creases at
all (see section 4).

## 2. Measurements

Method: perpendicular luma scans (averaged over 5 px across the scan, 0.25 px steps) through single edges.
`EW` = equivalent full-ink width (area of the dip / (background - ink luma 12)), which does not depend on blur.
A line counts as "present" if it is at least 35 % darker than the lighter side and FWHM ≤ 5 px at 720p. Reference
frames are 720x1280, so x1.5 gives 1080p. Ours are 540x960, so x2. The caption band (60-74 % of height) is masked
in all frame statistics. Caption outlines were measured separately only for calibration.
Scripts: `scanline.py`, `scans.py`, `scan_defs.py` (66 reference scans), `ours_scan_defs.py` (20 of ours),
`rise.py`, `density.py`, `edgeink.py`, `lineprof.py` (first pass, 32 boxes). Raw results: `results/*.json|csv`.

### 2.1 Reference, per edge type (66 scans, 8 videos with scans + 6 more in the first pass)

| edge type | scans | with line | EW @1080 px median (IQR) | FWHM @1080 | core luma median | core RGB median |
|---|---|---|---|---|---|---|
| depth jump (object vs farther object) | 26 | 19 | **3.09** (2.38-4.46) | 3.4 | 19 | (48,13,9) |
| silhouette vs sky | 8 | 6 | **3.04** (2.06-3.73) | 3.4 | 51 | (68,46,38) |
| convex crease (same object, no depth jump) | 10 | 8 | **2.17** (1.85-3.16) | 3.2 | 34 | (50,29,10) |
| contact (object meets floor or ground) | 5 | 3 | **2.42** (1.70-3.04) | 3.4 | 30 | (58,24,17) |
| painted texture line (planks, tiles, grout) | 7 | 1 | 3.66 (soft) | 6.4 | 68 | (111,60,17) |
| expected but absent: wall/floor, baseboard, sea horizon | 3 | **0** | - | - | - | - |
| character outline (drawn, not from the 3D) | 5 | 4 | 4.57 (3.57-5.17) | 5.4 | 41 | (42,40,33) |
| caption outline (calibration) | 2 | 2 | 5.87 | 5.4 | 0 | (0,0,0) |

* **Colour:** the ink is black or near-black. In-focus near lines reach luma 0-10 (v15 arch: core 6-7). The
  coloured core RGB medians come from 4:2:0 chroma subsampling, which smears the neighbouring surface hue into
  lines 2-3 px wide, and from DOF and atmosphere lightening the farther ones. Use a neutral near-black, `#0b0a0c`.
* **Softness:** the 10-90 % rise of world lines is **1.45 px @720** (median, n=46 flanks), against **1.58 px** for
  the crisp vector captions. So the lines are as sharp as the encode allows: anti-aliased, not blurred. They only
  go soft where the DOF blurs the whole background (v12 rock arch, v07 near snow mound).
* **Distance:** geometry lines near / mid / far have median EW **3.09 / 2.82 / 3.04 px** (n = 17 / 15 / 4 with
  line). The clean series is v15's receding arches: **3.36 → 2.82 → 2.15 px**, with core **7 → 16 → 50**, while
  the arch geometry shrinks about 4x. So the width stays nearly constant on screen, with a mild thinning and
  lightening far away. It does not scale with perspective.
* **Doubles:** none. The world ink never draws a box around the character cards, and characters are not
  outlined twice. Character outlines are their own drawn, thicker strokes (4.6 px).
* **Which edges get lines:** silhouettes, depth jumps, convex creases and object contacts do. Room-shell concave
  junctions (wall/floor, baseboard) and the sea horizon do not. Contacts behave like an object's own contour
  meeting the floor (barrel/deck 3.7 px, stump/floor), and they are weak for walls standing on grass.
* **Texture lines are painted.** Plank seams, tile grout and ceiling grids are soft, wide, tinted dark bands
  (core luma ~68, dark brown on wood). They scale with perspective and blur with DOF. Only 1 of 7 passes the
  "line" test. They are part of the textures, not the ink pass.

### 2.2 Ours, same scans (20 scans on c_1042, c_1050, c_1075, c_140, c_1340, c_1450, c_1800, b_470)

| edge type | scans | with line |
|---|---|---|
| silhouette vs sky (tower cone, parapets, roof) | 6 | **0** |
| depth jump (lamp posts vs water, wheel rim, far towers) | 10 | **0** |
| convex crease (quay wall top, railing box, deck beam) | 3 | **0** |
| contact (plinth on cobble) | 1 | **0** |

### 2.3 Whole frames (all 20 reference videos, one frame every 3 s ≈ 357 frames; 39 of our b_/c_ stills; 540x960 scale)

| metric | reference | ours | ours, world shots c_ |
|---|---|---|---|
| dark-stroke pixels (`density.py`), line % / black % | 1.70 / 0.81 | 1.95 / 0.96 | - |
| share of strong edges with ink on them (`edgeink.py`) | **45.1 %** | **33.4 %** | **27.4 %** (world-only shots 6-23 %) |

Our stroke density looks similar only because of the character outlines and the painted facade strokes. On the
3D edges themselves, ours have no ink.

## 3. Technique decision

* The lines sit on **geometry edges** (contours, silhouettes, depth jumps, convex creases, contacts). Their
  **screen width is nearly constant** (3.4 → 2.2 px from near to far). They are **anti-aliased and crisp**,
  near-black, applied **before the depth of field** (they blur with the background), and **not drawn on the
  character cards**. This looks like Blender Freestyle or Grease Pencil Line Art output (constant-pixel thickness
  for contour, crease and border lines) composited before the DOF.
* **Not an inverted hull.** A hull only gives silhouettes, scales with perspective, cannot draw crease or contact
  lines, and would outline the billboards.
* **Our equivalent:** a screen-space **depth + normal edge pass**. Render a world-only normal and depth buffer,
  detect edges with a scale-normalised depth test and a normal-angle test, set the width with the sampling
  radius, anti-alias, and composite before the DOF. Painted texture lines stay in `paint.ts`.

## 4. Why ours shows almost none (old `ink.ts` + `Bridge.tsx`)

1. **DOF erases it.** R3F's `<EffectComposer>` merges consecutive Effects into one EffectPass, so Ink, DOF, Bloom
   and Tone run in one shader. The DOF output is `inputColor*(1-cocFar) + colorFar`, where `colorFar` is blurred
   from the EffectPass input buffer, which has no ink. So wherever the CoC > 0, the ink is replaced by un-inked
   blur. Most of the world is out of focus, so most lines vanish, and the background has none at all.
2. **Creases and contacts are mathematically invisible.** On a plane, the Laplacian of 1/z is 0. Across a box
   corner it is only |tanθ1 − tanθ2| / f_px (f = 2637 px for a 40° FOV at 1920 px). For a 45° corner that is
   **7.6e-4, 79x below the 0.06 threshold**. Only real depth jumps can fire.
3. **The two-sided Laplacian** puts half of each line on the far side (sky or background), which the DOF then
   erases. What is left is ≤ 2 px wide.
4. **`farFade` 130-260 m** removes towers and hills completely.
5. **`#221f2e` at strength 0.92, blended in linear light**, gives a grey core (luma 60-80) and a line that looks
   ~30 % thinner.

## 5. Recipe for our stack (postprocessing 6.37.2, three 0.175, R3F postprocessing 3.0.4)

### 5.1 Replace `src/videos/bridge/ink.ts` with `recipe/ink.ts`

The file is complete and type-checked (tsc against reel-kit's three and postprocessing types). It has been run in
WebGL with this exact stack: MSAA 4, HalfFloat buffers, DOF, Bloom, Neutral tone mapping, with 0 GL errors. Full
source is in the appendix.

Design:

* **`InkPass extends Pass` (not an Effect),** so R3F keeps it as its own pass and does not merge it with the DOF.
  `needsSwap = false`: it composites into a temp target and copies back into the input buffer (colour only), so
  the composer's depth texture is untouched. `needsDepthTexture = true` gives it the main depth for occlusion
  tests.
* **Own world-only normal + depth target** (HalfFloat, Nearest, `DepthTexture` UnsignedInt, no MSAA). The scene is
  rendered once more with `scene.overrideMaterial = normalMat`, the camera with layer `NOINK` (3) disabled,
  `background = null`, and `shadowMap.autoUpdate = false`, so shadow maps are not re-rendered and keep the
  billboards' shadows. `normalMat.onBeforeRender` copies each object's `map` + `alphaTest` (including
  multi-material groups), so cut-out world planes like the sign board and church clock keep their shape. Verified:
  a round alpha-tested disc gets a round outline (`test/shots/harness_cutout_disc_4x.jpg`). It works for Mesh and
  InstancedMesh, and for geometry without normals (it falls back to derivative normals).
* **Depth edges:** the signed 2nd difference of 1/z, `s = (1/z1 + 1/z2 - 2/zc)·zc`, is linearised and
  scale-normalised. It is exactly 0 on any plane, so grazing floors produce no false lines. Only the **near side**
  is inked: `smoothstep(depthLo 0.02, depthHi 0.05, -s)`. Thin ropes and poles become solid lines, as in the
  reference.
* **Crease edges:** a normal-angle test at the same depth (|Δz| < 2 % of z), `1 - smoothstep(cos 65°, cos 50°, n0·nq)`.
  It is two-sided, its width is `creaseScale` 0.64 x the silhouette width, and concave folds (the neighbour is in
  front of the tangent plane) are drawn at `concaveGain` 0.7. That gives contact lines where objects meet the
  ground. Set it to 0 for interiors, where the reference has none.
* **Width from the sampling radius:** 4 directions (x, y and both diagonals), 1..6 px steps, with continuous
  coverage `clamp(w + 0.5 - d, 0, 1)`. That gives no width popping and built-in AA. The width follows the
  measured screen-constant behaviour: `widthNear 3.4 px @ 6 m → widthFar 2.2 px @ 90 m` (log distance), opacity
  ×0.75 at 90 m, faded out over **150-450 m**.
* **Occlusion by characters:** if the main depth has something nearer than the world (a billboard), no world ink
  is drawn there. Characters keep only their own outlines, with no doubles and no rectangles.
* **Composite:** a 3x3 tent filter (AA) over the mask, blended in display gamma like Canvas2D, colour `#0b0a0c`,
  strength 1.0. Measured EW in the toy scene: **3.7 / 3.2 / 2.6 / 1.5 / 1.1 px at 3 / 12 / 25 / 90 / 200 m**
  (silhouettes, 1080p) and **2.3 → 0.9 px** for creases. The reference is 3.4 → 2.8 → 2.2 px for silhouettes and
  depth jumps, and 2.2 px for creases.

### 5.2 `Bridge.tsx` (`Inner`), the only wiring change

```tsx
import { InkPass } from "./ink";                     // was: import { InkEffect } from "./ink";
// const { camera, scene } = useThree();             // already there
const fx = useMemo(() => {
  const dof = new DepthOfFieldEffect(camera, { worldFocusRange: 4, bokehScale: 2, resolutionScale: 0.5 });
  dof.target = target;
  return {
    dof,
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),   // was: new InkEffect()
    bloom: new BloomEffect({ intensity: 0.3, luminanceThreshold: 0.86, luminanceSmoothing: 0.1, mipmapBlur: true }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
  };
}, [camera, scene, target]);
useEffect(() => () => fx.ink.dispose(), [fx]);

const post = useMemo(() => (
  <EffectComposer multisampling={4}>
    <primitive object={fx.bloom} dispose={null} />   {/* 1. own EffectPass: bloom from the un-inked image */}
    <primitive object={fx.ink} dispose={null} />     {/* 2. InkPass (a Pass, never merged)             */}
    <primitive object={fx.dof} dispose={null} />     {/* 3. DOF + tone merged: DOF blurs the lines too  */}
    <primitive object={fx.tone} dispose={null} />
  </EffectComposer>
), [fx]);
```

* **Order: bloom → ink → DOF + tone.** If bloom runs after the ink, the bloom halo lifts the line cores (core 0 →
  53) and thins lines by 22-28 % near bright sky. With bloom first, I measured EW 3.65 and core 0.
* **Keep `multisampling={4}`.** InkPass reads the resolved MSAA colour and writes back into it, which is safe. With
  `multisampling={0}`, the bloom-first order creates a depth-texture feedback loop. In that case use
  ink → dof → bloom → tone and raise the bloom `luminanceThreshold` to ≥ 0.95.
* The existing per-frame DOF code (`worldFocusRange = max(2.5, dist*0.55)`, `bokehScale`) is unchanged.
* The InkPass constructor calls `camera.layers.enable(NOINK)`, so the main render and the shadow maps still
  include NOINK objects.

### 5.3 Layers: keep camera-facing cards, sky and smoke out of the ink

```ts
import { NOINK } from "./ink";
// cast.ts  Actor constructor and Fx constructor, after the mesh is created:
this.mesh.layers.set(NOINK);          // billboards: no rectangle outline, no holes in world lines
// world.ts
this.sky.layers.set(NOINK);           // gradient sky sphere
cloudMesh.layers.set(NOINK);          // every sprite cloud (loop where they are created)
smokeMesh.layers.set(NOINK);          // every smoke card
// optional: the hammered sign board (it has its own drawn outline) -> NOINK
```

* `layers.set` does not propagate to children. For groups, use `g.traverse(o => o.layers.set(NOINK))`.
* Water stays on layer 0 (quay and water contact lines). If the water uses vertex displacement in a custom
  shader, put it on NOINK, or the occlusion test will drop lines on wave crests.
* Any `THREE.Line` or `Points` objects go on NOINK.
* Lazily created actors and effects go through the Actor and Fx constructors, so they are covered automatically.

### 5.4 Tuning and debugging (live: `fx.ink.set({...})`; view: `fx.ink.debug = 1` mask, `2` world normals)

| option | default | meaning | sensible range |
|---|---|---|---|
| `color` | `#0b0a0c` | ink colour (sRGB) | keep neutral near-black |
| `strength` | 1.0 | max opacity | 0.9-1.0 |
| `widthNear` / `widthFar` | 3.4 / 2.2 px | silhouette width at `distNear` 6 m / `distFar` 90 m (1080x1920) | 3.0-4.0 / 1.8-2.6 |
| `creaseScale` | 0.64 | crease width / silhouette width | 0.55-0.75 |
| `depthLo` / `depthHi` | 0.02 / 0.05 | relative 1/z jump where lines start / are full | raise if floors get lines |
| `angleLo` / `angleHi` | 50° / 65° | crease angle start / full | 40-60 / 60-75 |
| `concaveGain` | 0.7 | contact / inner-corner lines | 0 indoors, 0.5-0.8 outdoors |
| `farOpacity` | 0.75 | opacity at 90 m | 0.6-0.9 |
| `fadeNear` / `fadeFar` | 150 / 450 m | far fade-out | keep far towers inked |

Cost: one extra world render (normals) plus a full-resolution mask with ≤ 96 depth fetches per pixel. That is
~30-60 ms per frame in the toy harness, which is fine for Remotion's offline render.

### 5.5 Painted texture lines (yes, needed, in `paint.ts`, not in the post pass)

The reference paints plank seams and butt joints, tile grout, ceiling grids, roof-tile rows and cobble gaps into
the textures. They are dark **tints** of the material, not black (wood seams ≈ (111,60,17) on a lighter brown,
core luma ~60-70), soft, and they scale with perspective.

* Deck planks: seams and butt joints. Quay and bridge stone: mortar. Roofs: tile rows. Facades: window and
  shutter frames. Cobbles: gaps.
* Colour = local colour × 0.35-0.45, alpha 0.8-0.9. Width chosen to land at **1.2-2 px at 1080p** at the typical
  shot distance: texture px = screen px × texels per metre / screen px per metre.
* Never paint a border along an edge that is also a geometry edge (box edges, plank ends at a beam). The InkPass
  already draws that one, and painting it too gives the double line the reference never has.
* The facade `INKL` stroke `rgba(40,30,40,0.85)` should become a warmer tint of the facade colour, kept lighter
  than the geometry ink.

## 6. Comparison images (all in `references/outlines/`)

* `sheets/final_crops_1.jpg`, `final_crops_2.jpg`, `final_crops_3.jpg`: **76 crops from 14 videos**, 64x64 source
  px at 4x nearest-neighbour, each labelled with edge type, EW @1080 and core.
* `sheets/side_by_side.jpg`: **7 reference-vs-ours pairs** at the same share of frame width. Pairs: roof vs sky,
  shed vs sky, barrel depth jump, wall-top crease, window-frame crease, contact, far arch. Ours show no line in
  every pair.
* `sheets/scan_01..09.jpg`: 66 reference scans, each with the scan line and the detected line marked.
  `sheets/ours_01..03.jpg`: our 20 scans. `sheets/pass1_01..04.jpg`: 32-box first pass.
  `sheets/v01..v20.jpg`: frame grids. `crops/`: 118 single crops.
* `test/shots/harness_final.jpg`: the new InkPass in the toy scene (bloom → ink → DOF), with the actor card
  excluded and its own outline intact. `test/shots/harness_mask.jpg`: the ink mask (silhouettes, creases,
  contacts, rail). `test/shots/harness_cutout_disc_4x.jpg`: the alpha cut-out keeps a round outline.
* Test harness: `test/main.ts` + `test/index.html` (bundle `test/bundle.js`; params `?debug=1|2`, `?dof=0`,
  `?ink=0`, `?bloomfirst=1`, `?calib=1`, `?crop=x,y,w,h`). It is a standalone toy scene, not our video.

## 7. Top 5 changes by visual impact

1. **Swap `InkEffect` for `InkPass` and order the composer bloom → ink → DOF + tone** (section 5.2). The lines then
   survive the DOF and blur with the background, as in the reference. This is the difference between no lines
   and lines everywhere.
2. **Normal-based creases and contacts** (built into InkPass). Box and house corners, stairs, deck and beam edges,
   wall tops and objects standing on the ground get lines. That is about a third of the reference's lines, and the
   old Laplacian cannot see them at all.
3. **Reference widths and colour:** silhouettes 3.4 → 2.2 px (6 → 90 m, log distance), creases ×0.64, `#0b0a0c`
   at strength 1.0 blended in display gamma, far opacity 0.75, fade 150-450 m instead of 130-260 m.
4. **`NOINK` layer for billboards, effect cards, sky, clouds and smoke, plus alpha cut-out support** (section
   5.3). No rectangles or holes around characters, no double outlines, and characters keep their own 4.6 px
   drawn outline.
5. **Painted texture lines in `paint.ts`** (section 5.5): plank seams, mortar, roof rows and window frames as soft
   dark tints, never duplicating geometry edges.

## Appendix: full `recipe/ink.ts` (drop-in replacement for `src/videos/bridge/ink.ts`)

```ts
// Ink outlines for the 3D world, matched to the reference measurements (reports/outlines.md).
// Drop-in replacement for src/videos/bridge/ink.ts (postprocessing 6.37.2 + three 0.175).
//
// How it works
//  1. Re-render the WORLD ONLY (camera layer 0) into a non-MSAA target: view-space normal (rgb), coverage (a) and
//     a depth texture. Character billboards, effect cards, sky, clouds and smoke live on layer NOINK, so they never
//     get rectangle outlines and never cut holes into the world's lines.
//  2. Edge mask (full resolution), pixel steps 1..6 along x, y and both diagonals:
//       depth  - signed 2nd difference of 1/z (exactly 0 on any plane, so no grazing-angle false lines) -> only the
//                NEAR side of a depth jump is inked, as a band `width` px wide (silhouettes vs sky, object vs object,
//                thin ropes become solid lines like the reference);
//       crease - normal angle > ~50 deg to a neighbour at the same depth, two-sided band ~0.64*width px wide,
//                concave folds (object meets ground, inner corners) at 0.7 strength;
//       coverage is continuous in the width (no width popping when the camera moves), width shrinks a little with
//       distance (3.4 px at 6 m -> 2.2 px at 90 m, log-distance), opacity to 0.75, fades out by 450 m;
//       no ink where the main depth buffer has something nearer than the world (characters / cards in front).
//  3. Composite: 3x3 tent-filtered mask (anti-aliasing), near-black ink blended in display gamma (like Canvas2D),
//     written back into the input buffer (colour only; the composer's depth texture stays intact).
//     This is a Pass (not an Effect), so R3F's <EffectComposer> keeps it as its own pass BEFORE the merged
//     DOF + Bloom + ToneMapping EffectPass: the depth of field then blurs the lines together with the background.
// Verified in a toy scene with this exact stack (MSAA 4, HalfFloat, DOF/Bloom/Neutral): compiles, no GL errors,
// measured EW 3.7 / 3.2 / 2.6 / 1.5 / 1.1 px at 3 / 12 / 25 / 90 / 200 m (silhouettes) and 2.3 -> 0.9 px (creases).
import * as THREE from "three";
import { Pass } from "postprocessing";

/** Layer for things that must never be outlined (camera-facing sprites, sky, clouds, smoke). */
export const NOINK = 3;

export type InkOptions = {
  color?: THREE.ColorRepresentation; // sRGB hex of the ink
  strength?: number; // max opacity
  widthNear?: number; // silhouette / depth-jump line width in px at distNear (1080x1920 output)
  widthFar?: number; // ... at distFar
  distNear?: number; // m
  distFar?: number; // m
  creaseScale?: number; // crease line width / silhouette line width
  depthLo?: number; // relative depth jump (1 - z_near / z_far) where lines start
  depthHi?: number; // ... where they are full strength
  angleLo?: number; // crease angle (deg) where lines start
  angleHi?: number; // ... where they are full strength
  concaveGain?: number; // strength of concave folds (object meets ground, inner corners)
  farOpacity?: number; // opacity multiplier reached at distFar
  fadeNear?: number; // m: start of the far fade-out
  fadeFar?: number; // m: lines gone
};

const DEF: Required<InkOptions> = {
  color: "#0b0a0c", strength: 1.0,
  widthNear: 3.4, widthFar: 2.2, distNear: 6, distFar: 90, creaseScale: 0.64,
  depthLo: 0.02, depthHi: 0.05, angleLo: 50, angleHi: 65, concaveGain: 0.7,
  farOpacity: 0.75, fadeNear: 150, fadeFar: 450,
};

const FS_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// world-only normal pass (scene.overrideMaterial); works for Mesh and InstancedMesh. Cut-out materials
// (map + alphaTest, e.g. the sign board, the church clock) keep their shape: see onBeforeRender in the constructor.
const NORMAL_VERT = /* glsl */ `
#include <common>
uniform mat3 cutUv;
varying vec3 vN;
varying vec3 vV;
varying vec2 vCut;
void main() {
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  vN = transformedNormal;
  vCut = (cutUv * vec3(uv, 1.0)).xy;
  #include <begin_vertex>
  #include <project_vertex>
  vV = mvPosition.xyz;
}`;
const NORMAL_FRAG = /* glsl */ `
uniform sampler2D tCut;
uniform float cut;
varying vec3 vN;
varying vec3 vV;
varying vec2 vCut;
void main() {
  if (cut > 0.0 && texture2D(tCut, vCut).a < cut) discard;
  vec3 n;
  if (dot(vN, vN) < 1e-8) n = normalize(cross(dFdx(vV), dFdy(vV)));   // geometry without normals
  else n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);            // back faces of double-sided planes
  gl_FragColor = vec4(n, 1.0);
}`;

const MASK_FRAG = /* glsl */ `
#include <packing>
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform sampler2D tMainDepth;
uniform vec2 texel;
uniform float cNear;
uniform float cFar;
uniform float p00;
uniform float p11;
uniform float wNear;
uniform float wFar;
uniform float dNear;
uniform float dFar;
uniform float creaseScale;
uniform float depthLo;
uniform float depthHi;
uniform float cosLo;
uniform float cosHi;
uniform float concaveGain;
uniform float farOpacity;
uniform float fadeNear;
uniform float fadeFar;
uniform float strength;
uniform float useMain;
varying vec2 vUv;

// pixel steps along x, y and both diagonals, and their length in px
const vec2 STEP[4] = vec2[4](vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(1.0, 1.0), vec2(1.0, -1.0));
const float SLEN[4] = float[4](1.0, 1.0, 1.41421, 1.41421);
#define RMAX 6

// textureLod: explicit LOD inside loops (nearest-filtered targets, no derivatives needed)
float dist(sampler2D t, vec2 uv) { return -perspectiveDepthToViewZ(textureLod(t, uv, 0.0).x, cNear, cFar); }
vec3 viewPos(vec2 uv, float d) { vec2 n = uv * 2.0 - 1.0; return vec3(n.x * d / p00, n.y * d / p11, -d); }

// crease strength between this pixel (n0, P0) and a neighbour
float crease(vec3 n0, vec3 P0, float zc, vec2 uq, float zq) {
  vec4 nq = textureLod(tNormal, uq, 0.0);
  if (nq.a < 0.5 || abs(zq - zc) > zc * depthLo) return 0.0;       // sky / depth jump: not a crease
  float k = 1.0 - smoothstep(cosHi, cosLo, dot(n0, nq.xyz));
  if (dot(viewPos(uq, zq) - P0, n0) > 0.0) k *= concaveGain;        // neighbour in front of our tangent plane: concave
  return k;
}

void main() {
  vec4 nc = textureLod(tNormal, vUv, 0.0);
  if (nc.a < 0.5) { gl_FragColor = vec4(0.0); return; }          // sky / empty: ink lives on the near object only
  float zc = dist(tDepth, vUv);

  // characters, cards etc. (not in the world buffer) in front of this pixel: no world ink over them
  if (useMain > 0.5) {
    float zm = dist(tMainDepth, vUv);
    zm = min(zm, dist(tMainDepth, vUv + vec2(texel.x, 0.0)));
    zm = min(zm, dist(tMainDepth, vUv - vec2(texel.x, 0.0)));
    zm = min(zm, dist(tMainDepth, vUv + vec2(0.0, texel.y)));
    zm = min(zm, dist(tMainDepth, vUv - vec2(0.0, texel.y)));
    if (zm < zc * 0.985 - 0.03) { gl_FragColor = vec4(0.0); return; }
  }

  float t = clamp(log(zc / dNear) / log(dFar / dNear), 0.0, 1.0);
  float w = mix(wNear, wFar, t);                     // silhouette line width (px) at this distance, near side only
  float hc = 0.5 * w * creaseScale;                  // crease line half width (px), drawn on both faces
  float Wc = 1.0 / zc;
  vec3 n0 = nc.xyz;
  vec3 P0 = viewPos(vUv, zc);
  float eD = 0.0, eN = 0.0;
  for (int a = 0; a < 4; a++) {
    for (int r = 1; r <= RMAX; r++) {
      vec2 o = STEP[a] * texel * float(r);
      float d = (float(r) - 0.5) * SLEN[a];          // distance of this pixel's centre to an edge first seen at r
      float cw = clamp(w + 0.5 - d, 0.0, 1.0);       // continuous coverage -> no width popping, built-in AA
      float ch = clamp(hc + 0.5 - d, 0.0, 1.0);
      if (cw <= 0.0 && ch <= 0.0) break;
      float z1 = dist(tDepth, vUv - o), z2 = dist(tDepth, vUv + o);
      // depth jump: this pixel is in front of its neighbours (2nd difference of 1/z < 0; exactly 0 on planes)
      float s = (1.0 / z1 + 1.0 / z2 - 2.0 * Wc) / Wc;
      eD = max(eD, smoothstep(depthLo, depthHi, -s) * cw);
      // crease: normal turns towards a neighbour at the same depth
      if (ch > 0.0) eN = max(eN, max(crease(n0, P0, zc, vUv - o, z1), crease(n0, P0, zc, vUv + o, z2)) * ch);
    }
  }

  float ink = max(eD, eN) * strength * mix(1.0, farOpacity, t) * (1.0 - smoothstep(fadeNear, fadeFar, zc));
  gl_FragColor = vec4(ink, 0.0, 0.0, 1.0);
}`;

const COMP_FRAG = /* glsl */ `
uniform sampler2D inputBuffer;
uniform sampler2D tMask;
uniform sampler2D tNormal;
uniform vec2 texel;
uniform vec3 inkColor;
uniform int debug;
varying vec2 vUv;
float m(float x, float y) { return texture2D(tMask, vUv + vec2(x, y) * texel).r; }
void main() {
  float a = (4.0 * m(0.0, 0.0)
    + 2.0 * (m(1.0, 0.0) + m(-1.0, 0.0) + m(0.0, 1.0) + m(0.0, -1.0))
    + m(1.0, 1.0) + m(-1.0, 1.0) + m(1.0, -1.0) + m(-1.0, -1.0)) / 16.0;   // 1-2-1 tent = anti-aliasing
  vec4 c = texture2D(inputBuffer, vUv);
  if (debug == 1) { gl_FragColor = vec4(vec3(1.0 - a), 1.0); return; }               // mask only
  if (debug == 2) { gl_FragColor = vec4(texture2D(tNormal, vUv).xyz * 0.5 + 0.5, 1.0); return; } // world normals
  // blend in display (gamma) space like Canvas2D does for the character drawings: coverage -> darkness is linear
  // on screen, so the measured line widths equal the coverage widths (a linear-light blend reads ~30 % thinner)
  vec3 g = pow(max(c.rgb, 0.0), vec3(1.0 / 2.2));
  gl_FragColor = vec4(pow(mix(g, pow(inkColor, vec3(1.0 / 2.2)), a), vec3(2.2)), c.a);
}`;

const COPY_FRAG = /* glsl */ `
uniform sampler2D tSrc;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(tSrc, vUv);
  #include <colorspace_fragment>
}`;

export class InkPass extends Pass {
  /** 0 = normal, 1 = show the ink mask, 2 = show the world normal buffer */
  debug = 0;
  private world: THREE.Scene;
  private cam: THREE.PerspectiveCamera;
  private rt: THREE.WebGLRenderTarget;
  private maskRT: THREE.WebGLRenderTarget;
  private tmpRT: THREE.WebGLRenderTarget;
  private normalMat: THREE.ShaderMaterial;
  private maskMat: THREE.ShaderMaterial;
  private compMat: THREE.ShaderMaterial;
  private copyMat: THREE.ShaderMaterial;
  private fsScene = new THREE.Scene();
  private fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;
  private clearCol = new THREE.Color();

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, options: InkOptions = {}) {
    super("InkPass");
    const o = { ...DEF, ...options };
    this.world = scene;
    this.cam = camera;
    this.cam.layers.enable(NOINK); // the main render still shows the NOINK layer (and its shadows)
    this.needsSwap = false; // writes back into the input buffer (keeps the composer's depth texture intact)
    this.needsDepthTexture = true;

    this.rt = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      generateMipmaps: false, depthBuffer: true, samples: 0,
      depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType),
    });
    this.maskRT = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.UnsignedByteType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      generateMipmaps: false, depthBuffer: false,
    });
    this.tmpRT = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      generateMipmaps: false, depthBuffer: false,
    });

    this.normalMat = new THREE.ShaderMaterial({
      vertexShader: NORMAL_VERT, fragmentShader: NORMAL_FRAG, side: THREE.DoubleSide,
      uniforms: { tCut: { value: null }, cut: { value: 0 }, cutUv: { value: new THREE.Matrix3() } },
    });
    // per object: copy the original material's cut-out (map + alphaTest) so alpha-tested world planes keep their shape
    this.normalMat.onBeforeRender = (_r, _s, _c, _g, object, group) => {
      const mat = (object as THREE.Mesh).material as THREE.Material | THREE.Material[];
      const gi = (group as unknown as { materialIndex?: number } | null)?.materialIndex ?? 0; // geometry group at runtime
      const src = (Array.isArray(mat) ? mat[gi] : mat) as THREE.MeshLambertMaterial;
      const u = this.normalMat.uniforms;
      const map = src && src.alphaTest > 0 ? src.map : null;
      u.tCut.value = map; u.cut.value = map ? src.alphaTest : 0;
      if (map) { map.updateMatrix(); (u.cutUv.value as THREE.Matrix3).copy(map.matrix); }
      this.normalMat.uniformsNeedUpdate = true;
    };
    const fs = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
      new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader, uniforms, depthTest: false, depthWrite: false });
    const texel = new THREE.Vector2(1, 1);
    this.maskMat = fs(MASK_FRAG, {
      tNormal: { value: this.rt.texture }, tDepth: { value: this.rt.depthTexture }, tMainDepth: { value: null },
      texel: { value: texel }, cNear: { value: 0.2 }, cFar: { value: 1500 }, p00: { value: 1 }, p11: { value: 1 },
      wNear: { value: o.widthNear }, wFar: { value: o.widthFar }, dNear: { value: o.distNear }, dFar: { value: o.distFar },
      creaseScale: { value: o.creaseScale }, depthLo: { value: o.depthLo }, depthHi: { value: o.depthHi },
      cosLo: { value: Math.cos((o.angleLo * Math.PI) / 180) }, cosHi: { value: Math.cos((o.angleHi * Math.PI) / 180) },
      concaveGain: { value: o.concaveGain }, farOpacity: { value: o.farOpacity },
      fadeNear: { value: o.fadeNear }, fadeFar: { value: o.fadeFar }, strength: { value: o.strength }, useMain: { value: 0 },
    });
    this.compMat = fs(COMP_FRAG, {
      inputBuffer: { value: null }, tMask: { value: this.maskRT.texture }, tNormal: { value: this.rt.texture },
      texel: { value: texel }, inkColor: { value: new THREE.Color(o.color) }, debug: { value: 0 },
    });
    this.copyMat = fs(COPY_FRAG, { tSrc: { value: this.tmpRT.texture } });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.maskMat);
    this.quad.frustumCulled = false;
    this.fsScene.add(this.quad);
  }

  /** live tuning, e.g. ink.set({ widthNear: 4.2, concaveGain: 0.5 }) */
  set(options: InkOptions) {
    const u = this.maskMat.uniforms;
    const map: [keyof InkOptions, string][] = [["widthNear", "wNear"], ["widthFar", "wFar"], ["distNear", "dNear"], ["distFar", "dFar"],
      ["creaseScale", "creaseScale"], ["depthLo", "depthLo"], ["depthHi", "depthHi"], ["concaveGain", "concaveGain"],
      ["farOpacity", "farOpacity"], ["fadeNear", "fadeNear"], ["fadeFar", "fadeFar"], ["strength", "strength"]];
    for (const [k, n] of map) if (options[k] !== undefined) u[n].value = options[k];
    if (options.angleLo !== undefined) u.cosLo.value = Math.cos((options.angleLo * Math.PI) / 180);
    if (options.angleHi !== undefined) u.cosHi.value = Math.cos((options.angleHi * Math.PI) / 180);
    if (options.color !== undefined) (this.compMat.uniforms.inkColor.value as THREE.Color).set(options.color);
  }

  override setDepthTexture(depthTexture: THREE.Texture) {
    this.maskMat.uniforms.tMainDepth.value = depthTexture ?? null;
    this.maskMat.uniforms.useMain.value = depthTexture ? 1 : 0;
  }

  override setSize(width: number, height: number) {
    this.rt.setSize(width, height);
    this.maskRT.setSize(width, height);
    this.tmpRT.setSize(width, height);
    (this.maskMat.uniforms.texel.value as THREE.Vector2).set(1 / width, 1 / height);
  }

  override render(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget) {
    const scene = this.world, cam = this.cam;
    const autoClear = renderer.autoClear, shadowAuto = renderer.shadowMap.autoUpdate;
    const mask = cam.layers.mask, override = scene.overrideMaterial, background = scene.background;
    renderer.getClearColor(this.clearCol);
    const clearAlpha = renderer.getClearAlpha();
    renderer.autoClear = false;

    // 1) world-only normals + depth (no characters / sprites / sky; shadow maps are not re-rendered)
    cam.layers.disable(NOINK);
    scene.overrideMaterial = this.normalMat;
    scene.background = null;
    renderer.shadowMap.autoUpdate = false;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(this.rt);
    renderer.clear(true, true, false);
    renderer.render(scene, cam);
    cam.layers.mask = mask;
    scene.overrideMaterial = override;
    scene.background = background;
    renderer.shadowMap.autoUpdate = shadowAuto;
    renderer.setClearColor(this.clearCol, clearAlpha);

    // 2) edge mask
    const u = this.maskMat.uniforms, e = cam.projectionMatrix.elements;
    u.cNear.value = cam.near; u.cFar.value = cam.far; u.p00.value = e[0]; u.p11.value = e[5];
    this.quad.material = this.maskMat;
    renderer.setRenderTarget(this.maskRT);
    renderer.render(this.fsScene, this.fsCam);

    // 3) composite into a temp target, 4) copy back into the input buffer (colour only; depth untouched)
    this.compMat.uniforms.inputBuffer.value = inputBuffer.texture;
    this.compMat.uniforms.debug.value = this.debug;
    this.quad.material = this.compMat;
    renderer.setRenderTarget(this.tmpRT);
    renderer.render(this.fsScene, this.fsCam);
    this.quad.material = this.copyMat;
    renderer.setRenderTarget(this.renderToScreen ? null : inputBuffer);
    renderer.render(this.fsScene, this.fsCam);

    renderer.autoClear = autoClear;
  }

  override dispose() {
    this.rt.depthTexture?.dispose();
    this.rt.dispose(); this.maskRT.dispose(); this.tmpRT.dispose();
    this.normalMat.dispose(); this.maskMat.dispose(); this.compMat.dispose(); this.copyMat.dispose();
    this.quad.geometry.dispose();
  }
}
```
