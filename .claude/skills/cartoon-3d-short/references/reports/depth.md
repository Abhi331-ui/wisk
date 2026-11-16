# Depth cues, glow and framing: reference vs ours

Private study. Only general rules and numbers are taken from the 20 reference videos: no traced shots, characters or props.
Working folder: `references/depth/` (scripts, data, crops).
Units: blur is a Gaussian sigma in **720p px** (reference 720x1280) unless marked. Our stills are 540x960 and are scaled ×720/540.
To get a blur-disc radius at our 1080x1920 output, use **R(px @1080p) ≈ 3 × sigma720** (a uniform disc has sigma = R/2, and 1080p is ×1.5).

## 0. The gap in one table

| Cue | Reference (539 frames, every 2 s, 20 videos) | Ours (56 test stills, `out/bridge/test`) | Gap |
|---|---|---|---|
| Background DOF | On in about 1/3 of shots. When on, background sigma720 is CU 4.2, MS 4.0, FS 2.7, WS 1.9 | Background sigma720 0.71-0.99. Excess over subject ≤ 0.71 (median 0.48) | **No visible DOF anywhere.** `DepthOfFieldEffect` caps the blur radius at `bokehScale` px (0.9-2.2 px) |
| Foreground blur | 20% of frames have a near foreground object, which is blurred to sigma720 3.7-7.8 | Almost no foreground objects. Tourist heads in b_200 are sharp (0.96) | Missing |
| Rack focus | None inside shots. Whole-frame blur pulses (sigma 3.6-5) of 0.3-1 s at some cuts | None | Transition-level only; see the motion report |
| Aerial perspective | Things at the skyline sit 40% closer to the horizon colour than near things (dA 0.41 vs 0.69). Darkest far pixels are lifted to 15% of the horizon colour | Far things are *further* from the horizon colour than near ones (0.80 vs 0.70). Dark floor 0.02 | **No haze.** `Fog(#cfe3f2, 90, 560)` hardly reaches the town (40-200 m) |
| Sky gradient (day) | Horizon/upper-sky luminance 1.28. Upper sky #5e93d9 (S 0.54), horizon #9fb6e6 (S 0.32) | 1.04. Upper #8cb6e7 (S 0.39), horizon #9abfe8 | Our upper sky is washed out and too flat |
| Sky (golden) | 1.55 (n = 3). Upper #9a7e7f mauve, horizon #ffd18a bright yellow-orange | 1.05. Upper #b5919f, horizon #cfa197 muddy pink | Orange and purple mix too early |
| Glow | Emissive sources only (moon, lamp, fire, sun): e-fold 14-21 px at 720p, +0.23-0.50 of (source − bg) next to the edge. White faces never glow: hot edges are *sharper* (0.38) than normal edges (0.52) | Nothing reaches the threshold. p99.9 luminance is 0.81 and the maximum is 0.85, so the bloom does nothing | Bloom is inert. There are no emissive sources and no pure whites |
| Camera height | Median 0.79 × character height. 82% eye level, 11% high, 3% low, 3% top-down | Median 0.80 × (1.6 m / 2.0 m), but 29% of shots are below 0.5 × | Slightly too many low shots |
| Headroom / horizon | Head top at y = 0.28 (CU), 0.35 (MS), 0.38 (FS), 0.50 (WS). Horizon at 0.45 | 0.33-0.41. Horizon 0.43-0.48 | OK |
| FOV | Not reliably measurable (see 4.4) | 34-46°, median 40 | No evidence to change |

Comparison sheets (reference on top, ours below):
- `depth/crops/sbs_dof.jpg`: DOF.
- `depth/crops/sbs_haze.jpg`: sky and haze, with swatches for upper sky, sky just above the skyline, and the colour of the first band below the skyline.
- `depth/crops/glow_sources_ref.jpg`: glow around the moon, a lamp, a fireball and the sun.
- `depth/crops/boxes_ref_1..6.jpg` and `boxes_ours_1..3.jpg`: every measured box with its sigma.
- `depth/crops/r04_t6_blurmap.jpg` and `blurviz_A.jpg`: per-edge blur maps.
- `depth/crops/z_*.png`: 2x zooms of blurred reference backgrounds and foregrounds.
- `depth/crops/rack_strip.jpg`: the rack-focus candidates.

---

## 1. Depth of field

### 1.1 Method
- **Edge-spread fit.** At every strong edge, a profile across the edge is fitted with `a + b·Φ((t−t0)/σ) + c·t` using batched Levenberg-Marquardt.
  - Fits are kept only if the relative RMS ≤ 0.07.
  - Detection runs at scales 1, 2 and 4 so that very soft edges are still found.
  - The method was validated on synthetic edges with sigma 0.6-16.
