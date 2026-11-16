// Element 1 — 1957 British console television, built entirely in code. Front faces -z, origin on the floor.
// Walnut-veneer cabinet (lacquer clearcoat, rounded bevels), ivory mask with a rounded-rect opening, curved CRT glass
// showing the broadcast, gold-fleck speaker cloth behind brass slats, knurled bakelite knobs with chrome caps, brass badge,
// splayed tapered legs with brass ferrules, lace doily + glass vase with daffodils on top.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {PBR} from '../engine/assets';

const rr = (w: number, h: number, r: number) => {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
};
const tex = (p: PBR, rx: number, ry: number, rot = 0) => {
  const c = (t?: THREE.Texture) => { if (!t) return undefined; const n = t.clone(); n.repeat.set(rx, ry); n.rotation = rot; n.center.set(0.5, 0.5); n.needsUpdate = true; return n; };
  return {map: c(p.map), normalMap: c(p.normalMap), roughnessMap: c(p.roughnessMap)};
};
/** lace doily alpha: concentric scallops + radial spokes + a mesh of holes */
function laceAlpha() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.translate(S / 2, S / 2); g.strokeStyle = '#fff'; g.fillStyle = '#fff';
  for (let r = 40; r < 480; r += 46) { g.lineWidth = 7; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
  for (let k = 0; k < 48; k++) { g.save(); g.rotate((k / 48) * Math.PI * 2); g.lineWidth = 5; g.beginPath(); g.moveTo(30, 0); g.lineTo(480, 0); g.stroke();
    for (let r = 70; r < 470; r += 46) { g.beginPath(); g.ellipse(r, 0, 12, 18, 0, 0, 7); g.stroke(); }
    g.beginPath(); g.arc(490, 0, 26, 0, 7); g.fill(); g.restore(); }
  g.beginPath(); g.arc(0, 0, 36, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); return t;
}
export function buildTV(P: {walnut: PBR; cloth: PBR}, screenTex: THREE.Texture) {
  const g = new THREE.Group();
  const W = 0.56, H = 0.5, D = 0.46, LEG = 0.44;
  const phys = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(o);
  const walnut = phys({...tex(P.walnut, 0.9, 0.8), color: '#c9a07c', clearcoat: 1, clearcoatRoughness: 0.06, roughness: 0.45, envMapIntensity: 1.3});
  const walnutDark = phys({...tex(P.walnut, 0.9, 0.8, Math.PI / 2), color: '#8a6448', clearcoat: 0.7, clearcoatRoughness: 0.16, roughness: 0.6});
  const ivory = phys({color: '#d8cdb2', roughness: 0.32, clearcoat: 0.35, clearcoatRoughness: 0.2});
  const bakelite = phys({color: '#1a0f0a', roughness: 0.24, clearcoat: 0.7, clearcoatRoughness: 0.08});
  const chrome = new THREE.MeshStandardMaterial({color: '#e6e6e6', roughness: 0.07, metalness: 1});
  const brass = new THREE.MeshStandardMaterial({color: '#d2a560', roughness: 0.26, metalness: 1});
  const cloth = phys({...tex(P.cloth, 5, 1.4), color: '#c8a874', roughness: 0.95, sheen: 0.7, sheenColor: new THREE.Color('#f2d9a0'), sheenRoughness: 0.5});
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, rot?: THREE.Euler) => {
    const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); if (rot) me.rotation.copy(rot); me.castShadow = me.receiveShadow = true; g.add(me); return me;
  };
  // cabinet + inset front panel + plinth
  add(new RoundedBoxGeometry(W, H, D, 5, 0.016), walnut, 0, LEG + H / 2, 0);
  add(new RoundedBoxGeometry(W - 0.03, H - 0.03, 0.012, 3, 0.004), walnutDark, 0, LEG + H / 2, -D / 2 - 0.002);
  add(new RoundedBoxGeometry(W - 0.02, 0.035, D - 0.02, 3, 0.006), walnutDark, 0, LEG + 0.012, 0);
  // ivory mask with a rounded-rect screen opening (extruded, bevelled)
  const sy = LEG + H * 0.6, sx = -0.02;
  const maskShape = rr(0.42, 0.33, 0.03); maskShape.holes.push(rr(0.34, 0.255, 0.045) as any);
  const mg = new THREE.ExtrudeGeometry(maskShape, {depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 4, curveSegments: 24});
  add(mg, ivory, sx, sy, -D / 2 - 0.018);
  // curved CRT: rounded-rect grid bulging toward the viewer, UVs over the picture
  const nx = 64, nz = 48, a = 0.172, c = 0.13, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
    const u = (i / nx) * 2 - 1, v = (j / nz) * 2 - 1, su = u * (1 - 0.18 * v * v), sv = v * (1 - 0.18 * u * u);
    pos.push(su * a, sv * c, 0.014 * (1 - su * su) * (1 - sv * sv)); uv.push(i / nx, j / nz);
  }
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const k = i * (nz + 1) + j; idx.push(k, k + nz + 1, k + 1, k + 1, k + nz + 1, k + nz + 2); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); sg.setIndex(idx); sg.computeVertexNormals();
  const screen = phys({color: '#0a0c0c', emissive: '#ffffff', emissiveMap: screenTex, emissiveIntensity: 1.8, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.01, envMapIntensity: 2.5});
  const scr = add(sg, screen, sx, sy, -D / 2 - 0.004); scr.rotation.y = Math.PI; scr.scale.x = -1;
  // speaker: cloth behind 5 brass slats in a brass frame
  add(new THREE.BoxGeometry(0.3, 0.075, 0.006), cloth, -0.06, LEG + 0.085, -D / 2 - 0.009);
  for (let k = 0; k < 5; k++) add(new THREE.CylinderGeometry(0.0025, 0.0025, 0.3, 12), brass, -0.06, LEG + 0.055 + k * 0.015, -D / 2 - 0.014, new THREE.Euler(0, 0, Math.PI / 2));
  for (const [w2, h2, x2, y2] of [[0.318, 0.006, -0.06, LEG + 0.13], [0.318, 0.006, -0.06, LEG + 0.04], [0.006, 0.092, -0.219, LEG + 0.085], [0.006, 0.092, 0.099, LEG + 0.085]])
    add(new RoundedBoxGeometry(w2, h2, 0.01, 2, 0.002), brass, x2, y2, -D / 2 - 0.012);
  // knobs: knurled bakelite + chrome cap + ivory pointer
  const knurl = new THREE.InstancedMesh(new RoundedBoxGeometry(0.003, 0.004, 0.02, 1, 0.0008), bakelite, 56); let ki = 0;
  for (const ky of [LEG + 0.12, LEG + 0.05]) {
    add(new THREE.CylinderGeometry(0.024, 0.025, 0.026, 64), bakelite, 0.185, ky, -D / 2 - 0.022, new THREE.Euler(Math.PI / 2, 0, 0));
    for (let q = 0; q < 28; q++) { const t = (q / 28) * Math.PI * 2, m = new THREE.Matrix4().makeRotationZ(t).setPosition(0.185 + Math.cos(t) * 0.0247, ky + Math.sin(t) * 0.0247, -D / 2 - 0.022); knurl.setMatrixAt(ki++, m); }
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 48), chrome, 0.185, ky, -D / 2 - 0.036, new THREE.Euler(Math.PI / 2, 0, 0));
    add(new THREE.BoxGeometry(0.002, 0.012, 0.003), ivory, 0.185, ky + 0.006, -D / 2 - 0.038);
  }
  knurl.castShadow = true; g.add(knurl);
  add(new THREE.CylinderGeometry(0.016, 0.016, 0.003, 48), brass, 0.185, LEG + 0.205, -D / 2 - 0.01, new THREE.Euler(Math.PI / 2, 0, 0));
  // splayed tapered legs with brass ferrules
  for (const sx2 of [-1, 1]) for (const sz of [-1, 1]) {
    const top = new THREE.Vector3(sx2 * (W / 2 - 0.06), LEG, sz * (D / 2 - 0.06)), foot = top.clone().add(new THREE.Vector3(sx2 * 0.05, -LEG, sz * 0.04));
    const d = top.clone().sub(foot), L = d.length(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    const leg = add(new THREE.CylinderGeometry(0.019, 0.011, L - 0.035, 24), walnut, 0, 0, 0); leg.quaternion.copy(q); leg.position.copy(foot.clone().add(d.clone().multiplyScalar(0.5)).add(d.clone().normalize().multiplyScalar(0.0175)));
    const fe = add(new THREE.CylinderGeometry(0.0115, 0.009, 0.04, 24), brass, 0, 0, 0); fe.quaternion.copy(q); fe.position.copy(foot.clone().add(d.clone().normalize().multiplyScalar(0.02)));
  }
  // lace doily + glass vase + daffodils
  const lace = new THREE.MeshStandardMaterial({color: '#efe9dc', roughness: 0.9, alphaMap: laceAlpha(), alphaTest: 0.5, side: THREE.DoubleSide});
  add(new THREE.CircleGeometry(0.15, 96), lace, 0.05, LEG + H + 0.002, 0.02, new THREE.Euler(-Math.PI / 2, 0, 0));
  const vaseProf = [[0.0, 0], [0.028, 0], [0.033, 0.03], [0.03, 0.08], [0.022, 0.12], [0.024, 0.135], [0.021, 0.135], [0.019, 0.12], [0.027, 0.08], [0.03, 0.03], [0.025, 0.004], [0, 0.004]].map(([x, y]) => new THREE.Vector2(x, y));
  const glass = phys({color: '#e8f4ee', roughness: 0.03, transmission: 1, thickness: 0.004, ior: 1.5});
  add(new THREE.LatheGeometry(vaseProf, 48), glass, 0.05, LEG + H + 0.003, 0.02);
  const stem = new THREE.MeshStandardMaterial({color: '#3d5a22', roughness: 0.55}), petal = phys({color: '#f4c21c', roughness: 0.45, sheen: 0.5, sheenColor: new THREE.Color('#fff2a0')}), trumpet = phys({color: '#f99a12', roughness: 0.4});
  for (const [dx, dz, hgt, lean] of [[-0.012, 0.004, 0.24, 0.12], [0.012, -0.006, 0.27, -0.1], [0.004, 0.012, 0.22, 0.25]]) {
    const base = new THREE.Vector3(0.05 + dx, LEG + H + 0.01, 0.02 + dz), top = base.clone().add(new THREE.Vector3(Math.sin(lean) * hgt * 0.35, hgt, -0.02));
    const curve = new THREE.QuadraticBezierCurve3(base, base.clone().add(new THREE.Vector3(0, hgt * 0.6, 0)), top);
    add(new THREE.TubeGeometry(curve, 16, 0.0028, 6), stem, 0, 0, 0);
    const head = new THREE.Group(); head.position.copy(top); head.rotation.set(-0.5, lean * 2, 0); g.add(head);
    for (let k = 0; k < 6; k++) { const t = (k / 6) * Math.PI * 2, pm = new THREE.Mesh(new THREE.SphereGeometry(0.026, 18, 10), petal); pm.scale.set(0.55, 1, 0.22); pm.position.set(Math.cos(t) * 0.024, Math.sin(t) * 0.024, 0); pm.rotation.z = t - Math.PI / 2; pm.castShadow = true; head.add(pm); }
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.008, 0.032, 24, 1, true), trumpet); tr.material.side = THREE.DoubleSide; tr.rotation.x = Math.PI / 2; tr.position.z = -0.016; head.add(tr);
  }
  return g;
}
