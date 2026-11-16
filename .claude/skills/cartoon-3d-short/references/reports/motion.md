# Motion: reference vs ours (camera grammar + character animation)

Units: **px = pixels at the reference size 720x1280** (multiply by 1.5 for our 1080x1920). **f** = frame at 30 fps.
Reference = 20 shorts, 32,337 frames, burned-in caption band excluded from every camera measurement.
Ours = `story.ts` / `cast.ts` / `toon.ts` as of 2026-10-31. Rendering was off-limits, so ours is measured **from the code with
the same maths**: `ourcam.py` runs the exact `CAMS` + `run()` + `camAt()` (a private copy, executed with node) through the same
per-frame similarity fit and the same statistics as the reference; `ourwalk.py` evaluates the `bodyFront` / `bodySide` formulas.

## 0. Verdict

1. **Our camera moves are 3-frame snaps; the reference glides.** Our key moves peak at a median 115 px/f (up to 488) with a 3 f
   attack. Reference moves are symmetric ease-in-out: ~10 f in, ~10 f out, ~23 f total, with a median peak of 14-16 px/f.
   The "ease-out burst" grammar in STYLE_BIBLE.md (and in the `story.ts` header comment) came from an integer phase
   correlation that cannot see motion below ~4 px/f. It is wrong.
2. **The reference camera is almost never dead still.** 65 % of frames move. Even in quiet frames it keeps pushing in
   (0.14 %/f median). There is no hand-held float at all. Impacts are 6-7 frame kicks that flip sign every frame.
3. **Characters are animated on ones.** No line boil, no squash/stretch, no smears, no idle loops. Everything happens on
   acting beats that land 0-3 f before the word.
4. **Walks are bouncy and planted.**
   - Body bob is 3-7 % of height; ours is 1.7 % in front view.
   - Lean swings from 1° to 7° every step.
   - A step takes 9-12 f; ours takes 15 f, and 20-38 f for the tourists.
   - The stance foot sticks to the ground; ours skate 13-60 % in side views.
5. **Blinks are frequent and shaped:** every 0.5-2.3 s, 4 frames (half / shut / shut / half), plus one on every expression
   swap. Ours blink every 4 s and only open/shut.

## 1. Method (scripts in `references/motion/scripts/`)

- **Camera (`cam2.py`, `camstats.py`, `camshape.py`)**
  - Each frame is fitted against the previous one: a robust 9-tile sub-pixel phase-correlation similarity fit (translation,
    zoom, roll) at 360x640. Tile bands are 3-29 %, 29-56 % and 80-97 % of the height, so captions are excluded. Outlier tiles
    are rejected.
  - The fits are integrated into a path and smoothed with a Gaussian of σ = 1.2 f.
  - Speed is translation combined with zoom × 734 px (the frame-corner radius).
  - Classes: hold < 0.3 px/f, drift < 2, move ≥ 2.
  - Bursts are local peaks ≥ 6 px/f. Attack and release are measured to 10 % of the peak.
- **Ours (`ours/dump.mjs`, `ourcam.py`)**
  - `camAt()` is projected through a 5x5 point grid on the subject plane into the next frame, then fitted the same way.
  - Shot boundaries with no on-screen cut (shots 3-8 and 10 start from the previous framing) are kept as moves.
  - Real cuts (flash, crossfades) are masked like the reference cuts.
- **Characters**
  - Contact sheets of 2-4 s at 30 fps. 
  - NCC template tracking (`track.py`), compensated for camera motion with background patches (`idle.py`, `walkstat.py`).
  - Frame-diff hold detection (`uniq.py`).
  - Eye-strip dark-pixel counts (`blink.py`).
  - Mouth blob area vs the voice RMS envelope, tested at lags −4..+4 f (`mouth.py`).

## 2. Camera

### 2.1 Reference vs ours