- **Caption mask.** The caption band (white word with a black outline, 55-86% of frame height) is masked out before any statistics.
- **Frame statistics.** Per frame, 40 px tiles take the 30th percentile of their edges. "Above head" is the median tile value above the labelled head top. Shot labels (type, head top/feet, horizon, camera height, foreground, background distance, dutch) were assigned by hand for all 539 frames (`data/labels.csv`).
- **Curated boxes.** On 47 reference frames and 22 of our stills, subject (S), background (B) and foreground (F) boxes were measured with dense sampling (`data/box_stats_ref.csv`, `data/box_stats_ours.csv`).

Scripts: `scripts/blurlib.py`, `batch_blur.py`, `analyze_ref.py`, `box_measure.py`.

### 1.2 How often and how strong (all 530 non-transition frames)

| Type | n | Share with DOF on (bg sigma720 > 1.2) | bg sigma720 when on, median (IQR) | R @1080p | Share > 1.0 overall |
|---|---|---|---|---|---|
| CU | 12 | 42% | 4.2 (2.8-4.4) | ~12.5 px | 58% |
| MS | 121 | 21% | 4.0 (1.9-4.9) | ~12 px | 29% |
| FS | 131 | 18% | 2.7 (2.0-3.4) | ~8 px | 23% |
| WS | 55 | 24% | 1.9 (1.4-2.5) | ~5.7 px | 25% |
| Inserts (tile p80) | 117 | 46% | 2.8 | ~8.3 px | — |
| **All** | 530 | — | above-head median 0.57 (IQR 0.38-1.07, p90 2.75) | — | 27% |

**Sharp baseline.** The 10th percentile of edge sigma per frame is 0.33 (IQR 0.30-0.37). Reference line work is crisp, so blur is a deliberate per-shot choice.

**Per video.** The above-head median ranges from 0.38 (videos 09 and 10, 0-5% of frames blurred) to 2.12 (video 04, 64% blurred).

**DOF is not a fixed lens.** In FS with a far background, the median is only 0.62 (20% > 1.0, 0% > 2.0). In MS with a near wall it is 0.60 (30% > 1.0). DOF is switched on for chosen beats, mostly intimate CU/MS moments, inserts and foreground-framed shots, and switched off for establishing and most full shots.

### 1.3 Measured examples (sigma720, p30 of each box)

| Frame | Type | Subject | Background | Foreground |
|---|---|---|---|---|
| 05_f2010 | MS | 0.30 | 6.97 (photo wall behind) | — |
| 13_f0930 | CU | 0.34 | 5.33 (forest, also hazed) | — |
| 05_f2250 | MS | — | 4.92 | — |
| 08_f0210 | MS over-the-shoulder | 0.36 | 4.53 | 3.71 (head in front) |
| 11_f0150 / 03_f0810 | MS | sharp | 3.16 / 2.76 | — |
| 03_f0930 / 04_f0210 / 04_f0390 / 04_f0330 | FS | ~0.35 | 2.80 / 2.54 / 2.35 / 1.85-2.74 | ground 10.8 (04_f0210) |
| 17_f0270 | MS | 0.44 | 1.77 | **7.79** (slot machines in front) |
| 16_f0990 | MS | 0.29 | 0.32 (sharp booth) | **5.52** (cat in front) |
| 14_f0030 / 01_f0210 / 07_f0750 | FS | sharp | 0.99 / 0.96 / 0.75 | — |
| 16_f0150 / 14_f0390 | WS | sharp | 1.27 / 0.74 | — |
| 10_f1650 | CU | 3.26 | 3.42 | focus on a foreground key |
| 01_f0570 | FS | 1.81 (near character) | focus on the far ship | — |

Ours (all 21 stills with S+B):
- Subject 0.60-1.02 (median 0.76).
- Background 0.71-0.99 (median 0.89).
- Excess background blur sqrt(B² − S²) has a median of 0.48 and a maximum of 0.71.
- Only foreground: b_200 tourist heads at 0.96.
- Our stills are half resolution, so their absolute sharpness is not comparable. The B−S difference is the fair measure, and it is about zero.

### 1.4 How blur grows behind the subject
- **Thin-lens shape with saturation.** CoC(d) = C∞·|1 − F/d| fits the reference.
  - Crowd 03_f1830: heads of diameter 200 → 135 → 110 → 70 px (distance ratio 1 → 1.5 → 1.8 → 2.9) have sigma 0.33 → 0.33 → 1.14-1.31 → 1.55.
  - Thin lens with C∞ = 2.4 sigma predicts 0, 0.8, 1.07 and 1.58.
- **Saturation.** In the western street (04 at 6 s), every building from mid to far distance sits at sigma 1.85-2.0. Blur reaches its limit within about 3× the focus distance and then stays flat.
- **Near walls.** A wall about 1 m behind a character is blurred much less than the sky or town in the same kind of shot. This follows from thin-lens geometry and does not need a separate rule.

