# Characters: how the reference builds its 2D cast vs. our bridge cast

Private study. Reference frames, crops and side-by-sides stay inside `references/characters/`.
No files under `your Remotion project` were edited and no new stills were rendered. Our numbers come from `toon.ts` (read only) and from stills already in `your Remotion project/out/bridge/test/`.
Only general construction rules were taken from the reference. None of its characters (chef, cowboy, potato-heads and so on) is copied.

**Short answer:** the user is right about the bodies, but the head diagnosis needs correcting.

- **Heads.** The reference heads are actually *rounder* than ours. They are slightly wider than tall (H/W 0.93); ours are tall ellipses (H/W 1.17). What makes theirs look hand-drawn is that the shape is not a perfect ellipse:
  - a slightly pointed crown and a fuller jaw that narrows toward the chin,
  - about 10% left/right asymmetry and a few degrees of tilt,
  - a plum outline about 3 times thicker on the bottom/shadow side than at the top,
  - eyes and mouth shifted toward the side the character faces,
  - no blush and no catchlights in the eyes.
- **Bodies.** Their adults are about 3.5 head-heights tall: a bean-shaped torso on long legs drawn as single thin ink strokes, with ink-dot hands. Ours are 2.7 head-heights, with limbs about 5 times too thick, skin-coloured ball hands and big oval boots. That reads as "chibi sticker".

Coverage:
- 96 frames, taken from all 20 reference videos.
- 38 head-contour fits from 19 videos: 23 front views and 8 three-quarter views are usable after removing bad fits.
- 15 full-body crops from 9 videos.
- 3 of our stills measured (riflemen, officer, crowd).

---

## 1. Measurements

Units:
- `W` = head width (the face fill inside the outline).
- `HH` = head height.
- Angles are canvas angles: 0 = right, 90° = down.
- Reference pixels are from 720×1280 frames; ours are from 540×960 stills.

### 1.1 Head contour

The fit model is a superellipse with separate exponents for the crown and the jaw, an egg taper and a left/right bulge. Points are generated as:
`X = sgn(c)|c|^(2/n), Y = sgn(s)|s|^(2/n)`, then `X *= (1+egg*Y)*(1+asym*sgnX)`, then `x = aX, y = bY`, then rotate by `rot`.
`n` is `n_top` for the upper half and `n_bot` for the lower half. Fits are in `data/heads2.json` (script `scripts/heads2.py`).

| param | ref front, median (IQR), n=23 | ref "reliable" 10 | ref 3/4 view, n=8 | **ours** (design / still) | gap |
|---|---|---|---|---|---|
| H/W | **0.93** (0.83–1.01) | 0.96 (0.94–1.02) | 1.04 | **1.17** (150/128; still fit 1.16) | ours 25% too tall |
| egg (neg = narrower at chin) | **−0.125** (−0.15…−0.04) | −0.12 | 0.00 | 0 | missing chin taper |
| n_top (crown; <2 = slightly pointed) | **1.70** (1.40–1.97) | 1.76 | 2.31 | 2 | missing |
| n_bot (jaw; >2 = fuller) | **2.26** (2.08–2.52) | 2.27 | 1.88 | 2 | missing |
| asym (one side wider) | **+0.10** (0.05–0.12) | +0.10 | ±0.1 | 0 | missing |
| tilt `rot` | −1° (−8.6…+3.0), per character | ±2.5° | **+19°** | 0 (only `headTilt`) | missing |
| contour wobble RMS | **1.0% W** (0.5–1.5) | 1.2% | 0.7% | 0 (48-gon ellipse) | smooth curves; only shape variety is needed |

Rules taken from this:
- The silhouette bulges on the side the face is turned to (jaw/cheek), and the eyes and mouth shift to that same side.
- The mean shift of the eye pair is **+0.08 W** (range +0.03 to +0.13); ours is 0.
- See `crops/compare_heads.png`. In it, cyan is the fitted contour and magenta is a circle of the same mean radius.

### 1.2 Outline (ink)

