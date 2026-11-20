# Styles: 12 looks for the same film

`kit/styles.js` re-dresses the whole scene in another look with one call. The scene code doesn't change.

| style | what it does | good for |
| --- | --- | --- |
| `lit` | the film as you built it (default) | the real thing |
| `clay` | every surface one matte ivory clay, same light | a maquette look, product shapes, "before the paint" |
| `paper` | construction paper: three flat light bands, muted colours, a paper grain, a darker cut line round every shape | crafts, kids' brands, storybook |
| `shadow` | shadow puppet: every object a black cut-out in front of a glowing amber screen | drama, intros, silhouettes |
| `blueprint` | navy shapes, white construction lines on every edge, a grid on the walls and floor | tech, "how it's built", engineering |
| `toon` | three hard light bands, bolder colours, black ink outlines | cartoon, playful brands |
| `voxel` | every object rebuilt from small cubes (1.2 cm), under the same light | games, Minecraft-style, pixel fans |
| `thermal` | a heat camera: cold blue to white hot. Screens, bulbs and anything you mark hot glow | sci-fi, "scan", surveillance |
| `synth` | synthwave: dark purple shapes with glowing cyan edges, a neon grid floor, a striped sunset on the wall | retro, music, 80s |
| `chrome` | liquid chrome: every object polished metal reflecting a pastel studio | luxury, product hero shots |
| `neon` | the same room at night: cold moonlight, a coral neon tube on the wall, strong glow | moody endings, night versions |
| `mix` | a different look per object (by default blueprint, paper and voxel on the three biggest objects) | "everything at once", the finale |

Screens (`MeshBasicMaterial`) stay screens in every look, so text on them still reads. In `thermal` they turn into heat, and in
`shadow` they keep their picture, warmed to the lamp's colour.

## Switch the look

When the user says "make it clay / paper / voxels / synthwave / at night", use the style. Don't rebuild the scene.

```bash
node render.mjs --stills=0.5,2.5,4.5 --n=16 --style=voxel --out=stills_voxel   # check stills first
node render.mjs --video --n=4 --style=voxel --out=out/preview_voxel.mp4
node render.mjs --video --n=48 --style=voxel --out=out/final_voxel.mp4
```

Live in the browser: `index.html?play=1&style=synth`, or `?t=2.5&style=chrome` for one frame.
Check all 12 at once: `for s in lit clay paper shadow blueprint toon voxel thermal synth chrome neon mix; do node render.mjs --stills=2.5 --n=4 --style=$s --out=stills/$s; done`

## In your own scene

`film.js` already calls it after the lights, the bloom and the grade are made:

```js
import { setStyle } from './styles.js';
const MIX = { computer: 'blueprint', plant: 'paper', mug: 'voxel' };   // only used by the mix look
setStyle(styleName, { scene, key: sun, fill: sky, bloom, renderer, grade: grade.material.uniforms, neonAt: V(0.52, 0.5, -0.88), mix: MIX });
```

- `key` is your main light, `fill` the soft one. Their brightness is scaled per look, so it works in any scene.
- `renderer` is needed by `chrome` (it builds its reflections from it).
- `grade` is the final pass's uniforms. The flat graphic looks (shadow, blueprint, thermal, synth) set its `graphic` uniform to 1,
  which skips the film tone curve so their colours stay exact. If your grade has no `graphic` uniform, nothing breaks.
- `neonAt` is a point on a wall the camera can see. The tube is about 40 cm wide. Put it off to one side of the hero object.
- `mix` is `{ objectName: look }`: the first named parent of a mesh wins. Give your groups names (`pc.name = 'computer'`).
  It can also be a function `(mesh) => look`. Leave it out and the three biggest objects get blueprint, paper and voxel.

### How the kit sorts your meshes

Every mesh gets a kind, worked out once. Set it yourself with `mesh.userData.kind` when the guess is wrong:

- `screen`: `MeshBasicMaterial` (screens, bulbs, neon tubes). Left alone.
- `back`: walls, floors, the desk top (planes and big flat boxes). These become the glowing screen in `shadow`, the grid in
  `blueprint` and on the `synth` floor, and the sunset on the `synth` wall.
- `big`: big solid things (bigger than `LOOK.big` = 1.2 m). Kept whole in `voxel`.
- `obj`: everything else. These are the props the looks are about.

Other flags:
- `mesh.userData.heat = 0.85` makes something hot in `thermal` (0 cold, 1 white hot). The kit's coffee mug has it.
- `mesh.userData.noOutline = true` skips its ink / cut / construction line (glass, thin wires). Planes are skipped already.

## Flip looks inside one film (the "change the style" moment)

Pick the look from `t` at the top of `renderAt`. It stays a pure function of time because the materials are cached:

```js
const styleAt = (t) => (t < 2 ? 'lit' : t < 3 ? 'clay' : t < 4 ? 'paper' : t < 5 ? 'voxel' : 'synth');
export function renderAt(t, n = 1) { setStyle(styleAt(t), { scene, key: sun, fill: sky, bloom, renderer, grade: grade.material.uniforms, neonAt, mix }); ... }
```

Land each flip on a beat or on the word, with a short sound that fits the look: a soft tick for clay, a paper flap for paper, a
wood block for voxel, a wub for synth, a triangle ding for chrome. For a wipe instead of a cut, render two clips and join them with
`ffmpeg ... -filter_complex xfade=transition=wipeleft:duration=0.3:offset=<t>`.

## Tuning

All numbers are in the `LOOK` table at the top of `styles.js`:

- clay too bright: lower `clay.key`. Too flat: lower `clay.fill`.
- paper lines too faint: raise `paper.outline` (0.0034 is about 3.5 px at 1080p) or lower `paper.edge` (darker line). Grain too big: raise `paper.grain`.
- toon lines too thin or thick: `toon.outline`. Colours too loud: lower `toon.sat`.
- shadow: the glow colours are `shadow.glow` (centre to edge). The cut-outs are `shadow.ink`.
- blueprint / synth grid too dense: raise `cell` (metres between lines). Lines too bright: lower the second number in `line` / `grid`.
- voxel cubes too big or small: `voxel.size` (metres). Under 0.008 gets slow on big scenes.
- thermal: the colour ramp is `thermal.stops`. Walls too warm: lower `thermal.wall` / `thermal.floor`.
- chrome too bright or glary: lower `chrome.key` and `chrome.bloom`. More of the object's own colour: raise `chrome.keep`.
- neon too dark: raise `neon.fill`. Tube glow too big: lower `neon.tube` or `neon.bloom`. Colour: `neon.coral`.

## A new style the user asks for

Add a name to `STYLES`, a row to `LOOK`, and a `case` in `dress()` that swaps materials (like `clayOf` / `toonOf`) or
hangs extra meshes on each object (like `outline` / `voxelize`, through `aux`). Keep screens readable, render 3 stills,
and show them before a full render. Ideas that fit this kit: golden hour (warmer, lower key), wireframe (`material.wireframe = true`
on a copy), watercolour (paper bands + soft edges), x-ray (thermal ramp in blue + additive blending).
