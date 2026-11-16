// Victorian/Edwardian London terraces (as still standing in 1957): brick fronts, white sash windows, stone sills and lintels,
// slate roofs, chimney stacks with clay pots, coloured front doors, low front walls. Near rows are fully modelled; far rows
// use a single block per 10-house segment with a generated facade texture (same brick colour, window grid, lit windows).
import * as THREE from 'three';
import {Batch, boxUV, hash} from '../engine/kit';

export const HOUSE_W = 4.8, EAVE = 6.4, RIDGE = 2.4, DEPTH = 8.5;
const DOORS = ['#2f4f3a', '#6b1f24', '#1f2f4f', '#3a2a20', '#4f4f4f', '#7a5a1f'];

/** one row of `n` houses; row origin = facade line centre of house 0; facade faces local -z; houses step along +x */
export function terraceRow(b: Batch, n: number, M: THREE.Matrix4, seed: number, skip: number[] = []) {
  const P = (x: number, y: number, z: number) => new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(x, y, z));
  const L = n * HOUSE_W;
  // party-wall-continuous brick mass (front + back walls) with window reveals as recessed glass
  for (let i = 0; i < n; i++) {
    if (skip.includes(i)) continue;
    const x0 = i * HOUSE_W, cx = x0 + HOUSE_W / 2, r = (k: number) => hash(seed * 31 + i, k);
    b.add('brick', boxUV(HOUSE_W, EAVE, DEPTH, 2), P(cx, EAVE / 2, DEPTH / 2));
    // plinth + string course
    b.add('stone', boxUV(HOUSE_W, 0.35, 0.06, 1), P(cx, 0.17, -0.03));
    b.add('stone', boxUV(HOUSE_W, 0.12, 0.08, 1), P(cx, 3.1, -0.04));
    // ground floor: big window + door; first floor: two windows. Same on the back.
    const door = r(1) < 0.5 ? 1 : -1;
    const win = (wx: number, wy: number, ww: number, wh: number, back = false) => {
      const z = back ? DEPTH + 0.05 : -0.05, s = back ? -1 : 1;
      b.add(r(wx * 7 + wy) < 0.55 ? 'glassLit' : (r(wx + wy * 3) < 0.25 ? 'glassTV' : 'glass'), boxUV(ww - 0.08, wh - 0.08, 0.02), P(wx, wy, z + 0.035 * s));
      b.add('frame', boxUV(ww, 0.07, 0.1), P(wx, wy + wh / 2, z)); b.add('frame', boxUV(ww, 0.07, 0.1), P(wx, wy - wh / 2, z));
      b.add('frame', boxUV(0.07, wh, 0.1), P(wx - ww / 2, wy, z)); b.add('frame', boxUV(0.07, wh, 0.1), P(wx + ww / 2, wy, z));
      b.add('frame', boxUV(ww, 0.05, 0.06), P(wx, wy + 0.02, z)); // sash meeting rail
      b.add('stone', boxUV(ww + 0.18, 0.08, 0.16), P(wx, wy - wh / 2 - 0.05, z - 0.06 * s)); // sill
      b.add('stone', boxUV(ww + 0.22, 0.2, 0.05), P(wx, wy + wh / 2 + 0.12, z - 0.02 * s)); // lintel
    };
    win(cx - door * 0.65, 1.55, 1.6, 1.55); win(cx - 1.1, 4.6, 1.05, 1.45); win(cx + 1.1, 4.6, 1.05, 1.45);
    win(cx - 0.6, 1.6, 1.3, 1.2, true); win(cx + 1.0, 4.6, 0.9, 1.2, true);
    // front door with step and fanlight
    const dx = cx + door * 1.55;
    b.add('door' + Math.floor(r(2) * DOORS.length), boxUV(0.95, 2.1, 0.06), P(dx, 1.05 + 0.15, 0.04));
    b.add('glassLit', boxUV(0.85, 0.32, 0.02), P(dx, 2.5, 0.02));
    b.add('stone', boxUV(1.2, 0.15, 0.4), P(dx, 0.07, -0.2));
    b.add('frame', boxUV(1.1, 0.08, 0.12), P(dx, 2.33, -0.01));
    // front garden wall + gate gap
    b.add('brick', boxUV(HOUSE_W - 1.1, 0.75, 0.25, 2), P(cx - door * 0.55, 0.37, -2.6));
    b.add('stone', boxUV(HOUSE_W - 1.1, 0.06, 0.32), P(cx - door * 0.55, 0.78, -2.6));
    // chimney stack on the party wall: brick + corbel + 2-3 clay pots
    const cs = P(x0, EAVE + RIDGE * 0.75, DEPTH * 0.5);
    b.add('brick', boxUV(0.7, 2.2, 1.2, 2), cs);
    b.add('brick', boxUV(0.82, 0.12, 1.32, 2), P(x0, EAVE + RIDGE * 0.75 + 1.1, DEPTH * 0.5));
    const pots = 2 + Math.floor(r(3) * 2);
    for (let k = 0; k < pots; k++) b.add('pot', new THREE.CylinderGeometry(0.11, 0.14, 0.55 + 0.2 * r(10 + k), 10), P(x0, EAVE + RIDGE * 0.75 + 1.43, DEPTH * 0.5 - 0.35 + (k * 0.7) / Math.max(1, pots - 1)));
    // gutter
    b.add('gutter', new THREE.CylinderGeometry(0.06, 0.06, HOUSE_W, 8).rotateZ(Math.PI / 2), P(cx, EAVE - 0.05, -0.08));
    b.add('gutter', new THREE.CylinderGeometry(0.06, 0.06, HOUSE_W, 8).rotateZ(Math.PI / 2), P(cx, EAVE - 0.05, DEPTH + 0.08));
  }
  // continuous slate roof (two pitches) over the whole row
  const pitch = Math.atan2(RIDGE, DEPTH / 2), slope = Math.hypot(RIDGE, DEPTH / 2) + 0.3;
  for (const s of [-1, 1]) {
    const g = boxUV(L + 0.1, 0.06, slope, 1.2);
    const m = new THREE.Matrix4().makeRotationX(s * pitch).setPosition(L / 2, EAVE + RIDGE / 2, DEPTH / 2 + (s * -DEPTH) / 4);
    b.add('slate', g, new THREE.Matrix4().multiplyMatrices(M, m));
  }
  b.add('stone', boxUV(L, 0.12, 0.22), P(L / 2, EAVE + RIDGE, DEPTH / 2)); // ridge tiles
}

