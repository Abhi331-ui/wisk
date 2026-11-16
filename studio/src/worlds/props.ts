// Procedural period props where no CC0 model fits: 1950s walnut TV, bakelite rotary phone, standard lamp, enamel cooker,
// telephone pole + wires, lattice transmitter mast, plain tins, sash window frame.
import * as THREE from 'three';
import {Batch, boxUV} from '../engine/kit';

export function tv1957(b: Batch, M: THREE.Matrix4) {
  const P = (x: number, y: number, z: number) => new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(x, y, z));
  b.add('walnut', boxUV(0.62, 0.52, 0.5, 0.6), P(0, 0.96, 0));                     // cabinet
  for (const [x, z] of [[-0.26, -0.2], [0.26, -0.2], [-0.26, 0.2], [0.26, 0.2]]) b.add('walnut', new THREE.CylinderGeometry(0.018, 0.012, 0.7, 8), P(x, 0.35, z));
  b.add('bakelite', boxUV(0.46, 0.38, 0.02), P(-0.03, 0.98, -0.252));                // bezel
  for (const k of [0, 1]) b.add('brass', new THREE.CylinderGeometry(0.022, 0.022, 0.03, 16).rotateX(Math.PI / 2), P(0.25, 0.86 + k * 0.1, -0.255));
  b.add('cloth', boxUV(0.08, 0.3, 0.01), P(0.25, 1.05, -0.252));                    // speaker cloth
}
/** the CRT screen as its own mesh (its texture is the live black-and-white broadcast) */
export function tvScreen(tex: THREE.Texture) {
  const g = new THREE.SphereGeometry(0.6, 32, 16, Math.PI / 2 - 0.32, 0.64, Math.PI / 2 - 0.25, 0.5);
  g.scale(1, 1, 0.25);
  // remap UVs to the screen rectangle so the whole broadcast frame shows
  g.computeBoundingBox(); const bb = g.boundingBox!, pa = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pa.count; i++) uv.setXY(i, 1 - (pa.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pa.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  const m = new THREE.MeshStandardMaterial({map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 1.3, roughness: 0.15, metalness: 0});
  const me = new THREE.Mesh(g, m); return me;
}
export function phone1957(b: Batch, M: THREE.Matrix4) {
  const P = (x: number, y: number, z: number, r = 0) => new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationX(r)));
  const body = new THREE.CylinderGeometry(0.075, 0.11, 0.11, 24); b.add('bakelite', body, P(0, 0.055, 0));
  b.add('bakelite', boxUV(0.22, 0.03, 0.06), P(0, 0.115, 0));
  const hand = new THREE.CapsuleGeometry(0.022, 0.16, 6, 12).rotateZ(Math.PI / 2); b.add('bakelite', hand, P(0, 0.15, 0));
  for (const s of [-1, 1]) b.add('bakelite', new THREE.SphereGeometry(0.035, 16, 10), P(s * 0.1, 0.14, 0));
  b.add('chrome', new THREE.TorusGeometry(0.045, 0.006, 8, 24), P(0, 0.082, -0.085, -0.7));
  b.add('paper', new THREE.CircleGeometry(0.03, 20), P(0, 0.081, -0.088, Math.PI - 0.7));
}
export function standardLamp(b: Batch, M: THREE.Matrix4) {
  const P = (x: number, y: number, z: number) => new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(x, y, z));
  b.add('brass', new THREE.CylinderGeometry(0.16, 0.2, 0.04, 24), P(0, 0.02, 0));
  b.add('brass', new THREE.CylinderGeometry(0.014, 0.014, 1.45, 10), P(0, 0.75, 0));
  b.add('shade', new THREE.CylinderGeometry(0.17, 0.27, 0.32, 28, 1, true), P(0, 1.55, 0));
}
export function cooker(b: Batch, M: THREE.Matrix4) {
  const P = (x: number, y: number, z: number) => new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(x, y, z));
  b.add('enamel', boxUV(0.6, 0.88, 0.58), P(0, 0.44, 0));
  b.add('bakelite', boxUV(0.56, 0.02, 0.54), P(0, 0.89, 0));
  for (const [x, z] of [[-0.14, -0.13], [0.14, -0.13], [-0.14, 0.13], [0.14, 0.13]]) b.add('iron', new THREE.TorusGeometry(0.08, 0.008, 6, 20).rotateX(Math.PI / 2), P(x, 0.905, z));
  b.add('enamelDark', boxUV(0.46, 0.4, 0.01), P(0, 0.42, -0.295));
  b.add('chrome', new THREE.CylinderGeometry(0.01, 0.01, 0.36, 8).rotateZ(Math.PI / 2), P(0, 0.66, -0.31));
  b.add('enamel', boxUV(0.6, 0.34, 0.06), P(0, 1.06, 0.27)); // splash-back with controls
}
export function tin(b: Batch, M: THREE.Matrix4, label: string, h = 0.11, r = 0.038) {
  const P = (x: number, y: number, z: number) => new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(x, y, z));
  b.add('tinMetal', new THREE.CylinderGeometry(r, r, h, 20), P(0, h / 2, 0));
  b.add(label, new THREE.CylinderGeometry(r + 0.0012, r + 0.0012, h * 0.7, 20, 1, true), P(0, h / 2, 0));
}
/** wooden telephone pole with crossarms + insulators; returns the wire attach points */
export function pole(b: Batch, at: THREE.Vector3, rot = 0) {
  const M = new THREE.Matrix4().makeRotationY(rot).setPosition(at), P = (x: number, y: number, z: number) => new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(x, y, z));
  b.add('poleWood', new THREE.CylinderGeometry(0.1, 0.15, 9, 10), P(0, 4.5, 0));
  const pts: THREE.Vector3[] = [];
  for (const [y, w] of [[8.4, 1.6], [7.8, 1.2]]) {
    b.add('poleWood', boxUV(w, 0.1, 0.1), P(0, y, 0));
    for (let k = 0; k < 4; k++) { const x = -w / 2 + 0.1 + (k * (w - 0.2)) / 3; b.add('porcelain', new THREE.CylinderGeometry(0.03, 0.04, 0.1, 10), P(x, y + 0.1, 0)); pts.push(new THREE.Vector3(x, y + 0.15, 0).applyMatrix4(M)); }
  }
  return pts;
}
export function wire(b: Batch, a: THREE.Vector3, c: THREE.Vector3, sag = 0.5, r = 0.008) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push(a.clone().lerp(c, u).add(new THREE.Vector3(0, -sag * 4 * u * (1 - u), 0))); }
  b.add('wire', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 4, false), new THREE.Matrix4());
  return pts;
}
/** Crystal Palace-style lattice mast: 4 tapering legs, K-bracing, platforms; height h */
export function mast(b: Batch, at: THREE.Vector3, h = 220, base = 18) {
  const legs: THREE.Vector3[][] = [];
  const W = (y: number) => base * (1 - y / h) ** 1.6 + 1.2;
  const N = 40;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) legs.push(Array.from({length: N + 1}, (_, i) => { const y = (i / N) * h; return new THREE.Vector3(at.x + (sx * W(y)) / 2, at.y + y, at.z + (sz * W(y)) / 2); }));
  const bar = (p: THREE.Vector3, q: THREE.Vector3, r: number) => {
    const d = q.clone().sub(p), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, 5);
    const m = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())).setPosition(p.clone().add(q).multiplyScalar(0.5));
    b.add('steel', g, m);
  };
  for (let l = 0; l < 4; l++) for (let i = 0; i < N; i++) {
    const a = legs[l][i], c = legs[l][i + 1], o = legs[(l + 1) % 4];
    bar(a, c, 0.35 * (1 - i / N) + 0.12);
    bar(a, o[i + 1], 0.1); bar(o[i], c, 0.1);
    if (i % 4 === 0) bar(a, o[i], 0.14);
  }
  return new THREE.Vector3(at.x, at.y + h + 2, at.z);
}
