// World: a London terraced street, spring 1957, dusk. The family's house (No. 9, row A) is built inside: front room with
// the TV, hallway with the phone, kitchen with pantry and the windowsill over the sink; back garden; the city in every
// direction to ~1.4 km (far LOD blocks); the Crystal Palace transmitter on a hill to the south-east.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Batch, boxUV, planeUV, hash, rng} from '../engine/kit';
import {loadMats, wallpaperTex, Mats} from '../engine/mats';
import {loadModel, useAsset} from '../engine/assets';
import {terraceRow, farFacade, HOUSE_W, EAVE, RIDGE, DEPTH} from './houses';
import {tv1957, tvScreen, phone1957, standardLamp, cooker, tin, pole, wire, mast} from './props';
import {Pen, bodyFront} from '../engine/toon';
import {Grass} from '../engine/Grass';

export const TV_ROT = Math.PI + 0.615;
export const FRONT_Z = 7.6, ROW_X0 = -40.8, PERIOD = 49.6;
// our house interior box (x, z ranges): front room, hallway, kitchen
export const ROOM = {front: {x: [-2.15, 1.05], z: [7.85, 11.8]}, hall: {x: [1.2, 2.15], z: [7.85, 12.0]}, kitchen: {x: [-2.15, 2.15], z: [12.1, 15.85]}, H: 2.75};
export const SPOTS = {
  tv: new THREE.Vector3(-1.65, 0, 8.35), sofa: new THREE.Vector3(0.15, 0, 10.9), armchair: new THREE.Vector3(-1.45, 0, 10.95),
  window: new THREE.Vector3(-0.65, 1.55, FRONT_Z), phone: new THREE.Vector3(1.88, 0.78, 9.1), frontDoor: new THREE.Vector3(1.55, 0, FRONT_Z),
  cooker: new THREE.Vector3(1.55, 0, 15.45), sill: new THREE.Vector3(-0.6, 1.0, 15.95), pantry: new THREE.Vector3(2.0, 0, 13.2),
  garden: new THREE.Vector3(0, 0, 22), mastTop: new THREE.Vector3(),
};

