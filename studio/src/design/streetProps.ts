// Street furniture + vehicles for element 4, all built in code: Victorian gas lamp, red pillar box, telephone pole,
// a generic rounded 1950s British saloon car (no real make), chimney smoke puffs.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
const P = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(o);
const put = (g: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number], r: [number, number, number] = [0, 0, 0]) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.castShadow = o.receiveShadow = true; g.add(o); return o; };

export function lampPost(withLight = true) {
  const g = new THREE.Group(), iron = P({color: '#1d2a24', roughness: 0.3, clearcoat: 0.8});
  put(g, new THREE.CylinderGeometry(0.2, 0.26, 0.5, 16), iron, [0, 0.25, 0]); put(g, new THREE.CylinderGeometry(0.09, 0.14, 0.8, 16), iron, [0, 0.85, 0]);
  put(g, new THREE.CylinderGeometry(0.06, 0.08, 2.4, 16), iron, [0, 2.4, 0]); put(g, new THREE.TorusGeometry(0.08, 0.02, 8, 16).rotateX(Math.PI / 2), iron, [0, 3.6, 0]);
  put(g, new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8).rotateZ(Math.PI / 2), iron, [0, 3.3, 0]);
  put(g, new THREE.CylinderGeometry(0.22, 0.12, 0.45, 4, 1, true).rotateY(Math.PI / 4), P({color: '#fff3d6', emissive: '#ffcf80', emissiveIntensity: 2.2, transparent: true, opacity: 0.85, roughness: 0.1}), [0, 3.95, 0]);
  put(g, new THREE.ConeGeometry(0.28, 0.25, 4).rotateY(Math.PI / 4), iron, [0, 4.3, 0]); put(g, new THREE.SphereGeometry(0.05, 10, 8), iron, [0, 4.45, 0]);
  if (withLight) { const l = new THREE.PointLight('#ffc070', 6, 10, 2); l.position.y = 3.95; g.add(l); }
  return g;
}
export function pillarBox() {
  const g = new THREE.Group(), red = P({color: '#c4161c', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05}), black = P({color: '#111', roughness: 0.4});
  put(g, new THREE.CylinderGeometry(0.3, 0.3, 0.12, 32), black, [0, 0.06, 0]); put(g, new THREE.CylinderGeometry(0.27, 0.27, 1.2, 40), red, [0, 0.72, 0]);
  put(g, new THREE.CylinderGeometry(0.31, 0.29, 0.08, 40), red, [0, 1.34, 0]); put(g, new THREE.SphereGeometry(0.29, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1), red, [0, 1.38, 0]);
  put(g, new THREE.BoxGeometry(0.26, 0.04, 0.04), black, [0, 1.15, 0.27]); put(g, new THREE.BoxGeometry(0.2, 0.26, 0.02), red, [0, 0.82, 0.27]);
  return g;
}
export function telePole() {
  const g = new THREE.Group(), wood = P({color: '#5a4636', roughness: 0.8}), porc = P({color: '#efece4', roughness: 0.2, clearcoat: 1});
  put(g, new THREE.CylinderGeometry(0.1, 0.15, 9, 12), wood, [0, 4.5, 0]);
  const tops: THREE.Vector3[] = [];
  for (const [y, w] of [[8.5, 1.6], [7.9, 1.2]] as const) { put(g, new THREE.BoxGeometry(w, 0.1, 0.1), wood, [0, y, 0]); for (let k = 0; k < 4; k++) { const x = -w / 2 + 0.1 + (k * (w - 0.2)) / 3; put(g, new THREE.CylinderGeometry(0.03, 0.04, 0.1, 10), porc, [x, y + 0.1, 0]); tops.push(new THREE.Vector3(x, y + 0.16, 0)); } }
  (g as any).userData.tops = tops; return g;
}
export function wire(a: THREE.Vector3, b: THREE.Vector3, sag: number, m: THREE.Material) {
  const pts = Array.from({length: 17}, (_, i) => { const u = i / 16; return a.clone().lerp(b, u).add(new THREE.Vector3(0, -sag * 4 * u * (1 - u), 0)); });
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.008, 4), m);
}
/** generic rounded 1950s saloon: separate front wings, bulbous bonnet, split windscreen, chrome bumpers + grille, white-wall tyres */
export function car1950s(paint: string) {
  const g = new THREE.Group();
  const body = P({color: paint, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, metalness: 0.1});
  const chrome = new THREE.MeshStandardMaterial({color: '#f0f0f0', roughness: 0.06, metalness: 1}), glass = P({color: '#2a3340', roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.75});
  const tyre = P({color: '#151515', roughness: 0.8}), white = P({color: '#f2f0ea', roughness: 0.5});
  const lowBody = new RoundedBoxGeometry(1.55, 0.55, 3.7, 6, 0.24); const lp = lowBody.attributes.position;
  for (let i = 0; i < lp.count; i++) { const z = lp.getZ(i), y = lp.getY(i); if (y > 0) lp.setY(i, y + 0.05 * Math.cos((z / 1.85) * Math.PI * 0.5)); if (Math.abs(z) > 1.4) lp.setX(i, lp.getX(i) * (1 - 0.15 * (Math.abs(z) - 1.4))); }
  lowBody.computeVertexNormals(); put(g, lowBody, body, [0, 0.62, 0]);
  const cabin = new RoundedBoxGeometry(1.3, 0.55, 1.75, 6, 0.26); const cp = cabin.attributes.position;
  for (let i = 0; i < cp.count; i++) { const y = cp.getY(i); if (y > 0) { cp.setX(i, cp.getX(i) * 0.9); cp.setZ(i, cp.getZ(i) * 0.85 - 0.05); } } cabin.computeVertexNormals();
  put(g, cabin, body, [0, 1.12, -0.25]);
  for (const s of [-1, 1]) { // side windows + split windscreen + rear window
    put(g, new THREE.PlaneGeometry(1.35, 0.36), glass, [s * 0.6, 1.15, -0.28], [0, s * Math.PI / 2, 0]);
    put(g, new THREE.PlaneGeometry(0.52, 0.34), glass, [s * 0.28, 1.15, 0.58], [-0.45, 0, 0]);
  }
  put(g, new THREE.PlaneGeometry(0.9, 0.3), glass, [0, 1.15, -1.1], [0.5, Math.PI, 0]);
  for (const [x, z] of [[-0.68, 1.15], [0.68, 1.15], [-0.68, -1.2], [0.68, -1.2]]) { // wheels + wing bulges
    put(g, new THREE.CylinderGeometry(0.33, 0.33, 0.2, 28).rotateZ(Math.PI / 2), tyre, [x, 0.33, z]);
    put(g, new THREE.CylinderGeometry(0.2, 0.2, 0.21, 28).rotateZ(Math.PI / 2), white, [x, 0.33, z]);
    put(g, new THREE.CylinderGeometry(0.12, 0.12, 0.22, 24).rotateZ(Math.PI / 2), chrome, [x, 0.33, z]);
    put(g, new THREE.SphereGeometry(0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.5, 0.75, 1.1), body, [x * 1.02, 0.5, z]);
  }
  for (const z of [1.92, -1.92]) put(g, new RoundedBoxGeometry(1.6, 0.12, 0.12, 3, 0.05), chrome, [0, 0.42, z]);
  put(g, new RoundedBoxGeometry(0.5, 0.26, 0.04, 2, 0.02), chrome, [0, 0.62, 1.86]);
  for (let k = 0; k < 6; k++) put(g, new THREE.BoxGeometry(0.44, 0.012, 0.02), P({color: '#222'}), [0, 0.52 + k * 0.04, 1.885]);
  for (const s of [-1, 1]) { put(g, new THREE.SphereGeometry(0.11, 20, 14), P({color: '#fff8e8', emissive: '#fff0c8', emissiveIntensity: 0.6, roughness: 0.05}), [s * 0.55, 0.78, 1.72]); put(g, new THREE.TorusGeometry(0.11, 0.018, 8, 24), chrome, [s * 0.55, 0.78, 1.8]); }
  for (const s of [-1, 1]) put(g, new THREE.BoxGeometry(0.1, 0.12, 0.03), P({color: '#a01010', emissive: '#600000', emissiveIntensity: 0.4}), [s * 0.6, 0.78, -1.86]);
  return g;
}
/** a soft rising smoke plume made of camera-facing puff sprites (static shape, drifts with t) */
let _puff: THREE.Texture | null = null;
export function smoke(n = 10, seed = 1) {
  if (!_puff) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!; const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); _puff = new THREE.CanvasTexture(c); }
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({map: _puff, color: '#d8d4dc', transparent: true, depthWrite: false, opacity: 0.6 * (1 - i / n)})); const k = 0.3 + i * 0.22; s.scale.set(k, k, 1); s.position.set(Math.sin(i * 0.7 + seed) * 0.15 + i * 0.12, i * 0.35, Math.cos(i + seed) * 0.08); g.add(s); }
  return g;
}

