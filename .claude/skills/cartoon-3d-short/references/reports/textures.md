# Textures: reference surface painting vs ours, and how to paint ours procedurally

Topic folder: `references/textures/` (scripts, crops, data, side-by-sides, prototype).
Private study only. Nothing here was uploaded, and nothing under `your Remotion project` was edited or rendered.

## 0. Bottom line

The reference paints every surface as a few flat colour fields. Painted lines (board gaps, mortar, tile joints) are
thin, about 3-5 px at 1080p. Sun and shade sit in a narrow, bright, saturated range, and only big shapes vary in tone.
Our surfaces miss in five ways:

1. **Too dark.** Our deck renders at L* 50, the reference at L* 72-80. Iron and side beams render at L* 3-7, where the reference never goes below L* 19.
2. **Too dull.** Our sky has C* 22-29 where the reference has 40-89. Our golden sky is a grey-mauve at C* 16-19.
3. **Lines too heavy and blurry.** Our gaps and mortar are 1.5-2.5x wider, and their 10-90 % edge ramps are 4-6 px.
4. **Water texture wrong.** Ripple marks are spread evenly at 4-12 % area and form vertical streaks, and there is no depth gradient.
5. **Flat clouds.** Ours are one flat tone. The reference uses three tones with a lavender underside.

Everything below is measured. The recipe in section 5 has been type-checked, and its water and deck output was measured
in a CPU preview against the reference numbers (section 5.6).

## 1. Method

- **Reference:** 91 frames from 14 videos (01 02 03 04 05 07 08 10 11 12 13 14 18 19), named `VV_SS.s` (video, second).
  I made 99 crops from 13 of those videos, full resolution in `crops/` and 2x in `crops/x2/`, and 30 zoom crops (`crops/z_*`).
  The measurements cover 79 + 14 surface patches (`data/patches*.json`), 40 line profiles (`data/lines.json`),
  11 water regions, 17 sky spans and 11 cloud crops.
- **Ours:** the 61 test stills in `your Remotion project/out/bridge/test/` (540x960 JPEG previews, read only).
- **Scale:** every pixel number is given at 1080x1920. Reference frames (720p) are scaled x1.5 and our stills x2.
  Our stills are half-resolution previews, so our edge widths include about 2 px of upscale blur. I took that out
  where the magnification is estimated.
- **Captions:** the reference word captions sit at rows 874-934 of 1280. `scripts/captions.py` detects them
  (`data/captions.json`). Water statistics mask rows 760-952. Three patch and line boxes that touched a caption were
  moved off it and measured again (grass 12_57.5, metal 12_52.5, dock edge 05_40.5).
- **Colour:** hex values are sRGB. L* and C* are CIE Lab (D65). "Clusters" are k-means with k = 4 in Lab, given as
  colour : area share. FWHM is the full width at half depth of a dark painted line, measured perpendicular to the line
  with band medians. "Edge" is the 10-90 % ramp width of that line's flank.
- **Scripts** (all in `textures/scripts/`):
  - `extract.py`, `crops.py`, `mosaic.py` make the frames, crops and atlases.
  - `measure_patches.py` and `tm.py` give colour, noise and line fraction.
  - `lines.py` and `lines_batch.py` measure line width, edge and depth.
  - `profile.py` gives board profiles, `water.py` water, `sky.py` sky and `clouds.py` clouds.
  - `sidebyside.py` makes the comparison sheets.

## 2. Files to look at

| What | Path (under `references/textures/`) |
|---|---|
| Ref vs ours side-by-sides at the same 1080p scale | `side/sbs_planks.png`, `sbs_beam.png`, `sbs_stone.png`, `sbs_water.png`, `sbs_sky.png`, `sbs_facade_roof.png`, `sbs_grass.png`, `sbs_metal.png`; all in one: `side/sbs_overview_half.jpg` |
| Surface atlases (every crop of a surface) | `mosaic/atlas_planks.jpg`, `atlas_woodwall`, `atlas_dirt`, `atlas_stone`, `atlas_facade`, `atlas_window`, `atlas_roof`, `atlas_grass`, `atlas_water`, `atlas_cloud`, `atlas_rock`, `atlas_metal` |
| Full-res and 2x crops | `crops/*.png`, `crops/x2/*_x2.png`, index `crops/crops.json` |
| Zoom crops (detail) | `crops/z_planks_0125.png`, `z_planks_0540.png`, `z_stone_1255.png`, `z_stone_1409.png`, `z_brick_1220.png`, `z_water_1205.png`, `z_water_1305.png`, `z_cloud_0412.png`, `z_cloud_1415.png`, `z_roof_1312.png`, `z_window_1052.png`, `z_metal_1255.png` ... ; ours `o_planks_b100.png`, `o_cobble_b1810.png`, `o_tower_b1810.png`, `o_water_b470.png` |
| Board profiles | `side/prof_planks_all.png`, `prof_planks_0125.png`, `prof_dock_0540.png`, `prof_porch_0206.png`, ours `prof_planks_b100.png` / `b380` / `b1900` |
| Water mark maps (magenta = crest, green = trough) | `side/watermarks_cmp.png`, `side/watermarks_<frame>.png` |
| Sky row-median strips | `side/sky_strips.png` |
| Numbers | `data/patches.json`, `patches_extra.json`, `lines.json`, `water.json`, `sky.json`, `clouds.json`, `captions.json` |
| Recipe prototype (type-checked) | `proto/paint_recipe.ts` (code in the appendix), swatch page `proto/swatches_inline.html`, previews `proto/views_inline.html`, `proto/build.sh` |

## 3. Measurements, reference vs ours

### 3.1 Deck planks (wooden planks / decks)

| | Reference | Ours | Gap |
|---|---|---|---|
| Sunlit board colours | #f8bb60 (64 %) / #dea04b (01_25.5); #e28c29 / #db983e (01_17.5); #ffab49 / #fe983b (01_50.5); muted ship deck #cd9a66 / #bf8c5c (12_13.5). Median L* 61-74, C* 35-68 | #b77a37 (64 %) / #a46826 (b_100); #c28844 / #ac6d29 (b_380). L* 50-54, C* 47 | ours 20-25 L* too dark, slightly over-orange |
| Shade | rigging and wheel shadow bands #7d4e1c / #875c27 (01_20.5, 01_22.5); porch under a roof #916351 / #a27864, L* 45 (02_06.5) | not measured | |
| Golden hour | dock #c18d61 / #a57651, L* 51 (05_40.5); deck #805345 / #714c46, L* 35 (12_41.5) | #8a440a / #663107 with 32 % #1f0904, L* 20 (b_1680) | ours 15-30 L* too dark |
| Board-to-board L* std | 1.2-4.2 | 5-6 (a staircase of 4 fills) | ours too varied |
| Within-board L* std (grain) | 1.3-2.6, broad, soft | 2-3; dark bezier strokes at alpha 0.35 read as extra gaps | |
| Gap width / board pitch | core about 3.3 %, FWHM 4.6-5.5 % (01_25.5 4.75 / 96 px, 01_50.5 7.67 / 166 px) | core 6.5 %, FWHM about 12 % (b_100 6.57 / 52 px) | ours about 2x too wide |
| Gap FWHM at 1080 | near 3.6-4.8 px, mid and far 3.3-3.5 px (they fade rather than thin), extreme close 7.7 px | near 5.0-6.6 px, mid and far 7.5-9.1 px | ours 1.5-2.5x |
| Gap colour, depth | #571e00 / #591e00 / #6b2903; ΔL* 40-48 in sun, 17-37 in shade, golden or DOF | #582e02 / #703f05 / #794308; ΔL* 16-21 | ours half the contrast |
| Board edges | dock: sunlit lip +4..+7 L* on one side, shaded lip -3..-6 on the other; porch: -6 / -7 on both | flat | missing |
| Details | small dark nails, rare knot rings (05_40.5), butt joints | 2 nails per board at fixed x, one 3 px cut | |
| Edge ramp 10-90 % | 3.2-3.3 px near, 4.8 px extreme close | 3.6-4.9 px | |
| Fine noise (hf) | 0.5-0.8 | 0.7-0.8 | same; keep it clean |

Style: hand-painted but flat. The colour fields are flat with a gentle broad drift, the lines are thin and dark, and there
is no photographic grain. Side by side: `side/sbs_planks.png`, profiles `side/prof_planks_all.png`.

### 3.2 Wood walls, hulls, side beams

| | Reference | Ours |
|---|---|---|
| Painted clapboard | aqua #a0c5c5 with lines #72a0aa / #57797a, FWHM 3.0-3.1 px, ΔL* 15-19, every 23-28 px (10_48.5, 10_52.5); purple #7a3c70, 4.1 px lines (07_43.5) | (none) |
| Painted hull planks | #d33414 (66 %) / #b82e10, C* 77, almost no lines (01_01.5) | (none) |
| Timber in shade or lamp light | #692c1a / #883b1c, L* 30 (12_31.5); #642717 / #411513, L* 27 (01_45.5) | deck side beam #231001, L* 6.7, std 2.3: a flat black band (b_470) |
| Golden | | swing beam #9c602b / #221a05, L* 32 (c_1450) |

Gap: our side beam is 20-25 L* darker than any reference timber, and it has no plank structure at all.

### 3.3 Stone, brick, cobbles, slabs

| | Reference | Ours | Gap |
|---|---|---|---|
| Block colours | bridge wall #c2b2a5 (44 %) / #9a8c7f (35 %) + #f4e2c6 highlights (14_09.5); castle #cdbdb0 / #9c908f, shade #533f47 (11_28.5); flagstones #c4b6b3 / #b5a8a5 / #a79998 (12_55.5); plaza slabs #eadabc / #d7c5aa (03_09.5). C* 5-16, L* 60-73 | tower #9d8d74 / #8d795a, L* 52, C* 18.5 (b_1810); far #927f63 / #59534c, L* 43 (c_140); golden #995d22 / #7a3f09, L* 31 | ours 10-20 L* darker, yellower |
| Mortar | #87796c, FWHM 3.6 px, depth 14 (14_09.5); #6c5b52, 2.8 px, depth 21 (11_28.5); #807270, 4.5 px, depth 20 (12_55.5); edge 2.1-2.9 px | #503f26, FWHM 5.4 px, edge 4.0, depth 22 (b_1810); far 9.4 px, edge 5.7 (c_140) | ours 1.5-2.6x wider, darker and browner |
| Block shading | light top bevel about +5 L*, dark bottom about -3 | flat block plus a thin white top band (alpha 0.12) | |
| Surface detail | dark and light speckles 2-4 px, hairline cracks, chipped corners | dark specks | |
| Brick | #cf5e30 (40 %) / #dca55f, light mortar #f6d9b1 (35 %), L* 67 (12_20.5) | #b5543c family on cream mortar, bricks 1.2 m long at 48 px/m (mill) | ours oversized |
| Cobbles | (no cobbles in the reference; ground is flat slabs or dirt with pebble dabs) | regular grid of ellipses with dark rims: #c3b18f / #756446 / #3d2d17, L* std 20, line fraction 0.13 (b_1810) | reads as a polka-dot pattern |