### 1.5 Rack focus
Three candidate windows were checked frame by frame (`scripts/rack.py`, `crops/rack_strip.jpg`, 6 horizontal bands per frame):
- 04 frames 100-220.
- 10 frames 1600-1700.
- 01 frames 540-620.

**No focus pulls inside shots were found.**

- In 04, a new shot starts with the whole frame at sigma 3.6 for 0.8 s, then 1.8 for 1.1 s, then a whip pan.
- In 10, a push-in blurs the whole frame to sigma 4-5 for 0.8 s, then cuts to sharp.

These are transition blurs (motion report), not DOF.

### 1.6 Why ours shows nothing (code)
postprocessing 6.37.2 `DepthOfFieldEffect` works like this:
- CoC = `smoothstep(0, focusRange, |d − F|)` in world units.
- Bokeh is a 64-tap Vogel disc of radius `coc × bokehScale × texelSize`, and the bokeh materials are sized to the **full** 1080x1920 buffer.
- So the maximum disc radius is `bokehScale` px.
- Our 2.2 / 1.5 / 0.9 px gives sigma720 ≈ 0.7 / 0.5 / 0.3, which is below the baseline.

Raising `bokehScale` to the 8-20 px we need has three problems:
- 64 taps spread over a 20 px disc look grainy.
- The far buffer is premultiplied by CoC without renormalising, which risks dark halos around the subject.
- The smoothstep CoC under-blurs foreground objects. At d = F/2 it gives 0.16 where the thin lens gives 1.0.

**Replace it with a thin-lens gather effect (recipe 6.1).**

---

## 2. Atmosphere

### 2.1 Method
`scripts/atmos.py` writes `data/atmos_ref.csv` and `data/atmos_ours.csv`.

- **Sky mask.** The sky is the smooth (|∇L| < 0.01/px), bright (L > 0.35) region connected to the top edge.
- **Skyline.** The median of the lowest sky pixel per column.
- **Sky colours.**
  - "Upper" is the median colour of the top 15% of the visible sky.
  - "Low" is the band just above the skyline (the airlight A).
- **Haze below the skyline**, in 5 bands (0-4, 4-10, 10-20, 20-35, 35-100% of frame height below it):
  - **Dark floor:** p10 of the normalised dark channel minfilter(min_c I_c/A_c). 0 means full-strength ink or shadow; 1 means everything is lifted to the horizon colour.
  - **dA:** the RGB distance from the band's median colour to A.
- Reference frames are restricted to the 40 exteriors with a labelled horizon. All 43 of our stills that contain sky are used.

### 2.2 Results

| Metric | Ref day (n 37) | Ours day (n 30) | Ref golden (n 3) | Ours golden (n 13) |
|---|---|---|---|---|
| Upper sky | **#5e93d9**, L 0.53, S 0.54 | #8cb6e7, L 0.69, S 0.39 | **#9a7e7f**, L 0.55 | #b5919f, L 0.60 |
| Sky above skyline | **#9fb6e6**, L 0.72, S 0.32 | #9abfe8, L 0.73, S 0.34 | **#ffd18a**, L 0.84 | #cfa197, L 0.67 |
| Low/upper luminance | **1.28** (1.18-1.40) | 1.04 (1.01-1.05) | **1.55** (1.49-1.87) | 1.05 |
| Dark floor just below skyline | 0.15 (0-0.24) | 0.02 | 0.12 | 0.00 |
| dA: far band → near band | **0.41 → 0.69** | 0.80 → 0.70 | 0.60 → 0.78 | 0.77 → 0.82 |
| Band colour just below skyline | #b2b0a1 (pale grey-beige) | #7c4d4b (dark brick red) | #be755f | #87270b |

### 2.3 What this means
- **Day, reference.** Skyline objects are blended about 40% toward the horizon colour (k ≈ 1 − 0.41/0.69). Their ink and shadows lift by about 15%. Near objects keep full colour.
- **Ours.** Our skyline town (40-180 m away) is darker and more saturated than the foreground.
- **Why our fog does nothing.** Fog 90 → 560 is 0 at 70 m, 0.085 at 130 m and 0.19 at 180 m. Its colour #cfe3f2 is also a pale cyan that does not match our horizon.
- **Sky gradient.** The reference keeps a pale horizon and reaches a deep, saturated blue within about 20° elevation. Our shader `mix(hor, top, pow(h, 0.55))` (h = sin(elevation)) hits about 50% at the top of a 40° frame, so the whole visible sky looks the same pale blue.
- **Golden.** Our sky is muddy because the orange horizon is already 30-40% mixed with the purple-blue top at the skyline.

---

## 3. Bloom and glow

