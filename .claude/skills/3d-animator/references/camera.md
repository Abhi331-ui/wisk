# Camera

## One move, one curve, one value
```js
const RAIL = new THREE.CubicBezierCurve3(START, C1, C2, END);       // the path
const p = easeInOut(seg(t, 0.0, 5.3));                              // the ONLY animated value
RAIL.getPoint(p, eye); look.copy(LOOK_A).lerp(LOOK_B, p);           // target blends with the same p
camera.position.copy(eye); camera.lookAt(look);
```
- Change the *shape* of the move with the control points `C1`, `C2`. Change the *timing* only with `seg(t, a, b)` and the easing.
- Several shots = several rails. Pick the rail by time (`if (t < 6.1) ... else ...`), each with its own `seg`.
- A rail whose end is the next rail's start, with matching direction (C2→END parallel to START→C1 of the next), gives a seamless continuous move.
- For a dive *into* something (a screen, a phone), end the rail at the surface and cut or cross-fade to the next scene on the motion: the blur hides the join.

## Lens
- Vertical FOV for the whole film. 35–40° = product/miniature feel, 50–55° = "I am in the room".
- Never animate the FOV. If something must get bigger, move the camera.
- Keep the near plane small (0.02 m) when the camera goes close to a screen.

## Depth of field (thin lens) and anti-aliasing, per sub-frame k of n
```js
const F = eye.distanceTo(FOCUS_POINT), lens = 0.006;                 // aperture radius in metres
const a = Math.sqrt(halton(k + 1, 2)) * lens, b = halton(k + 1, 3) * Math.PI * 2;
const lx = Math.cos(b) * a, ly = Math.sin(b) * a;                    // point on the lens disc
right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
camera.position.addScaledVector(right, lx).addScaledVector(up, ly); camera.updateMatrixWorld();
const e = camera.projectionMatrix.elements;
e[8] += -e[0] * lx / F + 2 * (halton(k + 1, 5) - 0.5) / W;           // shear keeps the focus plane still + sub-pixel jitter
e[9] += -e[5] * ly / F + 2 * (halton(k + 1, 7) - 0.5) / H;
camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
```
- Focus on what the viewer should read. Rack focus = animate `FOCUS_POINT` with the same eased `p`.
- Aperture 4–10 mm at desk scale. Over ~15 mm the world looks like a toy.
- For a "sharp" graphic frame (wireframe, UI flash), pass lens = 0 for that frame.

## Motion blur
```js
const ts = t + ((k + 0.5) / n - 0.5) * SHUTTER;   // sub-frame time, centred on t
```
- `SHUTTER = 0.5 / 30` (180°) normally; `0.8 / 30` during fast whips and dives.
- Everything that moves must be posed at `ts` (objects, camera, lights, UI that slides) or it will not blur.

## Comfort check
Print camera speed per frame and look for spikes:
```js
for (let f = 1; f < total * 30; f++) { shoot(f / 30, 0, 1); const s = camera.position.distanceTo(prev); prev.copy(camera.position); console.log(f, s.toFixed(4)); }
```
A spike = a jerk. Smooth it by moving control points, not by adding keyframes. No hard FPV slalom; one direction change per move.

## Timing structure
- Each section has its own clock (`tSection = t - SECTION_START`), so shortening one section does not shift the others' internals.
- Edits (cutting frames from the start, removing a pause) go in one mapping `sourceTimeAt(outputTime)`; every cue keeps its source time.
- Write cue times as frames when they must hit a sound: `at = 579 / 30`.