| Measure | Reference (median, range over 20 videos) | Ours (computed from story.ts) | Gap |
|---|---|---|---|
| Hold (< 0.3 px/f) | 10 % (1-27 %) | 22 % | more dead-still frames |
| Drift (0.3-2 px/f) | 24 % (4-38 %) | 22 % | ≈ |
| Move (≥ 2 px/f) | 65 % (34-94 %) | 55 % | ≈ |
| Median speed | 3.6 px/f (1.3-12.9) | 2.9 px/f | ≈ |
| p90 speed | 16.9 px/f (9.7-29.4) | 28.1 px/f | ours has spikes |
| Moves per 10 s | 6.0 (2.9-8) | 2.2 | half as many |
| Move peak speed | 13.7 px/f (p25 5.9, p75 24.6, p90 36) | **115 px/f** (79-488 on the big ones) | **8x too fast** |
| Burst attack (10 % to peak) | 10 f (p25 6, p75 18) | **3 f** | snap |
| Burst release (peak to 10 %) | 10 f (p25 6, p75 19) | 6 f | |
| Attack / release | 1.0; 62 % symmetric, 18 % ease-out, 20 % ease-in | 0.57; quartic ease-out puts 26-41 % of the move in frame 1 (dur 14-8) | wrong curve |
| Speed at ±10 f from the peak (median profile) | 0.6 of peak (full width at half max > 20 f) | 0.03-0.05 of peak (full width at half max ≈ 5 f) | see the profile plot |
| Size of one move | 101 px, zoom 23 % | 331 px, zoom 46 % | 3x bigger moves in 1/4 of the time |
| Strong moves (peak ≥ 25 px/f) | attack 8 f, release 7 f; e.g. v14 160-240: 1→38 px/f in 16 f, 12 f plateau, 13 f release | 3 f attack, 5-7 f release | |
| Zoom in quiet frames (translation < 2 px/f) | active (≥ 0.05 %/f) in 70 % of frames, 83 % of those push in; rate median 0.14 %/f, p75 0.34, p90 0.70 | active 55 %, 63 % push in; median 0.06 %/f, p75 0.16 | pushes 2.4x slower, often lateral drift instead |
| Push-in runs (≥ 12 f) | 336 push-ins vs 180 pull-outs; median 35 f, +22 %, 0.61 %/f. Slow ones (< 0.3 %/f): 25 f, +3.7 % | linear `drift()` | no deliberate push-ins |
| Snap zoom / crane | v08 snap zoom 0.4→5.9 %/f (+38 % in 14 f); v03 crane pull-back up to −4.6 %/f, ~45 f speeding up, ~60 f slowing down | 13 moves that zoom by up to 275 % or travel 0.7-3.7 frame widths in 3-8 f | |
| Roll moves | 3.2 per 10 s, median 3.6° over 18 f (p75 8.1°, p90 17.5°) | 3.0 per 10 s, ~2.5° over ~9 f (max 9.6°) | half as long, a bit small |
| Hand-held float | **none**: high-frequency residual 0.08 px median (0.05-0.29) | 0.006 m sine float = 0.03 px/f median (invisible) | delete it |
| Impact shake | v14 spear: offset flips sign **every frame** (15 Hz), ~3 px offset (≈5 px/f), roll ±0.1-0.35°, gone in 6-8 f; the push-in stops at the hit | 6.4 Hz sine, linear decay over 15 f: bolt 28.7 px/f, deck→water 15.5, hammer 10.7 on the first frame | 2-5x stronger, 2x longer, slow wobble |
| Whip pans | 0.45 per minute (5 real ones in 18 min). 45-93 px/f for 7-25 f, 2-3 f ramp up and down, **strong directional motion blur**: v13 175-183 (30→93→25), v07 58-90 (~47 vertical), v09 1334-1343 (peak 56) | none on purpose, but 13 un-blurred "fly" moves at 79-488 px/f | |
| Crowd beats | formations stand still while a crane or truck move supplies the motion (v03 51 s, v14 0 s and 125 s) | marching column (story), townsfolk waving and hopping nonstop | keep the march, still the extras |

### 2.2 Our key moves (`story.ts` CAMS)

Each move is measured as above. "Needed" is the glide length that keeps the peak at ≤ 25 px/f (the reference p75), using
smootherstep (peak = 1.875 × distance / duration).