### 3.1 Method
`scripts/bloom.py`, `scripts/glow_crops.py`, `scripts/sim_bloom.py`.

**(a) Edge widths.** ESF sigma of edges whose bright side is hot (local max L ≥ 0.95) vs normal edges (0.45-0.85), per frame.
- Reference: hot 0.38, normal 0.52. Per frame hot/normal = 0.80; only 2% of frames are above 1.5.
- **White surfaces (heads, eyes, walls, white clouds) do not bloom.** Their edges are the crispest in the frame.
- Ours: 1.01. No hot pixels exist at all.

**(b) Emissive sources** (`crops/glow_sources_ref.jpg`). The radial profile from the centroid of the L ≥ 0.85 blob. "Excess" = (L − bg)/(L_src − bg).

| Source | Disc r0 (px720) | Excess at r0+4 | r0+10 | r0+20 | r0+40 | e-fold (px720) |
|---|---|---|---|---|---|---|
| Moon, 11_f1350 | 38 | 0.37 | 0.32 | 0.22 | 0.10 | 19.6 |
| Moon, 11_f1050 | 40 | 0.23 | 0.21 | 0.15 | 0.05 | 18.0 |
| Ceiling lamp, 05_f0210 | 42 | 0.46 | 0.38 | 0.30 | 0.14 | 20.9 |
| Fireball, 12_f0930 | 36 | 0.42 | 0.23 | — | 0.05 | 14.4 |
| Sun, 11_f0930 | 58 | 0.50 | 0.49 | 0.41 | 0.11 | 19.7 |

**Target glow.** A broad, flat halo:
- excess 0.25-0.5 right at the edge;
- still 0.15-0.4 at +20 px (720p);
- e-fold 14-21 px at 720p, which is **21-31 px at 1080p** (about 1.5% of frame height).
- The sun scene washes 7% of the frame to L ≥ 0.93.

**Peak white.**
- Reference: p99.9 luminance 0.99, and the maximum is 1.0 in nearly every frame.
- Ours: p99.9 0.81, maximum 0.85 (p90 of frames: 0.97).
- Nothing in our frames crosses `luminanceThreshold 0.86`. This is a grade/exposure issue for the colour report, but it is the reason our bloom is invisible.

### 3.2 Calibrating the mipmap bloom (numpy port of MipmapBlurPass)
The port uses the same 13-tap downsample (inner 4 at 0.125, outer 9 at 1/18), the 9-tap tent upsample, and `mix(down[i], up, radius)`. Output is at half resolution. g(d) is the glow d px (1080p) outside a 60 px source of unit masked value.

| levels | radius | g(4) | g(20) | g(60) | g(150) | e-fold (px1080) |
|---|---|---|---|---|---|---|
| 8 (our current) | 0.85 | 0.14 | 0.049 | 0.017 | 0.0067 | 40 (long thin tail) |
| 6 | 0.5 | 0.13 | 0.022 | 0.004 | 0.0004 | 24.5 |
| **6** | **0.6** | ~0.15 | ~0.04 | ~0.011 | ~0.001 | **~30** |
| 6 | 0.7 | 0.18 | 0.057 | 0.019 | 0.002 | 35 |
| 5 | 0.85 | 0.26 | 0.124 | 0.022 | 0.00001 | 21 |

- **levels 6, radius 0.6** matches the reference e-fold.
- The reference halo is flatter near the source than any mip kernel. For the few big sources, add an additive glow sprite (recipe 6.4).
- Small sparks (r0 6 px) get only g(4) ≈ 0.045, so they need a much higher HDR value.

---

## 4. Composition

From `data/labels.csv` (530 frames) and our CAMS (`story.ts`, character card height 2.0-2.1 m with `SU = 0.00216`).

### 4.1 Shot mix and framing (reference)

| Type | Share | Head-top y (IQR) | Visible character height | Feet y | Foreground object |
|---|---|---|---|---|---|
| CU | 3% | 0.28 (0.21-0.35) | 0.65 | cut | 39% |
| MS | 27% | 0.35 (0.25-0.38) | 0.50 | cut at ~0.80 | 38% (s 46, b 9) |
| FS | 28% | 0.38 (0.35-0.42) | 0.35 (0.27-0.45) | 0.75 | 16% |
| WS | 12% | 0.50 (0.42-0.55) | 0.15 | 0.64 | 16% |
| EWS | 8% | 0.51 | 0.10 | 0.59 | 5% |
| Inserts | 22% | — | — | — | 9% |

Other reference framing numbers:
- **Horizon** (FS/WS/EWS): y = 0.45 (IQR 0.39-0.50).
- **Background distance:** near wall 58%, mid 23%, far 20%.
- **Dutch tilt:** 2% (11 of 530).
- **Placement:** characters sit in the middle of the vertical frame, with the caption over their lower body.

