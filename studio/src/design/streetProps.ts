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
