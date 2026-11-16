# Lighting: reference vs ours

This is a private study. Numbers come from 67 reference study frames (20 videos, 720x1280, captions masked), 539
frames taken every 2 s for the grade stats, and 36 of our stills (540x960, scaled to 720-wide equivalents where pixel
widths are quoted). Scripts, CSVs and crops are in `references/lighting/`. No stills were rendered and
nothing under `your Remotion project` was edited. The recipe values are starting points: they come from a numerical model of our
render path (`scripts/model.py`), and the calibration loop in 9.8 tunes them on the first real render.

## 0. The gap in one table

| What | Reference (measured) | Ours (measured) | Gap |
|---|---|---|---|
| Day shadow on the same surface, shade/lit | Y **0.49-0.52** on wood (0.37-0.65 overall). Per channel R .54-.56, G .46-.50, B .47-.50: slightly redder and **more** saturated (sat +.02-.13) | Y **0.25-0.38**. Deck B ratio .11-.18 (muddy orange). Paving goes grey (sat .17 → .07, hue 40° → 176°) | Our shadows are ~2x too dark, lose their colour and turn grey/blue |
| Sunset shadow, shade/lit | Y **0.15-0.27**. Per channel R .08-.15, G .16-.30, **B 1.35-3.04**: violet-blue shadow on orange ground (#db9044 → #5b5173). Not possible with additive light, so it is a stylised shadow colour | Golden ground is V .30-.47, sat .74-.95 dark olive/brown everywhere, with no light/shadow pattern. Model: ground shade/lit ≈ (.55, .64, .81) | We have no golden shadows at all |
| Key direction vs camera | Day: 6/20 frames side-back from screen right (az ~50-70°), 7 frontal-soft (facade shots), 2 top. Sunset: **10/15 backlit** (sun ahead, az 0-40°, el ~3-15°), long shadows toward the camera | 29 of 41 camera keys **front-lit** (sun 116-163° from the view axis), 9 side, 3 back. All 6 golden keys 114-156°: **no backlight** | Flat front light by day; golden is lit from behind the camera |
| In-focus shadow edges (10-90 %, px @720) | 3-12 px (d03 sun patch 7-12, blobs 3-12). Foreground shadows look 16-124 px soft only because of **DOF** | 3-10 px | Same range. Edge softness is not a lighting gap; DOF is (depth.md) |
| Contact / AO | No SSAO-like darkening. Contact = ink line + cast/blob shadow. Small props get a short ramp (bowl: 25 % darker, gone in 8 px) | None | Nothing to add except blobs under characters |
| Character ground shadow | Day: soft **blob** offset away from the sun, Y ratio .52-.74, edge 3-12 px. Sunset: long soft figure shadows | Hard full-silhouette shadows of the cards (rifles, legs) in every light | Need blobs (day) and soft long shadows (golden) |
| Heads | V **.97** (.86-1.0) in every light; sat .03 day → .23 sunset → .21 night (tinted by the scene); side gradient \|lr\| **.14** (.05-.36) toward the key; top brighter (tb −.11); rim 1.03 (none) | V .82 (.65-.92). Shade heads grey #ae9786 (V .68). Golden heads #bd7c48 / #a46d41 (sat .61-.62, V .64-.74). Gradient .008 (flat) | Ours go grey in shade and orange-dark at golden, and are flat |
| Sky in frame (day top) | #238bf4 / #0a6beb / #377ff1 / #5ca3e0 (sat .59-.96) over a pale horizon (#b5d9fb-#f1e3d4) | #8bb5e6 top, #9abfe9 low (sat .34-.40, no gradient) | Washed out. Fix in depth.md 6.5 |
| Grade (day) | L* p2 15.5, p98 95.3, vivid .28, dark hue 39° C 12 (warm darks) | L* p2 1.2, p98 79.6, vivid .05, dark C 4 (grey darks) | Darks crushed and grey, highlights dull |
| Specular | Only on metal: copper pot (d01), cannon (d12), armour (d15), iron ball (d20) | none (all Lambert) | Iron and steel could get one highlight |

## 1. Method (short)

- **Same-surface pairs.**
  - Lit and shade patches are taken on one material: hand boxes (M, P rows) or an Otsu 2-cluster split of log-luminance inside a region (R, Q rows).
  - Values are averaged in linear light. Ratios are per channel, linear.
  - Scripts: `scripts/run_pairs.py`, `scripts/run_auto.py`. Checks: `crops/pairs_check.jpg`, `crops/pairs_auto_check.jpg`.
- **Edges.**
  - A logistic fit (soft-L1) across a shadow edge; 10-90 % width = 4.394·σ.
  - Script: `scripts/edges.py`, plus the extra fits in section 4. Check: `crops/edges_check.jpg`.
- **Heads.**
  - Pale round blobs inside a dark ring (`scripts/heads.py`, `scripts/heads_ours.py`).
  - 30 reference heads were checked by eye; the false hits (hats, sails, snow, paper) were dropped.
  - A plane fit of linear luminance gives grad_lr and grad_tb: the change across the head in fractions of its mean.
  - Checks: `crops/heads_check_0.jpg`, `crops/heads_ours_check.jpg`.
- **Glows.** Radial median profile around each source (`scripts/glows.py`, `crops/glows_check.jpg`).
- **Grade.** Lab percentiles, plus the hue and chroma of the dark, mid and bright bands (`scripts/grade.py`).
- **Contact / AO.** Profiles from inside an object out across its base (`scripts/contact.py`).
- **Our sun vs camera.** Each camera key in `story.ts` is parsed against `LIGHTS` (`sun_vs_cam.txt`).
- **Model.** `scripts/model.py`: three r175 Lambert + hemisphere + directional, then PBR-Neutral tone map, then sRGB.
  - It reproduces our measured shadows: slab predicted #687175 vs measured #616868; rail-post deck #52391f vs #5a3b12.
  - It is then used to solve the new values.

## 2. Key light: direction and elevation

Estimates read from cast-shadow direction and length and from the lit and dark sides. Az is measured from the view
axis: 0° = sun straight ahead (backlight), 90° = side, 180° = behind the camera. All values are approximate (±15°).

| Frame | Scene | Key (screen) | az | el | Evidence | Shade colour / local lights / haze / spec / rim |
|---|---|---|---|---|---|---|
| d01 | ship deck | right-back | ~60 | ~45 | rail-post shadows fall lower-left | warm wood shade (R02 Y .37); pale blue-grey island haze; big soft highlight on copper pot; no rim |
| d02 | chef on deck | left | ~100 L | ~40 | mast lit left, dark right (M06 Y **.07**, deep form shadow) | – |
| d03 | deck wide | upper-right-back | ~50 | ~50 | sun patches through rigging, crisp 7-12 px | dark warm shade (R01 Y .28); navy sky top |
| d04 | race track | right, slightly back | ~70 | ~40 | horse shadow to lower-left | – |
| d05 | town from above | top | – | ~65 | very short shadows | strong blue haze on hills #94cefe |
| d07 | plaza | front-top, soft | ~150 | ~55 | large soft off-screen shadow | blue-grey stone shade |
| d08 | grass + crowd | soft front | ~160 | ~60 | almost no cast shadows | – |
| d09 | western street | right | ~95 | ~60 | left-hand facades lit; small blob under figure | pale horizon #b5d9fb; DOF |
| d10 | cowboy close | right-front | ~120 | ~55 | facades lit from the right | – |
| d12 | deck + cannon | right-back | ~60 | ~50 | carriage shadow lower-left | warm shade (R03 Y .49); lavender cliffs #a7a3af; cannon highlight |
| d13 | deck characters | right | ~70 | ~55 | blob offset left of the feet | warm (R04 Y .52) |
| d14 | chest | right | ~70 | ~50 | chest shadow to the left | warm (R05 Y .49) |
| d15 | market knight | front-top, soft | ~160 | ~60 | canopy shadow only | armour highlights |
| d16 | field king | flat | – | – | almost none | pale horizon #e5e7f2 |
| d17 | steel grating | front-top | ~150 | ~60 | soft shadows behind figures | bluish shade on grey metal (M02 B .81) |
| d18 | house door | front | ~170 | ~50 | evenly lit facade | – |
| d19 | castle gate | front-top | ~160 | ~60 | even facade | small wall torches |
| d20 | fort grass | high | – | ~65 | round blob under soldier | green shade (R06 Y .65); black ball highlight |
| s01 | western riders | **ahead, in frame** | ~5 | ~8 | long shadows toward camera | violet (M01 B x2.95); dust haze; bloom, no rim lines |
| s02 | western street | ahead | ~10 | ~8 | long shadows toward camera | violet (R07 B x3.0); orange haze |
| s03 | fallen | ahead-right | ~20 | ~10 | long shadows | violet (R08 B x2.8) |
| s04 | two characters | ahead | ~10 | ~10 | long figure shadows on sand | violet (R09 B x1.35); blue-violet blurred facade |
| s05 | hill | ahead-left (behind castle) | ~20 | ~15 | backlit jar, lavender shade side | fire + lantern; pink haze #db9594 |
| s06 | palace | left, at frame edge | ~40 | ~15 | backlit | lantern; peach haze #d1a57c |
| s07 | deck | behind characters | ~10 | ~10 | characters flat-lit, glowing fuse | purple sky |
| s09 | road | **ahead, at horizon** | 0 | ~3 | long shadows toward camera | sun glow core 90 px, r50 188 px |
| s11 | interior window | ahead (window behind figure) | ~10 | low | figure shadow on floor toward camera | warm-neutral (M05 Y .51) |
| s13 | dawn street | ahead (sun top, ring halo) | ~10 | ~25 | shadow toward camera | heavy orange haze |
| s15 | field haze | front-ish, soft | – | ~30 | crate shadow (DOF-soft) | brown-violet (R10 B .66) |
| n02 | night town | blue ambient | – | – | – | warm windows, street lamps (G01/G02) |
| n04 | night western | warm lamp right | – | – | boot shadow purple | shade (R11) (.47, .51, **.91**) |
| n06 | lanterns on snow | warm lanterns + door | – | – | – | glow G04 |
| n07 | moonlit field | moon top-left | – | – | – | violet ambient, moon glow G05 |
| n08 | castle wall | moon top + torch | – | – | – | head tinted lavender #b1ace7 |
| n09 | blacksmith | foggy moon behind | – | – | – | violet fog #877aea, warm windows |
| i02 | room | sun shaft from window left | – | – | dusty, soft (E09 48 px) | shade (M03) orange-warmer than the pale shaft |
| i08 | moonlit room | window | – | – | **window light pattern crosses the face** | characters receive light patterns |
| i10 | office | sun patch on wall | – | – | yellow patch on green wall (M04 B **x4.85**) | light patch = colour replacement |
| i11 | wall sconce | warm lamp top-left | – | – | – | glow G10 |
| i15/i16 | bare bulb | overhead | – | – | pool of light | glow G11/G12 |

**Ours.** The current `LIGHTS.day.sun` is (−0.45, 0.8, −0.4) at el 53°. Against our cameras (`sun_vs_cam.txt`):

| Class | Our camera keys (41) |
|---|---|
| Front, sun behind camera (>115°) | **29** (shots 1-3, 5-8, 10, 14, 15) |
| Side (87-115°) | 9 |
| Back (<60°) | 3 (shot 4 only) |
| Golden keys (shots 11-13) | 114-156° (none backlit) |

The sun is on screen right in 38 of the 41 keys (the exceptions are the three golden keys of shots 11-12).

## 3. Shadow colour on the same surface

Ratios are shade/lit per channel, in linear light.

| ID | Frame | Surface | Lit | Shade | R | G | B | Y | Hue lit → shade | Sat lit → shade |
|---|---|---|---|---|---|---|---|---|---|---|
| R02 | d01 | deck, rail shadow (day) | #e8b471 | #9f6f39 | .43 | .34 | .25 | .37 | 34 → 31 | .51 → .64 |
| R03 | d12 | deck, carriage shadow | #c08e5d | #936240 | .55 | .46 | .47 | .49 | 30 → 25 | .52 → .56 |
| R04 | d13 | deck, blob under character | #cb9563 | #9c6c46 | .56 | .50 | .48 | .52 | 29 → 27 | .51 → .55 |
| R05 | d14 | deck, chest shadow | #d19c65 | #9f6d48 | .54 | .46 | .50 | .49 | 31 → 26 | .52 → .54 |
| R01 | d03 | deck under sails (deep) | #d6933d | #785221 | .28 | .29 | .32 | .28 | 34 → 34 | .71 → .72 |
| R06 | d20 | grass, soldier blob | #6ca937 | #518c27 | .55 | .66 | .53 | .65 | 92 → 95 | .67 → .72 |
| M02 | d17 | steel grating | #444a54 | #32384c | .56 | .58 | .81 | .60 | 217 → 226 | .19 → .34 |
| M06 | d02 | mast, lit vs turned-away side (form) | #de9c41 | #3e2b1d | .07 | .07 | .24 | .07 | 35 → 25 | .71 → .53 |
| M01 | s01 | sand, long shadow (sunset) | #db9044 | #5b5173 | .15 | .30 | **2.95** | .27 | 30 → 258 | .69 → .29 |
| R07 | s02 | sand, long shadow | #da9043 | #524e73 | .12 | .27 | **3.04** | .24 | 30 → 247 | .69 → .32 |
| R08 | s03 | sand, long shadow | #df9545 | #524e72 | .11 | .25 | **2.82** | .22 | 31 → 246 | .69 → .32 |
| R09 | s04 | sand, figures' shadow | #bc7d52 | #38325f | .08 | .16 | **1.35** | .15 | 25 → 248 | .56 → .47 |
| R10 | s15 | dirt path, crate (hazy) | #bd874a | #6e4e3c | .31 | .32 | .66 | .32 | 32 → 22 | .61 → .46 |
| M05 | s11 | cream floor, figure (sunset interior) | #dfc5a8 | #ab8e81 | .55 | .49 | .56 | .51 | 31 → 20 | .25 → .25 |
| M03 | i02 | floor, sun shaft vs room | #fdf6cc | #cda479 | .62 | .40 | .32 | .45 | 52 → 30 | .19 → .41 |
| M04 | i10 | green wall, sun patch vs wall | #d6c33b | #76b27f | .27 | .82 | **4.85** | .69 | 53 → 129 | .73 → .34 |
| R11 | n04 | night sand under warm lamp | #a77065 | #765161 | .47 | .51 | .91 | .51 | 9 → 334 | .39 → .31 |
| **Q01** | **b_1900** | **our deck, rail posts (day)** | #a67041 | #5a3b12 | .27 | .27 | .11 | .27 | 28 → 34 | .61 → .80 |
| **Q02** | **b_100** | **our deck, soldier band (day)** | #b37736 | #794913 | .42 | .36 | .18 | .38 | 31 → 32 | .70 → .84 |
| **P01** | **b_1810** | **our paving, sign shadow (day)** | #ccc0a9 | #616868 | .20 | .26 | .35 | .25 | 40 → 176 | .17 → .07 |
| **P02** | **b_2010** | **our river, bridge shadow** | #3f7db7 | #0f4b87 | .09 | .34 | .51 | .36 | 209 → 210 | .65 → .89 |

**Why ours look like this** (model check).
- Our shade is hemisphere + fill only: physically (0.28, 0.36, 0.50) of the lit value.
- The PBR-Neutral toe then subtracts `x − 6.25x²` from every channel whose minimum is below 0.08. That crushes the small blue channel of warm shadows (deck B ratio .11-.18) and greys out the stone.
- In golden, the 14.5° sun adds little to horizontal ground, so the ground is shade-level everywhere.

**Rule taken from the reference.**
- **Day.** Shadow = about 0.5 × lit, keeping the surface's own hue with a little more saturation (warm on wood, green on grass, bluish only on grey metal).
- **Sunset.** Shadow = a violet-blue replacement colour (blue up to 3x the lit blue).
- **Interiors.** Light patches are colour replacements too (yellow patch on a green wall).
- Ratios like these need a shader that mixes a lit colour and a shadow colour. Light intensities alone cannot produce them.

## 4. Shadow edges, contact and AO

**Penumbra, 10-90 % width in px @720.**

| ID | Frame | Edge | Width | In focus? |
|---|---|---|---|---|
| new | d03 | sun patch through rigging, top / right edge | **7.1 / 12.5** | yes |
| E05 | d13 | blob under character | **9.2** | yes |
| E06 / new | d20 | soldier blob (side / lower edge) | **11.5 / 2.8** | yes |
| new | d14 | chest shadow, side edge | **5.0** | yes |
| E01-E03 | s01-s03 | long sunset shadows, near the bottom of frame | 15.8 / 20.2 / 57.4 | no, foreground DOF |
| E10 | s15 | crate shadow, foreground | 39.0 | no, DOF |
| E11 | s11 | figure shadow on floor strip | 69.2 | no, DOF |
| E12 | s04 | figures' shadow on sand | 123.8 | no, DOF |
| E09 | i02 | sun-shaft edge (dusty air) | 48.1 | volumetric |
| O01 | ours b_1900 | rail-post shadow on deck | **10.0** | – |
| O02 | ours b_1810 | sign shadow on paving | **2.9** | – |

Excluded: E04 (box inside the patch), E07, E08, O03, O04 (fit failed: plank lines, water).

**Result.**
- In-focus reference shadows are crisp, at 0.4-1.7 % of frame width. That is our range too.
- The very soft shadows in the reference all sit in DOF-blurred foreground.
- So keep a crisp shadow map. The softness comes from depth.md's lens blur, not from a big light.

**Contact darkening / AO** (`contact.csv`; distances in px @720 after the ink line).

| ID | Frame | Contact | Darkening next to base | Back to 90 % at |
|---|---|---|---|---|
| C01 | i01 | bowl on counter | **25 %** | 8 px |
| – | d11 | boardwalk front → sand | black gap under boards, then a soft ramp | 11 px |
| C03 | d14 | chest base on deck | ink line only | 3 px |
| C04 | d16 | box base on ground | none | 2 px |
| – | d12 | bucket base on deck | none (plateau right after the ink) | 0 |
| C02 | i12 | under counter-top lip | none (face slightly brighter) | 1 px |
| – | i10 | wall toward floor | 15 % gradient over 110 px (lighting, not AO) | – |

**Result.**
- The reference has no screen-space-AO look. Contact is the ink line plus cast or blob shadows.
- Only small props get a short 8-11 px ramp, and that is their cast shadow.
- Our stills have no AO either. Do not add SSAO.

**Character ground shadows** (`crops/sbs_contact.jpg`).

| | Reference | Ours |
|---|---|---|
| Day | Soft elliptical **blob** offset away from the sun (d13, d20, d09). Y ratio .52-.74 (R04 .52, R06 .65, E05 .63, E06 .74). Edge 3-12 px | Full card silhouettes with rifles and legs. Hard, 3-10 px |
| Sunset | Long soft figure silhouettes (s04, s11), DOF-softened | Same hard silhouettes |
| Interiors | Often no shadow at all (i14 forge, d17 grating) | – |

## 5. Characters (flat cards) under scene light

**Heads, valid set** (`heads_auto.csv`).

| Set | n | V median [range] | Sat median [range] | \|grad_lr\| median [range] | grad_tb | Rim |
|---|---|---|---|---|---|---|
| ref day | 10 | **.97** [.95-1.0] | .03 [.01-.09] | .114 [.05-.20] | −.12 (top brighter) | 1.02 |
| ref sunset | 2 | .99 | .23 [.18-.28] | .168 | −.06 | 1.03 |
| ref night | 6 | .98 [.88-.99] | .21 [.02-.26] | .119 [.03-.36] | −.13 | 1.04 |
| ref interior | 12 | .97 [.86-1.0] | .14 [.01-.29] | .174 [.005-.36] | −.11 | 1.03 |
| **ref all** | 30 | **.97 [.86-1.0]** | .08 | **.142** | **−.109** | 1.03 (no rim) |
| ours lit | 11 | .90 [.84-.92] | .31 | .011 | +.015 | 1.02 |
| ours shade | 8 | **.69** [.65-.70] | .24 | .018 | −.002 | 1.03 |
| ours golden | 2 | **.64-.74** | **.61-.62** | – | – | – |

**Measured head colours** (white albedo, so they read as the light colour).
- Day: #f8f1ef, #f7f1f0.
- Sunset: #fddeb6, #fde7d0.
- Warm lamp: #fcdfbd, #fbdeb5.
- Moonlight: #b1ace7, #edd9f7.
- Window light: #d9b5e7. In i08 a bright window stripe crosses the face.

**What the reference does with the cards.**
- Heads stay bright (never below V .86).
- They take the scene light colour as a tint.
- They have a soft side gradient toward the key (~14 % across the head) and a slightly brighter top.
- They receive shadows and light patterns (i08, i09) but only dim a little.
- There is no rim line.
- characters.md adds a soft crescent on the shadow side (0.88-0.89x, lavender ×(0.92, 0.90, 0.96)) and a stronger torso gradient (1.0 → 0.55-0.66).

**Ours.**
- Flat. The pasted-on look comes from emissive 0.36.
- Grey in shade (#ae9786).
- Over-orange and dark in golden (#bd7c48, #a46d41).

## 6. Local lights, glow, specular, rim, haze

**Glows** (`glows.csv`; px @720 from the brightest point; r50/r10 = where the glow excess falls to 50/10 %).

| Source | Core | r50 | r10 | Core / glow colour |
|---|---|---|---|---|
| street lamps n02 | 4-8 | 12 | 18-42 | #ffeac8 / #e1baac |
| lit window n05 | 8 | 34 | 114 | #f2d7a4 / #e9bf8a |
| paper lantern n06 | 24 | 42 | 46 | #fac777 / #efb56a |
| moon n07 / n08 / n09 (fog) | 20 / 10 / 14 | 30 / 38 / 32 | 64 / 108 / 144 | #e6eef7 / #bdd4f7 |
| wall lamp n12 | 2 | 4 | 24 | #f8d5c8 |
| ship lantern i01 | 28 | 34 | – | #f4e8d8 / #e8cda3 |
| sconce i11 | 32 | 68 | 204 | #f5efe9 / #e7c8a4 |
| bare bulbs i15 / i16 | 10 / 30 | 18 / 34 | 66 / 78 | #e0d4c5 |
| setting sun s09 | 90 | **188** | – | #e6cfc3 / #e5c195 |
| low sun s13 | 58 | 94 | 164 | #fceecf / #fbddae |
| candle i07 | 6 | 42 | 174 | #fef7f0 / #e8b57e |

Our film needs only the golden sun. Its glow should be r50 ≈ 13-26 % of frame width at the frame edge (see depth.md 6.4 for the bloom settings).

**Other observations.**
- **Specular.** Only metal props have it, as one soft broad highlight. Wood, ground and characters have none.
- **Rim / back light.** None on heads (rim 1.02-1.04 in both). Sunset backlight shows as bloom and haze around silhouettes, not as rim lines.
- **Haze.**
  - Day distance is blue: hills #94cefe, cliffs lavender #a7a3af.
  - Sunset distance is pink and peach: castle #db9594, palace #d1a57c.
  - Night fog is violet #877aea.
  - Exact sky and fog numbers are in depth.md 2.2/6.5; my in-frame top-of-sky samples agree with them (`sky.txt`).

## 7. Grade numbers that come from the lighting (`grade_*.csv`)

| Set | n | L* p2 | L* p50 | L* p98 | Vivid (C*>40) | Dark band hue / C | Bright band hue / C | split_b (warm brights − darks) |
|---|---|---|---|---|---|---|---|---|
| ref day | 20 | 15.5 | 63.7 | 95.3 | .28 | 39° / 12.4 | 79° / 6.7 | −0.2 |
| ref sunset | 15 | 15.7 | 59.2 | 92.1 | .28 | 8° / 15.4 (magenta-red) | 60° / 37.0 | **+26** |
| ref night | 14 | 8.3 | 32.2 | 83.8 | .45 | 300° / 33.3 (violet) | 320° / 20.5 | +17 |
| ref interior | 18 | 6.1 | 33.5 | 91.6 | .20 | 330° / 15.4 | 53° / 19.1 | +22 |
| ref all 539 | 539 | 10.2 | 48.7 | 92.2 | .23 | 340° / 15.1 | 44° / 10.0 | +11 |
| **ours day** | 28 | **1.2** | 48.6 | **79.6** | **.05** | 2° / **4.1** | 268° / 2.8 | 0.7 |
| **ours golden** | 9 | 3.2 | 37.1 | 73.2 | .24 | **57°** / 12.7 (orange) | 46° / 21.2 | **4.2** |

The two-tone shadow colours below fix the dark-band hue and chroma (warm by day, violet at sunset). Exposure and highlights belong to the grade report.

## 8. Comparison crops

Each sheet has the reference on the left, a magenta bar, then ours.

| File | What it compares |
|---|---|
| `lighting/crops/sbs_day_deck.jpg` | Deck shadows: soft, warm, light vs dark, hard stripes |
| `lighting/crops/sbs_golden.jpg` | Sunset s02/s04/s09 vs our golden b_1500/c_1340/b_1680 (sun ahead + violet shadows vs dim front-lit orange) |
| `lighting/crops/sbs_heads.jpg` | Reference heads in day / sunset / moon / lamp / window light vs ours (day, shade, golden) |
| `lighting/crops/sbs_contact.jpg` | Character contact blobs vs our hard silhouettes |
| `lighting/crops/sbs_sky.jpg` | Sky |
| `pairs_check.jpg`, `pairs_auto_check.jpg`, `edges_check.jpg`, `heads_check_0.jpg`, `heads_ours_check.jpg`, `glows_check.jpg` | Measurement checks (boxes and lines drawn) |
| `lighting/view/dir/s00-s11.jpg` | All 67 study frames (direction table source) |
| `lighting/view/dir/ours0-2.jpg` | Our stills |

## 9. Recipe for our stack (three 0.175, postprocessing 6.37.2)

The idea:
- Every world material (Lambert from `lam()` / `toLambert()`) gets a stylised **two-tone** shading: `albedo × mix(shadeCol, litCol, sunTerm)`.
  - `sunTerm` = the real shadow-map visibility × a soft N·L terminator.
  - The shadow colour is chosen per preset from the measured ratios.
- The character cards get their own light-colour tint with a bright floor and a side gradient. No emissive.
- The sun is placed **relative to each shot's camera** and frozen for the whole shot.

Shadow-map visibility is captured inside three's own light loop, so nothing is computed twice.

### 9.1 `lights.ts`: full replacement

The sky and fog fields are depth.md's values, so both recipes merge into one table.

```ts
// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export const LIGHTS: Record<"day" | "golden", LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.54, 1.47, 1.35], shade: [0.80, 0.71, 0.83], lift: [0, 0, 0], lambert: 0.35, sideK: 0.82, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#4284d3", hor: "#c9cdee", skyCurve: [0.0, 0.5, 0.6], fog: "#b0c0e8", fogNear: 25, fogFar: 420, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.3, sky: "#dcecff", ground: "#b49a78", hemiI: 0.9,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 15, el: 9,
    lit: [1.42, 0.79, 0.48], shade: [0.176, 0.206, 0.72], lift: [0.035, 0.03, 0.075], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#443876", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#f4c68c", fogNear: 20, fogFar: 360, sunDisc: "#ffd9a0",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#b9a4e0", ground: "#7a5a6a", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
};
```

Predicted results (`scripts/model.py`, section 5 of its output; up-facing ground; then the camera-facing wall). These
include the Neutral tone map:

| Material | Day lit | Day shade | Day Y ratio | Golden lit | Golden shade | Golden Y ratio |
|---|---|---|---|---|---|---|
| wood (deck) | #db9349 | #a76832 | .50 (ref #c08e5d/#936240) | #bd6010 | #45232e | .14 |
| sand | #f2d291 | #c7a57b | .60 | **#dc9244** | **#565072** | .25 (ref #db9044 / #5b5173) |
| stone / paving | #efdfbf | #bfaba3 | .57 | #d49864 | #515598 | .28 |
| grass | #82c44f | #5d8f37 | .50 (ref #6ca937/#518c27) | #708213 | #14483a | .26 |
| brick wall in shade | – | #973114 | – | – | #450620 + lift → plum | – |

**Notes on the presets.**
- **Per-shot override.** Allow per-shot `sunAz?` / `sunEl?` in `SHOTS` (story.ts) when a facade must be front-lit. Example: shot 2 town wide, az 120.
- **Golden backlight.** az 15 / el 9 puts the sun just outside the right frame edge for every golden camera. Its halo enters the frame, and 2 m cards cast ~13 m shadows toward the camera, as in s01-s04.
- **Head tints.** `charTint` values are the measured light colours for WHITE heads, which is what the reference uses. If our heads keep the peach skin #f7d6b6, use golden `[1.0, 0.88, 0.76]` and day `[1.0, 0.97, 0.96]` so head saturation stays ≤ .37 instead of .46.

### 9.2 New file `src/videos/bridge/shade.ts`: two-tone world shading + card shading

```ts
// Stylised two-tone lighting shared by all world materials and the character cards (three r175 chunk names).
import * as THREE from "three";

export const TONE = {
  uLitCol: { value: new THREE.Vector3(1.54, 1.47, 1.35) }, uShadeCol: { value: new THREE.Vector3(0.8, 0.71, 0.83) },
  uShadeLift: { value: new THREE.Vector3() }, uLambert: { value: 0.35 }, uSideK: { value: 0.82 }, uTerm: { value: 0.2 },
};
export const CHAR = {
  uCharTint: { value: new THREE.Vector3(1, 0.94, 0.92) }, uCharShade: { value: 0.86 }, uGrad: { value: 0.07 },
  uBodyGrad: { value: 0.2 }, uSideTint: { value: new THREE.Vector3(0.92, 0.9, 0.96) },
};

// Capture the sun's shadow visibility inside three's light loop (directional light 0 = the only shadow caster;
// three sorts shadow-casting lights first). Only the UNROLLED index 0 compiles the shadow block.
export const LFB = THREE.ShaderChunk.lights_fragment_begin
  .replace("directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]",
           "sunVis = ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]")
  .replace("vDirectionalShadowCoord[ i ] ) : 1.0;", "vDirectionalShadowCoord[ i ] ) : 1.0;\n\t\tdirectLight.color *= sunVis;");
if (!LFB.includes("directLight.color *= sunVis")) throw new Error("shade.ts: three lights_fragment_begin changed");

const TWO_TONE = /* glsl */ `
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;                               // view space, towards the sun
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float ndl = max( dot( geometryNormal, sunV ), 0.0 );
  float sunTerm = sunVis * smoothstep( 0.0, uTerm, ndl );                     // 0 = cast/form shadow, 1 = lit
  float skyK = mix( uSideK, 1.0, 0.5 + 0.5 * dot( geometryNormal, upV ) );    // up-facing a bit brighter
  vec3 lit = uLitCol * mix( 1.0, ndl, uLambert );                             // keep some cosine modelling
  reflectedLight.directDiffuse = diffuseColor.rgb * mix( uShadeCol, lit, sunTerm ) * skyK + uShadeLift * ( 1.0 - sunTerm );
  reflectedLight.indirectDiffuse = vec3( 0.0 );                               // hemisphere/fill no longer used here
}
#endif
`;
const DECL = "#include <common>\nuniform vec3 uLitCol; uniform vec3 uShadeCol; uniform vec3 uShadeLift; uniform float uLambert; uniform float uSideK; uniform float uTerm;";

/** Lambert (or Phong: its specular term is kept) -> two-tone. Call once per material, before first render. */
export function twoTone<T extends THREE.MeshLambertMaterial | THREE.MeshPhongMaterial>(m: T): T {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TONE);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", DECL)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + TWO_TONE);
  };
  m.customProgramCacheKey = () => "twoTone1";
  return m;
}

// Character card: bright floor, scene tint, side gradient toward the sun (head soft, torso strong), lavender
// shadow side; receives shadows but only dims to uCharShade. Replaces the whole outgoing light (no emissive).
const CARD = /* glsl */ `
vec3 outgoingLight = diffuseColor.rgb * uCharTint;
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float side = clamp( sunV.x * 1.4, -1.0, 1.0 );                                       // + = sun on screen right
  float u = clamp( ( vMapUv.x - 0.5 ) / 0.21, -1.0, 1.0 ) * sign( dFdx( vMapUv.x ) + 1e-7 ); // -1..1 left..right
  float t = u * side;                                                                    // +1 = edge facing the sun
  float head = smoothstep( 0.55, 0.62, vMapUv.y );                                       // head zone vs torso
  float g = mix( uBodyGrad, uGrad, head );
  float dark = smoothstep( 0.1, 1.0, -t );                                               // crescent on the far side
  vec3 sideK = mix( vec3( 1.0 ), uSideTint, dark * ( g / max( uGrad, 1e-3 ) ) * 0.5 );
  float top = 1.0 + 0.055 * clamp( ( vMapUv.y - 0.72 ) / 0.15, -1.0, 1.0 ) * clamp( dot( sunV, upV ) * 2.0, 0.0, 1.0 ) * head;
  float lift = 1.0 + 0.03 * max( t, 0.0 );
  outgoingLight *= mix( uCharShade, 1.0, sunVis ) * ( 1.0 - g * dark ) * sideK * top * lift;
}
#endif
`;
export function cardShade(m: THREE.MeshLambertMaterial) {
  m.emissive.set(0x000000); m.emissiveIntensity = 0; m.emissiveMap = null;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, CHAR);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uCharTint; uniform float uCharShade; uniform float uGrad; uniform float uBodyGrad; uniform vec3 uSideTint;")
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace("vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;", CARD);
  };
  m.customProgramCacheKey = () => "card1";
  return m;
}
```

What the card shader gives, using the model with our skin #f7d6b6:
- **Day.** Lit head #ecc6a4 (V .93). In shadow #e2bb9c (V .89), against today's #ae9786 (V .68).
- **Gradient.** Head about −14 % at the far edge (matches the .14 median); torso about −20 to −25 %, close to characters.md's 0.55-0.66 at the far edge with `bodyGrad` .2-.25.
- **Head zone.** The 0.55-0.62 v split and the 0.72 head centre assume the 600x1000 card with the head in the top third. Adjust them if characters.md changes the proportions.

### 9.3 `build.ts`: apply it everywhere the world gets a material

- `lam()`: `m = twoTone(new THREE.MeshLambertMaterial(make()))`.
- `toLambert()`: wrap the new Lambert the same way: `twoTone(new THREE.MeshLambertMaterial({...}))`.
- **Metal highlights** (the reference shows one soft highlight on metal only):
  - In `world.ts` use `M.iron = twoTone(new THREE.MeshPhongMaterial({ color: "#2c2f36", specular: "#8a8a8a", shininess: 60 }))` and `M.steel = twoTone(new THREE.MeshPhongMaterial({ color: "#9aa3b3", specular: "#b0b0b0", shininess: 45 }))`.
  - Phong keeps `directSpecular`, which is masked by the shadow because the sun colour was multiplied by `sunVis`.
- The water `MeshLambertMaterial` in world.ts should also go through `twoTone()`, so the bridge shadow on the river takes the shade colour.

### 9.4 `world.ts`: rig, sun per shot, uniforms, blobs

In the constructor:

```ts
import { TONE, CHAR, twoTone } from "./shade";
// sun disc direction for depth.md's sky/sun sprite: keep a vector
private sunDir = new THREE.Vector3();
// contact blobs: one instanced multiply-decal, drawn after ground (renderOrder 0.5) and before cards (renderOrder 1)
private blobs = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
  uniforms: { uRatio: { value: new THREE.Color(0.62, 0.58, 0.58) } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }",
  fragmentShader: "uniform vec3 uRatio; varying vec2 vUv; void main(){ float r = length(vUv * 2.0 - 1.0); float m = 1.0 - smoothstep(0.72, 1.0, r); gl_FragColor = vec4(mix(vec3(1.0), uRatio, m), 1.0); }",
  transparent: false, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
  blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
}), 160);
// ...in the constructor body: this.blobs.renderOrder = 0.5; this.blobs.frustumCulled = false; R.add(this.blobs);
// and give every Actor mesh renderOrder = 1 (cast.ts), so cards are drawn over the multiplied ground.
```

In `update()`, replace the "light, sky, fog" block:

```ts
const L = LIGHTS[s.light];
// camera-relative sun, frozen per shot: use the camera at the shot's first frame
const c0 = camAt(id, s.a);
let fx = c0.look[0] - c0.pos[0], fz = c0.look[2] - c0.pos[2]; const fn = Math.hypot(fx, fz) || 1; fx /= fn; fz /= fn;
const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az); // screen right = (-fz, fx)
const sunDir = this.sunDir.set(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el));
this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
this.fill.intensity = 0;                                    // not used by the two-tone shading
const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
// (shadow camera as today)
this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term;
CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
(this.blobs.material as THREE.ShaderMaterial).uniforms.uRatio.value.setRGB(...L.blob);
// sky + fog: depth.md 6.5 (top/hor/skyCurve/fog/fogNear/fogFar); sun disc sprite (depth.md 6.4) at cam + sunDir*900, colour L.sunDisc
```

In the actor loop:
- Delete `a.mat.emissive.set(tint)`.
- Add `a.mesh.castShadow = L.actorShadow;`.
- Add one blob per standing card (skip `crowd: "water"` shots and swing riders):

```ts
const hl = Math.hypot(sunDir.x, sunDir.z) || 1, ox = -sunDir.x / hl, oz = -sunDir.z / hl;   // away from the sun
this.e.set(-Math.PI / 2, Math.atan2(-ox, -oz), 0, "YXZ");                                     // long axis along shadow
this.m4.compose(this.v.set(p.x + ox * 0.25 * sc2, p.y + 0.012, p.z + oz * 0.25 * sc2), this.q.setFromEuler(this.e),
                this.s3.set(0.7 * sc2, 1.1 * sc2, 1));
this.blobs.setMatrixAt(bi++, this.m4);
// after the loop: this.blobs.count = bi; this.blobs.instanceMatrix.needsUpdate = true;
```

Blob values: an ellipse 0.7 × 1.1 m offset 0.25 m away from the sun. Its multiply is `L.blob` (day Y ≈ .59 = the
reference .52-.74). The soft rim is the outer 28 % of the radius, ≈ 0.1 m, which is ~10-14 px @720 in a medium shot (reference 3-12).

**Day vs golden card shadows.**
- In day the cards do not cast: with az 75 the sun is only 15° off the card plane, so the card would cast a thin sliver of a shadow. Reference day frames show blobs instead.
- In golden they cast long silhouettes plus a light contact blob, as in s01-s04.
- This refines characters.md's "keep the cast shadow + blob".

### 9.5 `cast.ts`: Actor material

```ts
import { cardShade } from "./shade";
this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
this.mat.alphaToCoverage = true;
this.mesh.receiveShadow = true;           // keeps sunVis (dims to 0.86-0.88 only)
this.mesh.renderOrder = 1;                // drawn after the contact blobs
bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }   // no emissiveMap any more
```

The `customDepthMaterial` (RGBADepthPacking, alphaTest 0.5) stays as it is. It also works with VSM if that is ever turned on.

### 9.6 Shadow-map settings

- **Keep `shadows` (PCFSoftShadowMap).** mapSize 4096 and the existing focus-fitted frustum `Rr = clamp(dist·1.15 + 7, 12, 95)`.
  - Texel = 2Rr/4096 (6 mm close-up, 4.6 cm wide).
  - In-focus edges stay 3-10 px @720, the same as the reference's 3-12. Do not add PCSS or big blur radii; DOF supplies the foreground softness.
- **Bias.**
  - Day: `bias −0.00025`, `normalBias 0.015·Rr/12` (as today).
  - Golden, with the sun at 9°: `bias −0.0006`, `normalBias 0.03·Rr/12` against acne on the grazing ground.
  - With two-tone colours, acne shows as violet speckles, so check the swing shot first.
- **Shadow reach.** At el 9° a 2 m card throws a ~13 m shadow, so keep `Rr ≥ 14` in golden shots. The existing clamp of 12 is just enough near the camera; use `Math.max(Rr, 16)` when `s.light === "golden"`.
- **Optional, only if edges still look too crisp after DOF.** `<ThreeCanvas shadows="variance">` with `sun.shadow.radius = 3`, `sun.shadow.blurSamples = 12`. It costs a blur pass; light bleed is fine at these ratios.

### 9.7 AO

**Do not add SSAOEffect.**
- The reference has no AO darkening (section 4).
- In postprocessing 6.37 it needs a `NormalPass`: a second full scene render that ignores our alpha-tested cards. It would add grime the reference does not have.
- If it is ever wanted for interiors:

```ts
new SSAOEffect(camera, normalPass.texture, { worldDistanceThreshold: 1, worldDistanceFalloff: 0.3,
  worldProximityThreshold: 0.4, worldProximityFalloff: 0.1, intensity: 1.2, radius: 0.05, samples: 9, rings: 4,
  luminanceInfluence: 0.7, resolutionScale: 0.5, color: new Color("#5b4a6a") })
```

Contact comes from:
- the blobs (9.4);
- the ink line (ink report);
- the two-tone cast shadows.

### 9.8 Calibration loop (first render after implementing)

1. Render the same test stills (b_100, b_1810, b_1900, c_1450, b_1500, b_1680, c_1745).
2. Run, in `references/lighting`:
   - `python scripts/run_auto.py` (Q01/Q02) and `python scripts/run_pairs.py` (P01/P02). Boxes are in pixel coordinates, so re-pick them if the framing moved.
   - `python scripts/heads_ours.py`
   - `python scripts/grade.py`
3. Check these targets:

| Measure | Target |
|---|---|
| Day deck/paving shade/lit Y | **.45-.55**; per-channel R ≥ G ≈ B; sat not lower than lit |
| Golden ground lit | V ≥ .75, hue 25-35° |
| Golden shade | B ratio ≥ 1.3 (aim 2-3), hue 240-260° |
| Heads | V ≥ .86 everywhere, \|grad_lr\| .10-.17, grad_tb −.05 to −.13 |
| Day dark-band chroma | C ≥ 10, hue 20-60° |
| Sunset split_b | ≥ +15 |

If a shade ratio misses, scale that channel of `shade` by target/measured and repeat. The Neutral toe makes it slightly non-linear, so 2 rounds are usually enough.

## 10. Top 5 changes ranked by visual impact

| # | Change | Where | What it fixes |
|---|---|---|---|
| 1 | **Two-tone shadow colours** | `shade.ts` + `twoTone()` in `lam` / `toLambert` + LIGHTS lit/shade | Every frame: day shadows go from grey-muddy Y .25-.38 to warm Y .50 with saturation kept; golden shadows become violet-blue (B ≈ 3x lit) |
| 2 | **Golden as backlight** | camera-relative sun az 15° / el 9° + depth.md sunset sky and sun disc | Long shadows toward the camera, lit ground V ≥ .75, violet shade, sun glow at the frame edge. Shots 11-13 change from "dim orange day" to the reference's signature sunset |
| 3 | **Card shading** | `cardShade()`: no emissive, tint per scene, bright floor .86, side gradient toward the sun (head ~14 %, torso ~20-25 %), lavender far side | Heads stop going grey (V .68 → .89) or orange-dark (sat .62 → ~.3); characters belong to the light |
| 4 | **Day key from the side, frozen per shot** | az 75 / el 48 | Deck and rail shadows run across the frame and facades get a lit and a shade side, instead of flat front light in 29/41 keys |
| 5 | **Character ground shadows** | Offset soft multiply blobs (Y ~.6) under every standing card; card shadow casting off by day, on at golden | Replaces the hard rifle-and-leg silhouettes; grounds the crowd like the reference blobs |

Sky and fog (depth.md 6.5) rank next to #4 but are already specified there. Metal highlights (9.3) are small.

## 11. Files

| Path | What |
|---|---|
| `lighting/scripts/` | `lib.py`, `frames.py` (67 study frames), `run_pairs.py`, `run_auto.py`, `edges.py`, `contact.py`, `heads.py`, `heads_ours.py`, `glows.py`, `grade.py`, `sbs.py`, `model.py` (render-path model + solvers), `zooms.py`, `gridview.py` |
| `lighting/` (data) | `pairs.csv`, `pairs_auto.csv`, `edges.csv`, `contact.csv`, `heads_auto.csv`, `heads_ours.csv`, `glows.csv`, `grade_ref_study.csv`, `grade_ref_all.csv`, `grade_ours.csv`, `sky.txt`, `sun_vs_cam.txt` |
| `lighting/crops/` | `sbs_*.jpg` side-by-sides and `*_check.jpg` measurement overlays |