### 4.2 Camera height
**Reference.**
- Labels: eye level 82%, high 11%, low 3.4%, top-down 3.2%.
- From horizon geometry (34 FS/WS/EWS frames, level camera): camera height = (feet − horizon)/(feet − head) = **0.79 × character height**, IQR 0.67-1.00.
- 10% of these frames are below 0.5×. High shots run 1.5-1.9×.

**Ours (CAMS).**
- Height above the deck: median 1.6 m = **0.80 ×** (matches).
- But 29% of shots are below 0.5× (≤ 1.0 m):
  - f48: 0.6 m
  - f88: 0.4 m
  - f353 and f440: 0.36 m
  - f823: 0.7 m
  - f1685: 0.8 m
- 47% are at 1.0-2.2 m. The rest are high shots and aerials.

### 4.3 Ours vs targets (from CAMS geometry; feet and head projected for a character at the look point)
- **Head top.** Our MS shots (f585/640/925/984) have the head top at 0.35-0.40 and a full-height equivalent of 0.74-0.77, which is the same as the reference MS. Our FS shots (f283, f768, f1729, f1857) have the head top at 0.29-0.41 and character height 0.32-0.41, matching the reference FS.
- **Horizon** 0.42-0.49 on level shots (matches).
- **Foreground objects:** essentially none (reference: 38% of MS and CU).
- **Inserts:** we have about 3 (anchor, snap, boots) vs 22% in the reference. This is out of scope here, but those shots carry most of the reference's DOF.

### 4.4 FOV
- I tried vanishing points: straight segments, RANSAC, then f² = −(v1−c)·(v2−c).
- It failed validation on our own stills: on c_1800 it estimated 25° against a true 42°.
- On reference frames it gave inconsistent values (1-73°), because stylised architecture is rarely orthogonal and many segments sit on frame edges.
- The ground-plane cues (horizon vs feet vs character size) cancel the focal length.
- Character sizes and positions at our distances already match the reference at fov 36-44.
- **Recommendation: keep fov 34-46; there is no measurable reason to change it.**

---

## 5. Gaps ranked by visual impact (top 5)

1. **DOF on chosen shots.**
   - Ours: zero. Reference: about 1/3 of shots.
   - Use a thin-lens gather effect: C∞ 12-14 px (CU/MS/inserts), 8 (FS when used), 5 (WS when used); foreground 15-24 px.
   - Focus on the subject's eyes.
2. **Aerial perspective.**
   - Fog colour = horizon colour; linear fog 25 → 420 m (day) and 20 → 360 m (golden).
   - The skyline town is then pulled 20-40% toward the horizon, and the ink is fog-tinted.
   - This takes our skyline from #7c4d4b-dark to the reference's pale grey-beige.
3. **Sky gradient.**
   - Deep upper blue #5e93d9 at about 20° elevation, pale horizon (luminance ratio 1.28).
   - Golden: bright #ffd08a horizon that holds to about 3°, then mauve/indigo.
4. **Foreground framing objects in about 1/3 of MS/CU.**
   - Rail post, chain link, flag, a spectator's shoulder or hat, at 0.3-0.5 × the focus distance and covering 10-25% of a frame edge.
   - The new DOF blurs them to the reference's 4-8 sigma720.
5. **Glow only on emissive sources and real whites.**
   - Bloom: threshold 1.0, levels 6, radius 0.6, intensity 0.5.
   - Emissive HDR ×3 (sun, lamps, fire), ×8 for sparks.
   - Faces stay crisp.
   - Pair with the colour report's exposure fix so white heads and clouds reach 0.97-1.0.
   - Minor: raise f48 and f823 to about 1.4 m so fewer than 15% of shots are low-angle.

---

## 6. Recipe (our stack: three 0.175, postprocessing 6.37.2, @react-three/postprocessing 3.0.4)

### 6.1 New file `src/videos/bridge/lensblur.ts`: thin-lens DOF, single gather pass
- `@react-three/postprocessing` 3.0.4 puts any `CONVOLUTION` effect into its own `EffectPass` automatically, so `<primitive object={fx.lens} />` can replace `fx.dof` in place (after ink, before bloom).
- `getViewZ`, `readDepth`, `texelSize` and `inputBuffer` are provided by `EffectPass`, as `ink.ts` already relies on.

```ts
// Thin-lens depth of field in one gather pass (scatter-as-gather), for the reference's soft backgrounds.
// CoC radius in output px = cInf * |1 - focus / depth| (near side x nearScale), clamped to maxCoC.
// Pass 1 gathers the pixel's own disc; samples farther than the pixel may not spread over it (keeps the subject's
// silhouette clean). Pass 2 lets a blurred foreground spread over sharper pixels behind it.
import { Effect, EffectAttribute, BlendFunction } from "postprocessing";
import { Uniform } from "three";

const frag = /* glsl */ `
uniform float focus;      // focus distance along the view axis (m)
uniform float cInf;       // blur-disc radius (px, output res) of things at infinity; 0 = off
uniform float nearScale;  // extra blur for things in front of the focus plane
uniform float maxCoC;     // px
#define TAPS 64
#define NEAR_TAPS 32
#define GOLDEN 2.39996323

