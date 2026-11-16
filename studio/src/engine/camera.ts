// Word-driven camera: every beat has a start pose `a` and an end pose `b`; the camera never stops. Within one set the
// poses are joined by a centripetal Catmull-Rom spline over time (position AND look target), so speed never hits zero.
import * as THREE from 'three';
export type V3 = [number, number, number];
export type Pose = {pos: V3; look: V3; fov?: number; roll?: number; focus?: number};
export type BeatCam = {set: string; a: Pose; b: Pose; dof?: number; kick?: number};
export type Beat = {id: number; t: number; t1: number; shot: string; hero: boolean; say: string};
type Key = {t: number; p: Pose};

const cr = (p0: number, p1: number, p2: number, p3: number, t0: number, t1: number, t2: number, t3: number, t: number) => {
  // Barry-Goldman pyramidal form of a non-uniform Catmull-Rom (knots = times)
  const A1 = ((t1 - t) * p0 + (t - t0) * p1) / (t1 - t0), A2 = ((t2 - t) * p1 + (t - t1) * p2) / (t2 - t1), A3 = ((t3 - t) * p2 + (t - t2) * p3) / (t3 - t2);
  const B1 = ((t2 - t) * A1 + (t - t0) * A2) / (t2 - t0), B2 = ((t3 - t) * A2 + (t - t1) * A3) / (t3 - t1);
  return ((t2 - t) * B1 + (t - t1) * B2) / (t2 - t1);
};
/** monotone cubic (Fritsch-Carlson) interpolation of one channel over the key times: smooth, continuous velocity,
 *  and never overshoots between keys (big fast moves between distant keys stay clean) */
function monotone(ts: number[], ys: number[], t: number) {
  const n = ts.length; if (n === 1) return ys[0];
  if (t <= ts[0]) return ys[0] + (ys[1] - ys[0]) / (ts[1] - ts[0] || 1) * 0; if (t >= ts[n - 1]) return ys[n - 1];
  const d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-6, ts[i + 1] - ts[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]); // harmonic mean
  let i = 0; while (i < n - 2 && t > ts[i + 1]) i++;
  const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
}
const lerpPose = (k: Key[], t: number): Pose => {
  const ts = k.map((q) => q.t), ch = (g: (p: Pose) => number) => monotone(ts, k.map((q) => g(q.p)), t);
  const v = (g: (p: Pose) => V3) => [0, 1, 2].map((c) => ch((p) => g(p)[c])) as V3;
  return {pos: v((p) => p.pos), look: v((p) => p.look), fov: ch((p) => p.fov ?? 40), roll: ch((p) => p.roll ?? 0), focus: ch((p) => p.focus ?? 0)};
};

export type CamState = Pose & {set: string; beat: number; whip: number; dof: number; local: number};
/** whip transition length (s) on each side of a set change */
export const WHIP = 0.2;
export const cameraAt = (beats: Beat[], cams: Record<number, BeatCam>, t: number): CamState => {
  let bi = 0; while (bi + 1 < beats.length && beats[bi + 1].t <= t) bi++;
  const set = cams[bi].set;
  let s0 = bi, s1 = bi; while (s0 > 0 && cams[s0 - 1].set === set) s0--; while (s1 + 1 < beats.length && cams[s1 + 1].set === set) s1++;
  const keys: Key[] = [];
  for (let j = s0; j <= s1; j++) {
    const b = beats[j], d = b.t1 - b.t;
    keys.push({t: b.t, p: cams[j].a}, {t: b.t + d * 0.82, p: cams[j].b});
  }
  // continue moving past the last key of the run (extrapolate the final drift) instead of stopping
  const last = keys[keys.length - 1], prev = keys[keys.length - 2];
  const ext = (a: V3, b: V3, k: number) => a.map((x, c) => b[c] + (b[c] - x) * k) as V3;
  keys.push({t: last.t + (last.t - prev.t) * 0.5, p: {...last.p, pos: ext(prev.p.pos, last.p.pos, 0.5), look: ext(prev.p.look, last.p.look, 0.5)}});
  const pose = lerpPose(keys, t);
  // kicks (impact flip-shake) and whip amount near set boundaries
  const b = beats[bi], startRun = beats[s0].t, endRun = beats[s1].t1;
  let whip = 0;
  if (s0 > 0 && t - startRun < WHIP) whip = -(1 - (t - startRun) / WHIP);
  if (s1 < beats.length - 1 && endRun - t < WHIP) whip = 1 - (endRun - t) / WHIP;
  const kick = cams[bi].kick ?? 0, kt = (t - b.t) * 30;
  const shake = kick && kt < 7 ? kick * (1 - kt / 7) * (Math.floor(kt) % 2 ? 1 : -1) : 0;
  pose.roll = (pose.roll ?? 0) + shake * 1.2;
  return {...pose, set, beat: bi, whip, dof: cams[bi].dof ?? 0, local: t - b.t};
};

export const applyCam = (cam: THREE.PerspectiveCamera, s: CamState) => {
  cam.position.set(...s.pos);
  cam.up.set(0, 1, 0); cam.lookAt(...s.look);
  // whip: fast yaw away from / into the shot (ease-in), plus roll
  const w = s.whip, yaw = Math.sign(w) * Math.pow(Math.abs(w), 2.2) * 0.9;
  cam.rotateY(-yaw);
  cam.rotateZ(THREE.MathUtils.degToRad(s.roll ?? 0));
  cam.fov = s.fov ?? 40; cam.updateProjectionMatrix();
};