const MATSPEC: Record<string, [string, number?, THREE.MeshStandardMaterialParameters?]> = {
  brick: ['brick_wall_10', 2], slate: ['roof_slates_02', 1.2], stone: ['concrete_floor', 1, {color: '#d8d0c0'}], asphalt: ['worn_asphalt', 3],
  paving: ['concrete_floor', 1.2, {color: '#b9b2a6'}], floor: ['old_wood_floor', 1.5], rug: ['fabric_pattern_07', 0.9], tiles: ['floor_tiles_06', 1],
  kitwood: ['kitchen_wood', 1], walnut: ['dark_wood', 0.6], fence: ['wood_plank_wall', 1.8, {color: '#9c8a78'}], gravel: ['forest_ground_04', 2, {color: '#8a8070'}],
  lawn: ['leafy_grass', 2], poleWood: ['dark_wood', 1, {color: '#6a5a4c'}], plaster: ['painted_plaster_wall', 2, {color: '#efe6d6'}],
};
function proceduralMats(): Mats {
  const S = (c: string, p: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({color: c, roughness: 0.6, ...p});
  const m: Mats = {
    frame: S('#efece4', {roughness: 0.45}), glass: S('#1a1e24', {roughness: 0.06, metalness: 0.9}),
    glassLit: S('#2a2016', {emissive: '#ffb062', emissiveIntensity: 1.25, roughness: 0.08, metalness: 0.4}),
    glassTV: S('#151a24', {emissive: '#7d94c8', emissiveIntensity: 0.9, roughness: 0.08, metalness: 0.4}),
    pot: S('#a4563a', {roughness: 0.8}), gutter: S('#2b2b2e', {roughness: 0.5, metalness: 0.6}), wire: S('#1d1d1f', {roughness: 0.6}),
    porcelain: S('#e8e4da', {roughness: 0.25}), steel: S('#5d6066', {roughness: 0.55, metalness: 0.7}),
    bakelite: S('#121112', {roughness: 0.22}), brass: S('#b8913f', {roughness: 0.3, metalness: 1}), chrome: S('#d8d8d8', {roughness: 0.12, metalness: 1}),
    cloth: S('#8a7350', {roughness: 0.95}), paper: S('#f2ecd8', {roughness: 0.9}), shade: S('#e9d7b0', {emissive: '#ffcf8a', emissiveIntensity: 0.9, side: THREE.DoubleSide, roughness: 0.9}),
    enamel: S('#ece4cf', {roughness: 0.25}), enamelDark: S('#2a2a2a', {roughness: 0.3}), iron: S('#1c1c1c', {roughness: 0.7, metalness: 0.5}),
    tinMetal: S('#c9c9c6', {roughness: 0.3, metalness: 1}), sink: S('#f1efe8', {roughness: 0.2}), coal: S('#100c0a', {emissive: '#ff5a1a', emissiveIntensity: 0.6, roughness: 1}),
    lace: new THREE.MeshStandardMaterial({color: '#f4f1ea', transparent: true, opacity: 0.55, side: THREE.DoubleSide, roughness: 1, depthWrite: false}),
    daffodil: S('#f2c91e', {roughness: 0.6}), stem: S('#4f7a2a', {roughness: 0.7}),
  };
  ['#b8312f', '#2f6b9a', '#e0b02f', '#3d7a3a', '#f2ede0'].forEach((c, i) => (m['label' + i] = S(c, {roughness: 0.7})));
  ['#2f4f3a', '#6b1f24', '#1f2f4f', '#3a2a20', '#4f4f4f', '#7a5a1f'].forEach((c, i) => (m['door' + i] = S(c, {roughness: 0.45})));
  const wp = wallpaperTex(); wp.repeat.set(1 / 0.6, 1 / 0.6);
  m.wallpaper = new THREE.MeshStandardMaterial({map: wp, roughness: 0.85});
  const kp = wallpaperTex('#dfe7d8', '#9aa78a', '#7d8f6a'); m.kitchenPaper = new THREE.MeshStandardMaterial({map: kp, roughness: 0.8});
  return m;
}

/** walls of one room as boxes with openings; inner faces get `inner` material, outer brick handled by the facade */
function room(b: Batch, x: [number, number], z: [number, number], H: number, inner: string, holes: {wall: 'n' | 's' | 'e' | 'w'; a: number; b: number; y0: number; y1: number}[], floor: string, ceil = 'plaster') {
  const T = 0.02;
  const wall = (side: 'n' | 's' | 'e' | 'w') => {
    const along = side === 'n' || side === 's' ? x : z, len = along[1] - along[0];
    const fix = side === 'n' ? z[0] : side === 's' ? z[1] : side === 'w' ? x[0] : x[1];
    const hs = holes.filter((h) => h.wall === side).sort((p, q) => p.a - q.a);
    const segs: [number, number, number, number][] = []; let cur = along[0];
    for (const h of hs) { segs.push([cur, h.a, 0, H]); segs.push([h.a, h.b, 0, h.y0]); segs.push([h.a, h.b, h.y1, H]); cur = h.b; }
    segs.push([cur, along[1], 0, H]);
    for (const [a, c, y0, y1] of segs) {
      if (c - a < 0.005 || y1 - y0 < 0.005) continue;
      const mid = (a + c) / 2, w = c - a, hgt = y1 - y0, g = side === 'n' || side === 's' ? boxUV(w, hgt, T, 1) : boxUV(T, hgt, w, 1);
      const pos: [number, number, number] = side === 'n' || side === 's' ? [mid, y0 + hgt / 2, fix] : [fix, y0 + hgt / 2, mid];
      b.add(inner, g, pos);
    }
    void len;
  };
  (['n', 's', 'e', 'w'] as const).forEach(wall);
  b.add(floor, boxUV(x[1] - x[0], 0.02, z[1] - z[0], 1), [(x[0] + x[1]) / 2, 0.01, (z[0] + z[1]) / 2]);
  b.add(ceil, boxUV(x[1] - x[0], 0.02, z[1] - z[0], 1), [(x[0] + x[1]) / 2, H, (z[0] + z[1]) / 2]);
  b.add('frame', boxUV(x[1] - x[0], 0.14, 0.02), [(x[0] + x[1]) / 2, 0.07, z[0] + 0.015]); // skirting
}

function buildStatic(m: Mats) {
  const b = new Batch();
  // near rows: A (ours, skip No. 9 = index 8 which we build by hand), B opposite, C/D behind
  terraceRow(b, 17, new THREE.Matrix4().makeTranslation(ROW_X0, 0, FRONT_Z), 11, [8]);
  terraceRow(b, 17, new THREE.Matrix4().makeTranslation(-ROW_X0, 0, -FRONT_Z).multiply(new THREE.Matrix4().makeRotationY(Math.PI)), 23);
  terraceRow(b, 17, new THREE.Matrix4().makeTranslation(-ROW_X0, 0, PERIOD - FRONT_Z).multiply(new THREE.Matrix4().makeRotationY(Math.PI)), 37);
  terraceRow(b, 17, new THREE.Matrix4().makeTranslation(ROW_X0, 0, -PERIOD + FRONT_Z), 41);
  // our house shell: facade + back wall with exact openings (window/door) as in the row pattern, roof continues from row
  const solid = (x0: number, x1: number, y0: number, y1: number, z: number, d = 0.25) => b.add('brick', boxUV(x1 - x0, y1 - y0, d, 2), [(x0 + x1) / 2, (y0 + y1) / 2, z + d / 2]);
  const Z0 = FRONT_Z, Z1 = FRONT_Z + DEPTH - 0.25;
  // front: window x[-1.45,0.15] y[0.78,2.33]; door x[1.08,2.03] y[0,2.25]
  solid(-2.4, -1.45, 0, EAVE, Z0); solid(-1.45, 0.15, 0, 0.78, Z0); solid(-1.45, 0.15, 2.33, EAVE, Z0); solid(0.15, 1.08, 0, EAVE, Z0); solid(1.08, 2.03, 2.25, EAVE, Z0); solid(2.03, 2.4, 0, EAVE, Z0);
  // back: kitchen window x[-1.25,0.05] y[1.0,2.2]
  solid(-2.4, -1.25, 0, EAVE, Z1); solid(-1.25, 0.05, 0, 1.0, Z1); solid(-1.25, 0.05, 2.2, EAVE, Z1); solid(0.05, 2.4, 0, EAVE, Z1);
  // party walls + upper floor slab (mass above the ceiling) so the house reads solid from outside
  b.add('brick', boxUV(0.25, EAVE, DEPTH, 2), [-2.4 + 0.125, EAVE / 2, FRONT_Z + DEPTH / 2]); b.add('brick', boxUV(0.25, EAVE, DEPTH, 2), [2.4 - 0.125, EAVE / 2, FRONT_Z + DEPTH / 2]);
  b.add('brick', boxUV(HOUSE_W, EAVE - ROOM.H - 0.05, DEPTH, 2), [0, ROOM.H + 0.05 + (EAVE - ROOM.H - 0.05) / 2, FRONT_Z + DEPTH / 2]);
  // front window (sash) frame + glass, door
  const winF = (cx: number, cy: number, w: number, h: number, z: number) => {
    for (const [dx, dy, ww, hh] of [[0, h / 2, w, 0.07], [0, -h / 2, w, 0.07], [-w / 2, 0, 0.07, h], [w / 2, 0, 0.07, h], [0, 0.02, w, 0.05]]) b.add('frame', boxUV(ww, hh, 0.1), [cx + dx, cy + dy, z]);
    b.add('stone', boxUV(w + 0.18, 0.08, 0.16), [cx, cy - h / 2 - 0.05, z - 0.06]); b.add('stone', boxUV(w + 0.22, 0.2, 0.05), [cx, cy + h / 2 + 0.12, z - 0.02]);
  };
  winF(-0.65, 1.555, 1.6, 1.55, Z0 + 0.02); winF(-0.6, 1.6, 1.3, 1.2, Z1 + 0.25);
  b.add('door1', boxUV(0.95, 2.1, 0.05), new THREE.Matrix4().makeRotationY(-1.2).setPosition(1.1, 1.2, Z0 + 0.48)); // front door ajar into the hall
  b.add('stone', boxUV(1.2, 0.15, 0.4), [1.55, 0.07, Z0 - 0.2]);
  // rooms
  room(b, ROOM.front.x as any, ROOM.front.z as any, ROOM.H, 'wallpaper', [{wall: 'n', a: -1.45, b: 0.15, y0: 0.78, y1: 2.33}, {wall: 'e', a: 10.6, b: 11.5, y0: 0, y1: 2.1}], 'floor');
  room(b, ROOM.hall.x as any, ROOM.hall.z as any, ROOM.H, 'wallpaper', [{wall: 'n', a: 1.08, b: 2.03, y0: 0, y1: 2.25}, {wall: 'w', a: 10.6, b: 11.5, y0: 0, y1: 2.1}, {wall: 's', a: 1.25, b: 2.1, y0: 0, y1: 2.1}], 'floor');
  room(b, ROOM.kitchen.x as any, ROOM.kitchen.z as any, ROOM.H, 'kitchenPaper', [{wall: 's', a: -1.25, b: 0.05, y0: 1.0, y1: 2.2}, {wall: 'n', a: 1.25, b: 2.1, y0: 0, y1: 2.1}], 'tiles');
  // front room: chimney breast + fireplace on the west party wall, rug
  b.add('wallpaper', boxUV(0.42, ROOM.H, 1.6, 1), [-2.15 + 0.21, ROOM.H / 2, 9.9]);
  b.add('walnut', boxUV(0.6, 0.08, 1.75), [-2.15 + 0.3, 1.18, 9.9]);
  b.add('iron', boxUV(0.05, 0.62, 0.7), [-2.15 + 0.43, 0.42, 9.9]); b.add('coal', boxUV(0.1, 0.12, 0.45), [-2.15 + 0.43, 0.2, 9.9]);
  b.add('stone', boxUV(0.6, 0.04, 1.4), [-2.15 + 0.62, 0.03, 9.9]);
  b.add('rug', boxUV(2.2, 0.012, 2.4, 1), [-0.55, 0.026, 9.95]);
  tv1957(b, new THREE.Matrix4().makeRotationY(TV_ROT).setPosition(SPOTS.tv));
  standardLamp(b, new THREE.Matrix4().makeTranslation(0.75, 0, 11.45));
  // lace half-curtains + daffodils on the front sill
  b.add('lace', planeUV(1.5, 0.75), [-0.65, 1.15, FRONT_Z + 0.3]);
  for (let i = 0; i < 7; i++) { const x = -0.95 + i * 0.05; b.add('stem', new THREE.CylinderGeometry(0.004, 0.004, 0.32, 5), [x, 0.95 + 0.16, FRONT_Z + 0.38]); b.add('daffodil', new THREE.ConeGeometry(0.03, 0.05, 8).rotateX(-1.2), [x, 1.28, FRONT_Z + 0.36]); }
  // hallway: phone table + phone, stairs, coat hooks
  b.add('walnut', boxUV(0.4, 0.04, 0.5), [SPOTS.phone.x, 0.76, SPOTS.phone.z]);
  for (const [dx, dz] of [[-0.17, -0.22], [0.17, -0.22], [-0.17, 0.22], [0.17, 0.22]]) b.add('walnut', boxUV(0.03, 0.74, 0.03), [SPOTS.phone.x + dx, 0.37, SPOTS.phone.z + dz]);
  phone1957(b, new THREE.Matrix4().makeRotationY(Math.PI / 2 + 0.3).setPosition(SPOTS.phone.x, 0.78, SPOTS.phone.z));
  for (let i = 0; i < 12; i++) b.add('floor', boxUV(0.9, 0.04, 0.26), [1.67, 0.2 + i * 0.21, 9.7 + i * 0.2]);
  // kitchen: sink under window, cupboards, cooker, pantry shelf with tins, table
  b.add('sink', boxUV(0.9, 0.25, 0.5), [-0.6, 0.78, 15.55]); b.add('kitwood', boxUV(1.0, 0.65, 0.55), [-0.6, 0.33, 15.55]);
  b.add('kitwood', boxUV(1.0, 0.85, 0.55), [-1.62, 0.43, 15.55]); b.add('kitwood', boxUV(1.0, 0.04, 0.6), [-1.62, 0.87, 15.55]);
  cooker(b, new THREE.Matrix4().makeRotationY(Math.PI).setPosition(SPOTS.cooker));
  for (let s = 0; s < 3; s++) {
    b.add('kitwood', boxUV(0.3, 0.025, 1.2), [2.0, 1.0 + s * 0.42, 13.2]);
    for (let k = 0; k < 7; k++) tin(b, new THREE.Matrix4().makeTranslation(2.0, 1.012 + s * 0.42, 12.7 + k * 0.16), 'label' + ((k + s) % 5), 0.1 + 0.02 * hash(k, s));
  }
  b.add('kitwood', boxUV(1.1, 0.04, 0.75), [-0.6, 0.74, 13.6]);
  for (const [dx, dz] of [[-0.5, -0.33], [0.5, -0.33], [-0.5, 0.33], [0.5, 0.33]]) b.add('kitwood', boxUV(0.05, 0.72, 0.05), [-0.6 + dx, 0.36, 13.6 + dz]);
  // street: road, kerbs, pavements; lane behind gardens
  const L = 200;
  b.add('asphalt', boxUV(L, 0.05, 6.4, 1), [0, -0.025, 0]);
  for (const s of [-1, 1]) { b.add('stone', boxUV(L, 0.14, 0.2), [0, 0.07, s * 3.3]); b.add('paving', boxUV(L, 0.12, 1.7, 1), [0, 0.06, s * 4.25]); b.add('paving', boxUV(L, 0.1, 2.6, 1), [0, 0.05, s * (FRONT_Z - 1.3)]); }
  // back gardens with plank fences, the lane
  for (let i = -8; i <= 8; i++) {
    const x = i * HOUSE_W - HOUSE_W / 2;
    b.add('fence', boxUV(0.04, 1.8, 13.4, 1), [x, 0.9, FRONT_Z + DEPTH + 6.7]);
    if (i !== 0) b.add('lawn', boxUV(HOUSE_W, 0.02, 13.4, 1), [x + HOUSE_W / 2, 0.01, FRONT_Z + DEPTH + 6.7]);
  }
  b.add('fence', boxUV(L, 1.8, 0.04, 1), [0, 0.9, 29.6]);
  b.add('gravel', boxUV(L, 0.02, 3.6, 1), [0, 0.0, 31.6]);
  // telephone poles along our pavement + wires; a drop wire to No. 9
  const poles = [-30, -6, 18, 42].map((x) => pole(b, new THREE.Vector3(x, 0, 3.7)));
  for (let k = 0; k + 1 < poles.length; k++) for (let w = 0; w < 8; w++) wire(b, poles[k][w], poles[k + 1][w], 0.55 + 0.05 * w);
  const drop = wire(b, poles[1][3], new THREE.Vector3(1.9, 5.6, FRONT_Z - 0.05), 0.35, 0.006);
  SPOTS.mastTop.copy(mast(b, new THREE.Vector3(1400, 70, -3300), 219));
  return {group: b.build(m), drop};
}

/** far city: instanced 10-house blocks on both sides of streets every PERIOD m, out to ~1.4 km, gaps for cross streets */
function buildFar(m: Mats) {
  const ff = farFacade(5), blockMat = new THREE.MeshStandardMaterial({map: ff.map, emissiveMap: ff.emissiveMap, emissive: '#ffffff', emissiveIntensity: 1.1, roughness: 0.9});
  const L = 10 * HOUSE_W, block = new THREE.BoxGeometry(L, EAVE, DEPTH), roof = new THREE.CylinderGeometry(0.01, DEPTH / 2 + 0.2, RIDGE, 4, 1).rotateY(Math.PI / 4).scale(L / (DEPTH * 0.73), 1, 1);
  const chim = new THREE.BoxGeometry(0.7, 1.8, 1.2);
  const mats: THREE.Material[] = [m.brick, m.brick, m.slate, m.brick, blockMat, blockMat];
  const M: THREE.Matrix4[] = [], R: THREE.Matrix4[] = [], C: THREE.Matrix4[] = [];
  for (let k = -28; k <= 28; k++) for (let s of [-1, 1]) {
    const z = k * PERIOD + s * (FRONT_Z + DEPTH / 2);
    if (Math.abs(z) < PERIOD + 10) continue; // near rows are real
    for (let xi = -14; xi <= 14; xi++) {
      if ((xi + 1000) % 4 === 0) continue; // cross street
      const x = xi * (L + 1.5) + (k % 2) * 17, d = Math.hypot(x, z); if (d > 1450 || d < 60) continue;
      const rot = s > 0 ? Math.PI : 0, yJit = hash(xi, k) * 0.6;
      M.push(new THREE.Matrix4().makeRotationY(rot).setPosition(x, EAVE / 2 + yJit, z));
      R.push(new THREE.Matrix4().makeRotationY(rot).setPosition(x, EAVE + RIDGE / 2 + yJit, z));
      for (let c = 0; c < 10; c += 1) C.push(new THREE.Matrix4().setPosition(x - L / 2 + c * HOUSE_W, EAVE + RIDGE * 0.7 + yJit, z));
    }
  }
  const g = new THREE.Group();
  const inst = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], list: THREE.Matrix4[]) => { const im = new THREE.InstancedMesh(geo, mat as any, list.length); list.forEach((x, i) => im.setMatrixAt(i, x)); im.receiveShadow = true; g.add(im); };
  inst(block, mats, M); inst(roof, m.slate, R); inst(chim, m.brick, C);
  // ground under the far city
  const gr = new THREE.Mesh(new THREE.CircleGeometry(4200, 48).rotateX(-Math.PI / 2), m.asphalt); gr.position.y = -0.06; g.add(gr);
  // the hill with the transmitter
  const hill = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.09, 1), m.lawn); hill.position.set(1400, -10, -3300); g.add(hill);
  return g;
}