float cocAt(float d) {
  float c = cInf * (1.0 - focus / max(d, 1e-3));
  if (c < 0.0) c *= nearScale;
  return clamp(c, -maxCoC, maxCoC);
}
float distAt(vec2 uv) { return -getViewZ(readDepth(uv)); }
float hash12(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  if (cInf < 0.25) { outputColor = inputColor; return; }
  float d0 = -getViewZ(depth);
  float r0 = abs(cocAt(d0));
  float rot = hash12(gl_FragCoord.xy) * 6.2831853;   // fixed per pixel: no frame-to-frame shimmer
  vec3 acc = inputColor.rgb; float wsum = 1.0;
  if (r0 > 0.5) {
    for (int i = 0; i < TAPS; i++) {
      float rr = sqrt((float(i) + 0.5) / float(TAPS)) * r0;
      float a = float(i) * GOLDEN + rot;
      vec2 suv = uv + vec2(cos(a), sin(a)) * rr * texelSize;
      float ds = distAt(suv);
      float rs = abs(cocAt(ds));
      if (ds > d0) rs = min(rs, r0);                // background never bleeds over a nearer pixel
      float w = clamp(rs - rr + 0.5, 0.0, 1.0);      // does the sample's disc reach us?
      acc += texture2D(inputBuffer, suv).rgb * w; wsum += w;
    }
  }
  vec3 col = acc / wsum;
  vec3 fg = vec3(0.0); float fw = 0.0, cov = 0.0;
  for (int i = 0; i < NEAR_TAPS; i++) {
    float rr = sqrt((float(i) + 0.5) / float(NEAR_TAPS)) * maxCoC;
    if (rr <= r0) continue;                          // already covered by pass 1
    float a = float(i) * GOLDEN + rot + 1.0;
    vec2 suv = uv + vec2(cos(a), sin(a)) * rr * texelSize;
    float ds = distAt(suv);
    if (ds >= d0 * 0.97) continue;                   // only things in front of us
    float rs = abs(cocAt(ds));
    float w = clamp(rs - rr + 0.5, 0.0, 1.0);
    fg += texture2D(inputBuffer, suv).rgb * w; fw += w;
    cov += w * (maxCoC * maxCoC) / max(rs * rs, 1.0);
  }
  if (fw > 0.0) col = mix(col, fg / fw, clamp(cov / float(NEAR_TAPS), 0.0, 1.0));
  outputColor = vec4(col, inputColor.a);
}`;

export class LensBlurEffect extends Effect {
  constructor({ maxCoC = 24, nearScale = 1.2 } = {}) {
    super("LensBlurEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.DEPTH | EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["focus", new Uniform(10)], ["cInf", new Uniform(0)],
        ["nearScale", new Uniform(nearScale)], ["maxCoC", new Uniform(maxCoC)],
      ]),
    });
  }
  set focus(v: number) { this.uniforms.get("focus")!.value = v; }
  set cInf(v: number) { this.uniforms.get("cInf")!.value = v; }
}
```

**Cost.** About 96 taps × 2 fetches per pixel at 1080x1920. This is fine on the ANGLE GPU path.

**Sky.** Depth 1.0 means the far plane (1500 m), so the sky and clouds get the full `cInf`, which matches the soft clouds in reference DOF shots.

**Fallback if you only want a quick test with the built-in effect:**
`new DepthOfFieldEffect(camera, { resolutionScale: 1 })`, `worldFocusRange = 2 * focus`, `bokehScale = cInf`. This approximates the far side of the thin lens but under-blurs foreground objects. Expect grain and dark rims above 8 px.

### 6.2 `Bridge.tsx` (replaces the `dof` lines)

```ts
import { LensBlurEffect } from "./lensblur";
import { dofAt } from "./story";
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();   // module scope

const fx = useMemo(() => ({
  ink: new InkEffect(),
  lens: new LensBlurEffect({ maxCoC: 24, nearScale: 1.2 }),
  bloom: new BloomEffect({ intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 }),
  tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
}), []);
// <primitive object={fx.lens} dispose={null} />  in place of fx.dof

// per frame, after target.copy(world.update(id, f, cam, scene)):
const d = dofAt(f);
cam.getWorldDirection(fwd);
if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));   // view-axis distance, not Euclidean
fx.lens.cInf = d.cInf;
```

### 6.3 `story.ts`: a DOF table next to CAMS (same `f`/`dur` as the camera entries, so blur ramps with camera moves)