### 3.4 Plaster facades, windows, shutters

| | Reference | Ours |
|---|---|---|
| Walls | cream plaster #f3e6d2, salmon #e58e6e, red #df585d, timber #804937 / #785248 (13_00.5, 13_12.5); aqua clapboard #a3cdc7 / #b4dbd4 with trim #fceed5, L* 81 (10_48.5) | #879590 (44 %) / #4f4347 (34 %) / near-black #0b0d18 (17 %), L* 40 (b_1810) |
| Window trim | white or cream #d6dfcf / #fceed5, thin dark outline | white #f4efe2 frame with a 2.5 px ink stroke |
| Glass | mid-tone blue-violet #7b7ea0 / #6670b0 with light reflections #a9c2d2 / #9ebacd (10_52.5), two diagonal glints | gradient #8fd0f5 to #3f7fc0; renders near-black in shade |
| Shutters | louvred, violet-blue #816e89 / #5a5f9a, slat lines | flat colour plus ink outline |
| Curtains | pink #f0d5df / #f5c0c8 in some windows | none |
| Texel density | crisp trim lines about 3 px at 1080 | 48 px/m: 2-4 px per texel at 15-30 m, soft |

### 3.5 Roofs

| | Reference | Ours |
|---|---|---|
| Terracotta | #dc8872 (41 %) / #c87563 (31 %) / #ec9c87 (26 %), L* 64, joints 3.3 px, ΔL* 10, no outline per tile (13_12.5) | #92391b family, L* about 40, joints 9.4 px, ΔL* 15, INKL outline on every tile (c_1050) |
| Slate (from above) | #bdbfc6 / #dbe0e9, darks #9292a4 / #705960, L* 74 (11_15.5) | #5b6470 base |
| Thatch | #d49934 / #f0bd59 with #80593d streaks (13_04.5) | |
| Sunset / night | snowy #fab8b8 (07_55.5); cone roof #2e5ccd (11_42.5) | golden #bc949c (c_1450) |

Gap: our roofs are about 20 L* too dark. The tile pattern is drawn with ink outlines 3x the reference joint width.

### 3.6 Grass

| | Reference | Ours |
|---|---|---|
| Sun | #71b038 (44 %) / #7dbf3f (42 %) / #588646, L* 66, C* 64 (10_52.5); #75b43b / #5da12e (12_57.5); plaza #488e2e, L* 53 (03_52.5) | #70b13b / #67a832, L* 64, C* 66 (c_140): **hue and level match** |
| Variation | broad: low-frequency variance 5.7-10, autocorrelation 16-40 px at 1080 | fine and uniform: low-frequency variance 1.6, autocorrelation 6 px |
| Shadow | teal #305c54 (10_48.5) | golden #405106 / #1f0f09, L* 26 (c_1450) |
| Details | sparse flowers and dabs (white, yellow, orange), short tuft strokes | noise only |

### 3.7 Sand and dirt roads

The reference is flat and very low in noise:
- western sand #b0937f (L* 63, std 3.7) in 04_02.5;
- town road #c58b43 / #cc9247 in 02_13.5;
- castle road #b99260 in 11_28.5;
- golden road #e3b46b / #ce9c5d in 13_39.5.