| Key f | Shot | Move | Zoom | Peak now | Needed | Do |
|---|---|---|---|---|---|---|
| 48 | 1 | 129 px | +64 % | 106 px/f | 37 f | glide 37 f |
| 88 | 1 | 338 | +34 % | 94 | 31 f | glide 32 f |
| 190 | 2 | 36 | +24 % | 37 | 13 f | glide 18 f |
| 246 | 2 | 97 | +26 % | 47 | 16 f | glide 18 f |
| 283 | 3 | 150 | +170 % | 164 | 94 f | **cut** (delete the copy of shot 2's framing) |
| 353 | 3 | 346 | +54 % | 112 | 40 f | glide 40 f |
| 444 | 4 | 1574 | −104 % | 373 | 120 f | **cut** (delete key 440) |
| 497 | 4 | 606 | +39 % | 80 | 50 f | **cut** |
| 534 | 5 | 898 | −6 % | 203 | 68 f | **cut** (delete key 530) |
| 585 | 5 | 22 | +20 % | 35 | 11 f | glide 18 f |
| 643 | 6 | 486 | −39 % | 79 | 42 f | **cut** (delete key 640) |
| 717 | 6 | 317 | −126 % | 218 | 73 f | **cut** |
| 768 | 6 | 254 | +38 % | 76 | 28 f | glide 29 f |
| 823 | 7 | 204 | −57 % | 84 | 35 f | glide 35 f (or cut) |
| 871 | 7 | 411 | +88 % | 159 | 58 f | **cut** |
| 925 | 7 | 1437 | −1 % | 276 | 108 f | **cut** |
| 987 | 8 | 2011 | −275 % | 427 | 160 f | **cut** (delete key 984) |
| 1039 | 8 | 2631 | +39 % | 488 | 198 f | **cut**, and kick on the snap |
| 1062 | 8 | 826 | −86 % | 230 | 78 f | **cut** |
| 1099 | 8 | — | — | — | — | already a cut (dur 1) |
| 1217 | 10 | 57 | +24 % | 39 | 14 f | glide 18 f |
| 1560 | 12 | 49 | −35 % | 45 | 20 f | glide 20 f |
| 1685 | 13 | 1045 | +28 % | 115 | 80 f | **cut** |
| 1770 | 14 | 1928 | +75 % | 392 | 150 f | **cut** |
| 1905 | 15 | 15 | +46 % | 76 | 26 f | glide 26 f |
| 1962 | 15 | 164 | −153 % | 202 | 85 f | **crane pull-out**: start ~1935, glide 90 f to the end (peak ≈3 %/f; reference cranes reach 4.6 %/f) |

## 3. Character animation

| Item | Reference (measured) | Ours (from code) | Gap |
|---|---|---|---|
| Drawing rate | **on ones**. A moving character changes every frame; no 2s or 3s holds. Static characters are pixel-identical (mean abs diff 0.15 grey levels). | March poses quantised at 1/120 of a cycle (ones). **Tourists use `q(…, 24)` at 0.39-0.75 Hz, so each pose holds 1.7-3.2 f.** | tourists are on 2s/3s |
| Step length in time | 9-12 f per step (2.5-3.3 steps/s): v04 cowboy 10.6 f, v13 carriers ~9 f, v03 kid ~12 f | march 15 f (2.0 steps/s); tourists 20-38 f (0.8-1.5 steps/s) | march 25-65 % slower; tourists 2-3x slower |
| Body bob, peak to peak | 3-7 % of height, lowest at contact: cowboy 47 px on a 617 px figure = 7.6 % (0.32 head heights); carriers ~4 %; kid ~3 % | front march 14 units = **1.7 %**, stroll **1.0 %**. Side view (from leg geometry) 4.1 % at stomp 1.0 → 9.0 % at stomp 1.5. Lowest at contact (correct). | front view 3-4x too flat |
| Lean | 1° at passing → 5-7° forward at contact, in phase with the bob (cowboy) | side: a constant 3°; front: none | no lean cycle |
| Leg action | side walk: big stride, thigh swings about ±35-45°, and the knee rises until the thigh is nearly level at passing (high-knee strut, v04 650-651 and 661-662; visual estimate) | side: thigh 30°×stomp + 16°×stomp lift, knee 70°×stomp. Front: foot lift 60 u for the march, 27 u for the stroll. | close enough at stomp ≥ 1.35 |
| Feet | **planted**. The stance foot moves with the ground at ≤ 1.1 px/f while the ground moves 7.2 px/f (v04 649-651, tracked). A soft blue-grey contact shadow sits under the foot. | **Side views skate**: column 39 % (stomp 1.0), 20 % (1.35), 13 % (1.5); tourists ~60 %. The legs (250 u = 0.54 m) cannot cover 0.8 m steps at 1.6 m/s and 2 steps/s. | visible in shots 4, 13, 15 |
| Arms | noodle arms hang or hold props; swing too small or hidden to measure on the studied walkers | front: hand ±16 u (±4°); side: hand ±90 u (±22°) | no data, leave as is |
| Idle in holds | **none**: frozen to 0.01-0.8 px over 32 f (v20 sitting). Only acting idles, e.g. the v20 sleeper's head lolls 10-15° in 8-10 f, holds ~20 f, then returns. | standing figures frozen (good); water bob 0.03 m at 0.35 Hz (motivated, good). **Townsfolk wave at 1.4 Hz and the kid hops at 1.1 Hz without a break.** | extras too busy |
| Blinks | 3-4 f long: half, shut ×1-2 (a line), half. Gaps 0.2-2.3 s, typically 0.5-1.5 s (v19: 7 blinks in 4 s, v06: 6 in 4 s). Blinks cover expression swaps. | `blinkAt`: every 3.98 s, 4.3 f, open/shut only, not tied to swaps | 3-5x fewer, no in-between frames |
| Mouth (talking) | smooth shapes changing on ones (line, rect with teeth, open with tongue, wide); r ≈ 0.47 with the voice RMS; the mouth leads by 0-1 f (v10 officer) | no talking characters; expression mouths are static | n/a (narration only) |
| Reaction timing | expression or action change lands 0-3 f **before** the word onset (v03 −1 / −3, v10 0, v14 0). Swaps are instant (1 frame). | `exprMarch` swaps at the onset −1.6..+2.0 f (median ~0), instant | about 2 f late |
| Squash / stretch, smears | none | none | keep |
| Anticipation / impact | jump: 2-3 f crouch (v10). Spear (v14): 3 f to lower, **~6 f held back, a 1-frame thrust**, impact flash + 4-5 f ring, contact on the word onset. No overshoot frames in these sequences. | hammer: 6 f smooth raise, 2 f hold, **3 f** ease-in strike, 9 f burst; contact on the word (good) | no held wind-up, strike too slow, burst too long |
| Line boil | **none** (amplitude 0) | none | keep 0 |
| Turns | real 3D bodies (capsule + sphere); turns take 1-4 f with the face decal sliding round the head (v10). Front→back ~2 f (v16 759→761); back→front can be a 1-frame swap (v16 801→802). | yaw billboards. Front↔side swap and mirror flip happen in 1 f whenever the camera crosses cos 0.57, **including in the middle of a camera move**. | pops during glides |

## 4. Files

**Comparison plots (ours vs reference, same method)**
- `references/motion/ours/burst_profile_ref_vs_ours.png`: median speed profile of a move, aligned on its peak
  (306 reference moves in blue, our 30 in red).
- `references/motion/ours/ours_speed.png`: our whole-film speed timeline, in the same format as the reference
  `references/motion/cam/NN_*_speed.png` and `cam/speed_combo.png`.
- Data: `cam/camstats.json`, `cam/NN_*_rob.npy` (reference) and `ours/ours_rob.npy`, `ours/ours_run_rob.npy` (ours).

**Reference sequences (`references/motion/sheets/`)**

| Topic | Sheets |
|---|---|
| Walks | `v04_640_cowboywalk.jpg`, `v04_645_legs.jpg`, `v04_645_feet.jpg`, `v04_649_footzoom.png`, `v03_465_kidwalk.jpg`, `v03_459_kidbody.jpg`, `v13_846_carrier.jpg`, `v03_44.5_walk_full.jpg`, `v04_21_walk_full.jpg`, `v11_14_walk_full.jpg`, `v13_27_walk_full.jpg`, `v16_24.5_walk_full.jpg` |
| Turns | `v10_8_turn.jpg`, `v16_755_turn_purple.jpg`, `v16_796_turn_orange.jpg` |
| Blinks | `blink_v19_490.jpg`, `blink_v06_30.jpg`, `blink_v10_571.jpg`, `blink_v17_120.jpg`, `v19_blink_zoom.jpg`, `v10_blink_zoom.jpg` |
| Mouths | `v05_1795_mouth.jpg`, `v08_128_cashier_mouth.jpg`, `v10_538_officer_face.jpg` |
| Actions | `v14_40_spear.jpg`, `v10_34_jump.jpg`, `v10_36_jumpzoom.jpg`, `v01_45_arm.jpg` |
| Idle | `v20_30_sit_idle.jpg`, `v20_30_sleep.jpg`, `v10_767_bed.jpg` |
| Crowds | `v03_51_crowd.jpg`, `v14_0_soldiers.jpg`, `v14_125_field.jpg` |
| Whips | `v07_60_whip.jpg`, `v09_1328_whip.jpg` |

Overviews are in `overview/small_*.jpg` and the coordinate grids in `grid/combo*.jpg`.

## 5. Implementation recipe

### 5.1 `story.ts`: camera

**a) Key blend: ease-in-out glides and real cuts.** This replaces the quartic `easeOut` inside `run()`. Keep `easeOut`
itself, because `snapEnd` uses it for the cable physics. Also replace the header comment (line 3) with: "continuous slow
push-ins; symmetric ease-in-out moves ~23 f (10 in / 10 out), peak ~15 px/f at 720p; big reframes are cuts".