```ts
/** Lens blur per shot (thin lens). cInf = blur-disc radius in px at 1080x1920 for things at infinity; 0 = all sharp.
 *  Reference: DOF on in ~1/3 of shots; when on, background sigma720 CU 4.2, MS 4.0, FS 2.7, WS 1.9,
 *  foreground objects 4-8 (disc radius at 1080p = 3 x sigma720). Establishing/wide/most full shots stay sharp. */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyes = (id: number) => (f: number): V3 => [0, D0 + 1.6, Fz(id, f)];
const boots = (id: number) => (f: number): V3 => [0, D0 + 0.3, Fz(id, f)];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },                                   // establishing
  { f: 88, dur: 9, cInf: 12, focus: eyes(1) },          // low MS, front soldier
  { f: 126, cInf: 0 },                                  // aerial wides, FS
  { f: 353, dur: 10, cInf: 16, focus: boots(3) },       // boots CU
  { f: 440, cInf: 16, focus: boots(4) },
  { f: 444, dur: 13, cInf: 0 },                         // side WS / FS
  { f: 534, dur: 13, cInf: 10, focus: eyes(5) },        // MS
  { f: 585, dur: 10, cInf: 12, focus: eyes(5) },
  { f: 640, cInf: 12, focus: eyes(6) },
  { f: 643, dur: 11, cInf: 14 },                        // CU, focus = look (the face)
  { f: 717, dur: 12, cInf: 0 },                         // high WS, FS, low WS
  { f: 871, dur: 11, cInf: 8 },                         // high MS, focus = look
  { f: 925, dur: 11, cInf: 12, focus: eyes(7) },        // MS
  { f: 984, cInf: 12, focus: eyes(8) },
  { f: 987, dur: 12, cInf: 14 },                        // anchor insert, focus = look
  { f: 1039, dur: 8, cInf: 10 },                        // snap insert
  { f: 1062, dur: 18, cInf: 0 },                        // aerial, river, park, bank FS
  { f: 1770, dur: 12, cInf: 10 },                       // officer MS, focus = look
  { f: 1857, cInf: 0 },
  { f: 1905, dur: 10, cInf: 10 },                       // MS
  { f: 1962, dur: 24, cInf: 0 },                        // closing aerial
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
```

**Notes on the DOF table.**
- **Coverage.** These values put DOF on about 35% of screen time: CU/MS beats, inserts and the boots shot. That matches the reference share.
- **Fallback.** If a shot reads too soft, halve `cInf` before turning it off. Reference "on" shots never go below sigma720 1.2 (about 4 px radius).
- **Foreground objects.** For the reference's foreground framing, place an object at 0.3-0.5 × the focus distance in DOF shots. With nearScale 1.2 it lands at 15-24 px, the same as the reference's 4-8 sigma720.

### 6.4 Bloom: glow only where light is emitted
- **Bloom settings.**
  - `luminanceThreshold 1.0`: no lit surface crosses it, so white heads stay crisp as in the reference.
  - `luminanceSmoothing 0.2`, `intensity 0.5`, `mipmapBlur true`, `levels 6`, `radius 0.6`.
  - This gives an e-fold of about 30 px at 1080p, the reference's 14-21 px at 720p.
  - The current `levels 8 / radius 0.85` makes a thin, long, frame-wide veil instead.
- **Emissive sources.**
  - Use HDR colours (the composer buffer is half-float, and r3f-postprocessing turns renderer tone mapping off).
  - Big sources: `new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.6, 2.0) })` for the sun disc (golden shots), lanterns and fire.
  - Sparks: `(8, 6, 3)`, for example where the bolt snaps.
  - Expected excess next to a big source: 3 × 0.5 × g(4 px) ≈ 0.22 linear, which is the reference's +0.25-0.5 of (source − bg).
- **Big sources (sun, lamp): add a flat halo sprite** to match the reference's flat glow:
  - additive `Sprite` of radius 2.2 × the source radius;
  - texture alpha = 0.35 × exp(−(r/(1.1·r_src))²);
  - `blending: THREE.AdditiveBlending`, `depthWrite: false`, `fog: false`.
- **Exposure (colour report).** Whites must reach 0.97-1.0, as in the reference (p99.9 0.99). Ours peak at 0.85.

### 6.5 Fog and sky (`world.ts` + the `LIGHTS` table)
**LIGHTS table.**

```ts
// LIGHTS (where top / hor / fog live)
day:    { /* … */ top: "#4284d3", hor: "#c9cdee", skyCurve: [0.0, 0.5, 0.6],  fog: "#b0c0e8", fogNear: 25, fogFar: 420 },
golden: { /* … */ top: "#443876", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#f4c68c", fogNear: 20, fogFar: 360 },
```

