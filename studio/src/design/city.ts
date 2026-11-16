// Element 5 — 1957 London from above at dusk. Street grid of terraced rows (period 49.6 m, rows face their street),
// distance tiers: near (full approved house, merged), mid (instanced LOD houses: brick shell, slate roof, chimney, pots,
// TV aerial, window quads lit warm / TV-blue / dark), far (instanced 10-house blocks with lit facade texture) to ~2.5 km;
// back gardens with lawns + trees; the Thames, Battersea Power Station and St Paul's on the skyline.
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {hash, rng} from '../engine/kit';
import {farFacade} from '../worlds/houses';
import {PBR} from '../engine/assets';
import {smoke} from './streetProps';

export const PERIOD = 49.6, FZ = 8.2, HW = 4.8, EAVE = 6.3, RIDGE = 2.5, DEPTH = 8.5;
const P = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(o);
const rep = (t: THREE.Texture | undefined, rx: number, ry = rx) => { if (!t) return undefined; const n = t.clone(); n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(rx, ry); n.needsUpdate = true; return n; };

/** row origins: every street k has two rows facing it at z = k*PERIOD ± FZ; returns [x0, z, facing(+1 faces +z)] */
export function rowsAround(cx: number, cz: number, R: number, skipNear = 0) {
  const out: {x: number; z: number; face: number; street: number}[] = [];
  for (let k = Math.floor((cz - R) / PERIOD) - 1; k <= Math.ceil((cz + R) / PERIOD) + 1; k++) for (const s of [-1, 1]) {
    const z = k * PERIOD + s * FZ;
    for (let xi = Math.floor((cx - R) / HW); xi <= Math.ceil((cx + R) / HW); xi++) {
      const x = xi * HW + ((k % 2) * 17.3), d = Math.hypot(x - cx, z - cz);
      if (d > R || d < skipNear) continue;
      if (((xi % 22) + 22) % 22 === 0) continue; // cross streets every ~105 m
      out.push({x, z, face: s < 0 ? 1 : -1, street: k});
    }
  }
  return out;
}
/** mid-distance LOD house as merged geometries per material (built once, instanced) */
function lodHouseGeos() {
  const g = {brick: [] as THREE.BufferGeometry[], slate: [] as THREE.BufferGeometry[], stone: [] as THREE.BufferGeometry[], pot: [] as THREE.BufferGeometry[], zinc: [] as THREE.BufferGeometry[]};
  const box = (arr: THREE.BufferGeometry[], w: number, h: number, d: number, x: number, y: number, z: number, rx = 0) => { const b = new THREE.BoxGeometry(w, h, d); if (rx) b.rotateX(rx); b.translate(x, y, z); arr.push(b.toNonIndexed()); };
  box(g.brick, HW, EAVE, DEPTH, 0, EAVE / 2, -DEPTH / 2);
  const pitch = Math.atan2(RIDGE, DEPTH / 2), slope = Math.hypot(RIDGE, DEPTH / 2) + 0.3;
  for (const s of [1, -1]) box(g.slate, HW + 0.02, 0.08, slope, 0, EAVE + RIDGE / 2, -DEPTH / 2 + (s * DEPTH) / 4, s * pitch);
  box(g.stone, HW, 0.12, 0.08, 0, 3.2, 0.04);
  box(g.brick, 0.75, 2.4, 1.3, -HW / 2, EAVE + RIDGE * 0.7, -DEPTH * 0.45);
  for (let k = 0; k < 3; k++) { const c = new THREE.CylinderGeometry(0.11, 0.14, 0.55, 8); c.translate(-HW / 2, EAVE + RIDGE * 0.7 + 1.45, -DEPTH * 0.45 - 0.4 + k * 0.4); g.pot.push(c.toNonIndexed()); }
  // H aerial
  const ax = -HW / 2 + 0.42, ay = EAVE + RIDGE * 0.7 + 1.3, az = -DEPTH * 0.45;
  box(g.zinc, 0.03, 2.2, 0.03, ax, ay + 0.9, az); box(g.zinc, 1.5, 0.02, 0.02, ax, ay + 1.8, az); box(g.zinc, 1.2, 0.02, 0.02, ax, ay + 1.35, az);
  for (const s of [-1, 1]) { box(g.zinc, 0.02, 0.75, 0.02, ax + s * 0.75, ay + 1.8, az); box(g.zinc, 0.02, 0.75, 0.02, ax + s * 0.6, ay + 1.35, az); }
  const out: Record<string, THREE.BufferGeometry> = {};
  for (const [k, arr] of Object.entries(g)) out[k] = mergeGeometries(arr)!;
  return out;
}
/** window quads of one LOD house (front + back), local coords; instanced separately so each window can be lit or dark */
const WINS: [number, number, number, number, number][] = [[-0.65, 1.55, 1.6, 1.55, 1], [-1.1, 4.6, 1.05, 1.45, 1], [1.1, 4.6, 1.05, 1.45, 1], [1.55, 1.3, 0.85, 2.0, 1], [-0.6, 1.6, 1.3, 1.2, -1], [1.0, 4.6, 0.9, 1.2, -1]];