Shadows on the ground turn blue-violet (#4b3c5a in 02_02.5) or warm mauve (#806154 in 13_39.5). The only detail is
sparse cream pebble dabs. Ours: `M.sand` is a flat #e2c992, which renders #774f1c (L* 36) at golden hour (c_1450).
The approach is fine; it is just too dark at golden hour.

### 3.8 Rocks

Every reference rock uses two flat planes: a warm lit face and a cool shade face, with almost no lines (line fraction 0-0.04).
- sea cliffs (12_05.5): lit #caae98, shade #60737c;
- pillars (12_01.5): lit #ddc0a6, shade #868784;
- mountain at sunset (11_58.5): #feb682 / #a67f99;
- pebbles (04_18.5): #bf9d7f / #745a55.

We have no rocks in the bridge scene, so I did not write a rock recipe.

### 3.9 Metal and iron

| | Reference | Ours |
|---|---|---|
| Cannon | bright band #e8e7df (30 %), #8790a6 (27 %), #586076 (23 %), darkest #282f41 (20 %, L* 19) (12_55.5); #e3d5c6 band (27 %) (12_00.5) | |
| Riveted hull | #596474 (84 %), rivets #2d3442 with highlight #f1ddb2 (12_52.5) | |
| Chains, iron | | chain links #040d16 (56 %, L* 3), chains overhead #050b1b, anchorage near-black (c_1042, b_470, d_1030) |

The reference paints iron like a matcap: blue-grey mids, a broad bright band on 25-30 % of the area, and darks that
stop at L* 19. Ours renders 16 L* below the reference's darkest iron. `M.iron` is #2c2f36, and the chain texture
draws #565c66 rings on #2c2f36.

### 3.10 Painted lines vs geometry ink (all at 1080p)

| Line | Reference FWHM / edge / ΔL* | Ours FWHM / edge / ΔL* |
|---|---|---|
| Plank gaps, near | 3.6-4.8 / 2.5-3.3 / 25-48 | 5.0-6.6 / 3.6-4.9 / 16-21 |
| Mortar | 2.8-4.5 / 2.1-2.9 / 14-21 | 5.4-9.4 / 4.0-5.7 / 13-22 |
| Tile joints | 3.3 / 2.7 / 10 | 9.4 / 5.7 / 15 |
| Clapboard | 3.0-4.1 / 2.2-4.0 / 15-19 | (none) |
| Geometry ink outlines (for scale) | 4.1-5.8 / 2.7-3.8 / 23-55, #32221f / #4c3234 | (see the outlines report) |

Rule: painted texture lines are thinner and lighter than the ink outline. They are about 0.7-0.9x the ink width and
half its contrast, so surfaces never compete with silhouettes.

### 3.11 Water

The reference was measured in 11 regions (`data/water.json`). Marks count when L* is more than 6 above the local median
(crest) or more than 6 below it (trough).

| Frame | Gradient stops, far to near | Crest area far / mid / near | Marks per 100x100 px | Crest w / h (px), aspect, angle | Crest colour, ΔL* | Trough colour, ΔL* |
|---|---|---|---|---|---|---|
| 12_18.5 teal sea | #1194b6, #087fa2, #05678f, #035077 | 1.9 / 0.2 / 0.0 % | 0.67 | 12 (p90 47) / 3, 3.0, -9° | #43b7d3, +8.8 | #0e819e, -8.9 |
| 12_05.5 teal sea | #1d97b2, #097fa2, #05668c, #034f77 | 4.9 / 1.6 / 0.9 % | 0.94 | 21 (p90 84) / 3, 4.0, -4° | #47abbd, +8.4 | #267285, -8.4 |
| 01_01.5 azure sea | #81acf1, #4bbbff, #30abff, #27a4ff | 1.5 / 0 / 0 % | 0.32 | 6 (p90 38) / 3, 2.0 | #a8d0f5, +10.4 | |
| 01_02.5 by the hull | #4bbdff, #7dcaff, #1a94fa | 4.0 / 0.4 / 0.0 % | 1.54 | 12 / 1.5, 5.7, 0° | #c0feff, +7.1 | |
| 13_05.5 harbour | #1e70bb, #1663af, #1357a0, #0d4e97 | 4.9 / 1.5 / 0.4 % | 1.28 | 30 (p90 97) / 4.5, 6.0, 0° | +11.0 | |
| 12_52.5 at the hull | #06628b, #045e88, #04557f, #02466f | 1.8 / 0.2 / 0.6 % | 0.24 | 52 / 10, 2.8 | #3d6b94, +12.4 | |
| 14_10.5 river from above | #8fb8d3, #8cb5d2, #87b0d2, #7c9ebc | 2.5 / 7.4 / 1.1 % | 5.38 | 9 / 3, 2.0, 0° | #bccec4, +10.4 | |
| 14_09.5 river under the arch | #0d2138 in shade, #7294b4 lit | 0.4 / 0 / 0.2 % | 0.4 | 13.5 / 1.5, 7.5 | +7.3 | |
| 05_40.5 lake, sunset | #77a5c3, #4482b3, #396362, #5c87a8 | 9.5 / 7.4 / 11.4 % (reflections) | 10.5 | 7.5 / 4.5, 1.5 | +13.3 | |
| 12_34.5 sea, dusk | #262246, #171841, #0a0f38, #040a2d | 10.0 / 1.0 / 0.8 % | 0.99 | 25.5 / 9, 2.1 | #783b52, +13.3 | |
| 08_18.5 night | #1c6ec8, #105fb6, #0a4a99, #083a7c | 5.3 / 2.3 / 0 % | 2.02 | 13.5 / 4.5, 3.0, 0° | #3494a1, +9.7 | #0f5e74, -11.0 |
| **ours b_470** (side view) | #3f7cb7 flat | 11.2 / 12.4 / 12.2 % | 3.94 | 12 / **18, 0.7, -14°** | #619ac9, +10.7 | |
| **ours b_200** (from the bank) | #275690, #2b76af, #3b7bb6 | 7.4 / 6.7 / 9.1 % | 10.2 | 14 / 2, 4.3 | +8.3 | |
| **ours b_1045, c_1050** | #457fb8 / #4a85bc, about flat | 2-4 / 2-9 / 4-6 % | 2.5-3.5 | 12-16 / 6-8, 2.3-2.8 | +7-8 | |
| **ours golden b_1350, b_1680** | #213b4e flat (L* 24, C* 14) | 5-9 % everywhere | 2.9-7.0 | 12 / 4-18, **0.7-4.0** | #3f525d | |

What the reference water does:
- **Base colour.** A flat, saturated vertical gradient: lighter and more cyan towards the horizon, darker and deeper
  near the camera. The top-to-bottom drop is 10-35 L*.
- **Marks.** Sparse and horizontal on screen, with an aspect of 2-7 and an angle within ±9°. They thin out towards the
  camera: about 1.5-5 % of the area far away, 0-1.6 % in the middle, 0-0.9 % near.
- **Crest and trough.** Each crest is +8..+13 L* and has a dark trough right under it (-8..-9 L*).
- **Glints.** A few long, thin glint lines, 1-3 px by 30-100 px.
- **No reflections.** No mirrored geometry. The lake at sunset only has the sky colour and blobs of warm light.

Where ours differs:
- No depth gradient.
- Marks are 2-10x too dense near the camera.
- In side views the marks are vertical streaks (aspect 0.7), because 30-100 px strokes along u face the camera.
- Golden water is a dull navy, C* 14. Reference sunset water is saturated: blue #4482b3 or violet-navy #262246.

### 3.12 Sky gradients (row medians over clean sky; `data/sky.json`, `side/sky_strips.png`)

| Light | Reference stops, top of frame to horizon (C*) | Ours (C*) |
|---|---|---|
| Day | #59abff, #208cfb, #3e9bff, #66baff (49-58) in 04_06.5; #0b6ced, #0f7af9, #1881fd (54-76) in 04_12.5; #266ac1 to #2a88df (52-54) in 18_25.5; #5ba8f0 to #82c4fc (35-43) in 02_13.5; #4d96d5, #7fbcf1, then a thin haze #d7e0e6 (39 to 5) in 12_18.5; #0a4ce6, #1975fd, #4991fc (61-89) in 01_00.5 | #8ab6e7 to #a0c3e9 (22-29) in b_200, c_140, b_1810: half the chroma, 5-10 L* paler |
| Golden / sunset | coral #d27472, #e27d7c, #fda77d, #ffca83 (43) in 13_39.5; lilac to pink #c18dde, #eb9ede, #feb0c6 (48 to 31) in 07_55.5; magenta #312384, #70339f, #ec5080 (63-67) in 02_53.5; blue to cream to peach #508bce, #d5cdbd, #f0bd97 in 05_40.5 | #ab89a1, #b9929d, #ca9d97 (16-19) in b_1350; #c69a99 to #dca890 in b_1680: dusty mauve |
| Dusk / night | #365296 to #a59ba9 (02_48.5); #1849b4 to #1857c8 (C* 66-69) in 11_42.5 | |

Why ours is pale: `mix(hor, top, pow(h, 0.55))` with h = sin(elevation). A level camera with vfov 36° only sees
elevations 0-18°, so the top of the frame is a 52 % mix, #7cb5ec. The saturated `top` colour never shows.

Why our golden sky is grey: mixing blue #5a66b8 with orange #ffc48c passes through grey. The reference turns its hue
through coral, pink and lilac instead.

### 3.13 Clouds (`data/clouds.json`)

| | Lit crown | Mid | Underside | Edge ramp 10-90 % | Dark rim |
|---|---|---|---|---|---|
| 04_12.5, 04_06.5 day | #f1f6fc / #f2f6fb (L* 97) | #e5edf9 | #cfe3fc / #ada7ad | 8.6 / 10.6 px | none |
| 02_02.5 big cumulus | #faedd7 (warm, 63 %) | #dadae9 (30 %) | #b6c1f2 lavender-blue (7 %), bottom third 12.5 % vs top 0.3 % | 16.2 px | none |
| 14_15.5 big cumulus | #fbfafd | #ecedf6 | #d1d4e1 (47 %) | 19.5 px | none |
| 12_01.5, 13_05.5 bands | #ece6e8 / #e2e8f1 | #e6e1e4 / #d3dae8 | #d6d6e0 / #c7cedf | 3.3-8.4 px | none |
| 12_55.5, 18_25.5 small, crisp | #f9eedc / #f7fafe | #ebebec | #d1d8e5 / #ccd6e9 | 1.9-2.1 px | **yes**, -13 L* ink rim |
| 02_48.5 dusk puffs | #daa07e | #9e96ab | #7b88af | 13.4 px | none |
| 13_39.5 sunset | #f99a84 | #ea827c | #cf727c | 25.2 px | none |
| **ours b_200, b_1810 day** | #f0f0f0 for everything (83 % one tone) | | | 4.3-4.8 px | none |
| **ours b_1350 golden** | #f0c9aa flat | | | 4.2 px | none |

The reference cloud shape is a chain of round lobes that is biggest in the middle, with a cauliflower crown and a flat
bottom. It is 100-640 px wide at 1080. Nine of eleven clouds have no outline. Small far crisp clouds sometimes get the
ink rim.

## 4. Texel density

Screen density for our lens is px/m = 1920 / (2 · D · tan(18°)) = **2954 / D**, at vfov 36° on 1080x1920, for a surface
facing the camera. Along the depth axis of a grazing surface, multiply by sin(grazing angle).

| D (m) | 0.5 | 1 | 2 | 5 | 10 | 20 | 50 | 100 |
|---|---|---|---|---|---|---|---|---|
| px/m | 5908 | 2954 | 1477 | 591 | 295 | 148 | 59 | 30 |

**What the reference does.** I estimated the reference's magnification (screen px per texel) from its painted-edge
ramps, after removing the 720p video blur:
- ramp 10-90 % ≈ sqrt((0.8 M)² + 1.5²);
- mortar and clapboard: M ≈ 2-3;
- plank gaps near: M ≈ 3.7;
- extreme close deck (01_50.5): M ≈ 5.7.

So the reference textures are magnified 2-6 px per texel and never more. **Target: M ≤ 6 at the closest lens, M ≤ 3 at
working distances.** Required texels/m = px/m / M.

| Surface | Now | Typical D | Now: px per texel | Target texels/m | Recipe |
|---|---|---|---|---|---|
| Deck top | 512 px / 4 m = 128 /m | 0.5-3 m (lens 0.36 m above the deck, nearest deck about 1.05-1.3 m, grazing about 18°) | 46 at 0.5 m facing; about 6-10 along z at 1.2 m | ≥ 1000 (0.5 m), ≥ 500 (1 m) | `planksHD` 2048 px / 2 m = **1024 /m** (M = 5.8 at 0.5 m, 2.9 at 1 m); anisotropy 16 |
| Deck side beam | 256 px / 3 m = 85 /m | 1-5 m | 35 at 1 m | ≥ 300 | `beamHD` 1024 / 3 m = 341 /m along, 512 /m vertical |
| Tower blocks | 512 / 2 m = 256 /m | 3-60 m | 3.8 at 3 m | ≥ 500 for 3 m close-ups | `stoneHD` 1024 / 2 m = **512 /m** |
| Quay wall | 512 / 4 m = 128 /m | 5-40 m | 4.6 at 5 m | ≥ 200 | `stoneHD` on the 4 m tile = 256 /m (0.5 m blocks) |
| Cobbles | 512 / 4 m = 128 /m | 3-30 m | 7.7 at 3 m | ≥ 250 | `cobbleHD` 1024 / 4 m = 256 /m |
| Grass | 512 / 4 m = 128 /m | 3-60 m | 7.7 at 3 m | ≥ 250 | `grassHD` 1024 / 4 m = 256 /m |
| Roofs | 512 / 4 m = 128 /m | 15-200 m | 1.5 at 15 m | ≥ 100 | `roofHD` 1024 / 4 m = 256 /m (no ink) |
| Facades | 48 px/m | 15-100 m | 4.1 at 15 m | ≥ 96 | `facadeHD` **96 px/m**, capped at 2048 px a side |
| Chain | 512 / 2 m = 256 /m | 1-10 m | 11.5 at 1 m | ≥ 500 | `chainHD` 1024 / 2 m = 512 /m |
| Water | 512 / 8 m = 64 /m | 6-500 m | see section 3.11 | marks keep a constant on-screen size | 2 bands: 1024 / 8 m near, 1024 / 40 m far |
| Clouds | 600x300 per 110-185 m sprite | 620-740 m | sprite 500-840 px on screen | about 1 texel per px | `cloudHD` 1024x512 |

Memory, RGBA plus mips:
- `planksHD` 22 MB;
- each 1024² texture 5.6 MB (towers, cope and wall stones, cobbles, grass, 5 roof colours, 2 water textures: about 75 MB);
- beam, chain and 8 cloud sprites together about 25 MB;
- facades at 96 px/m, about 4 MB for a 10x10 m front.

If the house count makes facades too heavy, use 72 px/m. That still halves the current blur.

## 5. Implementation recipe (our stack: three.js 0.175, Lambert materials, CanvasTexture via `ctex`)

All painters are in `proto/paint_recipe.ts` and listed in full in the appendix. They use `ctex(key, w, h, (g, r) => ...)`
and `rng` exactly as `paint.ts` does, and need no images. `tsc --strict` passes. To install them, paste the helpers
(`U`, `wrapX`, `wrap2`, `rr`, `blotch`, `grain`, `nail`) and the painters into `src/videos/bridge/paint.ts`. Change the
import to the local `ctex` / `rng`. All painters tile seamlessly in x, and scattered marks also wrap in y.

### 5.1 Parameters at a glance

| Painter | Canvas | Covers | Colours / strokes (key values) |
|---|---|---|---|
| `planksHD()` | 2048² | 2 m x 2 m, 8 boards of 256 px (0.25 m) | **Boards:** fills #efbd82 #e8b47a #f4c58b #e3ae74 #ecb97e (L* 75-82, std 2.6, hue 71-75°). With today's pipeline use the lighter set in 5.4; 5 drift blotches per board (r 120-260, x3 stretch, α 0.08-0.12); 10 grain strokes (500-1500 px long, amplitude 2-7, lw 1.5-3.5, rgba(140,82,36,.13) or light rgba(255,238,205,.14)); knot on 35 % of boards. **Edges:** sunlit lip 3 px rgba(255,238,200,.35); shaded lip 18 px gradient to rgba(80,35,10,.24). **Joints and nails:** 1 butt joint per board (6 px #66300f) with 4 nails (r 5, #3a2212 plus a glint); joist nails every 1 m. **Gaps:** 8 px #66300f plus a 1 px rim rgba(102,48,15,.5) (about 4 % of the pitch, as measured) |
| `beamHD()` | 1024x512 | 3 m x 1 m | 7 timbers (0.143 m), fills #a8743f #9e6b39 #b07a44; 6 grain strokes, α 0.12-0.16; top lip rgba(255,235,195,.30); bottom shade rgba(60,28,8,.26); seams #4a2510; one joint per timber with 2 bolts #2f2a2a |
| `stoneHD(key, cols, mortar)` | 1024² | 2 m tile: 0.25 m courses | towers ["#ddd0bf","#d3c5b3","#e5d9c9","#cabba8"], mortar #a39584; joint 7 px (5.5 %); blocks 200-360 px, running bond; top bevel 6 px α 0.22, left 4 px α 0.10, bottom 5 px rgba(70,55,45,.14); 16 speckles (r 1-2.2); cracks on 15 % of blocks; per-block ±7 % tone |
| `cobbleHD()` | 1024² | 4 m: 24 courses of 0.167 m | joints #8c7e69; setts 48-72 px, radius 7-12, #c4baa8 #b9ae9b #cfc5b3 #b3a793 #c9bfae #bdb4a6; light top-left and dark bottom-right gradient (α 0.20 / 0.16); no rim |
| `roofHD(col, slate)` | 1024² | 4 m: 0.25 m courses | tiles 77 px (slate 52); ±10 % tone per tile; pan gradient; joint 2 px α 0.22; lip light 3 px; course shadow 5 px rgba(55,22,18,.32); **no INKL outline** |
| `grassHD()` | 1024² | 4 m | base #73b23d; 16 patches r 120-320 (#8cc650 / #5c9a30 at α 0.35); 1400 V-tufts (7-16 px, lw 2); 12 flowers r 3.5 (#f7f3e8 #f4d24a #f3a9bb) |
| `facadeHD(key, wm, hm, o)` | 96 px/m (cap 2048) | same options as `facade()` | plaster blotches r 0.4-1.5 m (α 0.05-0.07), hairline cracks, plinth 0.45 m; timber #6e4a30, 0.18 m, with posts; windows 0.85x1.25 m: trim #f7f2e8 0.08 m with a 1.5 px rgba(60,45,40,.6) line; glass #8d9cdb to #5761a8; 2 glints at 45° (0.07 / 0.035 m, white α 0.5); curtains on 35 % (#f5c4c8 #f3e3c6 #d7e6cf); louvred shutters (slats every 0.06 m); brick at true size 0.25x0.085 m on #e9d3b4 |
| `waterNear()` / `waterFar()` | 1024² data texture (R crest, G trough, B glint) | 8 m and 40 m | arcs 18-44 px, sag 0.3-0.45 w, lw 3-5, random rotation; trough at +1.5 lw; near has 28 arcs and 5 glints, far 220 arcs and 30 glints; glints 40-140 x 1.2-2.4 px. Set `colorSpace = THREE.NoColorSpace` |
| `cloudHD(seed, pal)` | 1024x512 | one sprite | 6-9 lobes biggest in the middle, plus a crown; 3 layers: underside (blur 6), mid shifted (-.04, -.12)r x0.9 (blur 8), lit shifted (-.10, -.26)r x0.72 (blur 10); flat bottom fade 24 px; `CLOUD_DAY` #fbf8f1 / #e1e5f3 / #c3cbe9, `CLOUD_GOLD` #ffd2a8 / #f2a08f / #a98fc4 |
| `chainHD()` | 256x1024 | 4 faces x 2 m | background #262c3e; face-on rings lw 15 #5f6880 with #20263a edges; highlight arc lw 5 #d4d6de (upper left); glint #fbfaf4; edge-on links #56607a with stripe #c9ccd6 |
| `SKY` | | | day #d8ecf7 (0°), #8ccbf8 (3°), #4aa3f2 (12°), #2a7fe6 (30°+); golden #ffd08a (0°), #ffad7e (4°), #e9849a (14°), #8c78c4 (32°+) |

### 5.2 `world.ts` changes (file and lines as of this study)

1. **Deck top, line 194.** Change the uv to `ZS.flatMap((z) => [0, z / 2, 2.5, z / 2])`. On line 209, change the
   material to `lam("planksHD", () => ({ map: planksHD() }))`. Afterwards set `map.anisotropy = 16` (WebGL clamps it).
2. **Deck side, line 209.** Give `this.deckSide` its own `lam("deckSide", () => ({ map: beamHD() }))`. Do not swap
   `M.wood`: posts, ribs, rails and the sign use box UVs, and the 7-timber layout would be wrong there. Lift `M.wood`
   itself by editing `beam()`:
   - base `#6b4428` becomes `#a8743f`;
   - strokes `rgba(40,22,12,.45) lw 2` become `rgba(85,48,20,.16) lw 2-3`.
   This keeps any wood above L* 25 in shade.
3. **Materials, lines 127-134.**
   - `M.grass` uses `grassHD()`, `M.cobble` uses `cobbleHD()`.
   - `M.wall` uses `stoneHD("wallHD", ["#c9bcaa","#bfb19f","#d1c5b4","#b8aa97"], "#958776")`.
   - `M.cope` uses `stoneHD("copeHD", ["#e6dccd","#ddd3c3","#ece4d6","#d6cbba"], "#aea293")`.
   - `M.tower` uses `stoneHD("towerHD")`, which defaults to the tower colours.
   - **`M.iron` colour `#2c2f36` becomes `#4b5468`.**
   - Line 217: `chainM` map is `rep(chainHD(), 1, 1)`.
4. **Water, lines 185-188, plus the per-frame line about 283** (`this.waterMap.offset.set(...)`): replace the material with this shader:

```ts
const wNear = waterNear(), wFar = waterFar();
for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
this.WU = {
  wNear: { value: new THREE.Color() }, wMid: { value: new THREE.Color() }, wFar: { value: new THREE.Color() },
  wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
  wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
};
const waterM = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.9 });
waterM.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, this.WU);
  sh.vertexShader = sh.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
    .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
  sh.fragmentShader = sh.fragmentShader
    .replace("#include <common>", `#include <common>
varying vec3 vWP;
uniform vec3 wNear, wMid, wFar, wCrest, wTrough, wGlint;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`)
    .replace("#include <map_fragment>", `
  vec3 V = vWP - cameraPosition;
  float d = length(V);
  float dep = asin(clamp(-V.y / d, 0.0, 1.0));        // depression angle of the view ray
  float f = 1.0 - smoothstep(0.0, 0.42, dep);         // 1 at the horizon .. 0 at 24 deg down (spreads over the frame)
  vec3 c = mix(mix(wNear, wMid, smoothstep(0.0, 0.55, f)), wFar, smoothstep(0.55, 1.0, f));
  vec2 p = vWP.xz + vec2(0.35 * wTime, 0.0);          // slow river, 0.35 m/s along +x
  vec4 mk = mix(texture2D(wNearTex, p / 8.0), texture2D(wFarTex, p / 40.0 + 0.37), smoothstep(25.0, 90.0, d));
  c = mix(c, wTrough, mk.g * 0.6);
  c = mix(c, wCrest, mk.r * 0.7);
  c = mix(c, wGlint, mk.b * (0.3 + 0.5 * f));
  diffuseColor.rgb = c;`);
};
const wm = new THREE.Mesh(quadUp(-900, 900, -30, 30, 1, 1, -D0), waterM);
// per frame: this.WU.wTime.value = t; and set the six colours from the light preset (table below)
```

Water colours per light. The day and golden values were checked in the preview (5.6):

| Preset | wNear | wMid | wFar | wCrest | wTrough | wGlint |
|---|---|---|---|---|---|---|
| day | #0c5a8c | #1679ad | #2a9cc8 | #5fcfe6 | #0a4774 | #e8fbff |
| golden | #23306a | #3e5594 | #b98a9e | #d9a088 | #1a2350 | #ffe2b0 |

5. **Sky, lines 102-107 and 279.** Use 4 stops by elevation in place of `mix(hor, top, pow(h, .55))`:

```ts
this.skyMat = new THREE.ShaderMaterial({
  uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
              c3: { value: new THREE.Color() }, e: { value: new THREE.Vector3() } },
  vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `uniform vec3 c0, c1, c2, c3; uniform vec3 e; varying vec3 vP;
    void main(){ float el = asin(clamp(vP.y, -1.0, 1.0));
      vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
      c = mix(c, c2, smoothstep(e.x, e.y, el));
      c = mix(c, c3, smoothstep(e.y, e.z, el));
      gl_FragColor = vec4(c, 1.0); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
// per frame (replaces top/hor): const S = SKY[s.light]; const u = this.skyMat.uniforms;
// S.c.forEach((h, i) => u["c" + i].value.set(h)); u.e.value.set(...S.e.map((deg) => (deg * Math.PI) / 180));
```

   Keep `L.fog` for the fog. Its colour should sit near `c0` of the active preset: day #d8ecf7, golden #ffd08a.

6. **Clouds, line 119 and lines 282-283.** Build two sets: `cloudHD(i % 4, CLOUD_DAY)` and `cloudHD(i % 4, CLOUD_GOLD)`.
   Swap the map per light, and drop the `#ffd6b8` multiply tint. The sprite aspect stays 2:1 (w, w/2).

### 5.3 `build.ts` changes

- Lines 204-205, 300-301: change `facade(...)` to `facadeHD(...)`, keeping the same options.
- Line 196: change `roof(col)` to `roofHD(col, col === "#5b6470")`.
  - Lift the roof palette in `STYLES` towards the reference: #b5503c to #d27a62, #8a4a3a to #b8644f, #a35a3a to #c9775a,
    #6b5a7a to #8e7aa0, slate #5b6470 to #8f97a8.
  - The reference terracotta measures #dc8872 / #c87563, and slate #bdbfc6 / #9292a4.
- Line 286: change the church tower `stone("tstone", ...)` to `stoneHD("tstoneHD", ["#e2d8c2","#d6cbb2","#ece3cf","#cfc4aa"], "#a99d8b")`.

### 5.4 Shot-level rules (for whoever tunes lights)

- **Sunlit deck:** L* 72-80 on screen.
  - Today's albedo-to-screen transfer, measured on the deck, is about **-8 L\* and +7 C\***: fills #c68a52 / #b97c46 /
    #d39a5f / #bf8550 (L* 62 mean) land at #b77a37 / #a46826 / #c28844 / #ac6d29 (L* about 54) in b_100 and b_380.
  - So unless the lighting or grade reports lift exposure, use the lighter fills
    `["#fdd3a0", "#f7ca96", "#ffdaa8", "#f2c48e", "#fad09b"]` (L* 82-89, C* 30-35). These should land at L* 74-81,
    C* about 40.
  - The default fills in `paint_recipe.ts` (L* 75-82) assume a neutral pipeline.
  - If the deck is still short, raise the albedo before the sun.
- **Shade:** timber at L* 27-35, deck shade at L* about 45, iron no lower than L* 19. Only ink and gap cores may go darker.
- **Painted lines:** 3-5 px at 1080, and at most half the ink outline's contrast.

### 5.5 Acceptance checks after the first render (re-run `scripts/measure_patches.py` / `water.py` / `sky.py` on the new stills)

| Check | Target |
|---|---|
| Deck sunlit board median | L* 72-80, C* 35-55, hue 70-78° |
| Deck gaps | FWHM 3.5-5 px near, ΔL* 40-48, ≤ 5 % of the pitch |
| Water | gradient spread over the whole water area (≥ 10 L* drop top to bottom); crest area far 1.5-5 %, mid ≤ 1.6 %, near ≤ 0.9 %; marks aspect 3-6 |
| Sky, day | top-of-frame C* ≥ 45 |
| Sky, golden | C* ≥ 40 on every stop, no grey midband |
| Clouds | 3 tones: underside L* 79-86, lavender hue 250-280°; edge ramp 8-20 px |
| Iron and chains | darkest 10 % at L* ≥ 18; bright band present |
| Mortar and tile joints | FWHM ≤ 4 px |

### 5.6 Prototype check (CPU preview, `proto/views_inline.html`, 540x960, 4x4 supersampled)

**River**, camera 6 m above the water, pitch 8°, vfov 36°:

| Heading / light | Gradient, top to bottom | Crest area far / mid / near | Marks per 100² | Width (p90) | Height | Aspect | Crest ΔL* |
|---|---|---|---|---|---|---|---|
| along the flow, day | #2e9dc8, #2591be, #1575a9, #0d5c8e, #0c5a8c | 1.6 / 1.0 / 0.8 % | 1.75 | 10 (28) px | 4 px | 4 | +12.3 |
| across, day | | 1.6 / 1.0 / 0.8 % | 1.64 | 10 (30) px | 4 px | 3 | +12.6 |
| golden | | | | | | | +16.4, before the crest was lowered to #d9a088 |

All of these are inside the reference ranges in 3.11. Mark width is at the low end, so widen the arcs by about 20 % if
they look small.

**Deck** from the 0.36 m lens: boards L* 74-76, gaps 2-4 % of the pitch, gap depth 52 L*. I then lightened the gap
core to #66300f, which should bring the depth to about 45 (reference 40-48). At 0.5-0.9 m the gap FWHM is about
24 px, 3.2 % of the pitch.

## 6. Top 5 changes, ranked by visual impact

1. **Sky gradient (world.ts sky shader + `SKY` stops).** The sky covers 20-35 % of most wide frames. Ours is at half
   the reference chroma (C* 22-29 vs 40-89), and the golden preset is grey-mauve (C* 16-19). Use the 4 stops by
   elevation in 5.2, so the frame top reads #3d95ee in day light, and golden passes through coral and lilac.
2. **River water (shader + `waterNear` / `waterFar`).** Water covers 20-40 % of the river shots. Make three changes:
   - a depression-angle gradient (deep near, light cyan at the horizon);
   - sparse horizontal crest and trough marks that thin out towards the camera (1.6 / 1.0 / 0.8 %, not 4-12 %);
   - no vertical streaks.
   Golden water should be saturated violet-blue, not #213b4e.
3. **Deck planks (`planksHD` + deck uv).** Brighten the sunlit boards to L* 72-80 (now 50). Make the gaps half as
   wide and twice as dark, about 4 % of the pitch. Add the lit and shaded lips. Grain must never read as a gap. 1024
   texels/m keeps the 0.5 m lens within 5.8 px per texel.
4. **Stone (`stoneHD` for towers, cope and quay, `cobbleHD`).** Use neutral, lighter blocks (C* about 10, L* about 75
   in sun). Make the mortar a third thinner and much lighter (ΔL* about 18, not a #503f26 trench). Replace the polka-dot
   cobbles with staggered setts.
5. **Iron and timber out of black (`M.iron` #4b5468, `chainHD`, `beamHD`, lighter `beam()`).** The chains, anchorages
   and deck side beams render at L* 3-7. The reference never goes below L* 19 except in ink lines. Painted highlight
   bands are what make the reference iron read as metal.

Next, in order:
6. `facadeHD` at 96 px/m: mid-tone glass, white trim, no heavy ink.
7. `roofHD`: no ink on each tile, lighter palette.
8. `cloudHD`: three tones with a lavender underside.
9. `grassHD`: broad patches and sparse flowers.

## 7. Caveats

- Our stills are 540p JPEG previews. The edge and line numbers for ours carry about 2 px of upscale blur, so the true
  1080 render will be slightly sharper than reported. The colour numbers are not affected.
- Screen colours combine albedo, lights and the grade. The recipe gives albedos tuned to the current day light (a flat
  deck under it gets about x0.93-1.03 per channel, linear) and on-screen targets for checking. If the lighting or grade
  reports change exposure, keep the on-screen targets and re-tune the albedos.
- The reference has no cobbles and no suspension chains. Those recipes follow the reference's general rules (flat
  tones, thin light joints, painted highlight bands), not a measured counterpart.
- The CPU previews have no mipmaps or lighting. Re-measure on real renders (5.5).

## Appendix: `proto/paint_recipe.ts` (type-checked with `tsc --strict`; in reel-kit import `ctex` / `rng` from `./paint`)

```ts
// Texture recipe for the bridge short: Canvas2D painters in the style of reel-kit/src/videos/bridge/paint.ts
// (ctex + rng, no external images). Prototype copy for checking only; in reel-kit they go into paint.ts next to
// the old painters (import line becomes `from "./paint"` / local). Numbers in comments are the reference
// measurements each value is tuned to (reports/textures.md). All sizes assume the uv scales noted per function.
import { ctex, rng } from "./shim";

type R = () => number;
type G = CanvasRenderingContext2D;
const pick = <T,>(r: R, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const U = (r: R, a: number, b: number) => a + (b - a) * r();
const TAU = Math.PI * 2;

/** run fn at x and again one tile over when [x, x + w] crosses the left / right edge (seamless repeat in x) */
const wrapX = (W: number, x: number, w: number, fn: (x: number) => void) => {
  fn(x);
  if (x + w > W) fn(x - W);
  if (x < 0) fn(x + W);
};
/** same for a scattered mark of radius rad, in x and y */
const wrap2 = (W: number, H: number, x: number, y: number, rad: number, fn: (x: number, y: number) => void) => {
  for (const ox of [0, -W, W]) for (const oy of [0, -H, H]) {
    const X = x + ox, Y = y + oy;
    if (X + rad > 0 && X - rad < W && Y + rad > 0 && Y - rad < H) fn(X, Y);
  }
};
/** rounded-rectangle path */
const rr = (g: G, x: number, y: number, w: number, h: number, k: number) => {
  k = Math.max(0, Math.min(k, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + k, y);
  g.arcTo(x + w, y, x + w, y + h, k); g.arcTo(x + w, y + h, x, y + h, k);
  g.arcTo(x, y + h, x, y, k); g.arcTo(x, y, x + w, y, k);
  g.closePath();
};
/** soft elliptical blotch (radial gradient) stretched sx along x */
const blotch = (g: G, x: number, y: number, rad: number, sx: number, rgb: string, a: number) => {
  g.save(); g.translate(x, y); g.scale(sx, 1);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rad);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(-rad, -rad, rad * 2, rad * 2);
  g.restore();
};
/** long, soft wood-grain stroke along +x; random offsets drawn once so the wrapped copy matches */
const grain = (g: G, r: R, W: number, x: number, y: number, len: number, amp: number, lw: number, col: string) => {
  const n = Math.max(2, Math.round(len / 180));
  const dy = Array.from({ length: n + 1 }, () => (r() - 0.5) * 2 * amp);
  wrapX(W, x, len, (xx) => {
    g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round";
    g.beginPath(); g.moveTo(xx, y + dy[0]);
    for (let i = 1; i <= n; i++) {
      const x1 = xx + (len * i) / n;
      g.quadraticCurveTo(x1 - len / n / 2, y + (dy[i - 1] + dy[i]) / 2 + (i % 2 ? 0.3 : -0.3) * amp, x1, y + dy[i]);
    }
    g.stroke();
  });
};
/** nail / bolt head with a small painted glint (ref: dark dots with a white catch-light) */
const nail = (g: G, x: number, y: number, rad: number, col = "#3a2212") => {
  g.fillStyle = col; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
  g.fillStyle = "rgba(255,240,215,0.55)"; g.beginPath(); g.arc(x - rad * 0.32, y - rad * 0.32, rad * 0.36, 0, TAU); g.fill();
};

// ---------------------------------------------------------------------------------------------------------------
/** Deck top, transverse boards. 2048 px = 2 m x 2 m (1024 texels/m: the 0.5 m lens then magnifies ~5.8 px per
 *  texel, the same as the reference's closest deck shot, 10-90 % edge ramp ~4.8 px at 1080p).
 *  Canvas y runs along the bridge (z): 8 boards of 0.25 m = 256 px. world.ts deckTop uv -> [0, z / 2, 2.5, z / 2].
 *  Ref: board-to-board L* std 1.2-4.2 (ours 5-6), within-board 1.3-2.6, gaps ~4 % of the pitch (FWHM) dark brown
 *  #571e00-#6b2903 (dL* 40-48), sunlit lip +4..7 L*, shaded lip -3..-6 L*, nails + rare knots. */
export const planksHD = () => ctex("planksHD", 2048, 2048, (g, r) => {
  const S = 2048, B = 256, GAP = 8;
  // albedo: under the current day light sunlit boards must then measure L* 72-80 on screen (ref #f8bb60, #dea04b,
  // #cd9a66); if they come out darker, raise these (up to #ffd08a) before touching the light
  const fills = ["#efbd82", "#e8b47a", "#f4c58b", "#e3ae74", "#ecb97e"];
  for (let i = 0; i < 8; i++) {
    const y = i * B;
    g.save(); g.beginPath(); g.rect(0, y, S, B); g.clip();
    g.fillStyle = pick(r, fills); g.fillRect(0, y, S, B);
    for (let k = 0; k < 5; k++) { // broad tone drift along the board, +-2 L*
      const x = U(r, 0, S), rad = U(r, 120, 260), light = r() > 0.5;
      wrapX(S, x - rad * 3, rad * 6, (xx) => blotch(g, xx + rad * 3, y + B / 2, rad, 3, light ? "255,236,200" : "150,90,40", light ? 0.12 : 0.08));
    }
    for (let k = 0; k < 10; k++) { // grain: long, thin, low contrast; never as dark as a gap
      const light = r() < 0.3;
      grain(g, r, S, U(r, 0, S), y + U(r, 16, B - 16), U(r, 500, 1500), U(r, 2, 7), U(r, 1.5, 3.5),
        light ? "rgba(255,238,205,0.14)" : "rgba(140,82,36,0.13)");
    }
    if (r() < 0.35) { // knot, about one board in three
      const kx = U(r, 120, S - 120), ky = y + U(r, 70, B - 70), rx = U(r, 14, 24), ry = rx * U(r, 0.45, 0.6);
      g.strokeStyle = "rgba(140,82,36,0.20)"; g.lineWidth = 2;
      g.beginPath(); g.ellipse(kx, ky, rx * 2.3, ry * 1.9, 0, 0, TAU); g.stroke();
      g.fillStyle = "rgba(150,88,38,0.30)"; g.beginPath(); g.ellipse(kx, ky, rx, ry, 0, 0, TAU); g.fill();
      g.strokeStyle = "rgba(105,55,22,0.55)"; g.lineWidth = 2.5; g.stroke();
    }
    for (let k = 0; k < 3; k++) blotch(g, U(r, 100, S - 100), y + U(r, 40, B - 40), U(r, 40, 110), 1.6, "120,70,30", 0.06); // wear
    // board edges: sunlit lip on one side, soft darkening on the other
    g.fillStyle = "rgba(255,238,200,0.35)"; g.fillRect(0, y + GAP / 2 + 1, S, 3);
    const sh = g.createLinearGradient(0, y + B - GAP / 2 - 18, 0, y + B - GAP / 2);
    sh.addColorStop(0, "rgba(80,35,10,0)"); sh.addColorStop(1, "rgba(80,35,10,0.24)");
    g.fillStyle = sh; g.fillRect(0, y + B - GAP / 2 - 18, S, 18);
    // one butt joint per board per tile (staggered), nailed both sides; joist nails every 1 m
    const jx = U(r, 90, S - 90);
    g.fillStyle = "#66300f"; g.fillRect(jx - 3, y, 6, B);
    g.fillStyle = "rgba(255,238,200,0.30)"; g.fillRect(jx + 3, y, 2, B);
    for (const nx of [jx - 24, jx + 24]) for (const f of [0.28, 0.72]) nail(g, nx, y + B * f, 5);
    for (const nx of [512, 1536]) for (const f of [0.3, 0.7]) nail(g, nx + U(r, -3, 3), y + B * f, 5);
    g.restore();
  }
  for (let i = 0; i <= 8; i++) { // gaps last: 8 px core + 1 px soft rim = ~4 % of the 256 px pitch
    g.fillStyle = "rgba(102,48,15,0.5)"; g.fillRect(0, i * B - GAP / 2 - 1, S, GAP + 2);
    g.fillStyle = "#66300f"; g.fillRect(0, i * B - GAP / 2, S, GAP);
  }
});

/** Deck side beams / stringers: 1024 x 512 = 3 m along the beam x 1 m (matches the side uv: z / 3, height in m).
 *  Ours rendered #231001 (L* 7, reads as a black hole); ref timber in shade stays at L* 27-34 (#77331b, #632918). */
export const beamHD = () => ctex("beamHD", 1024, 512, (g, r) => {
  const W = 1024, H = 512, T = H / 7; // 0.143 m timbers
  for (let k = 0; k < 7; k++) {
    const y = k * T;
    g.save(); g.beginPath(); g.rect(0, y, W, T); g.clip();
    g.fillStyle = pick(r, ["#a8743f", "#9e6b39", "#b07a44"]); g.fillRect(0, y, W, T);
    for (let i = 0; i < 6; i++) {
      const light = r() < 0.3;
      grain(g, r, W, U(r, 0, W), y + U(r, 8, T - 8), U(r, 250, 700), U(r, 1.5, 4), U(r, 1.5, 3), light ? "rgba(255,232,190,0.12)" : "rgba(85,48,20,0.16)");
    }
    g.fillStyle = "rgba(255,235,195,0.30)"; g.fillRect(0, y + 3, W, 3);
    const sh = g.createLinearGradient(0, y + T - 12, 0, y + T);
    sh.addColorStop(0, "rgba(60,28,8,0)"); sh.addColorStop(1, "rgba(60,28,8,0.26)");
    g.fillStyle = sh; g.fillRect(0, y + T - 12, W, 12);
    const jx = U(r, 120, W - 120);
    g.fillStyle = "#4a2510"; g.fillRect(jx - 2, y, 4, T);
    for (const bx of [jx - 30, jx + 30]) nail(g, bx, y + T / 2, 7, "#2f2a2a");
    g.restore();
    g.fillStyle = "#4a2510"; g.fillRect(0, y - 1.5, W, 3); // seam between timbers
  }
});

/** Ashlar courses, 1024 px per tile: with boxGeo tile 2 (towers) courses are 0.25 m at 512 texels/m; with the 4 m
 *  quad tile (quay walls) 0.5 m blocks. Ref: blocks #c2b2a5 / #cdbdb0 (C* 5-12), mortar dL* -14..-20 and only
 *  2.8-3.6 px wide at 1080p (ours #503f26, 5.4 px, yellow C* 18), top bevel +5 L*, bottom -3 L*, 2-4 px speckles,
 *  hairline cracks. Joint = 7 px = 5.5 % of a course. */
export const stoneHD = (key = "stoneHD", cols = ["#ddd0bf", "#d3c5b3", "#e5d9c9", "#cabba8"], mortar = "#a39584") =>
  ctex(key, 1024, 1024, (g, r) => {
    const S = 1024, RH = 128, J = 7;
    g.fillStyle = mortar; g.fillRect(0, 0, S, S);
    for (let row = 0; row < S / RH; row++) {
      const y = row * RH, ws: number[] = [];
      let sum = 0;
      while (sum < S) { const w = U(r, 200, 360); ws.push(w); sum += w; }
      const k = S / sum; // stretch so every course closes exactly on the tile width
      let x = (row % 2) * 140 + U(r, 0, 60);
      for (const w0 of ws) {
        const w = w0 * k, col = pick(r, cols), dl = U(r, -1, 1);
        const sp = Array.from({ length: 16 }, () => [r(), r(), U(r, 1, 2.2), r() < 0.6 ? 1 : 0]);
        const crack = r() < 0.15 ? Array.from({ length: 4 }, () => [r(), r()]) : null;
        wrapX(S, x % S, w, (xx) => {
          const X = xx + J / 2, Y = y + J / 2, BW = w - J, BH = RH - J;
          rr(g, X, Y, BW, BH, 5); g.fillStyle = col; g.fill();
          g.fillStyle = dl > 0 ? `rgba(255,252,245,${0.07 * dl})` : `rgba(70,55,45,${-0.06 * dl})`; g.fill();
          g.fillStyle = "rgba(255,252,245,0.22)"; g.fillRect(X + 3, Y, BW - 6, 6);        // top bevel
          g.fillStyle = "rgba(255,252,245,0.10)"; g.fillRect(X, Y + 4, 4, BH - 8);        // left bevel
          g.fillStyle = "rgba(70,55,45,0.14)"; g.fillRect(X + 3, Y + BH - 5, BW - 6, 5); // bottom shade
          for (const [u, v, s, dark] of sp) {
            g.fillStyle = dark ? "rgba(95,82,72,0.38)" : "rgba(255,255,255,0.35)";
            g.beginPath(); g.arc(X + 6 + u * (BW - 12), Y + 8 + v * (BH - 16), s, 0, TAU); g.fill();
          }
          if (crack) {
            g.strokeStyle = "rgba(110,95,85,0.45)"; g.lineWidth = 1.2; g.beginPath();
            crack.forEach(([u, v], i) => { const px = X + 10 + u * (BW - 20), py = Y + 10 + v * (BH - 20); if (i) g.lineTo(px, py); else g.moveTo(px, py); });
            g.stroke();
          }
        });
        x += w;
      }
    }
  });

/** Cobbled quay: granite setts in staggered courses, 1024 px = 4 m (256 texels/m; setts 0.19-0.28 x 0.167 m).
 *  Replaces the polka-dot ellipses (ours: regular grid, dark rims, L* std 20): low tone spread, sand-coloured
 *  joints, a soft top-left light and bottom-right shade per sett, no outline ring. */
export const cobbleHD = () => ctex("cobbleHD", 1024, 1024, (g, r) => {
  const S = 1024, N = 24, CH = S / N, J = 5;
  g.fillStyle = "#8c7e69"; g.fillRect(0, 0, S, S);
  const cols = ["#c4baa8", "#b9ae9b", "#cfc5b3", "#b3a793", "#c9bfae", "#bdb4a6"];
  for (let row = 0; row < N; row++) {
    const y = row * CH, ws: number[] = [];
    let sum = 0;
    while (sum < S) { const w = U(r, 48, 72); ws.push(w); sum += w; }
    const k = S / sum;
    let x = U(r, 0, 60);
    for (const w0 of ws) {
      const w = w0 * k, col = pick(r, cols), dy = U(r, -1.5, 1.5), rad = U(r, 7, 12);
      const sp = Array.from({ length: 3 }, () => [r(), r(), r() < 0.5 ? 1 : 0]);
      wrapX(S, x % S, w, (xx) => {
        const X = xx + J / 2, Y = y + J / 2 + dy, W = w - J, H = CH - J;
        rr(g, X, Y, W, H, rad); g.fillStyle = col; g.fill();
        g.save(); rr(g, X, Y, W, H, rad); g.clip();
        const gr = g.createLinearGradient(X, Y, X + W * 0.6, Y + H);
        gr.addColorStop(0, "rgba(255,250,240,0.20)"); gr.addColorStop(0.5, "rgba(255,250,240,0)"); gr.addColorStop(1, "rgba(70,58,45,0.16)");
        g.fillStyle = gr; g.fillRect(X, Y, W, H);
        g.restore();
        for (const [u, v, d] of sp) {
          g.fillStyle = d ? "rgba(90,80,68,0.35)" : "rgba(255,255,255,0.3)";
          g.beginPath(); g.arc(X + 5 + u * (W - 10), Y + 5 + v * (H - 10), 1.4, 0, TAU); g.fill();
        }
      });
      x += w;
    }
  }
  for (let i = 0; i < 14; i++) { // damp / worn patches
    const x = U(r, 0, S), y = U(r, 0, S), rad = U(r, 60, 160);
    wrap2(S, S, x, y, rad * 1.3, (xx, yy) => blotch(g, xx, yy, rad, 1.3, "80,70,55", 0.07));
  }
});

/** Roof tiles (or slates with slate = true), 1024 px = 4 m (256 texels/m; keep the 4 m roof uv), courses 0.25 m.
 *  No per-tile ink outline: ref tile joints are 3.3 px at 1080p and only dL* 10 (ours 9.4 px, dL* 15, INKL stroke);
 *  the course shadow carries the pattern. Canvas y runs down the slope (flip the course if v runs the other way). */
export const roofHD = (col: string, slate = false) => ctex("roofHD" + col, 1024, 1024, (g, r) => {
  const S = 1024, C = 64, TW = slate ? 52 : 77;
  g.fillStyle = col; g.fillRect(0, 0, S, S);
  for (let row = 0; row < S / C; row++) {
    const y = row * C, off = (row % 2) * TW / 2 + U(r, -6, 6);
    const n = Math.ceil(S / TW) + 1;
    for (let i = 0; i < n; i++) {
      const x = i * TW - off, tone = U(r, -1, 1);
      const fill = tone > 0 ? `rgba(255,240,225,${0.10 * tone})` : `rgba(60,25,20,${-0.10 * tone})`;
      wrapX(S, x, TW, (xx) => {
        g.fillStyle = fill; g.fillRect(xx, y, TW, C);
        const gr = g.createLinearGradient(xx, 0, xx + TW, 0); // rounded pan: light left, darker right
        gr.addColorStop(0, "rgba(255,240,225,0.12)"); gr.addColorStop(0.55, "rgba(255,240,225,0)"); gr.addColorStop(1, slate ? "rgba(20,25,35,0.10)" : "rgba(60,25,20,0.12)");
        g.fillStyle = gr; g.fillRect(xx, y, TW, C);
        g.fillStyle = slate ? "rgba(20,25,35,0.25)" : "rgba(60,25,20,0.22)"; g.fillRect(xx, y, 2, C); // thin soft joint
      });
    }
    g.fillStyle = slate ? "rgba(220,230,245,0.18)" : "rgba(255,235,220,0.22)"; g.fillRect(0, y + C - 9, S, 3); // lower-lip light
    g.fillStyle = slate ? "rgba(15,20,30,0.32)" : "rgba(55,22,18,0.32)"; g.fillRect(0, y + C - 5, S, 5);        // course shadow
  }
  for (let i = 0; i < 18; i++) { // weathering
    const x = U(r, 0, S), y = U(r, 0, S), rad = U(r, 40, 120);
    wrap2(S, S, x, y, rad * 1.5, (xx, yy) => blotch(g, xx, yy, rad, 1.5, "70,60,40", 0.08));
  }
});

/** Grass bank: 1024 px = 4 m (256 texels/m). Ref lawns: flat, saturated (#71b038 / #7dbf3f, L* 62-66, C* 55-64),
 *  broad soft variation (autocorrelation ~40 px at 1080p, +-4 L*), sparse tufts and flowers, low fine noise.
 *  Ours had the right hue (#6dad37) but only fine uniform noise (autocorrelation 6 px). */
export const grassHD = () => ctex("grassHD", 1024, 1024, (g, r) => {
  const S = 1024;
  g.fillStyle = "#73b23d"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 16; i++) {
    const x = U(r, 0, S), y = U(r, 0, S), rad = U(r, 120, 320), light = r() > 0.5;
    wrap2(S, S, x, y, rad * 1.4, (xx, yy) => blotch(g, xx, yy, rad, 1.4, light ? "140,198,80" : "92,154,48", 0.35));
  }
  g.lineWidth = 2; g.lineCap = "round"; g.lineJoin = "round";
  for (let i = 0; i < 1400; i++) { // tufts ~90 per m2
    const x = U(r, 0, S), y = U(r, 0, S), h = U(r, 7, 16), lean = U(r, -3, 3), light = r() < 0.4;
    wrap2(S, S, x, y, 20, (xx, yy) => {
      g.strokeStyle = light ? "rgba(165,218,98,0.35)" : "rgba(78,138,38,0.45)";
      g.beginPath(); g.moveTo(xx - 3 + lean, yy - h); g.lineTo(xx, yy); g.lineTo(xx + 3 + lean, yy - h * 0.8); g.stroke();
    });
  }
  for (let i = 0; i < 12; i++) { // flowers ~0.75 per m2
    const x = U(r, 0, S), y = U(r, 0, S), c = pick(r, ["#f7f3e8", "#f4d24a", "#f3a9bb", "#f7f3e8"]);
    wrap2(S, S, x, y, 8, (xx, yy) => {
      g.fillStyle = c; g.beginPath(); g.arc(xx, yy, 3.5, 0, TAU); g.fill();
      g.fillStyle = "rgba(240,190,60,0.9)"; g.beginPath(); g.arc(xx, yy, 1.3, 0, TAU); g.fill();
    });
  }
});

/** Plaster / timber / brick facade at 96 px/m (2x the old 48, capped at 2048 px a side). Windows as in the ref:
 *  white trim with a thin dark line (no heavy ink), mid-tone blue-violet glass (never near-black), two diagonal
 *  glints, curtains in about a third, louvred shutters. Same options object as facade(). */
export const facadeHD = (key: string, wm: number, hm: number, o: { wall: string; shutter: string; door?: boolean; timber?: boolean; brick?: boolean }) => {
  const PX = Math.min(96, 2048 / Math.max(wm, hm));
  const W = Math.round(wm * PX), H = Math.round(hm * PX), m = (v: number) => v * PX;
  return ctex("facHD" + key, W, H, (g, r) => {
    if (o.brick) { // real-size bricks 0.25 x 0.085 m with light mortar (ref brick #cf5e30 / mortar #f6d9b1)
      g.fillStyle = "#e9d3b4"; g.fillRect(0, 0, W, H);
      const bw = m(0.25), bh = m(0.085);
      for (let y = 0, row = 0; y < H; y += bh, row++) for (let x = -(row % 2) * bw / 2; x < W; x += bw) {
        g.fillStyle = pick(r, ["#c0583a", "#b44f35", "#c8643f", "#a94a33", "#cf6e45"]);
        g.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      }
    } else {
      g.fillStyle = o.wall; g.fillRect(0, 0, W, H);
      const n = Math.round((wm * hm) / 3) + 6;
      for (let i = 0; i < n; i++) {
        const light = r() > 0.5;
        blotch(g, U(r, 0, W), U(r, 0, H), m(U(r, 0.4, 1.5)), 1.5, light ? "255,255,255" : "120,90,60", light ? 0.07 : 0.05);
      }
      for (let i = 0; i < 4; i++) { // hairline cracks
        let x = U(r, 0, W), y = U(r, 0, H * 0.8);
        g.strokeStyle = "rgba(120,100,80,0.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += m(U(r, -0.08, 0.08)); y += m(U(r, 0.04, 0.12)); g.lineTo(x, y); }
        g.stroke();
      }
    }
    const floors = Math.max(1, Math.floor(hm / 2.8));
    const nWin = Math.max(1, Math.floor(wm / 2.2));
    g.fillStyle = "rgba(70,55,45,0.28)"; g.fillRect(0, H - m(0.45), W, m(0.45)); // plinth
    g.fillStyle = "rgba(70,55,45,0.35)"; g.fillRect(0, H - m(0.45), W, 2);
    const timberBeam = (x: number, y: number, w: number, h: number) => {
      g.fillStyle = "#6e4a30"; g.fillRect(x, y, w, h);
      g.strokeStyle = "rgba(40,25,15,0.5)"; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle = "rgba(255,230,200,0.22)"; g.fillRect(x + 2, y + 2, w - 4, 2);
    };
    if (o.timber) {
      const t = m(0.18);
      timberBeam(0, 0, t, H); timberBeam(W - t, 0, t, H); timberBeam(0, 0, W, t);
      for (let fl = 1; fl < floors; fl++) timberBeam(0, H - m(fl * 2.8) - t / 2, W, t);
      for (let i = 1; i < nWin; i++) timberBeam((i * W) / nWin - t / 2, 0, t, H - m(2.8)); // posts, upper floors
    }
    const door = (cx: number) => {
      const dw = m(1.1), dh = m(2.1);
      const path = (k: number) => {
        g.beginPath(); g.moveTo(cx - dw / 2 - k, H); g.lineTo(cx - dw / 2 - k, H - dh + dw / 2);
        g.arc(cx, H - dh + dw / 2, dw / 2 + k, Math.PI, 0); g.lineTo(cx + dw / 2 + k, H); g.closePath();
      };
      path(m(0.1)); g.fillStyle = "#e9e2d4"; g.fill(); g.strokeStyle = "rgba(60,45,40,0.6)"; g.lineWidth = 1.5; g.stroke();
      path(0); g.fillStyle = "#7a4a2c"; g.fill();
      g.save(); path(0); g.clip();
      for (let x = cx - dw / 2 + m(0.14); x < cx + dw / 2; x += m(0.14)) {
        g.fillStyle = "rgba(40,20,10,0.45)"; g.fillRect(x - 1, H - dh, 2, dh);
        g.fillStyle = "rgba(255,225,190,0.15)"; g.fillRect(x + 1, H - dh, 2, dh);
      }
      g.restore();
      path(0); g.strokeStyle = "rgba(40,25,15,0.7)"; g.lineWidth = 2; g.stroke();
      nail(g, cx + dw / 3, H - dh / 2, m(0.035), "#d9b04a");
    };
    for (let fl = 0; fl < floors; fl++) for (let i = 0; i < nWin; i++) {
      const cx = ((i + 0.5) * W) / nWin, by = H - m(fl * 2.8 + 0.9);
      if (o.door && fl === 0 && i === Math.floor(nWin / 2)) { door(cx); continue; }
      const ww = m(0.85), wh = m(1.25), x0 = cx - ww / 2, y0 = by - wh, tr = m(0.08), sw = m(0.45);
      for (const sx of [x0 - tr - sw - m(0.02), x0 + ww + tr + m(0.02)]) { // louvred shutters
        g.fillStyle = o.shutter; g.fillRect(sx, y0, sw, wh);
        const lw = Math.max(1.5, m(0.012));
        for (let ly = y0 + m(0.06); ly < y0 + wh - m(0.04); ly += m(0.06)) {
          g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(sx + m(0.04), ly, sw - m(0.08), lw);
          g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(sx + m(0.04), ly + lw, sw - m(0.08), 1);
        }
        g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = m(0.03); g.strokeRect(sx + m(0.015), y0 + m(0.015), sw - m(0.03), wh - m(0.03));
        g.strokeStyle = "rgba(40,30,40,0.55)"; g.lineWidth = 1.5; g.strokeRect(sx, y0, sw, wh);
      }
      g.fillStyle = "#f7f2e8"; g.fillRect(x0 - tr, y0 - tr, ww + 2 * tr, wh + 2 * tr); // trim
      const gl = g.createLinearGradient(0, y0, 0, y0 + wh);
      gl.addColorStop(0, "#8d9cdb"); gl.addColorStop(1, "#5761a8"); // ref glass #6670b0
      g.fillStyle = gl; g.fillRect(x0, y0, ww, wh);
      if (r() < 0.35) { // curtains from the top corners
        g.fillStyle = pick(r, ["#f5c4c8", "#f3e3c6", "#d7e6cf"]);
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + ww * 0.42, y0); g.lineTo(x0, y0 + wh * 0.75); g.fill();
        g.beginPath(); g.moveTo(x0 + ww, y0); g.lineTo(x0 + ww * 0.58, y0); g.lineTo(x0 + ww, y0 + wh * 0.75); g.fill();
      }
      g.save(); g.beginPath(); g.rect(x0, y0, ww, wh); g.clip(); // two diagonal glints
      g.fillStyle = "rgba(255,255,255,0.5)";
      for (const [a, b] of [[0.3, m(0.07)], [0.58, m(0.035)]]) {
        g.save(); g.translate(x0 + ww * a, y0 + wh * 0.5); g.rotate(Math.PI / 4); g.fillRect(-b / 2, -wh, b, wh * 2); g.restore();
      }
      g.restore();
      g.fillStyle = "#f7f2e8"; g.fillRect(cx - m(0.02), y0, m(0.04), wh); g.fillRect(x0, y0 + wh * 0.45 - m(0.02), ww, m(0.04)); // mullions
      g.strokeStyle = "rgba(60,45,40,0.6)"; g.lineWidth = 1.5; g.strokeRect(x0 - tr, y0 - tr, ww + 2 * tr, wh + 2 * tr);
      g.strokeStyle = "rgba(60,45,40,0.45)"; g.strokeRect(x0, y0, ww, wh);
      g.fillStyle = "#ebe3d4"; g.fillRect(x0 - tr - m(0.06), by + tr, ww + 2 * tr + m(0.12), m(0.07)); // sill
      g.fillStyle = "rgba(60,45,40,0.35)"; g.fillRect(x0 - tr - m(0.06), by + tr + m(0.07), ww + 2 * tr + m(0.12), m(0.03));
    }
  });
};

/** River marks as a DATA texture for the water shader (world.ts): R = crest, G = trough, B = glint; 1024 px = 8 m.
 *  Two instances: a sparse one for the near band and a dense one sampled at 40 m tiles for the far band, because the
 *  ref thins the marks out towards the camera (area far 1.5-5 %, mid 0-1.6 %, near 0-0.9 %; ours 4-12 % everywhere).
 *  Ref marks: 12-30 px wide at 1080p (p90 36-97), 3-6 px tall, aspect 3-6, crest +8..+13 L* with a trough
 *  -8..-9 L* right under it, thin glint lines 1-3 x 30-100 px. The marks are short, deep, randomly turned arcs
 *  (isotropic on average): foreshortening alone then makes horizontal dashes on screen from ANY heading (aspect
 *  1 / sin(grazing) = 3.4 at 17 deg, 5.8 at 10 deg); ours drew 30-100 px strokes along u, which turn into dots /
 *  vertical streaks when the camera looks along the river. In reel-kit set colorSpace = THREE.NoColorSpace. */
export const waterMarks = (key: string, nCrest: number, nGlint: number) => ctex("waterMarks" + key, 1024, 1024, (g, r) => {
  const S = 1024;
  g.fillStyle = "#000"; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = "lighter"; // channels add independently
  g.lineCap = "round";
  for (let i = 0; i < nCrest; i++) {
    const x = U(r, 0, S), y = U(r, 0, S), w = U(r, 18, 44), sag = w * U(r, 0.3, 0.45), lw = U(r, 3, 5), a = U(r, 0, Math.PI);
    wrap2(S, S, x, y, w, (xx, yy) => {
      g.save(); g.translate(xx, yy); g.rotate(a);
      const arc = (dy: number, col: string, k: number) => {
        g.strokeStyle = col; g.lineWidth = lw * k;
        g.beginPath(); g.moveTo(-w / 2, dy); g.quadraticCurveTo(0, dy - sag * 2, w / 2, dy); g.stroke();
      };
      arc(0, "rgb(255,0,0)", 1);          // crest
      arc(lw * 1.5, "rgb(0,255,0)", 0.9); // trough right under it
      g.restore();
    });
  }
  for (let i = 0; i < nGlint; i++) { // glints: long thin straight lines
    const x = U(r, 0, S), y = U(r, 0, S), len = U(r, 40, 140), lw = U(r, 1.2, 2.4), a = U(r, 0, Math.PI);
    wrap2(S, S, x, y, len, (xx, yy) => {
      g.save(); g.translate(xx, yy); g.rotate(a); g.strokeStyle = "rgb(0,0,255)"; g.lineWidth = lw;
      g.beginPath(); g.moveTo(-len / 2, 0); g.lineTo(len / 2, 0); g.stroke(); g.restore();
    });
  }
  g.globalCompositeOperation = "source-over";
});
export const waterNear = () => waterMarks("near", 28, 5);  // ~0.3 % crest area
export const waterFar = () => waterMarks("far", 220, 30);  // ~2.5 % crest + glints, at 40 m tiles

/** Cloud sprite, 1024 x 512, three painted tones and a flat soft bottom, no outline.
 *  Ref cumulus: lit crown #f1f6fc-#fbfafd (L* 96-98, warm in haze #faedd7), mid #dadae9-#e5edf9, lavender-blue
 *  underside #b6c1f2 / #c7cedf / #d1d4e1 (L* 79-86) mostly in the bottom third, edge ramp 8-20 px at 1080p
 *  (median ~10), no dark rim in 9 of 11 clouds. Ours: one flat tone (#f0f0f0 = 83 % of the cloud), 4-5 px edge.
 *  Golden: use CLOUD_GOLD instead of multiplying the white sprite by #ffd6b8 (a tint cannot make the cool belly). */
export const CLOUD_DAY = { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" };
export const CLOUD_GOLD = { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" };
export const cloudHD = (seed: number, pal = CLOUD_DAY) => ctex(`cloudHD_${pal.lit}_${seed}`, 1024, 512, (g) => {
  const r = rng(seed * 7919 + 17); // own seed: ctex keys of equal length would otherwise share shapes
  const W = 1024, H = 512, base = 400;
  const n = 6 + Math.floor(r() * 4), lobes: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < n; i++) { // main row, biggest in the middle
    const t = (i + 0.5) / n, rad = (60 + 110 * Math.sin(Math.PI * t) ** 0.8) * U(r, 0.75, 1.15);
    lobes.push({ x: 150 + t * 724 + U(r, -30, 30), y: base - rad * U(r, 0.35, 0.65), r: rad });
  }
  for (let i = 0; i < Math.floor(n / 2); i++) { // crown
    const t = U(r, 0.25, 0.75), rad = U(r, 60, 110);
    lobes.push({ x: 150 + t * 724, y: base - 150 - rad * U(r, 0.3, 0.7), r: rad });
  }
  const layer = (dx: number, dy: number, k: number, col: string, blur: number) => {
    g.save(); g.filter = `blur(${blur}px)`; g.fillStyle = col; g.beginPath();
    for (const l of lobes) { const x = l.x + dx * l.r, y = l.y + dy * l.r; g.moveTo(x + l.r * k, y); g.arc(x, y, l.r * k, 0, TAU); }
    g.fill(); g.restore();
  };
  layer(0, 0, 1.0, pal.shade, 6);         // silhouette in the underside tone
  layer(-0.04, -0.12, 0.9, pal.mid, 8);   // mid band
  layer(-0.1, -0.26, 0.72, pal.lit, 10);  // sunlit crown, offset up-left
  g.globalCompositeOperation = "destination-in"; // flat, soft bottom
  const m = g.createLinearGradient(0, base - 18, 0, base + 6);
  m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = m; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
});

/** Chain strand: 4 faces side by side (Strand uv: u = k / 4 around the tube), 1024 px = 2 m along (512 texels/m).
 *  Ref iron: blue-grey with a painted matcap-like bright band (#e3d5c6-#e8e7df, ~25-30 % of the area), mids
 *  #586076 / #8790a6, darks #282f41 (L* 19). Ours renders #040d16 / #050b1b (L* 3-5). */
export const chainHD = () => ctex("chainHD", 256, 1024, (g) => {
  const F = 64, P = 128; // face width, link pitch 0.25 m
  g.fillStyle = "#262c3e"; g.fillRect(0, 0, 256, 1024);
  for (let f = 0; f < 4; f++) {
    const cx = f * F + F / 2;
    for (let i = 0; i < 1024 / P; i++) {
      const cy = i * P + P / 2;
      if (i % 2 === 0) { // face-on link
        g.lineWidth = 15; g.strokeStyle = "#5f6880"; g.beginPath(); g.ellipse(cx, cy, 22, 58, 0, 0, TAU); g.stroke();
        g.lineWidth = 2.5; g.strokeStyle = "#20263a";
        for (const d of [-7.5, 7.5]) { g.beginPath(); g.ellipse(cx, cy, 22 + d, 58 + d, 0, 0, TAU); g.stroke(); }
        g.lineWidth = 5; g.strokeStyle = "#d4d6de"; g.beginPath(); g.ellipse(cx, cy, 22, 58, 0, Math.PI * 1.05, Math.PI * 1.55); g.stroke();
        g.fillStyle = "#fbfaf4"; g.beginPath(); g.arc(cx - 15, cy - 40, 2.5, 0, TAU); g.fill();
      } else { // edge-on link
        rr(g, cx - 8, cy - 62, 16, 124, 8); g.fillStyle = "#56607a"; g.fill();
        g.strokeStyle = "#20263a"; g.lineWidth = 2.5; g.stroke();
        g.fillStyle = "#c9ccd6"; g.fillRect(cx - 5, cy - 52, 3, 104);
      }
    }
  }
});

/** Sky colour stops by elevation (degrees), for the 4-stop sky shader in world.ts. Values are on-screen targets
 *  (check after the grade): ref day C* 40-89 (#208cfb, #0b6ced, #5ba8f0 -> #82c4fc), ours C* 22-29 (#8ab6e7);
 *  ref golden C* 40-67 through coral / pink / lilac, ours C* 16-19 dusty mauve (blue-to-orange mix through grey). */
export const SKY = {
  day: { c: ["#d8ecf7", "#8ccbf8", "#4aa3f2", "#2a7fe6"], e: [3, 12, 30] },
  golden: { c: ["#ffd08a", "#ffad7e", "#e9849a", "#8c78c4"], e: [4, 14, 32] },
};
/** CPU copy of the shader's stop interpolation (for checking / preview strips) */
export const skyAt = (p: { c: string[]; e: number[] }, el: number) => {
  const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const srgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
  const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const C = p.c.map((s) => hex(s).map(lin));
  const e = [0, ...p.e];
  let c = C[0];
  for (let i = 1; i < 4; i++) { const t = ss(e[i - 1], e[i], el); c = c.map((v, k) => v + (C[i][k] - v) * t); }
  return c.map((v) => Math.round(srgb(v) * 255));
};
```