```ts
/** reference camera ease: symmetric smootherstep. Peak speed = 1.875 x distance / dur, so keep dur >= 0.075 x distance (720p px) */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Partial<Cam> & { pos: V3; look: V3 } };
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
```

Then apply the table in 2.2 to the keys:
- Moves of at most half a frame width (≤ 360 px) and at most 40 % zoom become `glide` with `dur` 18-40.
- Anything bigger becomes `cut: true`. For the boundary keys, simply delete the key that copies the previous shot's framing.

So that the move's fastest frame lands where the snap used to land, start each glide about `dur/2` earlier. This is a
judgment call: camera-to-word timing was not measured.

**b) Holds: push in instead of sliding sideways.** Use this in place of the lateral `drift(...)` on hold keys:

```ts
/** slow dolly toward the look point; the subject grows ~rate per frame.
 *  Reference quiet frames: 0.14 %/f median, 0.34 p75. Emphasis pushes: ~0.6 %/f for ~35 f (+22 %). */
const push = (pos: V3, look: V3, f: number, f0: number, rate = 0.0025): V3 => {
  const k = (1 - rate) ** Math.max(0, f - f0);
  return [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k];
};
// e.g. shot 2: { f: 190, dur: 18, s: (f) => { const look: V3 = [0, 8, 8]; return { pos: push([10, 10.5, -42], look, f, 190, 0.002), look, fov: 42 }; } },
```