export type CityTex = {brick: PBR; slate: PBR; stone: PBR; lawn: PBR; asphalt: PBR};
export function buildCity(T: CityTex, focus: THREE.Vector3, opts: {mid?: number; far?: number; skip?: number} = {}) {
  const MID = opts.mid ?? 420, FAR = opts.far ?? 2600, root = new THREE.Group(), r = rng(17);
  const brick = P({map: rep(T.brick.map, 0.5), normalMap: rep(T.brick.normalMap, 0.5), roughness: 0.85});
  const slate = P({map: rep(T.slate.map, 0.8), normalMap: rep(T.slate.normalMap, 0.8), color: '#c9ccd6', roughness: 0.45, clearcoat: 0.5});
  const stone = P({color: '#e9dfca', roughness: 0.5}), pot = P({color: '#b9603e', roughness: 0.6}), zinc = new THREE.MeshStandardMaterial({color: '#b0b4b8', roughness: 0.3, metalness: 0.9});
  const geos = lodHouseGeos(), mats: Record<string, THREE.Material> = {brick, slate, stone, pot, zinc};
  // ---- mid tier: instanced LOD houses + instanced windows ----
  const mid = rowsAround(focus.x, focus.z, MID, opts.skip ?? 0);
  const M: THREE.Matrix4[] = mid.map((h) => new THREE.Matrix4().makeRotationY(h.face > 0 ? 0 : Math.PI).setPosition(h.x, 0, h.z));
  for (const [k, geo] of Object.entries(geos)) { const im = new THREE.InstancedMesh(geo, mats[k], M.length); M.forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = im.receiveShadow = true; root.add(im); }
  const winGeo = new THREE.PlaneGeometry(1, 1), nW = M.length * WINS.length;
  const winMat = P({color: '#ffffff', roughness: 0.05, clearcoat: 1, emissive: '#ffffff', emissiveIntensity: 1});
  winMat.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= vColor.rgb * step(0.5, vColor.r + vColor.g + vColor.b);'); };
  const win = new THREE.InstancedMesh(winGeo, winMat, nW), wm = new THREE.Matrix4(), c = new THREE.Color(); let wi = 0;
  M.forEach((m, i) => WINS.forEach(([x, y, w, h, side], j) => {
    const local = new THREE.Matrix4().makeRotationY(side > 0 ? 0 : Math.PI).setPosition(x * side, y, side > 0 ? 0.02 : -DEPTH - 0.02).scale(new THREE.Vector3(w, h, 1));
    wm.multiplyMatrices(m, local); win.setMatrixAt(wi, wm);
    const v = hash(i * 7 + j, 3); c.set(v < 0.45 ? '#ffb664' : v < 0.6 ? '#7d96d8' : '#14161c'); if (j === 3) c.set(v < 0.3 ? '#ffd08a' : '#2a1d14'); win.setColorAt(wi++, c);
  }));
  root.add(win);
  // smoke from a sample of mid chimneys
  for (let i = 0; i < mid.length; i += 37) { const h = mid[i], sm = smoke(9, i); sm.scale.setScalar(1.6); sm.position.set(h.x - HW / 2 * h.face, EAVE + RIDGE * 0.7 + 1.9, h.z - h.face * DEPTH * 0.45); root.add(sm); }
  // ---- far tier: 10-house blocks with lit facade texture ----
  const ff = farFacade(5), blockMat = new THREE.MeshStandardMaterial({map: ff.map, emissiveMap: ff.emissiveMap, emissive: '#ffffff', emissiveIntensity: 1.2, roughness: 0.9});
  const L = 10 * HW, block = new THREE.BoxGeometry(L, EAVE, DEPTH), roof = new THREE.CylinderGeometry(0.01, DEPTH / 2 + 0.2, RIDGE, 4, 1).rotateY(Math.PI / 4).scale(L / (DEPTH * 0.73), 1, 1);
  const FB: THREE.Matrix4[] = [], FR: THREE.Matrix4[] = [];
  for (let k = Math.floor((focus.z - FAR) / PERIOD); k <= Math.ceil((focus.z + FAR) / PERIOD); k++) for (const s of [-1, 1]) {
    const z = k * PERIOD + s * (FZ + DEPTH / 2);
    for (let xi = Math.floor((focus.x - FAR) / (L + 6)); xi <= Math.ceil((focus.x + FAR) / (L + 6)); xi++) {
      const x = xi * (L + 6) + (k % 3) * 11, d = Math.hypot(x - focus.x, z - focus.z); if (d < MID - 30 || d > FAR) continue;
      if (inRiver(x, z)) continue;
      const yj = hash(xi, k) * 0.8 + Math.max(0, (d - 1200) * 0.012) * hash(k, xi); // gentle rise toward the far hills
      FB.push(new THREE.Matrix4().makeRotationY(s > 0 ? Math.PI : 0).setPosition(x, EAVE / 2 + yj, z)); FR.push(new THREE.Matrix4().makeRotationY(s > 0 ? Math.PI : 0).setPosition(x, EAVE + RIDGE / 2 + yj, z));
    }
  }
  const inst = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], list: THREE.Matrix4[]) => { const im = new THREE.InstancedMesh(geo, mat as any, list.length); list.forEach((x, i) => im.setMatrixAt(i, x)); im.receiveShadow = true; root.add(im); };
  inst(block, [brick, brick, slate, brick, blockMat, blockMat], FB); inst(roof, slate, FR);
  // ---- ground: streets (asphalt), back gardens (lawn), lanes; trees in gardens ----
  const asph = P({map: rep(T.asphalt.map, 600), roughness: 0.8, color: '#9a98a0'});
  const ground = new THREE.Mesh(new THREE.CircleGeometry(FAR + 400, 64).rotateX(-Math.PI / 2), asph); ground.position.y = -0.05; root.add(ground);
  const lawn = P({map: rep(T.lawn.map, 1, 1), color: '#c8d8b0', roughness: 0.9});
  const gardens: THREE.Matrix4[] = [];
  for (let k = Math.floor((focus.z - MID) / PERIOD); k <= Math.ceil((focus.z + MID) / PERIOD); k++) {
    const zc = k * PERIOD + PERIOD / 2; // between the backs of two rows
    for (let x = focus.x - MID; x < focus.x + MID; x += 30) gardens.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.01, zc), new THREE.Quaternion(), new THREE.Vector3(30, 1, PERIOD - 2 * (FZ + DEPTH) - 3)));
  }
  inst(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), lawn, gardens);
  const leaf = P({color: '#4e7a36', roughness: 0.7}), trunk = P({color: '#4a3a2c', roughness: 0.9});
  const T1: THREE.Matrix4[] = [], T2: THREE.Matrix4[] = [];
  for (let i = 0; i < 1600; i++) {
    const k = Math.floor((r() - 0.5) * 2 * MID / PERIOD + focus.z / PERIOD), x = focus.x + (r() - 0.5) * 2 * MID, z = k * PERIOD + PERIOD / 2 + (r() - 0.5) * 8;
    if (Math.hypot(x - focus.x, z - focus.z) > MID) continue; const s = 2.5 + r() * 3;
    T1.push(new THREE.Matrix4().compose(new THREE.Vector3(x, s * 1.4, z), new THREE.Quaternion(), new THREE.Vector3(s, s * 0.9, s)));
    T2.push(new THREE.Matrix4().compose(new THREE.Vector3(x, s * 0.5, z), new THREE.Quaternion(), new THREE.Vector3(0.25, s, 0.25)));
  }
  inst(new THREE.IcosahedronGeometry(1, 2), leaf, T1); inst(new THREE.CylinderGeometry(1, 1.2, 1, 6), trunk, T2);
  // ---- landmarks: the Thames, Battersea Power Station, St Paul's ----
  root.add(landmarks(stone, brick));
  return root;
}
/** the river runs across the view ~1.3-1.6 km away */
export const inRiver = (x: number, z: number) => { const c = -1450 + 120 * Math.sin(x / 700); return z > c - 140 && z < c + 140; };
function landmarks(stone: THREE.Material, brick: THREE.Material) {
  const g = new THREE.Group();
  const water = new THREE.Mesh(new THREE.PlaneGeometry(9000, 280, 200, 1).rotateX(-Math.PI / 2), P({color: '#2a3048', roughness: 0.03, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.6}));
  const wp = water.geometry.attributes.position; for (let i = 0; i < wp.count; i++) wp.setZ(i, wp.getZ(i) + 120 * Math.sin(wp.getX(i) / 700)); water.geometry.computeVertexNormals();
  water.position.set(0, 0.02, -1450); g.add(water);
  // Battersea Power Station: brick hall, four white fluted chimneys, two smoking
  const bps = new THREE.Group(); bps.position.set(-650, 0, -1680); g.add(bps);
  const hall = new THREE.Mesh(new THREE.BoxGeometry(160, 50, 110), brick); hall.position.y = 25; bps.add(hall);
  const white = P({color: '#f1ede4', roughness: 0.35, clearcoat: 0.6});
  for (const [x, z] of [[-75, -50], [75, -50], [-75, 50], [75, 50]]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 6.5, 103, 24), white); ch.position.set(x, 51.5, z); bps.add(ch); const plume = smoke(14, x + z); plume.scale.setScalar(14); plume.position.set(x, 104, z); if (x < 0) bps.add(plume); }
  // St Paul's: drum, colonnade ring, dome, lantern, west towers
  const sp = new THREE.Group(); sp.position.set(900, 0, -1900); g.add(sp);
  const base = new THREE.Mesh(new THREE.BoxGeometry(150, 30, 60), stone); base.position.y = 15; sp.add(base);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 25, 40), stone); drum.position.y = 42; sp.add(drum);
  for (let k = 0; k < 32; k++) { const a = (k / 32) * Math.PI * 2, col = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 22, 8), stone); col.position.set(Math.cos(a) * 25, 41, Math.sin(a) * 25); sp.add(col); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(23, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.25, 1), P({color: '#9aa7aa', roughness: 0.35, metalness: 0.4})); dome.position.y = 54.5; sp.add(dome);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 12, 16), stone); lantern.position.y = 89; sp.add(lantern);
  const cross = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), P({color: '#e2b250', metalness: 1, roughness: 0.2})); cross.position.y = 97; sp.add(cross);
  for (const x of [-60, 60]) { const tw = new THREE.Mesh(new THREE.BoxGeometry(12, 50, 12), stone); tw.position.set(x, 25, 28); sp.add(tw); const cap = new THREE.Mesh(new THREE.ConeGeometry(7, 12, 8), stone); cap.position.set(x, 56, 28); sp.add(cap); }
  return g;
}