/** far-LOD facade texture: brick tone + 10 houses of windows; emissive map with random lit windows */
export function farFacade(seed: number) {
  const W = 1024, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H;
  const e = document.createElement('canvas'); e.width = W; e.height = H;
  const g = c.getContext('2d')!, ge = e.getContext('2d')!;
  g.fillStyle = '#6e4636'; g.fillRect(0, 0, W, H); ge.fillStyle = '#000'; ge.fillRect(0, 0, W, H);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${90 + 60 * hash(i, 1)},${50 + 30 * hash(i, 2)},${40 + 20 * hash(i, 3)},0.35)`; g.fillRect(hash(i, 4) * W, hash(i, 5) * H, 6, 2); }
  const hw = W / 10;
  for (let i = 0; i < 10; i++) for (const [wx, wy, ww, wh] of [[0.3, 0.62, 0.32, 0.25], [0.25, 0.16, 0.2, 0.24], [0.7, 0.16, 0.2, 0.24], [0.78, 0.62, 0.17, 0.33]]) {
    const x = i * hw + wx * hw - (ww * hw) / 2, y = wy * H, w = ww * hw, h = wh * H, lit = hash(seed + i, wx * 10 + wy) < 0.5, tv = hash(seed - i, wy) < 0.2;
    g.fillStyle = '#f1ece2'; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = '#1d2026'; g.fillRect(x, y, w, h);
    if (wx < 0.75 || wy > 0.5) { ge.fillStyle = lit ? (tv ? '#6f86b8' : '#ffb35a') : '#000'; ge.fillRect(x, y, w, h); }
  }
  const t = new THREE.CanvasTexture(c), te = new THREE.CanvasTexture(e);
  t.colorSpace = te.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return {map: t, emissiveMap: te};
}