Rates:
- 0.0015-0.0035 on every hold.
- 0.006 for about 35 f on the punch words: "pride of the whole town", "starts bouncing", the bolt line, "the best drilled soldiers".

The push stops on an impact: cut, or end the key at the hit frame. On emphasis keys, set `roll` to ±0.06-0.14 rad
(3.6-8°) with `dur` ≥ 18. The current ±0.02-0.06 is fine on calm keys.

**c) Impacts: frame-alternating kicks, no float.** This replaces `SHAKES`, the `k` / `n()` float and the sine shake in
`camAt`:

```ts
// impact kicks (reference v14): image offset flips sign every frame, ~3 px at 720p per unit, gone in 7 f, roll +-0.23 deg per unit
const KICKS: [number, number][] = [[SNAP, 1], [DROP1, 1.6], [59.79, 0.5], [60.33, 0.5], [61.69, 0.7]];
const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.round((t - t0) * FPS);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a; // metres at the look distance for 3 px x a
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
```

**d) March cadence (optional, needs the sound agent).**
- **Option A**, closest to the reference (2.6 steps/s = 11.5 f per step):
  `export const MARCH_HZ = 1.3; export const marchPhase = (tau: number) => (((tau * MARCH_HZ) % 1) + 1) % 1;`
  - The deck bounce follows automatically, at 2.6 Hz.
  - Any footstep or stomp sound timed to 2 steps/s must be re-timed to `marchPhase` 0 and 0.5.
  - Together with the stride in 5.2, skating drops to within about ±5 %.