| | reference | **ours** | gap |
|---|---|---|---|
| median width / W | **5.0% W** (reliable 10), 5.9% W (all 23); IQR 4.8–6.9% | 4.9% (12 / 244 design); **3.3–4.6% on screen** (5 px on a 140 px face, `c_1745`) | slightly thin on screen |
| thick/thin ratio (p90/p10 around one head) | **2.9–3.5** (IQR 2.5–4.2) | ~1.0–1.25 | uniform line, no taper |
| width by direction (normalised to the head's own median; octant medians) | top-right (−68°) **0.65**, top-left (−112°) 0.74, left-up (−158°) 0.88, right-up (−22°) 1.02, right-down (22°) 1.05, **bottom-right (68°) 1.11**, bottom-left (112°) 1.00, left-down (158°) 0.73 | flat 1.0 | no weight at the bottom or shadow side |
| angle of the thickest point | clusters at **50–90°**, median **64°** (bottom-right). It moves to the left-bottom when the light comes from the right (`10_018`: left 20 px vs right 7 px on a 361 px head) | — | |
| ink colour (darkest core) | **#201628 … #2f1d28** dark plum (median core rgb 47,29,40). Under orange light it goes warm (#5d2c19…#6e3e30) | design #221f2e; **on screen #0a0014**, crushed to black | lift it and make it plum |
| inner detail lines (brows, mouth, clothing) | ≈0.6–0.9× of the outline; clothing seams/pockets ≈0.4× | brows 9, mouth 8 (0.75× of 12); belts drawn in solid ink | ok |

### 1.3 Face colour and shading (front heads; on-screen values)

| | reference | **ours** |
|---|---|---|
| fill | white **#fef9f6 / #e7edf5–#fffcfc**; cream/skin **#ffe0b4, #f6b988, #e9c8ae**; median luma **0.93** (0.76–1.0) | design SKIN #f7d6b6. On screen **#af9886, luma 0.62** (riflemen `c_1745`); #e8c5a5, 0.81 (officer `c_1800`) |
| shading | **soft crescent** on the side away from the light. Flat out to r≈0.6R, then falls off over 0.6→0.8R to **0.88–0.89×** the lit value. Angular FWHM ≈150° around the shadow direction (mostly 45–105°). Not a hard cel edge | none (flat) |
| shadow tint | white heads ×(0.92, 0.90, **0.96**), i.e. lavender (#fffcfc→#f1e6f0, #edf1f7→#d9dcf2). Skin ×(0.96, 0.86, 0.84) (#ffe7bd→#f5c69f). It follows the scene light (orange rim at the casino) | — |
| texture / grain | none measurable (residual is at JPEG-noise level); faces are clean | none |
| blush cheeks | **0 of ~40 faces inspected**. One character has brown freckle/stubble dots | **blush on 11 of 14 expressions** (#f3aa98) |
| catchlight dots in the eyes | **0 of ~40** | white r4 highlight on every dot eye |

### 1.4 Features (÷ W; y measured from the head centre, + = down)

| | reference (13 heads) | **ours** (`faceFront`, s=1, W=244) | gap |
|---|---|---|---|
| eye spacing, centre to centre | **0.26** (0.19–0.28) | **0.38** | +45%, eyes too far apart |
| eye height | **0.00** (−0.06…+0.03) | +0.025 | ok |
| default eye | **lidded half-disc**: lid line 0.18 wide plus a dark half-disc below it (0.18×0.10–0.12), giving a deadpan look. Also flat dashes 0.16–0.18×0.03–0.05, and dot eyes as vertical ovals ≈0.09×0.13 | round dot 0.107 + white highlight | wrong default |
| shock eyes | white sclera circles **0.21–0.24 diameter**, almost touching (gap ≈0.02); small pupil dots ≈0.06 | white ellipses 0.17×0.2, gap 0.2 | eyes too small and too far apart |
| brows | **0.17–0.18 long × 0.045–0.055 thick**, tapered, at **y −0.20** (0.18–0.24 above the eyes). Often one brow higher (skeptical) | 0.17 × 0.037, uniform, at y −0.12 | thin, low, symmetric |
| mouth position | **y +0.19** (0.17–0.31), x shifted to the facing side | y +0.24, centred | |
| neutral mouth | short dash **0.09–0.14 × 0.04–0.06**, often tilted (smirk) | 0.18 × 0.033 | too wide |
| grin / open | 0.22–0.42 × 0.10–0.17 with a white **teeth box** and ink dividers; O-mouth 0.19–0.21 × 0.24–0.29 | D-mouth 0.28×0.18 + tongue | ok-ish |
| mouth interior | **#54212a / #5c222b** | #5a1e28 | ok |
| nose / ears | none in front view. 3/4 view: a small nose tick on the facing side; hair wraps the back of the head | side view: skin-coloured bump ellipse (potato nose) | remove the bump |

### 1.5 Bodies

Read by eye from gridded crops (±5 px, about ±3% HH). Measured to the head top under any hat. Crops are `crops/bodies/b01…b15`.

| figure | total HH | chin → torso bottom (HH) | torso bottom → sole (HH) | torso width / W |
|---|---|---|---|---|
| woman 03_064.5 | 3.66 | 1.14 | 1.51 | 0.74 |
| bald man 04_031.5 | 3.5 | 1.05 | 1.48 | 0.90 |
| hat man 04_031.5 | ~3.4 | 1.12 | 1.39 | 0.97 |
| dad 10_012.0 | 3.3 | 0.90 | 1.39 | 0.85 |
| coat 18_015.0 | 3.45 | (coat) | — | 0.80 |
| cap guy 18_015.0 | 3.3 | 1.17 | 1.18 | 0.69 |
| walker 3/4 19_016.5 | 3.6 | 1.10 | 1.54 | 0.68 |
| uniform soldier 12_057.0 | ~3.6 | 1.06 | ~1.4 | 0.71 |
| robe 13_009.0 | 3.5 | 2.0 (robe) | 0.48 | 0.87 |
| sitting 12_003.0 | — | 1.23 | (sitting) | 0.58 |
| **adult median** | **3.5** (3.3–3.7) | **1.1** (0.9–1.23) | **1.4** (1.2–1.54) | **0.80** (0.58–0.97) |
| kids 03_033.0 (×3) | **2.7–3.0** | 0.7–1.0 | 1.0–1.15 | 0.47–0.84 |
| **ours, every adult** (`bodyFront`) | **2.7** | **0.83** | **0.86** | 0.77 |

Limbs (÷ W):

| part | reference | **ours** | gap |
|---|---|---|---|
| legs | **one ink stroke 0.05–0.08 W (median 0.055)**, no knees, slight curve, A-stance (feet ≈0.45 W apart, hips ≈0.3 W). Close-ups sometimes show a thin outlined tube of the same total width | tube 46 + ink rim 21.6 = **0.28 W** (on screen 35 px on a 124 px face) | **5× too thick** |
| arms | ink stroke **≈0.05 W**, start inside the torso sides, no shoulders or elbows | 40 + 21.6 = **0.25 W** | 5× |
| hands | **filled ink dots 0.08–0.15 W** (median ≈0.11), no fingers; props held by the dot | skin balls r24 + outline = **0.23 W** | 2× too big, wrong colour |
| feet | short round-capped strokes **0.15–0.25 W long, ≈0.07 W thick**, pointing outward (front) or forward (side) | boot ovals **0.39 × 0.26 W** | ~2× |
| neck | none; the head overlaps the torso top | none | ok |

Torso shape:
- **Reference:** a vertical **bean/capsule**. The top is narrower and hidden under the head. It is widest at 60–70% of its height, and the bottom is fully round (radius ≈ half the width). The outline has the same thick-thin behaviour as the head.
- **Ours:** a rounded rectangle with corner radius 58 (0.33 of the width), which reads boxy.

Torso shading (column profiles, `scripts/torso_profile.py`):
- Much stronger than on faces: from the lit side to the shadow side **1.0 → 0.55–0.66**, as a smooth gradient.
- About half the torsos have a **light rim** (0.8–0.97) just inside the shadow-side edge (robe 13_009, yellow 19_016.5, blue soldier 12_057).
- Ours: one flat colour plus a hard 30-unit darker band at the bottom (`shade 0.8`).

Clothing detail:
- At most about 5 elements per torso: buttons (dots ≈0.04–0.06 W), pocket, belt, tie, collar, stripes.
- Drawn as flat fills with thin inner lines (≈0.4× the outline).
- The uniformed soldier (12_057) has 4 brass dots, a dark belt with a small buckle, and a soft cap.
- Ours is the same level of detail (cross belts and 4 buttons). That part is fine.

Hats and props:
- Hats sit **low**, covering the top 25–40% of the head. Their base edge follows the skull as a shallow "smile" curve (sag ≈0.05 W). They tilt with the head, carry the same outline, and the brim sticks out on the facing side.
- Props are held by dot hands on thin arms, with props outlined at ≈0.6–1.0× weight.
- Our shako is a flat-bottom trapezoid wider than the head. Our rifle is a 22-unit tube with a 21.6 rim (0.18 W).

Poses:
- Torso lean 3–8°. Head tilt typically ±5° (3/4 views up to 19°).
- One arm usually doing something (pointing, holding, raised) while the other hangs.
- Feet turned outward. Bodies are rarely perfectly symmetric.
- Ours: upright and mirror-symmetric.

Ground shadows:
- Real 3D cast shadows of the cards (long at sunset, `04_031.5`), plus soft dark contact blobs under the feet (`03_033.0`).
- This is a lighting topic. Keep our cast shadow and add a contact blob of 0.5 W × 0.06 W, alpha 0.3, blurred.

Side and 3/4 views:
- Features slide 0.1–0.15 W toward the facing side; there is a small nose tick; hair or hats wrap the back.
- The torso turns into a narrower bean (≈0.6 W).
- Legs are still two thin strokes, the far one darker.

### 1.6 The gap in plain words

1. **Proportions.** Our adults have kid proportions: 2.7 HH, with legs at 61% and torso at 75% of the reference lengths.
2. **Limbs.** Arms and legs are 5× too thick, hands are 2× too big and skin-coloured, and the boots are big ovals. This is the "cheap sticker" look the user is reacting to.
3. **Heads.** They are perfect symmetric ellipses 25% too tall: no chin taper, no crown/jaw difference, no tilt or side bulge, features dead-centre.
4. **Outline.** Uniform width, and crushed to pure black on screen. The reference is plum with about 3:1 thick/thin, weighted to the bottom and shadow side.
5. **Faces.** Eyes are 45% too far apart. Every face has blush and catchlights (the reference has neither). The default eye is a cute dot instead of a lidded deadpan eye. Brows are thin and mouths wide.
6. **Values.** Faces render at luma 0.62–0.81 against the reference 0.93. There is no crescent shading on heads and no gradient on torsos.

---

## 2. Drawing spec for our cast (600×1000 design units, soles at y=975)

### 2.1 Builds

`W = 2a` is the head's path width; `HH = 2b`.

| build | used for | head a / b (W × HH) | chin→torso bottom | legs (torso bottom→sole) | total | torso width |
|---|---|---|---|---|---|---|
| **adult** | riflemen, parent, townsfolk | 118 / 111 (236 × 222) | 1.10 HH = 244 | 1.40 HH = 311 | **3.5 HH**; crown at y≈198 | 0.80 W = 189 |
| **stout** | officer | 118 / 111 | 1.15 HH = 255 | 1.32 HH = 293 | 3.47 HH | 0.92 W = 217, rounder belly |
| **kid** | kid | 112 / 108 (224 × 216) | 0.85 HH = 184 | 1.00 HH = 216 | **2.85 HH**; crown at y≈359 | 0.72 W = 161 |

Kid heads are almost adult-sized; only the body is shorter, as in the reference. The current `head: 1.15` should become a `build` flag.

### 2.2 Head contour (`blobPts` / `headBlob`)

Base values, plus a per-character variation from a seed (`who.i`):

| param | front base | per-character spread | side view | 3/4 view |
|---|---|---|---|---|
| b/a | 0.94 | ±0.04 | 0.94 | 1.02 |
| egg | −0.12 | ±0.03 | −0.10 | 0 |
| nTop | 1.75 | ±0.15 | 1.8 | 2.2 |
| nBot | 2.30 | ±0.15 | 2.3 | 1.9 |
| asym | +0.08 × facing (random sign when facing = 0) | 0.06–0.10 | **+0.12** (jaw toward the front) | +0.08 |
| rot | ±4° random | — | +3° | ±12° toward the facing side |
| noise | 0.8% radius, harmonics 2–4, seeded phases | — | same | same |

### 2.3 Line weights (u = 1% of W ≈ 2.36 units for adults)

| line | width | rule |
|---|---|---|
| head and torso outline | **w0 = 5u ≈ 11.8** | `w(θ) = w0·(1 + 0.45·cos(θ − θthick))`, giving thin 6.5 and thick 17.1. `θthick = atan2(−sin(light) + 0.8, −cos(light))`, which is 65° for upper-left light (matches the measured 64°) |
| hats and props | 0.85 × w0, uniform with round joins | — |
| legs | 5.8u ≈ 13.7, colour `mix(pants, INK, 0.55)` | no tube or rim; slight bow |
| feet | 7.5u ≈ 17.7 thick, 16u ≈ 38 long | outward in front view, forward in side view |
| arms | 5.2u ≈ 12.3, colour `mix(jacket, INK, 0.5)` | back arm drawn before the torso, front arm after |
| hands | ink dot r = 5.5u ≈ 13 | — |
| brows | tapered 5u inner → 2.5u outer, 17u long | — |
| eye lid / dash / arcs | 3.8u | — |
| mouth line | 4u | — |
| clothing internal lines (belt rims, pockets) | 1.5–1.8u | — |

Minimum width: at texture tier k=0.4, keep every line ≥ 1.5 / k design units (≈4) so lines survive mip-mapping.

### 2.4 Colours

| role | hex | note |
|---|---|---|
| INK | **#241726** | replaces #221f2e; reference core is #201628–#2f1d28 |
| skins (fills) | **#ffe2c2, #f5c9a0, #ecd0b6, #c99067** | brighter and cleaner than now; must land at luma ≥0.85 on screen |
| skin shadow | `mul(skin, [0.96, 0.86, 0.84])`, e.g. #ffe2c2 → #f5c2a3 | soft crescent only |
| optional pale "townsfolk white" head | #fbf8f4 / shadow `mul(…, [0.92, 0.90, 0.96])` = #e7dfea | lavender |
| rifle-green coatee | **#357650** | lifted from #2f6a43 so it still reads after the render; shadow `mul(…, SH_CLOTH)` = #234e3b |
| cross belts | **#f1efe6**, rim INK 1.8u | white belts as briefed |
| rifleman buttons | #d9dde0 (pewter) | officer: #e8c45a (brass) |
| trousers / leg strokes | #3d4440 → stroke #2f2b32 | — |
| boots / feet | INK | kid: #f4f1ea with ink rim |
| shako | body **#3a3d47**, shadow #24262d, peak #16171b, badge #c9ccd2, tuft #2b7a4b; officer band #e8c45a | lighter than black so the plum outline reads |
| officer sash | #c0353a | moustache #4a3020 |
| kid | jacket #f08a2c, pants #3b5b9a, cap #e2453c (brim ×0.8) | — |
| parent | coat #7b5ac9, hair #5a3b2a, shoes #5a3b2a | — |
| mouth / tongue / sclera / sweat | #5a1e28 / #e86e78 / #ffffff / #9fd4ff | keep |
| CHEEK #f3aa98 | **drop** | the reference has no blush |

### 2.5 Face library

Layout:
- Eyes at x = cx + 7u·facing ± 13u (shock: ±12u), y = cy.
- Brows at y = cy − 20u.
- Mouth at x = cx + 8u·facing, y = cy + 20u.

Brow numbers are `[inner, outer]` offsets in u; + = down.

| expr | eyes | brows | mouth |
|---|---|---|---|
| neutral | **lidded** half-disc (rx 7u, ry 6u under an 18u lid line) | [0, −1] | dash 11u, tilted 0.8u (smirk) |
| stern | lidded | **[+3, −2]** (V) | frown arc 13×3.5u |
| grin | happy ∩ arcs 16×6u | [−3, −3] | D 24×8u + white teeth band 3u |
| laugh | squeeze > < | [−4, −4] | open D 32×11u + tongue |
| whistle | closed dashes | [−2, −4] | small "o" 7×8u, shifted +4u |
| nervous | small ovals 6×9u | **[−3, +2]** (worried) | wave 18u, amplitude 1.5u; sweat drop |
| shock | **white circles 22u almost touching**, pupils r3u | raised arcs −7u | tall O 18×22u |
| relief | happy ∩ | [−2, +1] | wide smile arc 22×6u |
| relief_open | happy ∩ | [−2, +1] | D 24×8u |
| dazed | spirals r≈8u | [−3, +2] | small wave |
| pained | squeeze (back eye) + lidded (front eye) | [−3, +2] | teeth box 24×8u, 3 dividers |
| smile | dot ovals 7.6×11u | [0, −1] | smirk arc 14×4u |
| smile_closed | happy ∩ | [0, −1] | smile arc 16×4.5u |
| lick | dot ovals, look sideways | [0, −1] | smile + tongue 7×9u at the corner |

Across all expressions: no blush, no catchlights. Optional per-character quirk: the facing-side brow sits 2u higher (skeptical).

### 2.6 Body construction, front view

Draw order:
1. Legs and feet.
2. Both arms and their dot hands. They come out from behind the bean; draw an arm after the torso only when the hand is in front of the body (holding a prop).
3. Torso: shaded fill → clothing clipped to the torso → ink ring.
4. Head: shaded fill → ink ring.
5. Hat.
6. Face, drawn last so brows can overlap a brim.

Placement:
- Hips at torsoBot − 0.12 HH, x ±15u; feet at x ±22u.
- Arms hang **outside** the bean, as in the reference:
  - shoulder at (±0.85·Ta, chin + 0.12 HH),
  - elbow at ±(1.12·Ta + 4u), y + 0.48 HH,
  - hand 3u further out, at chin + 1.04 HH.
- The first preview put the arms inside the torso; they vanished behind it.
- Torso blob: `a = (tw/2)·W/1.06, b = (torsoBot − (chin − 0.25 HH))/2, nTop 2.2, nBot 2.6, egg +0.12, asym 0.04·facing`.
- Body lean: rotate everything above the hips 3–6° (marchers alternate ±2° with the step).

### 2.7 Side view (`bodySide`)

- **Head:** same blob with asym +0.12 and rot +3°.
- **Face:** one eye at hx + 27u, y = hy (lidded or dot). Brow is a taper from [ex−7u, ey−20u] to [ex+8u, ey−21u]. Mouth is a dash from [hx+26u, hy+21u] to [hx+36u, hy+20u]. Optional nose tick from [hx+44u, hy+4u] to [hx+47u, hy+9u] to [hx+43u, hy+10u] at 3u. **No skin bump nose and no ear.**
- **Torso:** bean with a = 0.31 W, egg +0.10, asym +0.06 (belly forward), lean +4° when marching.
- **Legs:** thigh = shin = 0.72 HH (160), stroke 5.8u. Far leg is `mix(pants, INK, 0.75)`, near leg 0.55. Feet are 16u strokes pointing forward. The current march kinematics stay; only the lengths and widths change.
- **Arm:** one 5.2u stroke of length 0.95 HH, swinging ±30°, ending in a dot hand.
- **Shako:** trapezoid with the peak as a forward wedge (16u long) and the tuft at the front-top.

### 2.8 Shading layer

- **Head:**
  - flat fill, then a soft crescent: the shape filled with the shadow colour, then a copy shifted toward the light by 0.30R in the base colour with `blur(0.09R)`, clipped to the shape;
  - this gives full shadow only in the outer ~30% on the far side and fades by ±75–110°;
  - multipliers SH_SKIN [0.96, 0.86, 0.84] or SH_WHITE [0.92, 0.90, 0.96].
- **Torso:**
  - same method but broader: shift 0.55R, blur 0.18R, SH_CLOTH [0.64, 0.66, 0.74];
  - optional rim light: a 2u sliver along the shadow-side edge in `mix(jacket, #ffffff, 0.45)` at 55% alpha.
- **Light direction:**
  - `light` = canvas angle the key light comes from, worked out per shot in cast.ts and quantised to 45°;
  - the outline's thick side follows `thickAngle(light)`.
- **Grain:**
  - not measurable in the reference;
  - if wanted, at most 2% multiply noise clipped to the shapes; default **off**.
- **Not a hard cel step:** the measured edge is soft.

### 2.9 Fitting the cast into the rules

**Riflemen (1831):**
- Adult build. Coatee bean #357650 with white cross belts:
  - two 5.5u bands from the shoulder top (±0.75·Ta at chin − 0.05 HH) to the opposite hip (±0.8·Ta at torsoBot − 0.1 HH),
  - clipped to the torso, so they wrap the bean;
  - a small 7u pewter plate where they cross is optional.
- 4 pewter buttons r 2.2u, spaced 0.2 HH, shifted 2u toward the facing side.
- Legs are dark trouser strokes; feet are ink strokes.
- **Shako:**
  - base sits **0.25 HH below the crown**, half-width 46u, base edge sags 3u (follows the skull);
  - bell top half-width 52u, height 0.56 HH (≈124);
  - black-felt fill #3a3d47 with a crescent shadow; peak is a half-ellipse 34u × 0.045 HH, #16171b;
  - badge is a 6u bugle ring #c9ccd2; green tuft r 7u on top;
  - tilts with the head ±2° extra.
  - Under any brimmed hat the brows drop to −17u, matching the reference (police cap 10_018: brows at −0.15 W). The face is drawn after the hat.
- **Rifle:** wood band 5u (#7a4b2a, rim 1.5u) from (300+30u, torsoBot − 0.05 HH) up past the crown by 0.35 HH. Steel band 2.4u (#8d949c) over the top 40%. The front dot-hand sits on the stock at 45% of its height.
- Moustache variants (skins 1 and 3): two tapered commas 9u long each, 4u→1.5u, #4a3426 / #2a201a, total width ≈0.36 W. The current ones are 0.53 W.

**Officer:**
- Stout build, same face rules.
- `shako_tall`: height 0.66 HH, gold band 0.06 HH at 0.07 HH below the top, brass badge.
- Crimson sash: a 0.13 HH band at torsoBot − 0.32 HH, clipped to the bean, with the knot hanging on the facing side.
- Sword: a 3u silver band (rim 1.2u) from the back hip, angled 25°.
- Handlebar moustache: two tapers of 10u each, 5u→1.5u, #4a3020.
- Stern default: lidded eyes with a V brow.

**Kid:**
- Kid build (2.85 HH). Orange bean torso 0.72 W, blue trouser strokes, white shoe strokes (with a 1.5u ink rim).
- **Cap:**
  - dome = the head's own crown above 0.30 HH, pushed out by 3%, in #e2453c;
  - front peak is a half-ellipse 32u × 0.06 HH, ×0.8 shade, shifted 4u toward the facing side;
  - a side wedge brim covered one eye in the preview, so it was dropped.
- `swingKid` currently translates by design (360, 715). With the new build the hip is at y ≈ 975 − 1.0·216 − 0.12·216 ≈ 733, so update the seat offset to `rope + 20 − 733·0.92`.

**Parent:**
- Adult build, purple coat bean, brown shoes.
- Hair: the head's crown above 0.42 HH pushed out by 3%, #5a3b2a, with 3 scallops on the lower edge and 1–2 ink strands at 1.2u. The part sits on the facing side.

**Townsfolk:**
- Adult build. Coats as now; skins from the new SKINS list.
- **Top hat:** base 0.31 W half-width, seated 0.22 HH below the crown; 0.8 HH tall with a slight flare; brim ellipse 0.45 W × 0.05 HH; band = coat ×0.9.
- **Bonnet:** a blob 1.15× the head drawn behind it, a 7u brim band arc over the forehead, and a 2u ribbon under the chin.
- **Dress:** a bell bean (`egg +0.35`, nBot 3) from chin − 0.2 HH down to 0.35 HH above the soles, with two short ink ankle strokes below.

---

## 3. Implementation recipe (TypeScript, toon.ts style)

Where each change goes:

| file / place | change |
|---|---|
| `toon.ts`: `INK`, `SKINS`, `CHEEK` | `INK = "#241726"`, new SKINS, `CHEEK` unused |
| `toon.ts`: `Outfit`, `RIFLEMAN`, `OFFICER`, `KID` | add `build?: "adult" \| "stout" \| "kid"`. RIFLEMAN gets `belt: "#f1efe6"`, `jacket: "#357650"`. OFFICER gets `build: "stout"`. KID gets `build: "kid"` (the `head: 1.15` drops) |
| `toon.ts`: class `Pen` | add `clip`, `shadedFill`, `inkRing`, `band`, `rimLight` |
| `toon.ts`: helpers | new `mix`, `mul`, `rnd`, `Blob`, `blobPts`, `headBlob`, `thickAngle`, `taper`, `rotPts` |
| `toon.ts`: faces | `faceFront` → `faceV2` + `FACE` table |
| `toon.ts`: hats | `hatFront` → `hatV2` |
| `toon.ts`: bodies | `bodyFront` → `bodyFrontV2` (march/stroll/stand below; sit/fall/dress use the same parts with the old poses rescaled). `bodySide` per §2.7. `swingKid` gets the new offset |
| `toon.ts`: `FrontOpts` / `SideOpts` | add `light?: number; facing?: -1 \| 0 \| 1; seed?: number` |
| `cast.ts`: `person()` | pass `seed: who.i`, `facing` (sign of walk direction · `cam.right` for diagonal walkers, else 0) and `light: light2D(cam, sunDir, mirror)` into `fo`/`so`. They enter the texture key through `fkey()` automatically |
| `cast.ts`: material (line 65) | faces render at luma 0.62–0.81 because of `MeshLambert + emissiveIntensity 0.36`. Target is ≥0.85 lit and ≈0.75 in shade, e.g. `emissiveIntensity: 0.75` with `color: 0x808080`. The painted crescent then carries the form. This overlaps with the lighting/grade reports; check with them before changing it |

```ts
// ===================== toon.ts — character construction v2 =====================
export const INK = "#241726";                         // dark plum; reference ink core #201628..#2f1d28
export const SKINS = ["#ffe2c2", "#f5c9a0", "#ecd0b6", "#c99067"];
const SH_SKIN: [number, number, number] = [0.96, 0.86, 0.84];   // measured shadow/lit ratio, skin heads
const SH_WHITE: [number, number, number] = [0.92, 0.9, 0.96];   // white heads: lavender shadow
const SH_CLOTH: [number, number, number] = [0.64, 0.66, 0.74];  // torsos: lit -> shadow side ~0.6

export const mul = (c: string, m: [number, number, number]) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255, m[0])}${ch((n >> 8) & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const mix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
/** deterministic per-character random in [0, 1) */
const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);

// ---------------- contour ----------------
export type Blob = { a: number; b: number; nTop: number; nBot: number; egg: number; asym: number; rot: number; noise: number; seed: number };

/** superellipse "bean": separate crown / jaw exponents, egg taper (neg = narrower chin), one-side bulge, soft noise.
 *  Points run right -> down -> left -> up (clockwise on screen), 96 per contour. */
export const blobPts = (cx: number, cy: number, B: Blob, n = 96): P2[] => {
  const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map((v) => v * Math.PI * 2);
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
    const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
    const x = B.a * X * r, y = B.b * Y * r;
    pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
  }
  return pts;
};

/** measured head: H/W 0.94, slightly pointed crown (1.75), fuller jaw (2.3), chin taper -0.12, 8% bulge to the facing side */
export const headBlob = (seed: number, a = 118, facing = 0): Blob => ({
  a, b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
  nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5), nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
  egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
  asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
  rot: rad(8 * (rnd(seed, 7) - 0.5)), noise: 0.008, seed,
});

/** thickest outline direction: away from the light, pulled toward the ground (64° measured for upper-left light) */
export const thickAngle = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));

/** tapered stroke, thick end at a: brows, moustache halves */
const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
    [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col); p.dot(b[0], b[1], wb / 2, col);
};
```

Add these methods inside `class Pen`:

```ts
  /** draw with a closed shape as clip */
  clip(pts: P2[], fn: () => void) { const g = this.g; g.save(); this.path(pts, true); g.clip(); fn(); g.restore(); }

  /** flat fill + soft crescent on the side away from the light (light = canvas angle the light comes FROM).
   *  shape in the shadow colour, then a copy moved toward the light in the base colour, blurred, clipped. */
  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.3, soft = 0.09) {
    const g = this.g, m = g.getTransform(), k = Math.hypot(m.a, m.b);
    const dx = Math.cos(light) * shift * R, dy = Math.sin(light) * shift * R;
    this.clip(pts, () => {
      this.path(pts, true); g.fillStyle = shadow; g.fill();
      g.filter = `blur(${(soft * R * k).toFixed(1)}px)`;
      this.path(pts.map(([x, y]) => [x + dx, y + dy] as P2), true); g.fillStyle = base; g.fill();
      g.filter = "none";
    });
  }

  /** thick-thin ink ring: w(θ) = w0 (1 + k cos(θ − thick)), θ from the contour centroid (canvas angles) */
  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = INK) {
    const n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const out: P2[] = [], inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0];                       // outward normal for clockwise-on-screen contours
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]); inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => { r.forEach(([x0, y0], i) => { const [x, y] = this.P(x0, y0); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
    g.beginPath(); trace(out); trace(inn.reverse());
    g.fillStyle = col; g.fill("evenodd");
  }

  /** flat strap with a thin ink rim (cross belts, sash, rifle parts) */
  band(pts: P2[], fill: string, w: number, rim: number) {
    const g = this.g; g.lineCap = "butt"; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * rim; g.stroke();
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }

  /** optional: thin light rim just inside the shadow-side edge (seen on about half the reference torsos) */
  rimLight(pts: P2[], col: string, light: number, w: number, alpha = 0.55) {
    const g = this.g, dx = Math.cos(light) * w, dy = Math.sin(light) * w;
    this.clip(pts, () => {
      g.beginPath(); g.rect(-5000, -5000, 10000, 10000);
      pts.map(([x, y]) => this.P(x + dx, y + dy)).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath(); g.globalAlpha = alpha; g.fillStyle = col; g.fill("evenodd"); g.globalAlpha = 1;
    });
  }
```

Face library:

```ts
type EyeK = "dot" | "small" | "lid" | "happy" | "dash" | "squeeze" | "shock" | "spiral";
/** eyes [back, front], brows [inner, outer] offsets in u (+ = down), mouth kind */
const FACE: Record<Expr, { eye: [EyeK, EyeK]; brow: [number, number]; mouth: string }> = {
  neutral: { eye: ["lid", "lid"], brow: [0, -1], mouth: "dash" },
  stern: { eye: ["lid", "lid"], brow: [3, -2], mouth: "frown" },
  grin: { eye: ["happy", "happy"], brow: [-3, -3], mouth: "grin" },
  laugh: { eye: ["squeeze", "squeeze"], brow: [-4, -4], mouth: "laugh" },
  whistle: { eye: ["dash", "dash"], brow: [-2, -4], mouth: "o" },
  nervous: { eye: ["small", "small"], brow: [-3, 2], mouth: "wave" },
  shock: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "O" },
  relief: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "smileWide" },
  relief_open: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "grin" },
  dazed: { eye: ["spiral", "spiral"], brow: [-3, 2], mouth: "wave" },
  pained: { eye: ["squeeze", "lid"], brow: [-3, 2], mouth: "teeth" },
  smile: { eye: ["dot", "dot"], brow: [0, -1], mouth: "smirk" },
  smile_closed: { eye: ["happy", "happy"], brow: [0, -1], mouth: "smile" },
  lick: { eye: ["dot", "dot"], brow: [0, -1], mouth: "lick" },
};

/** face v2. u = 1% of the head path width W. Eyes 26u apart on the centre line, brows 20u up, mouth 20u down,
 *  everything slid toward the facing side. No blush, no catchlights. */
export const faceV2 = (p: Pen, cx: number, cy: number, W: number, expr: Expr, facing = 0, look = 0, blink = false, brim = false) => {
  const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing, lw = 3.8 * u;
  const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
  for (const side of [-1, 1]) {
    const x = fx + side * ex, lx = x + look * 3 * u;
    const kind: EyeK = blink ? "dash" : F.eye[(facing ? side === facing : side > 0) ? 1 : 0];
    if (kind === "dot") p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0);
    else if (kind === "small") p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0);
    else if (kind === "lid") { p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); }
    else if (kind === "happy") p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw);
    else if (kind === "dash") p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw);
    else if (kind === "squeeze") p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw);
    else if (kind === "shock") { p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u); p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u); }
    else { const s: P2[] = []; for (let t = 1; t < 15; t++) s.push([x + Math.cos(t * 0.9) * t * 0.55 * u, ey + Math.sin(t * 0.9) * t * 0.55 * u]); p.stroke(s, 2.4 * u); }
    const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;           // under a brim the brows sit lower
    if (kind === "shock") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
  }
  const mx = cx + 8 * u * facing, my = cy + 20 * u, mw = 4 * u;
  const dmouth = (rx: number, ry: number, y: number, tongue = false) => {        // open "D" with teeth band (+ tongue)
    p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
    p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
    if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
    p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
  };
  switch (F.mouth) {
    case "dash": p.stroke([[mx - 5.5 * u, my], [mx + 5.5 * u, my - 0.8 * u]], mw); break;
    case "frown": p.arc(mx, my + 3 * u, 6.5 * u, 3.5 * u, 200, 340, mw); break;
    case "smirk": p.arc(mx + u, my - 3 * u, 7 * u, 4 * u, 10, 150, mw); break;
    case "smile": p.arc(mx, my - 3 * u, 8 * u, 4.5 * u, 20, 160, mw); break;
    case "smileWide": p.arc(mx, my - 4 * u, 11 * u, 6 * u, 15, 165, mw); break;
    case "grin": dmouth(12 * u, 8 * u, my - u); break;
    case "laugh": dmouth(16 * u, 11 * u, my, true); break;
    case "o": p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u); break;
    case "O": p.ell(mx, my + 2 * u, 9 * u, 11 * u, MOUTH, 3.2 * u); break;
    case "wave": { const s: P2[] = []; for (let i = 0; i <= 12; i++) s.push([mx - 9 * u + i * 1.5 * u, my + 1.5 * u * Math.sin(i * 1.3)]); p.stroke(s, 3 * u); break; }
    case "teeth":
      p.poly([[mx - 12 * u, my - 4 * u], [mx + 12 * u, my - 4 * u], [mx + 11 * u, my + 4 * u], [mx - 11 * u, my + 4 * u]], WHITE, 3 * u);
      for (const k of [-1, 0, 1]) p.stroke([[mx + k * 6 * u, my - 4 * u], [mx + k * 6 * u, my + 4 * u]], 1.5 * u);
      break;
    case "lick": p.arc(mx, my - 3 * u, 8 * u, 4.5 * u, 20, 160, mw); p.ell(mx + 6 * u, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u); break;
  }
  if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};
```

Body (front), shown for march/stroll/stand. Sit, fall and dress reuse the same parts.

```ts
const BUILD = {
  adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 },
  stout: { a: 118, torso: 1.15, legs: 1.32, tw: 0.92 },
  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 },
};
export type FrontOpts2 = FrontOpts & { light?: number; facing?: -1 | 0 | 1; seed?: number };

export const bodyFrontV2 = (p: Pen, o: Outfit & { build?: keyof typeof BUILD }, { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, tilt = 0, headTilt = 0, light = rad(-135), facing = 0, seed = 1 }: FrontOpts2) => {
  const B = BUILD[o.build ?? "adult"], skin = o.skin ?? SKINS[0], two = Math.PI * 2;
  const H = headBlob(seed, B.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const bob = mode === "march" ? 5 * Math.cos(2 * two * phase) : mode === "stroll" ? 3 * Math.cos(2 * two * phase) : 0;
  const sole = 975, torsoBot = sole - B.legs * HH + bob, chin = torsoBot - B.torso * HH, hc = chin - H.b;
  const thick = thickAngle(light), ow = 5 * u;
  const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots === INK ? INK : mix(o.boots, INK, 0.3);
  // legs: single thin strokes, no knees, slight A-stance; feet = short outward strokes
  const L = mode === "march" ? lift : mode === "stroll" ? lift * 0.45 : 0;
  for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
    const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
    const hx = 300 + side * 15 * u, hy = torsoBot - 0.12 * HH, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
    p.stroke([[hx, hy], [(hx + fx) / 2 + side * 1.5 * u, (hy + fy) / 2], [fx, fy]], 5.8 * u, legCol);
    p.stroke([[fx, fy], [fx + side * 16 * u, fy + 0.5 * u]], 7.5 * u, footCol);
  }
  p.rot = tilt ? [rad(tilt), 300, torsoBot] : null;
  // torso: bean, widest low, round bottom, top hidden under the head (no neck)
  const T: Blob = { a: (B.tw / 2) * W / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
  // arms hang OUTSIDE the bean (shoulder on its edge, elbow/hand clear of it) and come out from behind it
  const arm = (side: number, swing: number): P2[] => {
    const x = tcx + side * 0.85 * T.a, y = chin + 0.12 * HH, out = tcx + side * (1.12 * T.a + 4 * u);
    return [[x, y], [out, y + 0.48 * HH], [out + side * 3 * u + swing * 14 * u, y + 0.92 * HH - Math.abs(swing) * 8 * u]];
  };
  for (const [side, s] of [[-1, -sw], [1, sw]] as const) {      // draw a hand-in-front arm after the torso instead
    const a = arm(side, s);
    p.stroke(a, 5.2 * u, armCol); p.dot(a[2][0], a[2][1], 5.5 * u);
  }
  p.shadedFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light, T.a, 0.55, 0.18);
  p.clip(tp, () => {                                                     // clothing wraps the bean
    if (o.belt) for (const s of [-1, 1]) p.band([[tcx - s * 0.75 * T.a, chin - 0.05 * HH], [tcx + s * 0.8 * T.a, torsoBot - 0.1 * HH]], o.belt, 5.5 * u, 1.8 * u);
    for (let i = 0; i < 4; i++) p.dot(tcx + 2 * u * facing, chin + 0.12 * HH + i * 0.2 * HH, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
    if (o.sash) p.band([[tcx - 1.2 * T.a, torsoBot - 0.32 * HH], [tcx + 1.2 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
  });
  p.rimLight(tp, mix(o.jacket, "#ffffff", 0.45), light, 2 * u);
  p.inkRing(tp, ow, thick);
  // head: tilts around the chin; hat sits low and follows the skull; face last (brows may overlap a brim)
  p.rot = tilt || headTilt ? [rad(tilt + headTilt), 300, chin] : null;
  const hp = blobPts(300, hc, H);
  p.shadedFill(hp, skin, mul(skin, skin === WHITE ? SH_WHITE : SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatV2(p, o, hp, H, 300, hc, light, seed);
  faceV2(p, 300, hc, W, expr, facing, look, blink, !!o.hat && o.hat !== "hair" && o.hat !== "bonnet");
  p.rot = null;
};
```

Hats (shako, cap, hair; the top hat and bonnet follow §2.9 numbers):

```ts
const hatV2 = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, seed: number) => {
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5));                     // tilt with the head, +-2 deg extra
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  if (o.hat === "shako" || o.hat === "shako_tall") {
    const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
    const base: P2[] = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; base.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]); }
    const body = R([...base.reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, "#3a3d47", "#24262d", light, wt);
    if (tall) p.clip(body, () => p.band(R([[cx - wt, yb - ht + 0.07 * HH], [cx + wt, yb - ht + 0.07 * HH]]), "#e8c45a", 0.06 * HH, 1.5 * u));
    p.poly(body, null, ow);
    const [px, py] = R([[cx, yb + 3 * u]])[0];
    p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, (a * 180) / Math.PI);      // peak
    const [bx, by] = R([[cx, yb - 0.45 * ht]])[0];
    p.arc(bx, by, 6 * u, 5 * u, 200, 520, 2.4 * u, "#c9ccd2");                            // bugle-horn badge, simplified
    const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
    p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);                                       // green tuft
  } else if (o.hat === "cap" || o.hat === "hair") {
    const cut = crown + (o.hat === "cap" ? 0.3 : 0.42) * HH;
    const dome = hp.filter(([, y]) => y < cut).map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (o.hat === "hair") {                                                 // scalloped lower edge
      const [x0, y0] = dome[dome.length - 1], [x1] = dome[0];
      for (let i = 1; i < 6; i++) dome.push([x0 + ((x1 - x0) * i) / 6, y0 + (i % 2 ? 4 * u : 0)]);
    }
    const col = o.hat === "cap" ? o.cap! : o.hair!;
    p.shadedFill(dome, col, shade(col, 0.78), light, H.a);
    p.poly(dome, null, ow);
    if (o.hat === "cap") {                                                  // short front peak, nudged to one side
      const s = rnd(seed, 21) < 0.5 ? -1 : 1, [px, py] = R([[cx + s * 4 * u, cut + 1.5 * u]])[0];
      p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, (a * 180) / Math.PI);
    }
  }
};
```

Light direction in `cast.ts`. Billboards stand upright, so their "up" is world +Y:

```ts
/** canvas angle the sun comes FROM on an upright card facing the camera; 45-degree steps keep the texture cache small */
const light2D = (cam: CamInfo, sunDir: THREE.Vector3, mirror = false) => {
  const sx = sunDir.dot(cam.right) * (mirror ? -1 : 1), sy = -sunDir.y;  // sunDir = normalize(sun.position - sun.target.position)
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
```

Notes:
- `ctx.filter = "blur()"` works in Chromium canvases, which is what Remotion renders with. Texture draws are cached per key in `cast.ts`, so the blur cost is paid once per pose, light and expression.
- Characters drawn with `p.rot` rotate their light shift with the tilt. That is negligible for tilts under 8°.
- For a quick visual check after implementing, render one still each of rifleman, officer and kid next to `crops/compare_bodies.png`.

---

## 4. Top 5 changes, ranked by visual impact

1. **Body build and limbs.**
   - Adults go to 3.5 HH (head 1 : torso 1.1 : legs 1.4); the kid to 2.85 HH.
   - Legs become single 0.058 W strokes, arms 0.052 W strokes, hands 0.055 W ink dots, feet short 0.16 W strokes. This replaces the 0.25–0.28 W tubes, skin ball hands and boot ovals.
   - The torso becomes a bean (round bottom, wider low) instead of a rounded box.
   - This is the biggest single change in silhouette, and it is the "poor body structure" complaint.
2. **Head contour.**
   - Superellipse bean: H/W 0.94, egg −0.12, crown n 1.75 / jaw n 2.3, 8% bulge to the facing side, tilt ±4°.
   - Per-character seed variation and 0.8% soft noise, instead of the symmetric 1.17 ellipse.
   - The fix is *not* "less round"; it is taper plus asymmetry plus tilt.
3. **Thick-thin plum outline.**
   - `INK #241726`, w0 = 5% W, thickness `1 + 0.45·cos(θ − θthick)`, thick side away from the light and toward the ground.
   - Inner details at 0.4–0.9×. Lift the on-screen ink from #0a0014 toward #2a1b28.
4. **Face library.**
   - Eyes 0.26 W apart on the centre line; lidded deadpan default; shock eyes 0.22 W and almost touching.
   - No blush, no catchlights; thicker tapered brows at −0.20 W; small mouths at +0.20 W.
   - Features slide 0.07–0.08 W toward the facing side.
5. **Value and shading.**
   - Faces must render light: luma ≥0.85, against 0.62 now (`cast.ts` emissive/material, coordinate with lighting/grade).
   - Soft crescent on heads (×0.89, lavender or warm tint).
   - Broad gradient on torsos (→ ×0.6) with an optional rim on the shadow edge.
   - Grain off, or ≤2%.

---

## 5. Files

Everything is under `references/characters/`.

**Side-by-sides:**
- `crops/compare_heads.png`: 8 reference heads with the fitted contour vs 3 of ours with their ellipse.
- `crops/compare_bodies.png`: 5 reference bodies vs our officer and rifleman, all scaled to the same head height with HH guide lines.
- `crops/spec_preview.png`: the proposed construction drawn in PIL with the numbers in this report (`scripts/spec_preview.py`), showing rifleman ×2, officer, kid and townsperson. It is a check that the spec holds together, not a render of the reel. The TS snippets in §3 type-check under `tsc --strict` against `toon.ts` (harness in `tscheck/check.ts`).

**Reference crops (private):**
- `crops/heads2/*.png`: 38 heads with rays and fits.
- `crops/bodies/b01…b15*.png`: gridded full bodies.
- `crops/zoom_10_018_outline.png`, `crops/head_shading_stretched.jpg`.
- `data/bodies_a…e.png`, `data/fits_0..2.jpg`, `data/angles_0..3.jpg`, `data/grid_00..15.jpg`, `data/cand_crops*.jpg`.

**Ours (read-only copies with grids):**
- `crops/ours/c_1745_grid.png`, `crops/ours/sheet_1800_1470.png`.

**Data:**
- `data/heads2.json` (contour, outline, feature and colour fits per head)
- `data/heads.json`
- `data/ours_heads.json`
- `data/face_candidates.json`

**Scripts:**
- `scripts/extract.py`, `overview.py`, `faces.py` (ink map and face finder)
- `heads.py`, `heads2.py` (contour model, ray widths, inner/outer fits)
- `angle_sheet.py`, `bodycrops.py`, `torso_profile.py`
- `ours_grid.py`, `ours_measure.py`, `compare_sheets.py`
