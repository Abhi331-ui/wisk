// A detailed generic 1950s British pontoon saloon (no real make), built in code. Length ~4.3 m, front = +z.
// Body: side silhouette with wheel arches extruded across the width, then sculpted (tumblehome, plan taper, crowned top).
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
const P = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(o);
const put = (g: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number] = [0, 0, 0], r: [number, number, number] = [0, 0, 0]) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
const WF = 1.32, WR = -1.27, WRAD = 0.33, ARCH = 0.43, W = 1.64;

/** extrude a side profile (z, y) across x, centred, then sculpt each vertex */
function sculpt(shape: THREE.Shape, width: number, bevel: number, f: (v: THREE.Vector3) => void) {
  const g = new THREE.ExtrudeGeometry(shape, {depth: width - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 12, curveSegments: 72, steps: 28});
  g.translate(0, 0, -(width - 2 * bevel) / 2); g.rotateY(Math.PI / 2); // shape x → world z, extrusion → world x
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); f(v); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
function bodyShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.12, 0.36);                                                  // rear, under the bumper
  s.bezierCurveTo(-2.2, 0.55, -2.18, 0.82, -2.0, 0.93);                    // rounded tail
  s.bezierCurveTo(-1.7, 0.99, -1.4, 1.0, -1.1, 1.0);                       // boot lid to the rear screen
  s.lineTo(0.9, 1.0);                                                     // belt line
  s.bezierCurveTo(1.3, 1.0, 1.75, 0.97, 2.0, 0.88);                        // bonnet
  s.bezierCurveTo(2.2, 0.8, 2.22, 0.5, 2.15, 0.34);                        // nose
  s.lineTo(WF + ARCH + 0.05, 0.3);
  s.absarc(WF, 0.36, ARCH, -0.05, Math.PI + 0.05, false);                 // front arch (counter-clockwise over the top)
  s.lineTo(WR + ARCH + 0.05, 0.3);
  s.absarc(WR, 0.36, ARCH, -0.05, Math.PI + 0.05, false);                 // rear arch
  s.lineTo(-2.12, 0.36);
  return s;
}
function cabinShape() {
  const s = new THREE.Shape();
  s.moveTo(-1.12, 0.96); s.bezierCurveTo(-0.98, 1.3, -0.82, 1.5, -0.55, 1.53); // rear screen
  s.lineTo(0.12, 1.53); s.bezierCurveTo(0.35, 1.52, 0.55, 1.35, 0.78, 0.96);      // roof → windscreen
  s.lineTo(-1.12, 0.96); return s;
}
function tyreGeo() {
  const pr: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI; pr.push(new THREE.Vector2(0.23 + Math.sin(a) * 0.1 * (1 - 0.15 * Math.cos(a * 2)), Math.cos(a) * 0.095)); }
  const g = new THREE.LatheGeometry(pr, 64); g.rotateZ(Math.PI / 2);
  const p = g.attributes.position; // tread: shallow grooves around the crown
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i), r = Math.hypot(y, z); if (r > 0.315) { const a = Math.atan2(z, y), k = 1 - 0.008 * (Math.sin(a * 64) > 0.4 ? 1 : 0); p.setY(i, y * k); p.setZ(i, z * k); } }
  g.computeVertexNormals(); return g;
}
export function carDetailed(paint: string, two?: string) {
  const g = new THREE.Group();
  const body = P({color: paint, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.02, metalness: 0.15});
  const roofM = P({color: two ?? paint, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.02, metalness: 0.15});
  const chrome = new THREE.MeshStandardMaterial({color: '#f4f4f4', roughness: 0.04, metalness: 1});
  const glass = P({color: '#1b232c', roughness: 0.0, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2.2, transparent: true, opacity: 0.88});
  const rubber = P({color: '#141414', roughness: 0.75}), wall = P({color: '#f1efe8', roughness: 0.55}), seam = new THREE.MeshBasicMaterial({color: '#0c0c0c'});
  // body + glasshouse
  put(g, sculpt(bodyShape(), W, 0.13, (v) => {
    const t = THREE.MathUtils.clamp((v.y - 0.62) / 0.4, 0, 1); v.x *= 1 - 0.07 * t * t;                       // tumblehome
    const e = Math.max(0, Math.abs(v.z) - 1.55) / 0.65; v.x *= 1 - 0.2 * e * e;                                 // plan taper at the ends
    if (v.y > 0.9) v.y += 0.035 * (1 - (v.x / (W / 2)) ** 2);                                                   // crowned bonnet/boot
  }), body);
  put(g, sculpt(cabinShape(), 1.4, 0.15, (v) => { const t = THREE.MathUtils.clamp((v.y - 0.96) / 0.57, 0, 1); v.x *= 1 - 0.22 * t * (2 - t); if (v.y > 1.5) v.y += 0.02 * (1 - (v.x / 0.6) ** 2); }), roofM);
  // windows (glass panels proud of the cabin surface) with chrome surrounds
  const side = (s: number, z0: number, z1: number) => {
    const sh = new THREE.Shape(); sh.moveTo(z0, 1.0); sh.lineTo(z1, 1.0); sh.lineTo(z1 - 0.12, 1.46); sh.lineTo(z0 + 0.08, 1.46); sh.lineTo(z0, 1.0);
    const geo = new THREE.ShapeGeometry(sh); geo.rotateY(s > 0 ? Math.PI / 2 : -Math.PI / 2);
    const m = put(g, geo, glass, [s * 0.64, 0, 0]); m.rotation.z = s * -0.08;
    const pts = sh.getPoints().map((q) => new THREE.Vector3(s * (0.645 - (q.y - 1.0) * 0.08), q.y, s > 0 ? -q.x : q.x));
    put(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 60, 0.009, 5, true), chrome).rotation.y = s > 0 ? Math.PI : 0;
  };
  for (const s of [-1, 1]) { side(s, -0.98, -0.18); side(s, -0.1, 0.62); }
  for (const s of [-1, 1]) put(g, new THREE.PlaneGeometry(0.6, 0.42), glass, [s * 0.31, 1.24, 0.62], [-0.95, s * 0.12, 0]);   // split windscreen
  put(g, new THREE.BoxGeometry(0.03, 0.45, 0.03), chrome, [0, 1.24, 0.65], [-0.95, 0, 0]);
  put(g, new THREE.PlaneGeometry(1.0, 0.36), glass, [0, 1.24, -0.93], [0.9, Math.PI, 0]);
  // door shut-lines, handles, chrome belt strip, sills
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - 0.05);
    for (const z of [0.66, -0.16, -0.99]) put(g, new THREE.BoxGeometry(0.006, 0.62, 0.006), seam, [x * 1.003, 0.68, z]);
    put(g, new THREE.BoxGeometry(0.006, 0.006, 1.65), seam, [x * 1.003, 0.38, -0.16]);
    for (const z of [0.5, -0.32]) put(g, new RoundedBoxGeometry(0.03, 0.03, 0.14, 2, 0.012), chrome, [s * (W / 2 - 0.02), 0.88, z]);
    put(g, new THREE.CylinderGeometry(0.008, 0.008, 3.6, 8).rotateX(Math.PI / 2), chrome, [s * (W / 2 - 0.025), 0.78, 0.0]);
  }
  // front: oval chrome grille with bars, headlamps in bezels, sidelights, wrap-around bumpers with overriders
  const gr = new THREE.Group(); gr.position.set(0, 0.62, 2.33); gr.rotation.x = -0.25; g.add(gr);
  put(gr, new THREE.TorusGeometry(0.28, 0.022, 10, 48).scale(1, 0.55, 1), chrome);
  put(gr, new THREE.CircleGeometry(0.27, 40).scale(1, 0.53, 1), P({color: '#0a0a0a', roughness: 0.5}), [0, 0, -0.01]);
  for (let k = -6; k <= 6; k++) put(gr, new THREE.BoxGeometry(0.012, 0.28 * Math.sqrt(1 - (k / 7) ** 2), 0.02), chrome, [k * 0.04, 0, 0]);
  for (const s of [-1, 1]) {
    put(g, new THREE.SphereGeometry(0.12, 28, 20, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), P({color: '#fffbf0', emissive: '#fff4d8', emissiveIntensity: 0.5, roughness: 0.02, clearcoat: 1}), [s * 0.56, 0.8, 2.17]);
    put(g, new THREE.TorusGeometry(0.125, 0.022, 10, 32), chrome, [s * 0.56, 0.8, 2.2]);
    put(g, new THREE.SphereGeometry(0.035, 12, 10), P({color: '#ffcf70', emissive: '#ff9a20', emissiveIntensity: 0.3}), [s * 0.42, 0.52, 2.34]);
    put(g, new THREE.BoxGeometry(0.1, 0.14, 0.04), P({color: '#a00e10', emissive: '#500000', emissiveIntensity: 0.6, roughness: 0.1, clearcoat: 1}), [s * 0.62, 0.72, -2.31]);
    put(g, new THREE.CylinderGeometry(0.035, 0.045, 0.16, 16), chrome, [s * 0.32, 0.4, 2.44]); // overriders
    put(g, new THREE.CylinderGeometry(0.035, 0.045, 0.16, 16), chrome, [s * 0.32, 0.4, -2.42]);
  }
  for (const z of [1, -1]) { // bumpers: a chrome blade following the plan curve of the nose/tail
    const pts = Array.from({length: 21}, (_, i) => { const u = i / 20 * 2 - 1; return new THREE.Vector3(u * 0.9, 0.4, z * (2.38 - 0.16 * u * u)); });
    put(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.055, 12), chrome).scale.set(1, 1.15, 1);
    put(g, new THREE.PlaneGeometry(0.52, 0.12), P({color: '#0b0b0b', roughness: 0.4}), [0, 0.56, z * 2.31], [z > 0 ? -0.2 : 0.2, z > 0 ? 0 : Math.PI, 0]); // plate (blank)
    for (let k = 0; k < 6; k++) put(g, new THREE.PlaneGeometry(0.045, 0.07), P({color: '#bfbfbf', roughness: 0.3, metalness: 0.8}), [-0.19 + k * 0.075, 0.56, z * 2.315], [0, z > 0 ? 0 : Math.PI, 0]);
  }
  // wheels: rounded tyres with tread, white walls, domed chrome hubcaps; dark wheel-arch liners
  const tg = tyreGeo();
  for (const [x, z] of [[-0.69, WF], [0.69, WF], [-0.69, WR], [0.69, WR]]) {
    const wg = new THREE.Group(); wg.position.set(x, WRAD, z); g.add(wg);
    put(wg, tg, rubber);
    const s = Math.sign(x);
    put(wg, new THREE.RingGeometry(0.2, 0.27, 48), wall, [s * 0.1, 0, 0], [0, s * Math.PI / 2, 0]);
    put(wg, new THREE.SphereGeometry(0.19, 32, 16, 0, Math.PI * 2, 0, 0.6).rotateZ(-s * Math.PI / 2), chrome, [s * -0.05, 0, 0]);
    put(wg, new THREE.CylinderGeometry(0.04, 0.04, 0.02, 20).rotateZ(Math.PI / 2), P({color: '#222', roughness: 0.3}), [s * 0.105, 0, 0]);
    put(g, new THREE.CylinderGeometry(ARCH - 0.02, ARCH - 0.02, 1.3, 32, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2), P({color: '#070707', roughness: 1, side: THREE.BackSide}), [0, 0.36, z]);
  }
  // wipers, mirror, bonnet mascot
  for (const s of [-1, 1]) put(g, new THREE.BoxGeometry(0.4, 0.012, 0.012), P({color: '#111', roughness: 0.4}), [s * 0.25, 1.03, 0.76], [0, 0, s * 0.35]);
  put(g, new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8), chrome, [-0.78, 1.08, 0.7], [0, 0, 0.6]); put(g, new THREE.SphereGeometry(0.05, 16, 12).scale(1, 0.7, 0.4), chrome, [-0.85, 1.16, 0.7]);
  put(g, new THREE.ConeGeometry(0.03, 0.1, 12).rotateX(Math.PI / 2), chrome, [0, 1.12, 2.05]);
  return g;
}