- **Option B**: keep 2 steps/s, the historical quick march. Use stride ×1.25 at stomp ≥ 1.35 (slide ≤ 7 %), and reframe
  shot 4 to a 3/4 front view, where the 28 % slide at stomp 1.0 does not read.

**e) Stable views for billboards (optional).** Pick front or side per key, not per frame, so a soldier never pops in the
middle of a glide:

```ts
/** frame at which the current key's move has finished; world.ts builds the CamInfo for viewOf() from camAt(id, keyEnd(id, f)) */
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};
```

### 5.2 `toon.ts`: body mechanics

**`bodyFront`: bob.** The reference bobs 3-7 % of height, lowest at contact. Set the march to 5 % (40 u p-p) and the stroll to
3 % (24 u):

```ts
const bob = mode === "march" ? 20 * Math.cos(2 * two * phase) : mode === "stroll" ? 12 * Math.cos(2 * two * phase) : mode === "sit" ? 170 : 0;
```

The legs are drawn from `hipY`, so the low point reads as a knee bend. Nothing else needs to change.

**`bodySide`: lean cycle and stride.**

```ts
export type SideOpts = { phase?: number; expr?: Expr; mode?: "march" | "stand" | "swing" | "push"; blink?: boolean | number; stomp?: number; stride?: number; pose?: number };
// signature: { ..., stomp = 1, stride = 1, pose = 0 }
legs.push([rad(30 * stomp * stride * Math.sin(q) + 16 * stomp * lift), rad(70 * stomp * lift), k]);
// lean swings with the step like the reference walk: 1 deg at passing, 7 deg at contact (phase 0 / 0.5)
const lean = mode === "push" ? 14 * pose : mode === "march" ? 4 + 3 * Math.cos(2 * two * phase) : 0;
```

**`faceFront` / `bodySide` eyes: half-lid in-between.** `blink` becomes `boolean | number`, where 1 is shut and 0.5 is half.
Pass `skin` in from `bodyFront`.

```ts
const faceFront = (p: Pen, cx: number, cy: number, s: number, expr: Expr, look = 0, blink: boolean | number = false, skin = SKIN) => {
  const lid = blink === true ? 1 : Number(blink) || 0;
  // ... in the eye loop: shut = the existing arc when lid >= 1 (or whistle); default dot eyes get a half-lid when 0 < lid < 1:
  //   p.dot(x + look * 9 * s, ey, 13 * s);
  //   if (lid > 0) { p.ell(x + look * 9 * s, ey - 7 * s, 17 * s, 10 * s, skin, 0); p.stroke([[x - 15 * s, ey - 1 * s], [x + 15 * s, ey - 1 * s]], lw * 0.8); }
  //   else p.dot(x + look * 9 * s - 4 * s, ey - 5 * s, 4 * s, WHITE);
```

In `bodySide`, test `lid >= 1` for the shut arc. For `0 < lid < 1`, draw a 30 u horizontal ink line through the eye instead
of the dot.

### 5.3 `cast.ts`: cast behaviour

**Blinks.** This replaces `blinkAt`:

```ts
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, and a blink across every expression swap */
const LID = [0.5, 1, 1, 0.5];
const SWAPS: Record<number, number[]> = { 4: [16.17, 17.3], 5: [19.48, 20.6], 6: [21.9, 23.7], 7: [29.4, 30.6], 8: [SNAP] };
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  for (const ts of swaps) { const k = Math.floor((t - ts + LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; } // shut frames hide the swap
  let s = -2 * hh(i, 9);
  for (let n = 0; s <= t && n < 400; n++) {
    const k = Math.floor((t - s) * FPS);
    if (k >= 0 && k < 4) return LID[k];
    s += 0.5 + 1.8 * hh(i * 31 + n, 13); // next gap 0.5-2.3 s
  }
  return 0;
};
// column(): const blink = expr !== "whistle" ? lidAt(t, i, SWAPS[id]) : 0;   (sitters / townsfolk / officer / park: lidAt(t, i))
```

The pool key already quantises numbers, so this adds only two drawing variants per face: half and shut.

**Reactions land 2 f early.** In `exprMarch`, subtract `LEAD` from every switch time:

```ts
const LEAD = 2 / FPS; // reference expression and action changes land 0-3 f before the word onset
case 4: return t < 16.17 - LEAD ? { expr: i % 2 ? "neutral" : "stern", look: 0 } : t < 17.3 - LEAD ? { expr: lau ? "shock" : "nervous", look: 0 } : { expr: "neutral", look: 0 };
```

Do the same for the times in cases 5-8. Define `LEAD` once at the top of the module, before `lidAt` and `CHEER` use it.

**Column: stride matched to the walking speed.** In `column()`:

```ts
// side-view stride so the stance foot keeps pace with the column (Option A cadence 2.6 steps/s: slide within about +-5 %)
const so: SideOpts = { phase: mode === "march" ? ph : 0, expr, mode: mode === "march" ? "march" : "stand", blink, stomp: st, stride: Math.max(0.9, 1.4 - (st - 1)) };
// Option B (2 steps/s): stride: st >= 1.3 ? 1.25 : 1.4
```

**Tourists: on ones, a real stroll cadence, no skating.** In `tourists()`:

```ts
const phase = q(((t - t0) * 1.2 + hh(i, 5)) % 1, 30); // 2.4 steps/s, 25 f per cycle, a new pose every frame (was sp/1.4 Hz, 24 poses = 2-3 f holds)
const so: SideOpts = { mode: "march", phase, expr, stomp: 0.82 * sp }; // stride grows with walking speed: no skating
```

**Extras hold still except on cue.** The reference background crowds are frozen. In `townsfolkAt`, gate the wave and the hop
with these cue windows (taken from `words.json`):

```ts
const CHEER: [number, number][] = [[8.01 - LEAD, 9.45], [65.96 - LEAD, 67.5]]; // "pride of the whole town", "like a crowd of tourists"
const on = CHEER.some(([a, b]) => t >= a && t < b);
const hop = kid && on ? Math.max(0, Math.sin(t * 7 + i)) * 0.18 : 0;
const fo: FrontOpts = { mode: "stand", expr, arms: i % 3 === 2 || !on ? undefined : wave(t, i, 420), blink: lidAt(t, i + 40) };
```

**Sitters.**
- Water sitters keep the bob; it is motivated by the water.
- Bank sitters stay frozen apart from one acting beat, the reference sleeper loll:

```ts
/** head loll: 12 deg in 9 f, hold 20 f, back in 9 f (reference v20 sleeper); use as FrontOpts.headTilt for "dazed" sitters, staggered by hh(i) */
const loll = (t: number, t0: number) => { const n = (t - t0) * FPS; return n < 0 || n > 38 ? 0 : 12 * (n < 9 ? smooth(n / 9) : n < 29 ? 1 : 1 - smooth((n - 29) / 9)); };
```

**Officer hammer: held wind-up, 1-frame strike, short burst.** This replaces `hammerK`:

```ts
// reference action timing (v14 spear): short wind-up, ~6 f held at the top, 1-frame strike, contact on the word onset
const hammerK = (t: number) => {
  let k = 1;
  for (const th of HITS) {
    const n = (t - th) * FPS; // frames to contact
    if (n >= -11 && n < -7) k = Math.min(k, 1 - smooth((n + 11) / 4)); // wind-up 4 f
    else if (n >= -7 && n < 0) k = 0; // held at the top 7 f; first frame with n >= 0 is the hit
  }
  return k;
};
// officer(): burst window th .. th + 5 / FPS (was 0.3 s = 9 f); reference ring is 4-5 f
```

