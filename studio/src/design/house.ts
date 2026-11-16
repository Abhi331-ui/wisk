// Element 3 — London terraced house, 1957 (Victorian, 1890s build). Facade on z=0 facing +z, house runs back to z=-8.5,
// x in [-2.4, 2.4]. Canted ground-floor bay (left), recessed front door with fanlight (right), two sashes upstairs,
// slate roof, chimney stack on the party wall, gutter + downpipe, tiled path, low wall + privet hedge, milk bottles, dustbin.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {boxUV} from '../engine/kit';
import {PBR} from '../engine/assets';

export const HW = 4.8, EAVE = 6.3, RIDGE = 2.5, DEPTH = 8.5;
export type HouseTex = {brick: PBR; slate: PBR; stone: PBR; tiles: THREE.Texture; privet: THREE.Texture};
const rep = (t: THREE.Texture | undefined, r = 1) => { if (!t) return undefined; const n = t.clone(); n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(r, r); n.needsUpdate = true; return n; };
const P = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(o);
export function houseMats(T: HouseTex, door = '#1f4a34') {
  const brick = P({map: rep(T.brick.map, 0.5), normalMap: rep(T.brick.normalMap, 0.5), roughnessMap: rep(T.brick.roughnessMap, 0.5), color: '#ffffff', roughness: 0.9});
  const slate = P({map: rep(T.slate.map, 0.8), normalMap: rep(T.slate.normalMap, 0.8), color: '#c9ccd6', roughness: 0.6});
  const stone = P({map: rep(T.stone.map, 1), color: '#efe6d2', roughness: 0.5});
  brick.userData.matte = slate.userData.matte = stone.userData.matte = true;
  const paint = P({color: '#f4f0e6', roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.08});
  const doorM = P({color: door, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.14, envMapIntensity: 0.7}); doorM.userData.matte = true;
  const brass = new THREE.MeshStandardMaterial({color: '#e0b25e', roughness: 0.18, metalness: 1});
  const glass = P({color: '#1c2028', roughness: 0.02, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.0, envMapIntensity: 2});
  const lit = P({color: '#2a2014', roughness: 0.05, emissive: '#ffbf72', emissiveIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0});
  const net = new THREE.MeshStandardMaterial({color: '#f6f1e4', roughness: 1, transparent: true, opacity: 0.72, emissive: '#ffd6a0', emissiveIntensity: 0.35});
  const lead = P({color: '#5d6168', roughness: 0.45, metalness: 0.6});
  const iron = P({color: '#1c1d20', roughness: 0.35, metalness: 0.5, clearcoat: 0.6});
  const pot = P({color: '#b9603e', roughness: 0.6});
  const tiles = P({map: T.tiles, roughness: 0.25, clearcoat: 0.7}); tiles.map!.wrapS = tiles.map!.wrapT = THREE.RepeatWrapping; tiles.map!.repeat.set(1.2, 6);
  const hedge = new THREE.MeshStandardMaterial({map: rep(T.privet, 1.2), roughness: 0.8, color: '#ffffff'}); hedge.userData.matte = true;
  const milk = P({color: '#ffffff', roughness: 0.05, transmission: 0.25, thickness: 0.01, clearcoat: 1});
  const foil = new THREE.MeshStandardMaterial({color: '#d8d8dc', roughness: 0.25, metalness: 1});
  const zinc = new THREE.MeshStandardMaterial({color: '#a9adb0', roughness: 0.35, metalness: 0.9});
  return {brick, slate, stone, paint, doorM, brass, glass, lit, net, lead, iron, pot, tiles, hedge, milk, foil, zinc};
}
type M = ReturnType<typeof houseMats>;
const add = (g: THREE.Group, geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number], r: [number, number, number] = [0, 0, 0]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.castShadow = o.receiveShadow = true; g.add(o); return o;
};
/** a sash window (frame, meeting rail, glazing bars, glass lit or dark, nets) centred at (x, y) on a wall at z, facing +z */
function sash(g: THREE.Group, m: M, x: number, y: number, w: number, h: number, z: number, litWin: boolean) {
  add(g, new THREE.PlaneGeometry(w - 0.06, h - 0.06), litWin ? m.lit : m.glass, [x, y, z - 0.06]);
  if (litWin) add(g, new THREE.PlaneGeometry(w - 0.1, h * 0.45), m.net, [x, y - h * 0.22, z - 0.05]);
  for (const [ww, hh, dx, dy] of [[w, 0.07, 0, h / 2], [w, 0.09, 0, -h / 2], [0.07, h, -w / 2, 0], [0.07, h, w / 2, 0], [w, 0.05, 0, 0.02], [0.03, h / 2, 0, h / 4], [0.03, h / 2, 0, -h / 4]] as const)
    add(g, new RoundedBoxGeometry(ww, hh, 0.08, 2, 0.01), m.paint, [x + dx, y + dy, z - 0.02]);
  add(g, new RoundedBoxGeometry(w + 0.2, 0.08, 0.2, 2, 0.015), m.stone, [x, y - h / 2 - 0.06, z + 0.06]);                 // sill
  add(g, new RoundedBoxGeometry(w + 0.24, 0.22, 0.06, 2, 0.01), m.stone, [x, y + h / 2 + 0.13, z + 0.02]);                // lintel
  add(g, new RoundedBoxGeometry(0.16, 0.24, 0.07, 2, 0.01), m.stone, [x, y + h / 2 + 0.13, z + 0.04]);                    // keystone
}
export function buildHouse(m: M, opts: {seed?: number; lights?: boolean[]} = {}) {
  const g = new THREE.Group(), L = opts.lights ?? [true, true, false];
  const wall = (x0: number, x1: number, y0: number, y1: number, z = 0, d = 0.35) => add(g, boxUV(x1 - x0, y1 - y0, d, 1), m.brick, [(x0 + x1) / 2, (y0 + y1) / 2, z - d / 2]);
  // facade with openings: bay x[-1.6,0.4] y[0,2.8]; door recess x[1.05,2.05] y[0,2.75]; upstairs x[-1.62,-0.58],[0.58,1.62] y[3.8,5.35]
  wall(-HW / 2, -1.6, 0, EAVE); wall(0.4, 1.05, 0, EAVE); wall(2.05, HW / 2, 0, EAVE);
  wall(-1.6, 0.4, 2.8, 3.8); wall(-1.6, 0.4, 5.35, EAVE); wall(1.05, 2.05, 2.75, EAVE);
  wall(-1.6, -1.62 + 1.04, 0, 0); // (no-op guard)
  for (const [a, b] of [[-1.6, -1.62], [-0.58, 0.4]] as const) if (b > a) wall(a, b, 3.8, 5.35);
  wall(-0.58, 0.4, 3.8, 5.35); wall(0.4, 0.58, 3.8, 5.35); wall(1.62, 2.05, 3.8, 5.35); wall(1.05, 0.58 + 0.47, 3.8, 5.35);
  wall(-HW / 2, HW / 2, 0, EAVE, -DEPTH + 0.35, 0.35); // back wall
  for (const s of [-1, 1]) add(g, boxUV(0.3, EAVE, DEPTH, 1), m.brick, [s * (HW / 2 - 0.15), EAVE / 2, -DEPTH / 2]);
  add(g, boxUV(HW - 0.6, 0.3, DEPTH - 0.7, 1), m.brick, [0, EAVE - 0.15, -DEPTH / 2]);
  // stone string course + plinth
  add(g, new RoundedBoxGeometry(HW, 0.14, 0.1, 2, 0.02), m.stone, [0, 3.2, 0.04]); add(g, new RoundedBoxGeometry(HW, 0.3, 0.06, 2, 0.01), m.stone, [0, 0.15, 0.02]);
  // ---- canted bay (3 faces) on a brick dado, stone mullions, its own little slate roof ----
  const bay = new THREE.Group(); bay.position.set(-0.6, 0, 0); g.add(bay);
  const faces: [number, number, number, number][] = [[0, 0.62, 1.2, 0], [-0.8, 0.31, 0.62, Math.PI / 4], [0.8, 0.31, 0.62, -Math.PI / 4]]; // x, z, width, rot
  faces.forEach(([x, z, w, r], i) => {
    const f = new THREE.Group(); f.position.set(x, 0, z); f.rotation.y = r; bay.add(f);
    add(f, boxUV(w + 0.02, 0.78, 0.3, 1), m.brick, [0, 0.39, -0.15]);
    add(f, new RoundedBoxGeometry(w + 0.12, 0.1, 0.36, 2, 0.02), m.stone, [0, 0.8, -0.13]);
    sash(f, m, 0, 1.75, w - 0.1, 1.75, 0, L[0] && i !== 2);
    add(f, new RoundedBoxGeometry(0.12, 2.0, 0.14, 2, 0.02), m.stone, [w / 2, 1.8, -0.05]); add(f, new RoundedBoxGeometry(0.12, 2.0, 0.14, 2, 0.02), m.stone, [-w / 2, 1.8, -0.05]);
    add(f, new RoundedBoxGeometry(w + 0.16, 0.18, 0.4, 2, 0.02), m.stone, [0, 2.78, -0.12]);
  });
  // lean-to lead-flashed slate roof over the bay: front slope + two hipped sides
  add(bay, boxUV(1.5, 0.05, 0.85, 1), m.slate, [0, 3.07, 0.32], [0.45, 0, 0]);
  for (const s2 of [-1, 1]) add(bay, boxUV(0.62, 0.05, 0.6, 1), m.slate, [s2 * 0.95, 3.05, 0.2], [0.45, s2 * -0.78, 0]);
  add(bay, new RoundedBoxGeometry(1.6, 0.05, 0.08, 2, 0.02), m.lead, [0, 3.3, 0.02]);
  // ---- recessed front door: 4-panel door, fanlight, brass furniture, whitened step, tiled porch floor ----
  const dx = 1.55;
  for (const s of [-1, 1]) add(g, boxUV(0.06, 2.75, 0.4, 1), m.paint, [dx + s * 0.47, 1.375, -0.2]);
  add(g, boxUV(0.94, 0.06, 0.4, 1), m.paint, [dx, 2.75, -0.2]);
  const door = new THREE.Group(); door.position.set(dx, 0.12, -0.38); g.add(door);
  add(door, new RoundedBoxGeometry(0.9, 2.08, 0.05, 2, 0.01), m.doorM, [0, 1.04, 0]);
  for (const [px, py, pw, ph] of [[-0.2, 1.55, 0.3, 0.7], [0.2, 1.55, 0.3, 0.7], [-0.2, 0.5, 0.3, 0.6], [0.2, 0.5, 0.3, 0.6]]) {
    add(door, new RoundedBoxGeometry(pw, ph, 0.02, 2, 0.008), m.doorM, [px, py, 0.03]);
    add(door, new RoundedBoxGeometry(pw - 0.05, ph - 0.05, 0.02, 3, 0.012), m.doorM, [px, py, 0.045]); // raised field
  }
  add(door, new RoundedBoxGeometry(0.24, 0.05, 0.02, 2, 0.008), m.brass, [0, 1.08, 0.04]);                 // letterbox
  add(door, new THREE.TorusGeometry(0.05, 0.012, 10, 24), m.brass, [0, 1.42, 0.06]);                      // knocker
  add(door, new THREE.SphereGeometry(0.032, 16, 12), m.brass, [0.34, 1.0, 0.06]);                          // knob
  add(g, new THREE.CircleGeometry(0.44, 32, 0, Math.PI), m.lit, [dx, 2.33, -0.37]);                         // fanlight
  for (let k = 1; k < 5; k++) add(g, new THREE.BoxGeometry(0.015, 0.44, 0.02), m.paint, [dx + Math.cos((k / 5) * Math.PI) * 0.22, 2.33 + Math.sin((k / 5) * Math.PI) * 0.22, -0.36], [0, 0, (k / 5) * Math.PI - Math.PI / 2]);
  add(g, new RoundedBoxGeometry(1.1, 0.14, 0.45, 2, 0.02), P({color: '#d9d4c8', roughness: 0.7}), [dx, 0.07, 0.15]);   // whitened step
  add(g, new THREE.PlaneGeometry(0.92, 0.4), m.tiles, [dx, 0.125, -0.18], [-Math.PI / 2, 0, 0]);
  // ---- upper sashes ----
  sash(g, m, -1.1, 4.58, 1.04, 1.55, 0.001, L[1]); sash(g, m, 1.1, 4.58, 1.04, 1.55, 0.001, L[2]);
  for (const x of [-1.1, 1.1]) for (const s of [-1, 1]) add(g, boxUV(0.06, 1.55, 0.16, 1), m.brick, [x + s * 0.55, 4.58, -0.08]);
  // ---- roof (front + back pitch), ridge, chimney stack with pots, gutter + downpipe ----
  const pitch = Math.atan2(RIDGE, DEPTH / 2), slope = Math.hypot(RIDGE, DEPTH / 2) + 0.35;
  for (const s of [1, -1]) add(g, boxUV(HW + 0.04, 0.08, slope, 1.2), m.slate, [0, EAVE + RIDGE / 2 + 0.04, -DEPTH / 2 + (s * DEPTH) / 4 + s * 0.08], [s * pitch, 0, 0]);
  add(g, new THREE.CylinderGeometry(0.11, 0.11, HW, 12).rotateZ(Math.PI / 2), P({color: '#7c4a34', roughness: 0.5}), [0, EAVE + RIDGE + 0.05, -DEPTH / 2]);
  const cx = -HW / 2, cz = -DEPTH * 0.45;
  add(g, boxUV(0.75, 2.4, 1.3, 1), m.brick, [cx, EAVE + RIDGE * 0.7, cz]);
  add(g, new RoundedBoxGeometry(0.9, 0.14, 1.44, 2, 0.02), m.stone, [cx, EAVE + RIDGE * 0.7 + 1.24, cz]);
  for (let k = 0; k < 3; k++) {
    const pg = new THREE.LatheGeometry([[0, 0], [0.15, 0], [0.13, 0.12], [0.11, 0.5], [0.13, 0.56], [0.1, 0.58], [0.09, 0.56], [0, 0.56]].map(([x, y]) => new THREE.Vector2(x, y)), 20);
    add(g, pg, m.pot, [cx, EAVE + RIDGE * 0.7 + 1.31, cz - 0.4 + k * 0.4]);
  }
  add(g, new THREE.CylinderGeometry(0.065, 0.065, HW, 12, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), m.iron, [0, EAVE + 0.02, 0.12], [Math.PI, 0, 0]);
  add(g, new THREE.CylinderGeometry(0.04, 0.04, EAVE, 10), m.iron, [HW / 2 - 0.12, EAVE / 2, 0.1]);
  // ---- front garden: tiled path, low brick wall with stone coping, gate pillars, privet hedge ----
  add(g, new THREE.PlaneGeometry(1.0, 2.6), m.tiles, [dx, 0.012, 1.7], [-Math.PI / 2, 0, 0]);
  add(g, new THREE.PlaneGeometry(HW - 1.2, 2.6), P({color: '#5a4a38', roughness: 1}), [-0.5, 0.008, 1.7], [-Math.PI / 2, 0, 0]);
  add(g, boxUV(HW - 1.25, 0.6, 0.24, 1), m.brick, [-0.58, 0.3, 3.05]); add(g, new RoundedBoxGeometry(HW - 1.2, 0.08, 0.32, 2, 0.02), m.stone, [-0.58, 0.64, 3.05]);
  for (const px of [dx - 0.58, dx + 0.58]) { add(g, boxUV(0.34, 1.0, 0.34, 1), m.brick, [px, 0.5, 3.05]); add(g, new RoundedBoxGeometry(0.42, 0.1, 0.42, 2, 0.02), m.stone, [px, 1.05, 3.05]); }
  const hg = new RoundedBoxGeometry(HW - 1.5, 0.75, 0.55, 6, 0.2), hp = hg.attributes.position;
  for (let i = 0; i < hp.count; i++) { const x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i), n = Math.sin(x * 13 + y * 7) * Math.cos(z * 11 + x * 3) * 0.03 + Math.sin(x * 31 + z * 29) * 0.015; hp.setXYZ(i, x * (1 + n), y + n * 0.5, z * (1 + n * 2)); }
  hg.computeVertexNormals(); add(g, hg, m.hedge, [-0.62, 1.0, 2.75]);
  // ---- doorstep life: two milk bottles with foil caps, galvanised dustbin by the bay ----
  const bottle = new THREE.LatheGeometry([[0, 0], [0.036, 0], [0.038, 0.01], [0.038, 0.13], [0.026, 0.18], [0.02, 0.2], [0.021, 0.205], [0, 0.205]].map(([x, y]) => new THREE.Vector2(x, y)), 32);
  for (const bx of [dx - 0.38, dx - 0.29]) { add(g, bottle, m.milk, [bx, 0.14, 0.27]); add(g, new THREE.CylinderGeometry(0.022, 0.022, 0.01, 20), m.foil, [bx, 0.35, 0.27]); }
  const bin = new THREE.Group(); bin.position.set(-2.0, 0, 1.0); g.add(bin);
  add(bin, new THREE.CylinderGeometry(0.27, 0.24, 0.7, 40, 1, true), m.zinc, [0, 0.35, 0]);
  for (const y of [0.15, 0.35, 0.55]) add(bin, new THREE.TorusGeometry(0.262, 0.012, 8, 40).rotateX(Math.PI / 2), m.zinc, [0, y, 0]);
  add(bin, new THREE.SphereGeometry(0.29, 40, 10, 0, Math.PI * 2, 0, 0.5).scale(1, 0.35, 1), m.zinc, [0, 0.68, 0]);
  add(bin, new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), m.zinc, [0, 0.78, 0]);
  return g;
}