export type StreetProps = {t: number; preset?: 'dusk' | 'night' | 'rain'; tvDraw?: (p: Pen, t: number) => void; children?: React.ReactNode; gardenTree?: boolean};
export const Street1957: React.FC<StreetProps> = ({t, preset = 'dusk', tvDraw, children}) => {
  const pbr = useAsset('street:mats', () => loadMats(MATSPEC));
  const models = useAsset('street:models', () => Promise.all(['sofa_02', 'ArmChair_01', 'mantel_clock_01', 'fancy_picture_frame_01', 'street_lamp_01', 'dining_chair_02', 'pot_enamel_01', 'vintage_electric_kettle', 'planter_pot_clay', 'jug_01', 'tea_set_01', 'side_table_01'].map(loadModel)));
  const world = useMemo(() => {
    if (!pbr || !models) return null;
    const m = {...proceduralMats(), ...pbr};
    const s = buildStatic(m), far = buildFar(m);
    const place = (i: number, pos: [number, number, number], rot = 0, size?: number) => {
      const o = models[i].clone(true); o.position.set(...pos); o.rotation.y = rot;
      if (size) { const bb = new THREE.Box3().setFromObject(o), sz = bb.getSize(new THREE.Vector3()); o.scale.setScalar(size / Math.max(sz.x, sz.y, sz.z)); }
      return o;
    };
    const props = new THREE.Group();
    props.add(place(0, [SPOTS.sofa.x, 0, SPOTS.sofa.z + 0.1], Math.PI + 0.35, 2.0));
    props.add(place(1, [SPOTS.armchair.x, 0, SPOTS.armchair.z], Math.PI * 0.75, 1.0));
    props.add(place(2, [-2.15 + 0.3, 1.22, 9.9], Math.PI / 2, 0.38));
    props.add(place(3, [-2.15 + 0.45, 1.85, 9.9], Math.PI / 2, 0.9));
    for (const x of [-14, 10]) for (const zz of [-4.6, 4.6]) props.add(place(4, [x, 0, zz], zz > 0 ? Math.PI : 0, 4.6));
    props.add(place(5, [-0.6, 0, 13.0], 0, 0.95)); props.add(place(5, [-0.6, 0, 14.2], Math.PI, 0.95));
    props.add(place(6, [SPOTS.cooker.x - 0.14, 0.91, SPOTS.cooker.z - 0.13], 0, 0.26));
    props.add(place(7, [-1.75, 0.89, 15.5], 0.4, 0.24));
    props.add(place(8, [-0.95, 1.01, 15.85], 0, 0.14));
    props.add(place(9, [-0.4, 0.76, 13.6], 0, 0.15));
    props.add(place(11, [-0.95, 0, 11.35], 0, 0.55)); props.add(place(10, [-0.95, 0.56, 11.35], 0.3, 0.32));
    props.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // TV screen + broadcast canvas
    const tvc = document.createElement('canvas'); tvc.width = 480; tvc.height = 400;
    const tvTex = new THREE.CanvasTexture(tvc); tvTex.colorSpace = THREE.SRGBColorSpace;
    const scr = tvScreen(tvTex); scr.position.copy(SPOTS.tv).add(new THREE.Vector3(-0.03, 0.98, -0.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), TV_ROT));
    scr.rotation.y = TV_ROT + Math.PI;
    const g = new THREE.Group(); g.add(s.group, far, props, scr);
    return {g, tvc, tvTex, scr, m};
  }, [pbr, models]);
  if (!world) return null;
  // live broadcast: the narrator in black and white with scanlines and a soft flicker
  const c = world.tvc.getContext('2d')!; c.setTransform(1, 0, 0, 1, 0, 0);
  const gr = c.createRadialGradient(240, 170, 20, 240, 200, 300); gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(1, '#5a5a5a');
  c.fillStyle = gr; c.fillRect(0, 0, 480, 400);
  if (tvDraw) { c.save(); c.filter = 'grayscale(1) contrast(1.15) blur(0.6px)'; c.setTransform(0.72, 0, 0, 0.72, 24, 30); tvDraw(new Pen(c), t); c.restore(); c.filter = 'none'; }
  c.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < 400; y += 3) c.fillRect(0, y, 480, 1);
  const vg = c.createRadialGradient(240, 200, 120, 240, 200, 300); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = vg; c.fillRect(0, 0, 480, 400);
  world.tvTex.needsUpdate = true;
  const flick = 0.92 + 0.08 * Math.sin(t * 37) * Math.sin(t * 13.3);
  (world.scr.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.25 * flick;
  (world.m.glassTV as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + 0.25 * Math.sin(t * 5.1) * Math.sin(t * 2.3);
  const tvPos = SPOTS.tv.clone().add(new THREE.Vector3(0, 1.0, -0.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), TV_ROT));
  return (
    <group>
      <primitive object={world.g} />
      {/* interior lights: standard lamp, TV glow, hall bulb, kitchen bulb; two street lamps */}
      <pointLight position={[0.75, 1.6, 11.45]} color="#ffb768" intensity={preset === 'rain' ? 0 : 4.5} distance={7} decay={2} />
      <pointLight position={tvPos.toArray()} color="#a9bcff" intensity={2.2 * flick} distance={4.5} decay={2} />
      <pointLight position={[1.7, 2.5, 9.6]} color="#ffc27c" intensity={2.2} distance={5} decay={2} />
      <pointLight position={[0, 2.55, 14.0]} color="#ffd29a" intensity={preset === 'rain' ? 1.5 : 4} distance={6} decay={2} />
      <pointLight position={[-14, 4.3, -4.0]} color="#ffbf73" intensity={22} distance={20} decay={2} />
      <pointLight position={[10, 4.3, 4.0]} color="#ffbf73" intensity={22} distance={20} decay={2} />
      <Grass center={[0, 22.8]} size={[4.6, 13]} count={22000} t={t} height={[0.08, 0.22]} />
      {children}
    </group>
  );
};