**Settings to leave as they are:**
- line boil 0;
- no squash/stretch or smears;
- no breathing or idle loops on standing figures;
- march poses on ones;
- whistle notes.

### 5.4 `Bridge.tsx`: whip blur (optional, at most one whip)

Only add a whip if it gets blur. The reference whips are 45-93 px/f over 7-25 f with a 2-3 f ramp, always smeared. Set `vel`
each frame to the camera's screen motion between `f` and `f+1` (in UV units) × 0.5 shutter, and 0 otherwise:

```ts
import { Effect } from "postprocessing";
import { Uniform, Vector2 } from "three";
const frag = /* glsl */ `
uniform vec2 vel;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (dot(vel, vel) < 1e-8) { outputColor = inputColor; return; }
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 12; i++) acc += texture2D(inputBuffer, uv + vel * (float(i) / 11.0 - 0.5));
  outputColor = acc / 12.0;
}`;
export class WhipBlur extends Effect { constructor() { super("WhipBlur", frag, { uniforms: new Map([["vel", new Uniform(new Vector2())]]) }); } }
```

## 6. Top 5 changes, ranked by visual impact

1. **Turn the fly-snaps into cuts and everything else into glides** (`story.ts`: `run`, `Key`, `CAMS`; table 2.2).
   - Today, 13 key moves travel 0.7-3.7 frame widths or zoom by up to 275 % in 3-8 frames, at 79-488 px/f with no blur.
   - The reference moves peak at 14-16 px/f and ease in and out over ~23 f. Its whips (≤ 93 px/f) always carry heavy blur.
   - This is the biggest "cheap" tell in our film.
2. **Push in on every hold; roll on emphasis beats** (`story.ts` CAMS: `push()` instead of `drift()`).
   - Base 0.15-0.35 %/f, and 0.6 %/f for ~35 f on punch words.
   - Rolls of 4-8° glided over ≥ 18 f.
   - Stop the push on impacts.
3. **Walk and march mechanics** (`toon.ts` `bodyFront` / `bodySide`; `cast.ts` `column` / `tourists`; optional
   `marchPhase`).
   - Front bob 1.7 % → 5 % (march) and 1 % → 3 % (stroll).
   - Side lean cycles from 1° to 7°.
   - Stride tied to speed, so feet stop skating.
   - Tourists stroll at 2.4 steps/s on ones.
4. **Blinks and reaction lead** (`cast.ts` `lidAt` / `exprMarch`; `toon.ts` `faceFront`).
   - Blink gaps of 0.5-2.3 s.
   - 4-frame half / shut / shut / half shape.
   - A blink across every expression swap.
   - Swaps 2 f before the word.
5. **Impact grammar** (`story.ts` `camAt` → `kickAt`; `cast.ts` `hammerK`).
   - Replace the 15-frame 6.4 Hz wobble with 7-frame kicks that flip sign every frame (~3 px at 720p, roll ±0.23°).
   - Hammer: held wind-up, a 1-frame strike on the word, a 5-frame burst.
   - Delete the invisible float.

Next in line:
- background townsfolk frozen except on cue;
- stable billboard views during glides;
- at most one blurred whip.

## 7. Limits

- **Ours is computed, not rendered.** The camera numbers are exact to the code; the walk numbers are exact to the drawing
  formulas.
- **The stride / slide figures are approximate.** They come from `bodySide`'s lowest-foot rule; the true contact depends on
  the boot ellipse.
- **Reference walk numbers rest on few clean walkers** (v04 cowboy, v13 carriers, v03 kid), because most of the reference
  is acting rather than walking. Leg angles are visual estimates from the sheets. Arm swing could not be measured.
- **Judgment calls, not measurements:**
  - starting glides `dur/2` early;
  - the cue windows for the extras;
  - the loll staggering;
  - keeping 2 steps/s as Option B.