/** cast-iron manhole cover with a raised grid pattern */
export function manhole() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!;
  x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#c8c8c8';
  for (let i = 0; i < 256; i += 24) for (let j = 0; j < 256; j += 24) x.fillRect(i + 4, j + 4, 14, 14);
  x.strokeStyle = '#ffffff'; x.lineWidth = 10; x.beginPath(); x.arc(128, 128, 118, 0, 7); x.stroke();
  const bump = new THREE.CanvasTexture(c);
  return new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.02, 40), P({color: '#2c2b2a', roughness: 0.45, metalness: 0.6, bumpMap: bump, bumpScale: 2}));
}
export function drainGrate() {
  const g = new THREE.Group(), iron = P({color: '#1e1d1c', roughness: 0.4, metalness: 0.6});
  put(g, new THREE.BoxGeometry(0.5, 0.02, 0.34), P({color: '#050505', roughness: 1}), [0, 0.0, 0]);
  for (let k = 0; k < 9; k++) put(g, new THREE.BoxGeometry(0.02, 0.025, 0.34), iron, [-0.22 + k * 0.055, 0.01, 0]);
  put(g, new THREE.BoxGeometry(0.52, 0.025, 0.02), iron, [0, 0.01, 0.17]); put(g, new THREE.BoxGeometry(0.52, 0.025, 0.02), iron, [0, 0.01, -0.17]);
  return g;
}
/** still rain puddle: mirror-smooth dark water reflecting the sky */
export function puddle(w: number, d: number, seed = 1) {
  const sh = new THREE.Shape(); for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2, r = 1 + 0.18 * Math.sin(a * 3 + seed) + 0.1 * Math.sin(a * 5 + seed * 2); const px = Math.cos(a) * r * w / 2, py = Math.sin(a) * r * d / 2; i ? sh.lineTo(px, py) : sh.moveTo(px, py); }
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 24).rotateX(-Math.PI / 2), P({color: '#0c0e13', roughness: 0.04, metalness: 0.75, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.3}));
  m.userData.water = true; return m;
}
/** fallen leaves (plane-tree brown/ochre) scattered in a strip */
export function leafLitter(len: number, wid: number, n: number, seed = 2) {
  let r = seed * 7919; const rnd = () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; };
  const im = new THREE.InstancedMesh(new THREE.CircleGeometry(0.035, 6).scale(1, 1.4, 1).rotateX(-Math.PI / 2), P({color: '#ffffff', roughness: 0.8, side: THREE.DoubleSide}), n);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < n; i++) { m4.compose(new THREE.Vector3((rnd() - 0.5) * len, 0.005 + rnd() * 0.01, (rnd() - 0.5) * wid * Math.pow(rnd(), 0.5)), new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.6, rnd() * 6.28, (rnd() - 0.5) * 0.6)), new THREE.Vector3(1, 1, 1).multiplyScalar(0.7 + rnd() * 0.8)); im.setMatrixAt(i, m4); im.setColorAt(i, c.setHSL(0.07 + rnd() * 0.05, 0.55 + rnd() * 0.25, 0.22 + rnd() * 0.2)); }
  im.receiveShadow = true; return im;
}
/** 1950s roadster bicycle (black frame, chrome, leather saddle, basket) */
export function bicycle() {
  const g = new THREE.Group(), frame = P({color: '#121212', roughness: 0.2, clearcoat: 1}), chrome = new THREE.MeshStandardMaterial({color: '#e8e8e8', roughness: 0.08, metalness: 1}), tyre = P({color: '#1a1a1a', roughness: 0.8}), leather = P({color: '#5a3a22', roughness: 0.45, clearcoat: 0.4});
  const tube = (a: number[], b: number[], r = 0.016, m: THREE.Material = frame) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A); const o = put(g, new THREE.CylinderGeometry(r, r, d.length(), 10), m, A.clone().add(B).multiplyScalar(0.5).toArray() as any); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
  for (const z of [0.55, -0.52]) {
    put(g, new THREE.TorusGeometry(0.33, 0.022, 10, 48).rotateY(Math.PI / 2), tyre, [0, 0.35, z]); put(g, new THREE.TorusGeometry(0.31, 0.008, 6, 48).rotateY(Math.PI / 2), chrome, [0, 0.35, z]);
    for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; tube([0, 0.35, z], [0, 0.35 + Math.sin(a) * 0.31, z + Math.cos(a) * 0.31], 0.0015, chrome); }
    put(g, new THREE.CylinderGeometry(0.03, 0.03, 0.06, 12).rotateZ(Math.PI / 2), chrome, [0, 0.35, z]);
  }
  const BB = [0, 0.33, 0], ST = [0, 0.86, -0.12], HT = [0, 0.88, 0.42], HB = [0, 0.62, 0.48];
  tube(BB, ST); tube(ST, HT); tube(BB, HB); tube(HT, HB, 0.02); tube(BB, [0, 0.35, -0.52]); tube(ST, [0, 0.35, -0.52], 0.012); tube(HB, [0, 0.35, 0.55], 0.014, chrome); tube(HT, [0, 1.0, 0.38], 0.014, chrome);
  tube([-0.25, 1.02, 0.34], [0.25, 1.02, 0.34], 0.011, chrome);
  put(g, new THREE.SphereGeometry(0.1, 16, 10).scale(0.8, 0.35, 1.3), leather, [0, 0.95, -0.15]);
  put(g, new THREE.CylinderGeometry(0.13, 0.11, 0.18, 20, 1, true), P({color: '#a88a5a', roughness: 0.9, side: THREE.DoubleSide}), [0, 0.88, 0.6]);
  put(g, new THREE.TorusGeometry(0.09, 0.012, 8, 24).rotateY(Math.PI / 2), chrome, [0, 0.33, 0]);
  return g;
}
/** cottage-garden flowers in a bed (wallflowers, marigolds, forget-me-nots) */
export function flowerBed(w: number, d: number, seed = 5) {
  let r = seed * 104729; const rnd = () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; };
  const g = new THREE.Group(), n = Math.floor(w * d * 220);
  const leaf = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6).scale(1, 0.6, 1), P({color: '#3f6e2e', roughness: 0.6}), n);
  const bloom = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 10, 8), P({color: '#ffffff', roughness: 0.45, sheen: 0.5}), n);
  const cols = ['#e2462a', '#f2b42c', '#7a3fa8', '#6aa0e6', '#f3eee0', '#c8184a'], m4 = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < n; i++) { const x = (rnd() - 0.5) * w, z = (rnd() - 0.5) * d, h = 0.08 + rnd() * 0.25;
    m4.makeTranslation(x, h * 0.6, z); leaf.setMatrixAt(i, m4); m4.makeTranslation(x + (rnd() - 0.5) * 0.03, h, z); bloom.setMatrixAt(i, m4); bloom.setColorAt(i, c.set(cols[Math.floor(rnd() * cols.length)])); }
  leaf.castShadow = bloom.castShadow = true; g.add(leaf, bloom); return g;
}
