# Grade: colour and tone, reference vs ours

Folder: `references/grade/`. Scripts are in `scripts/`, data in `data/`, images in `out/`.

All reference material stays private and local. No stills were rendered and nothing under `your Remotion project` was edited; the stills were only read.

## 0. The gap in plain words

Compared with the reference day frames, our day frames have four problems:

- **Too dark in the mids and top.**
  - Median Y' is 0.436 against 0.571.
  - p99 is 0.783 against 0.967, so we have no near-whites.
- **Big pure-black areas.**
  - Non-ink p5 is 0.026 against 0.234.
  - The reference has no black areas; its darks are coloured and lifted.
- **Low-chroma lit surfaces.** Lit C* p50 is 23 against 34, and p90 is 37 against 55.
- **No vignette.** Our corners are brighter than the centre at 1.46, against the reference's 0.86 darkening.

Two more gaps:

- **Black point.** Reference blacks are warm-lifted, with a black point of (35,19,20). Ours is blue-black, (2,0,13).
- **Golden.** Ours is much darker (median 0.33 against 0.52) and over-saturated orange (HSV S p50 .71 against .45). Its shadows are brown (dark-zone b* +11), where the reference's are violet (b* −6). It is also missing the reference's roughly 25 % share of violet, blue, magenta and rose hues.

A grade fixes the tone curve, blacks, overall saturation, cast and vignette. It cannot fix pastel or dark albedo, brown or black cast shadows, or missing hue families. See section 6.

## 1. Method

- **Frames.**
  - Reference: every 15th frame of all 20 videos, 2164 frames.
  - Decoding: ffmpeg `scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int`, then area-scaled to 540x960. That is the same grid as our stills; the default ffmpeg conversion was 1 level off, so it was replaced.
  - Ours: 39 stills in `your Remotion project/out/bridge/test`, b_*/c_*: 28 day, 9 golden (shots 11-13), plus the 2 dark bolt close-ups c_1000 and c_1036.