**Sky shader** (constructor; `h` = sin(elevation)).

```ts
uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, curve: { value: new THREE.Vector3(0, 0.5, 0.6) } },
fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 curve; varying vec3 vP;
  void main(){ float h = clamp(vP.y, 0.0, 1.0);
    float k = pow(clamp((h - curve.x) / (curve.y - curve.x), 0.0, 1.0), curve.z);
    gl_FragColor = vec4(mix(hor, top, k), 1.0); }`,
```

**`update()`.**

```ts
this.skyMat.uniforms.curve.value.set(...L.skyCurve);
this.fog.color.set(L.fog); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
```

**Check of the sky values.**
- Day: at 4° elevation the sky is #a0b7e6, and at 20° it is #5e93d9. Both match the reference.
- Golden: it stays #ffd08a up to 3°, and is #9c807f at 20° (reference #9a7e7f).
- NEUTRAL tone mapping compresses linear values above 0.76, so check one still per light.

**What the new fog does.**

| Distance | Fog amount |
|---|---|
| Soldiers (≤ 15 m) | 0 |
| Far tower (~57 m) | 0.08 |
| Far-bank riverfront (70 m) | 0.11 |
| Back rows (100-140 m) | 0.19-0.29 |
| Main street (180 m) | 0.39 |
| Aerial shots of the town (250 m) | 0.57 |

**Fog-tinted ink (`ink.ts`, coordinate with the ink report).** The reference lifts far ink by about 15%. Add `fogColor`, `fogNear` and `fogFar` uniforms and replace `ink` in the final mix:

```glsl
float fogK = clamp((dist - fogNear) / (fogFar - fogNear), 0.0, 1.0);
vec3 inkC = mix(ink, fogColor, fogK * 0.6);
outputColor = vec4(mix(inputColor.rgb, inkC, k), inputColor.a);
```

Also raise `farFade` to about 600, so far outlines haze out instead of vanishing at 260 m.

### 6.6 Composition rules for CAMS
- **Keep:**
  - head top at y ≈ 0.28 (CU), 0.35 (MS), 0.38 (FS), 0.50 (WS);
  - horizon at 0.40-0.50;
  - fov 34-46.
- **Camera height.**
  - Default: 0.7-1.0 × character height = **1.4-2.0 m above the deck** (reference median 0.79×).
  - Keep the deliberately low beats (boots f353/440, f88).
  - Raise f48 (0.6 → 1.4 m) and f823 (0.7 → 1.4 m). That brings low shots (below 0.5×) from 29% to about 15%. The reference has 3% labelled low and 10% below 0.5×.
- **Foreground framing.** In about 1/3 of MS/CU (for example f534, f585, f925, f1770), put a near object at 0.3-0.5 × the focus distance covering 10-25% of a frame edge. Reference: 38% of MS/CU, blurred to sigma720 4-8.
- **Dutch tilt.** The reference uses it in 2% of frames. Keep our rolls ≤ 0.05 rad and use them on at most 2-3 shots.
- **No focus pulls inside shots.** Change DOF only at cuts, or ramp it with camera moves (the `dur` in the table).

---

## 7. Files

**Report:** `references/reports/depth.md`

**Data** (`references/depth/data/`):
- `labels.csv`: 539 labelled frames.
- `frame_stats.csv`: per-frame DOF statistics.
- `edges/*.npy`: per-edge fits.
- `box_stats_ref.csv`, `box_stats_ours.csv`: curated boxes.
- `atmos_ref.csv`, `atmos_ours.csv`.
- `bloom_ref.csv`, `bloom_ours.csv`.
- `dense/`: dense per-frame fits.

**Scripts** (`references/depth/scripts/`):
- `blurlib.py`: ESF fit and caption mask.
- `batch_blur.py`, `analyze_ref.py`, `box_measure.py`.
- `rack.py`, `atmos.py`, `bloom.py`, `glow_crops.py`.
- `sim_bloom.py`: numpy MipmapBlurPass.
- `vp_fov.py`: the failed FOV attempt, kept for the record.
- `sbs.py`: comparison sheets.

**Crops** (`references/depth/crops/`):
- `sbs_dof.jpg`, `sbs_haze.jpg`, `glow_sources_ref.jpg`, `glow_top.jpg`, `rack_strip.jpg`.
- `boxes_ref_1..6.jpg`, `boxes_ours_1..3.jpg`, `r04_t6_blurmap.jpg`, `blurviz_A.jpg`, `z_*.png`.

**Caveats.**
- Our stills are half-resolution JPEG test renders, so compare blur *differences* (background vs subject), not absolute sharpness.
- Golden-hour reference n = 3.
- Bloom calibration is a CPU port of the shader. Verify on one emissive still.
- Nothing was rendered and nothing under `your Remotion project` was edited.