- **Luma.** Y' = 0.2126 R' + 0.7152 G' + 0.0722 B' on sRGB-encoded 0..1 values. These are Rec.709 weights on encoded values, i.e. luma, not linear luminance.
- **Caption mask.** Caption text sits at rows 662-694 in 99.5 % of frames, at the same place in all videos. Full-width rows 650-706 are removed from every statistic, and local contrast also drops ±5 rows. No other overlay was found.
- **Ink mask.** Black top-hat (7x7 grey closing − Y' > 0.12) AND Y' < 0.30. "Non-ink" stats drop the ink dilated by 1 px.
- **Per-frame metrics** (`scripts/metrics.py`):
  - Y' p1/5/25/50/75/95/99, mean and std;
  - HSV S mean/p50/p90 over V > 0.15;
  - Hasler-Süsstrunk colourfulness;
  - local contrast = std(Y' − 9x9 box mean);
  - a saturation-weighted 12-bin hue histogram and Lab means per zone: shadows Y' < 0.3, mids, highlights Y' > 0.7;
  - black point = mean RGB of the darkest 0.5 %;
  - vignette = mean Y' in 10 normalised-radius bins (r = 1 at the corners), plus corner/centre (r ≥ 0.9 vs r < 0.3) and mid-row edge/centre;
  - lit chroma C*ab p50/p90 over L* 40-85 non-ink pixels.
- **Clusters.** Manual per-video range labels from timeline strips (`scripts/labels.py`, `out/strips/NN_lab.jpg`), with k-means only as an aid.

  | Label | Meaning | Frames |
  |---|---|---|
  | D | day exterior | 552 |
  | G | golden/sunset | 162 |
  | N | night | 352 |
  | I | interior | 835 |
  | X | excluded (graphics, documents, flashes, body-interior, scope) | 263 |

  Overview: `out/clusters_overview.jpg`.
- **Raw data.**
  - `data/ref_frames.csv`: every reference frame with its label.
  - `data/ours_frames_before.csv`.
  - `data/summary.json`: per-cluster aggregates.
  - `data/samples.npz`: pooled pixels.

## 2. Measured tables

Per-frame medians per cluster, then ours before and after the fitted grade. The "+grade" columns are our stills graded in numpy with exactly the shader maths (section 5), then re-measured with the same ink mask.

| per-frame median | ref day | ref golden | ref night | ref interior | ref all | OURS day now | OURS day +grade | OURS golden now | OURS golden +grade |
|---|---|---|---|---|---|---|---|---|---|
| frames | 552 | 162 | 352 | 835 | 1901 | 28 | 28 | 9 | 9 |
| Y' p1 | 0.134 | 0.124 | 0.068 | 0.084 | 0.095 | 0.012 | 0.051 | 0.016 | 0.056 |
| Y' p5 | 0.205 | 0.180 | 0.087 | 0.121 | 0.137 | 0.026 | 0.071 | 0.072 | 0.138 |
| Y' p25 | 0.417 | 0.356 | 0.150 | 0.257 | 0.278 | 0.253 | 0.366 | 0.212 | 0.324 |
| Y' p50 | 0.571 | 0.516 | 0.243 | 0.448 | 0.449 | 0.436 | 0.577 | 0.329 | 0.467 |
| Y' p75 | 0.706 | 0.668 | 0.366 | 0.607 | 0.618 | 0.554 | 0.696 | 0.459 | 0.631 |
| Y' p95 | 0.895 | 0.828 | 0.669 | 0.870 | 0.857 | 0.746 | 0.844 | 0.688 | 0.778 |
| Y' p99 | 0.967 | 0.912 | 0.817 | 0.942 | 0.943 | 0.783 | 0.886 | 0.812 | 0.818 |
| Y' mean | 0.558 | 0.508 | 0.295 | 0.460 | 0.474 | 0.415 | 0.533 | 0.358 | 0.473 |
| Y' std | 0.202 | 0.182 | 0.176 | 0.221 | 0.205 | 0.213 | 0.228 | 0.195 | 0.197 |
| non-ink Y' p5 | 0.234 | 0.211 | 0.088 | 0.129 | 0.151 | 0.026 | 0.071 | 0.090 | 0.166 |
| non-ink Y' p50 | 0.583 | 0.526 | 0.244 | 0.459 | 0.463 | 0.451 | 0.599 | 0.329 | 0.467 |
| HSV S mean | 0.439 | 0.459 | 0.586 | 0.436 | 0.465 | 0.455 | 0.450 | 0.649 | 0.452 |
| HSV S p50 | 0.429 | 0.448 | 0.611 | 0.422 | 0.467 | 0.373 | 0.345 | 0.714 | 0.458 |
| HSV S p90 | 0.737 | 0.671 | 0.840 | 0.764 | 0.762 | 0.843 | 0.844 | 0.969 | 0.655 |
| colourfulness (H-S) | 82.8 | 71.2 | 66.6 | 68.0 | 71.7 | 65.6 | 85.9 | 62.6 | 61.5 |
| C*ab lit p50 (L* 40-85) | 33.8 | 36.8 | 36.7 | 28.4 | 31.9 | 23.5 | 26.2 | 22.7 | 25.4 |
| C*ab lit p90 | 54.9 | 53.0 | 64.4 | 54.9 | 56.6 | 37.4 | 52.8 | 48.9 | 42.5 |
| local contrast (std 9x9 HP) | 0.072 | 0.051 | 0.048 | 0.066 | 0.062 | 0.063 | 0.072 | 0.035 | 0.042 |
| ink fraction | 0.026 | 0.019 | 0.018 | 0.025 | 0.023 | 0.048 | 0.048 | 0.015 | 0.015 |
| vignette corner/centre | 0.856 | 0.754 | 0.461 | 0.671 | 0.719 | 1.458 | 1.222 | 1.430 | 1.148 |
| vignette mid-edge/centre | 0.975 | 0.952 | 0.753 | 0.866 | 0.904 | 1.093 | 1.046 | 0.912 | 0.862 |

| zone (non-ink pixels) | ref day | ref golden | ref night | ref interior | ref all (D+G+N+I) | ours day | ours golden |
|---|---|---|---|---|---|---|---|
| shadows Y'<0.3 share | 0.17 | 0.20 | 0.61 | 0.36 | 0.34 | 0.34 | 0.45 |
| shadows Y'<0.3 mean a*/b* | +12.5 / -2.5 | +19.1 / -5.8 | +19.7 / -33.1 | +14.8 / -2.5 | +16.5 / -13.4 | +1.0 / -3.2 | +5.3 / +11.4 |
| shadows Y'<0.3 S-weighted hue (strength) | 331 deg (0.32) | 322 deg (0.54) | 239 deg (0.86) | 333 deg (0.42) | 277 deg (0.41) | 164 deg (0.19) | 43 deg (0.41) |
| mids share | 0.55 | 0.54 | 0.34 | 0.39 | 0.44 | 0.53 | 0.52 |
| mids mean a*/b* | +4.0 / +8.1 | +19.4 / +15.8 | +21.3 / -32.4 | +10.3 / +7.1 | +10.5 / +2.7 | +2.4 / +4.2 | +14.1 / +23.1 |
| mids S-weighted hue (strength) | 56 deg (0.20) | 14 deg (0.71) | 242 deg (0.66) | 17 deg (0.31) | 9 deg (0.18) | 53 deg (0.16) | 27 deg (0.95) |
| highlights Y'>0.7 share | 0.28 | 0.26 | 0.05 | 0.24 | 0.22 | 0.13 | 0.03 |
| highlights Y'>0.7 mean a*/b* | -0.5 / +6.2 | +12.3 / +23.3 | +6.0 / +1.6 | +2.8 / +13.1 | +2.7 / +11.1 | -2.2 / -11.6 | +11.5 / +21.6 |
| highlights Y'>0.7 S-weighted hue (strength) | 58 deg (0.27) | 25 deg (0.93) | 1 deg (0.26) | 36 deg (0.71) | 37 deg (0.55) | 207 deg (0.63) | 25 deg (1.00) |
| after grade: ours day / ours golden | sh a*/b* +11.2/+0.6 +16.8/-5.6, hue 349/311 | mid a*/b* +2.7/-3.2 +10.2/+12.8, hue 184/24 | hi a*/b* -2.6/-4.0 +14.4/+9.7, hue 193/8 |
| black point RGB (darkest 0.5 %) | 35,19,20 | 48,16,22 | 9,10,38 | 23,12,20 | 25,13,22 | 2,0,13 | 4,0,7 |
| darkest 0.5 % of non-ink area | 40,27,33 | 47,22,34 | 10,12,40 | 26,16,27 | 28,18,31 | 2,0,14 | 4,0,7 |
| white point RGB (brightest 0.5 %) | 254,251,246 | 254,240,220 | 242,230,236 | 253,246,239 | 253,247,240 | 230,206,218 | 240,201,170 |

| ref day hue histogram (S-weighted, %) | red 0 | orange 30 | yellow 60 | chartr. 90 | green 120 | spring 150 | cyan 180 | azure 210 | blue 240 | violet 270 | magenta 300 | rose 330 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sh | 25 | 26 | 1 | 1 | 1 | 0 | 5 | 13 | 17 | 3 | 3 | 6 |
| mid | 7 | 40 | 4 | 9 | 4 | 1 | 4 | 28 | 3 | 0 | 0 | 1 |
| hi | 1 | 50 | 8 | 2 | 1 | 1 | 5 | 29 | 2 | 0 | 0 | 0 |

| ours day hue histogram (S-weighted, %) | red 0 | orange 30 | yellow 60 | chartr. 90 | green 120 | spring 150 | cyan 180 | azure 210 | blue 240 | violet 270 | magenta 300 | rose 330 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sh | 8 | 26 | 3 | 0 | 2 | 15 | 13 | 29 | 3 | 0 | 0 | 2 |
| mid | 2 | 53 | 1 | 1 | 0 | 1 | 3 | 37 | 1 | 0 | 0 | 0 |
| hi | 0 | 17 | 0 | 0 | 0 | 4 | 2 | 76 | 0 | 0 | 0 | 0 |

| ref golden hue histogram (S-weighted, %) | red 0 | orange 30 | yellow 60 | chartr. 90 | green 120 | spring 150 | cyan 180 | azure 210 | blue 240 | violet 270 | magenta 300 | rose 330 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sh | 29 | 14 | 0 | 0 | 0 | 0 | 0 | 8 | 12 | 14 | 9 | 12 |
| mid | 21 | 49 | 7 | 2 | 0 | 0 | 1 | 2 | 6 | 2 | 4 | 5 |
| hi | 12 | 77 | 6 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 3 |

| ours golden hue histogram (S-weighted, %) | red 0 | orange 30 | yellow 60 | chartr. 90 | green 120 | spring 150 | cyan 180 | azure 210 | blue 240 | violet 270 | magenta 300 | rose 330 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sh | 8 | 45 | 5 | 14 | 1 | 1 | 1 | 24 | 0 | 0 | 1 | 0 |
| mid | 12 | 80 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 |
| hi | 0 | 100 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

| radial bin r | 0.0-0.1 | 0.1-0.2 | 0.2-0.3 | 0.3-0.4 | 0.4-0.5 | 0.5-0.6 | 0.6-0.7 | 0.7-0.8 | 0.8-0.9 | 0.9-1.0 |
|---|---|---|---|---|---|---|---|---|---|---|
| ref day | 1.00 | 1.00 | 1.00 | 1.02 | 1.01 | 1.00 | 0.97 | 0.95 | 0.90 | 0.86 |
| ref golden | 1.01 | 1.00 | 1.00 | 0.98 | 0.97 | 0.94 | 0.89 | 0.85 | 0.80 | 0.75 |
| ref night | 1.06 | 1.00 | 0.94 | 0.86 | 0.79 | 0.70 | 0.62 | 0.55 | 0.51 | 0.46 |
| ref interior | 1.03 | 1.00 | 0.97 | 0.94 | 0.90 | 0.85 | 0.80 | 0.77 | 0.71 | 0.67 |
| ref all (D+G+N+I) | 1.02 | 1.00 | 0.98 | 0.96 | 0.94 | 0.89 | 0.84 | 0.81 | 0.76 | 0.72 |
| ours day | 0.86 | 1.01 | 1.11 | 1.18 | 1.26 | 1.35 | 1.35 | 1.39 | 1.38 | 1.46 |
| ours golden | 1.03 | 1.00 | 1.02 | 1.04 | 1.06 | 1.24 | 1.29 | 1.39 | 1.47 | 1.43 |

### 2b. Per-video consistency (day frames)

Every video agrees on the direction:

- warm-rose dark zone, with a* positive in all 13 videos;
- lifted, warm black point;
- near-white tops, with p99 ≥ 0.94.

The size varies: median Y' runs 0.38-0.68, non-ink p5 0.09-0.38, and lit C* p50 18-53.

| video | D | G | N | I | X | day Y' p50 | day non-ink Y' p5 | day Y' p99 | day C*lit p50 / p90 | day colourf. | day corner/centre | day dark-zone a*/b* | day black pt RGB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | 54 | 0 | 56 | 19 | 1 | 0.39 | 0.09 | 1.00 | 53 / 77 | 99 | 0.65 | +13 / -2 | 16,4,9 |
| 02 | 64 | 11 | 0 | 50 | 4 | 0.51 | 0.27 | 0.96 | 37 / 53 | 77 | 0.77 | +8 / -4 | 26,13,19 |
| 03 | 69 | 5 | 20 | 5 | 32 | 0.59 | 0.23 | 0.95 | 26 / 64 | 67 | 0.93 | +8 / -0 | 25,14,18 |
| 04 | 63 | 11 | 10 | 26 | 3 | 0.51 | 0.19 | 0.95 | 32 / 59 | 86 | 0.90 | +13 / -6 | 38,24,38 |
| 05 | 22 | 0 | 90 | 33 | 11 | 0.65 | 0.29 | 0.94 | 33 / 52 | 88 | 0.88 | +10 / -9 | 37,18,10 |
| 06 | 0 | 0 | 0 | 87 | 40 | - | - | - | - | - | - | - | - |
| 07 | 12 | 31 | 46 | 23 | 7 | 0.38 | 0.21 | 0.98 | 49 / 75 | 100 | 0.98 | +24 / +6 | 18,10,19 |
| 08 | 0 | 4 | 12 | 89 | 11 | - | - | - | - | - | - | - | - |
| 09 | 0 | 0 | 6 | 112 | 3 | - | - | - | - | - | - | - | - |
| 10 | 12 | 0 | 24 | 73 | 8 | 0.61 | 0.25 | 0.96 | 35 / 73 | 91 | 0.90 | +10 / -0 | 58,32,28 |
| 11 | 14 | 30 | 26 | 60 | 0 | 0.68 | 0.29 | 0.97 | 18 / 36 | 58 | 0.83 | +23 / +5 | 49,29,34 |
| 12 | 78 | 33 | 0 | 5 | 11 | 0.57 | 0.27 | 0.95 | 32 / 43 | 87 | 0.99 | +9 / +1 | 34,20,20 |
| 13 | 63 | 4 | 3 | 0 | 12 | 0.48 | 0.22 | 0.98 | 42 / 59 | 93 | 0.84 | +15 / +14 | 44,23,24 |
| 14 | 51 | 3 | 6 | 30 | 0 | 0.65 | 0.35 | 0.98 | 27 / 41 | 69 | 0.79 | +14 / +14 | 52,32,28 |
| 15 | 0 | 0 | 0 | 12 | 57 | - | - | - | - | - | - | - | - |
| 16 | 0 | 0 | 53 | 38 | 0 | - | - | - | - | - | - | - | - |
| 17 | 0 | 0 | 0 | 38 | 24 | - | - | - | - | - | - | - | - |
| 18 | 40 | 6 | 0 | 21 | 13 | 0.56 | 0.19 | 0.99 | 48 / 73 | 90 | 0.96 | +9 / -8 | 31,16,15 |
| 19 | 10 | 24 | 0 | 54 | 7 | 0.66 | 0.38 | 0.96 | 21 / 36 | 67 | 0.81 | +8 / +1 | 48,31,25 |
| 20 | 0 | 0 | 0 | 60 | 19 | - | - | - | - | - | - | - | - |
| **all day** | 552 | 162 | 352 | 835 | 263 | 0.57 | 0.23 | 0.97 | 34 / 55 | 83 | 0.86 | +11 / +0 | 35,19,20 |
Y_p50 per-video day median range 0.38 - 0.68 over 13 videos
A_p5 per-video day median range 0.09 - 0.38 over 13 videos
C_lit_p50 per-video day median range 17.68 - 52.80 over 13 videos
colourfulness per-video day median range 58.31 - 99.51 over 13 videos

### 2c. Per-hue lit colour (pooled pixels; brightest 30 % of the S > 0.25 pixels in each 30° hue bin)

These are the albedo and lighting targets for section 6.

| hue (day) | ref share | ref lit colour (L*, C*) | ours share | ours now (L*, C*) | ours + grade (L*, C*) |
|---|---|---|---|---|---|
| red 0 | 9 % | #e85648 (56, 69) | 3 % | #983c22 (38, 52) | #c55c4f (51, 40) |
| orange 30 | 38 % | #e3b684 (77, 31) | 37 % | #b7906f (62, 23) | #daad89 (73, 24) |
| yellow 60 | 3 % | #d3c677 (80, 44) | 1 % | #6d6b3f (45, 20) | #e4d283 (84, 40) |
| chartreuse 90 | 7 % | #7cbb48 (70, 66) | 1 % | #6fb03a (66, 66) | #80d23e (77, 80) |
| green 120 | 3 % | #58af47 (65, 66) | 1 % | #246014 (36, 50) | #3b9f27 (58, 72) |
| spring 150 | 1 % | #93cdb6 (78, 24) | 6 % | #0e5c2e (34, 39) | #0b8550 (49, 48) |
| cyan 180 | 5 % | #6dc7ce (75, 28) | 7 % | #32938a (55, 31) | #30c3c5 (72, 38) |
| azure 210 | 27 % | #8fc4fa (77, 29) | 42 % | #9abfe9 (76, 25) | #addaff (85, 23) |
| blue 240 | 5 % | #6d76aa (51, 28) | 1 % | #4d5384 (36, 27) | #767aac (53, 27) |
| violet 270 | 1 % | #5d4c72 (36, 24) | 0 % | #543f60 (31, 20) | #261f2b (13, 9) |
| magenta 300 | 1 % | #713e74 (34, 43) | 0 % | - | #2d132c (10, 19) |
| rose 330 | 1 % | #733d56 (34, 25) | 1 % | #5f0622 (19, 40) | #920f38 (32, 53) |

| hue (golden) | ref share | ref lit colour (L*, C*) | ours share | ours now (L*, C*) | ours + grade (L*, C*) |
|---|---|---|---|---|---|
| red 0 | 20 % | #f09a93 (71, 33) | 6 % | #d0a296 (70, 20) | #b06762 (48, 21) |
| orange 30 | 47 % | #ffc590 (83, 37) | 66 % | #d0a377 (70, 28) | #e5b992 (78, 27) |
| yellow 60 | 5 % | #fee792 (92, 41) | 4 % | #536008 (38, 45) | #7f8c37 (56, 46) |
| chartreuse 90 | 1 % | #6e8f35 (55, 51) | 8 % | #3e5405 (33, 43) | #637636 (47, 37) |
| green 120 | 0 % | #628e62 (55, 28) | 1 % | #2e6e1e (41, 49) | #448145 (48, 43) |
| spring 150 | 0 % | #76b197 (68, 26) | 1 % | #09422a (24, 24) | #36784f (45, 37) |
| cyan 180 | 1 % | #36aaae (64, 32) | 0 % | #304849 (29, 10) | #175961 (34, 20) |
| azure 210 | 4 % | #668cbe (58, 37) | 13 % | #283f50 (25, 13) | #475f8e (40, 28) |
| blue 240 | 7 % | #717be8 (54, 56) | 0 % | - | #5a648d (43, 24) |
| violet 270 | 5 % | #8967b1 (49, 48) | 0 % | - | #5a307a (30, 35) |
| magenta 300 | 5 % | #a065a0 (50, 38) | 0 % | #4c1357 (19, 46) | #442645 (20, 22) |
| rose 330 | 6 % | #d588a5 (65, 34) | 0 % | #3e2a34 (20, 13) | #60293e (25, 28) |

### 2d. Lit vs shadow on the same material

Hand-picked patches, Otsu split. Crops: `out/shadow_crops_ref.jpg` and `out/shadow_crops_ours.jpg`.

| frame | lit | shadow | linear lit/shadow |
|---|---|---|---|
| ref 04, day sand | #d2ac81 (L* 73) | #6a6d92 (L* 47, b* −21) | 2.8 |
| ref 18, day pavement | #edd8bf (L* 87) | #7481b8 (L* 55, b* −30) | 3.1 |
| ref 12, day deck | #e1c38d (L* 80) | #5e6474 (L* 42) | 4.4 |
| ref 04, golden sand | #d28d4a (L* 64) | #514d74 (L* 35) | 4.0 |
| ours b_1900, deck | #a76d30 (L* 51) | #452512 (L* 19, b* +19, brown) | 7.5 |
| ours b_100 | #b17332 (L* 54) | #5f4116 (L* 30) | 3.4 |

The reference shadows are lighter than ours and blue-violet. Their B channel is often higher than the lit side's: lit B 129 against shadow B 146. That cannot come from a darker version of one albedo, so it is a painted shadow colour.

Sky, top 10 % / 10-20 % / 20-30 % of rows:

| | top 10 % | 10-20 % | 20-30 % |
|---|---|---|---|
| ref day | #5997e2 (S .61) | #70adf1 | #82b8f5 |
| ours day | #8db7e7 (S .39) | #95bce8 | #9dc1e9 |

- Ref golden: the top is violet, #937b80 (IQR #61426f to #da97a1); rows 20-40 % are #d99d83 peach.
- Ours golden: the top is #b6919e to #d2a294, pink-mauve.

## 3. Side-by-sides and sheets

Each side-by-side is three panels: ours now | ours + fitted grade | reference frame with similar content.

- Day: `out/side_by_side/sbs_c_140.jpg`, `sbs_b_470.jpg`, `sbs_c_1745.jpg`, `sbs_b_1180.jpg`, `sbs_c_1075.jpg`.
- Golden: `out/side_by_side/sbs_c_1340.jpg`, `sbs_c_1450.jpg`, `sbs_c_1650.jpg`, `sbs_b_1500.jpg`.
- All 39 stills, before on top and graded below: `out/graded_overview.jpg`. Full-size graded PNGs are in `out/graded/`.
- Tone curves and Y' CDFs (ref, ours now, ours graded): `out/curves_cdf.png`.
- Clusters: `out/clusters_overview.jpg`, `out/clusters/`.

What the side-by-sides show:

- **Day.** The grade reads clearly better: brighter, a punchy blue sky and water, warmer deck, near-whites, and a light vignette.
- **Golden.** It gets brighter and loses the orange-soup cast, but it turns lilac and slightly washed. The reference golden keeps saturated reds and oranges under a violet sky, and grading cannot add those hues (section 6).

## 4. The fitted grade

The fit is `scripts/fit2.py`, staged and regularised. The model works on sRGB-encoded values and is identical in numpy (`scripts/grade.py`) and GLSL. Steps, in order:

1. **Tone curve.** One RGB curve, a monotone cubic Hermite (Fritsch-Carlson) through 7 knots at x = 0, .1, .25, .5, .75, .9, 1.
   - It is fitted to the non-ink Y' quantiles of the matching reference cluster.
   - Constraints: smoothness penalty, slope ≥ 0.35, y(1) = 1, black point Y' ≈ 0.035.
2. **Saturation around Y'.** Separate amounts for shadows, mids and highlights.
   - Masks: wS = 1 − smoothstep(0, .55, Y'), wH = smoothstep(.45, 1, Y'), wM = rest.
   - Fitted to zone chroma, lit chroma, HSV S and colourfulness, bounded to 0.6-1.6.
3. **Three-way tint.** A zero-luma BT.709 Cb/Cr offset per zone.
   - Fitted to the a*/b* of near-neutral pixels (C* < 20), the dark-zone colour and the per-frame black point.
   - Penalties: chroma preservation, L2, and a cap of 28/255 per channel.
4. **Vignette.** × (1 − k·smoothstep(r0, 1, r)), fitted to the reference cluster mean images after content normalisation.
   - Measured: D k = 0.06, r0 = 0.50; G k = 0.11, r0 = 0.39.
   - Used slightly stronger, because our sky brightens the corners.

| | DAY (fit to ref D) | GOLDEN (fit to ref G) |
|---|---|---|
| curve y at x = 0, .1, .25, .5, .75, .9, 1 | 0.0345, 0.1828, 0.3812, 0.6605, 0.8814, 0.9631, 1 | 0.0311, 0.1877, 0.4017, 0.6754, 0.8750, 0.9582, 1 |
| curve tangents | 1.483, 1.404, 1.220, 0.987, 0.661, 0.435, 0.369 | 1.567, 1.498, 1.253, 0.924, 0.645, 0.472, 0.418 |
| saturation sh / mid / hi | 0.983 / 1.273 / 1.457 | 0.832 / 0.880 / 1.706 |
| shadow tint (Cb, Cr) | (−0.0291, +0.0411): hue 20° warm red, RGB (+16.5, −3.5, −13.8)/255 | (+0.0528, +0.0004): hue 246° blue-violet, RGB (+0.2, −2.6, +25.0)/255 |
| mid tint (Cb, Cr) | (+0.0376, −0.0104): hue 230° cool, RGB (−4.2, −0.6, +17.8)/255 | (+0.0583, −0.0003): hue 245°, RGB (−0.1, −2.7, +27.6)/255 |
| highlight tint (Cb, Cr) | (+0.0144, −0.0047): RGB (−1.9, −0.1, +6.8)/255 | 0 (see note) |
| vignette k, r0 | 0.10, 0.45 | 0.16, 0.40 |

Reading the presets:

- **Day.** Lift blacks warm, and brighten the mids by about +0.2 at 0.25-0.5. Roll off the top. Boost mid and highlight saturation, cool the yellow mids, and add a light vignette.
- **Golden.** Brighten hard. Pull saturation down in shadows and mids, where our orange is over-saturated. Cancel the orange cast with blue-violet in the shadows and mids, so they move from brown to violet. Use a stronger vignette.

Golden highlight tint: the fit wanted a violet highlight tint, but it was driven by only 754 neutral highlight pixels and moved the highlight mean away from the reference's orange. It was therefore set to 0.

Golden is the weaker fit. The golden look depends on hue content our golden scenes do not have. Use `amount` 0.8 for golden.

Stability: a first run with neutral-only tint targets reproduced the same day preset to within 0.01 (`data/grade_params_v1_neutral_only.json`). It made golden explode to a +71/255 magenta shadow tint, which is why the tint stage got its chroma, black-point and cap terms. Logs: `data/fit2_v2.log`. Presets: `data/grade_params.json`.

## 5. Implementation recipe (our stack)

**A. New file `src/videos/bridge/grade.ts`.**

- Copy `references/grade/GradeEffect.ts` verbatim. It needs postprocessing 6.37.2 and three 0.175.
- It contains the GLSL `mainImage` with the uniforms `gradeKy[7]`, `gradeKm[7]`, `gradeSat`, `gradeTintS/M/H`, `gradeVig` and `gradeAmount`. It also has the `GradeEffect` class with `set(p, q?, t)` for blending presets and an `amount` dial, plus the `GRADE_DAY` / `GRADE_GOLDEN` constants from the table above.
- The core of the shader:

```glsl
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 src = gradeEncode(inputColor.rgb);                 // linear (after tone mapping) -> sRGB
  vec3 c = vec3(gradeCurve(src.r), gradeCurve(src.g), gradeCurve(src.b));
  const vec3 W = vec3(0.2126, 0.7152, 0.0722);
  float y = dot(c, W);
  float wS = 1.0 - smoothstep(0.0, 0.55, y), wH = smoothstep(0.45, 1.0, y), wM = 1.0 - wS - wH;
  float s = gradeSat.y + (gradeSat.x - gradeSat.y) * wS + (gradeSat.z - gradeSat.y) * wH;
  c = vec3(y) + s * (c - vec3(y));
  c += wS * gradeTintS + wM * gradeTintM + wH * gradeTintH;
  float r = length(uv * 2.0 - 1.0) * 0.70710678;          // 1 at the corners (same as the numpy fit)
  c *= 1.0 - gradeVig.x * smoothstep(gradeVig.y, 1.0, r);
  c = clamp(c, 0.0, 1.0);
  outputColor = vec4(gradeDecode(mix(src, c, gradeAmount)), inputColor.a);
}
```

**B. `Bridge.tsx`, inside `Inner`.** Put the grade last, after `fx.tone`, and choose the preset from the shot's `light`:

```tsx
import { GradeEffect, GRADE_DAY, GRADE_GOLDEN } from "./grade";
import { SHOTS } from "./story";
// in the fx useMemo:
  grade: new GradeEffect(GRADE_DAY, 1.0),
// in <EffectComposer>, AFTER <primitive object={fx.tone} dispose={null} />:
  <primitive object={fx.grade} dispose={null} />
// every render (the "base"/"over" Inner instances change shot id over time):
const light = (SHOTS.find((s) => s.id === id) ?? SHOTS[0]).light;
fx.grade.set(light === "golden" ? GRADE_GOLDEN : GRADE_DAY);
fx.grade.amount = light === "golden" ? 0.8 : 1.0;
```

The grade is display-referred and expects tone-mapped input in 0..1, so it must come after `ToneMappingEffect(NEUTRAL)`. Bloom stays before tone mapping, as now.

**C. Re-fit after the lighting and albedo work lands.** The grade was fitted to today's stills, so once renders get brighter or more colourful it will over-correct. Either:

- lower `amount` (0.5-0.7); or
- re-fit in about 5 minutes. Put the new stills in a folder and point `SRC` in `scripts/run_ours.py` and `scripts/validate.py` at it. Then run `run_ours.py` → `samples.py` → `fit2.py day golden` → `emit_ts.py` → `validate.py data/grade_params.json`.

**D. Cheap source-side wins.** These reduce how hard the grade has to work.

- `lights.ts` day sky: `hor: "#c4e0f7"` → `"#8fc0f2"`.
- `world.ts` sky shader: change the exponent `pow(h, 0.55)` → `pow(h, 0.4)`. The frame top is only about 20° above the horizon, so today the pale horizon colour dominates and the sky top reads #8db7e7 instead of #5997e2.
- `lights.ts` golden sky: `top: "#5a66b8"` → `"#6a4f8c"` (violet) and `hor: "#ffc48c"` → `"#f7a27e"` (peach).
- These are untested starting points (no renders allowed in this pass). Check the final frame against the sky targets in 2d.

## 6. What a grade cannot fix: targets for the lighting and texture work

Measure these on the final graded frame. The reference numbers are final-frame values.

1. **Cast shadows.** Ours are brown and near-black: L* 19-30, b* +19, lit/shadow ratio up to 7.5:1.
   - Target: a sunlit/shadow linear ratio of 2.8-4.4:1 on the same material, median about 3.5:1 day and 4:1 golden.
   - Shadow L* 42-55 day, about 35 golden, blue-violet with b* −20 to −30. Examples: #6a6d92, #7481b8, #5e6474; golden #514d74.
   - A grade cannot separate shadow from lit at equal luma. Do it in the material: a shadow-tint term added where sun visibility is below 1, plus a blue-violet hemisphere ground/sky. For example, in `onBeforeCompile`: `outgoingLight = mix(outgoingLight, outgoingLight * 0.55 + vec3(0.20, 0.21, 0.36) * 0.35, 1.0 - sunVis)`.
2. **Albedo chroma and lightness** (table 2c).
   - Even after the grade, our lit reds are #c55c4f (L* 51, C* 40) against #e85648 (L* 56, C* 69), and our greens are dark spring green.
   - Paint targets for lit day surfaces:
     - red #e85648
     - orange/wood #e3b684 (L* 77)
     - yellow #d3c677
     - green #7fbc4e / #5ab04c (L* 65-70, C* 64)
     - azure #93c6f9
     - blue #7980b0
   - Lit-surface chroma targets: C* p50 ≥ 32 and p90 ≥ 55 (graded day: 26 / 53).
3. **Large black areas** (shakos, coats, chains, thick outlines).
   - Ours have non-ink p5 = 0.026, and 0.071 even after the grade; the reference is 0.234.
   - Dark materials must be coloured darks at L* 16-22, not black: navy #262c51, aubergine #2e2439, plum #3d2530, oxblood #4d2725.
   - Ink should be about 2-2.6 % of pixels (ours is 4.8 %), as thin lines with warm near-black cores of about (35,19,20).
4. **Missing hue families in golden.**
   - The reference golden is about 20 % red/rose (#f09a93, #d588a5) and about 17 % blue/violet/magenta (#717be8, #8967b1, #a065a0). Ours is 66 % orange, with almost no violet or blue.
   - The grade only shifts the cast. Golden needs violet sky and shadow fill (`ground: "#4f3f84"` is right; make the shadow term violet) and red/rose accents in the set dressing.
5. **Flat, emissive-looking characters.** cast.ts uses emissive ≈ 0.36, which flattens their tone range, so no curve can create real form shading on them. Lower emissive to ≤ 0.12 and let the sun and hemisphere shade them (the lighting report owns this).

## 7. Top 5 changes, ranked by visual impact

1. **Add `GradeEffect` after tone mapping**, with the day/golden presets per shot (section 5 A-B).
   - Day: median Y' goes .436 → .577 (ref .571), p99 .78 → .89, colourfulness 66 → 86 (ref 83), lit C* p90 37 → 53 (ref 55).
   - Day: vignette and the warm lifted black point come for free.
2. **Recolour cast shadows in the material:** lighter, blue-violet, lit/shadow ratio about 3.5:1, shadow L* 42-55 (6.1).
3. **Replace black materials with coloured darks** (L* 16-22, hex above) and thin the ink to 2-2.6 %. This removes our biggest remaining tonal gap: non-ink p5 0.07 against 0.23.
4. **Raise albedo chroma and lightness** to the per-hue targets (red #e85648, green #7fbc4e, wood #e3b684), and saturate the day sky toward #5997e2 at the top (6.2, 5D).
5. **Golden-specific:** violet sky top #6a4f8c with peach horizon, violet shadow fill and red/rose accents. Then re-fit the grade (5C) so golden stops needing the strong blue tint.
