// Element 2 — the 1957 front room, every object built in code. Room: x[-1.6,1.6], z[-2,2], h 2.75; front wall (z=-2)
// has the sash window to the street; chimney breast on the west wall (x=-1.6); door on the back wall.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {PBR} from '../engine/assets';

export const RW = 3.2, RD = 4.0, RH = 2.75;
const phys = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(o);
const rep = (t: THREE.Texture | undefined, rx: number, ry: number) => { if (!t) return undefined; const n = t.clone(); n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(rx, ry); n.needsUpdate = true; return n; };
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number], r: [number, number, number] = [0, 0, 0], parent?: THREE.Object3D) => {
  const o = new THREE.Mesh(g, m); o.position.set(...p); o.rotation.set(...r); o.castShadow = o.receiveShadow = true; parent?.add(o); return o;
};
/** cushion: rounded box whose top/front faces puff outward (soft, slightly sagging) */
const cushion = (w: number, h: number, d: number, puff = 0.18, r = 0.035) => {
  const g = new RoundedBoxGeometry(w, h, d, 6, r), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2), y = p.getY(i) / (h / 2), z = p.getZ(i) / (d / 2);
    const k = (1 - x * x) * (1 - z * z); if (y > 0.2) p.setY(i, p.getY(i) + puff * h * k * (y - 0.2));
    const kz = (1 - x * x) * (1 - y * y * 0.6); if (z < -0.3) p.setZ(i, p.getZ(i) - puff * 0.5 * d * kz * 0.25);
  }
  g.computeVertexNormals(); return g;
};
export type RoomTex = {floor: PBR; walnut: PBR; fabricN: PBR; plaster: PBR; wallpaper: THREE.Texture; moquette: THREE.Texture; chintz: THREE.Texture; tiles: THREE.Texture; rug: THREE.Texture; rugN: PBR};

export function buildRoom(T: RoomTex) {
  const g = new THREE.Group();
  const walnut = phys({map: rep(T.walnut.map, 1.2, 1.2), normalMap: rep(T.walnut.normalMap, 1.2, 1.2), color: '#c9a07c', clearcoat: 0.9, clearcoatRoughness: 0.1, roughness: 0.45});
  const wpMat = (w: number, h: number) => new THREE.MeshStandardMaterial({map: rep(T.wallpaper, w / 0.68, h / 0.68), roughness: 0.85});
  const paint = phys({color: '#dfd8c6', roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.25});
  const ceiling = new THREE.MeshStandardMaterial({map: rep(T.plaster.map, 2, 2), normalMap: rep(T.plaster.normalMap, 2, 2), color: '#f1ece0', roughness: 0.95});
  const moq = phys({map: rep(T.moquette, 3, 3), normalMap: rep(T.fabricN.normalMap, 6, 6), normalScale: new THREE.Vector2(0.6, 0.6), color: '#ffffff', roughness: 0.9, sheen: 0.8, sheenColor: new THREE.Color('#d9a982'), sheenRoughness: 0.6});
  const brass = new THREE.MeshStandardMaterial({color: '#d2a560', roughness: 0.25, metalness: 1});
  // ---- shell: floor, ceiling, walls with window + door openings, skirting, picture rail ----
  mesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshStandardMaterial({map: rep(T.floor.map, RW / 1.4, RD / 1.4), normalMap: rep(T.floor.normalMap, RW / 1.4, RD / 1.4), roughnessMap: rep(T.floor.roughnessMap, RW / 1.4, RD / 1.4)}), [0, 0, 0], [-Math.PI / 2, 0, 0], g);
  mesh(new THREE.PlaneGeometry(RW, RD), ceiling, [0, RH, 0], [Math.PI / 2, 0, 0], g);
  const wall = (len: number, holes: [number, number, number, number][], at: [number, number, number], ry: number) => {
    // wall as a shape with rectangular holes (a0, a1 along the wall from its left end; y0, y1)
    const s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2, RH); s.lineTo(-len / 2, RH); s.lineTo(-len / 2, 0);
    for (const [a0, a1, y0, y1] of holes) { const h = new THREE.Path(); h.moveTo(a0, y0); h.lineTo(a0, y1); h.lineTo(a1, y1); h.lineTo(a1, y0); h.lineTo(a0, y0); s.holes.push(h); }
    const geo = new THREE.ShapeGeometry(s); const uv = geo.attributes.uv, p = geo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + len / 2) / 0.68, p.getY(i) / 0.68);
    const m = new THREE.MeshStandardMaterial({map: rep(T.wallpaper, 1, 1), roughness: 0.85});
    return mesh(geo, m, at, [0, ry, 0], g);
  };
  wall(RW, [[-0.8, 0.8, 0.8, 2.35]], [0, 0, -RD / 2], 0);               // front: sash window
  wall(RW, [[0.5, 1.35, 0, 2.08]], [0, 0, RD / 2], Math.PI);           // back: door (on the right as seen from inside)
  wall(RD, [], [-RW / 2, 0, 0], Math.PI / 2); wall(RD, [], [RW / 2, 0, 0], -Math.PI / 2);
  for (const [len, x, z, ry] of [[RW, 0, -RD / 2 + 0.012, 0], [RW, 0, RD / 2 - 0.012, Math.PI], [RD, -RW / 2 + 0.012, 0, Math.PI / 2], [RD, RW / 2 - 0.012, 0, -Math.PI / 2]] as const) {
    mesh(new RoundedBoxGeometry(len, 0.17, 0.025, 2, 0.006), paint, [x, 0.085, z], [0, ry, 0], g);
    mesh(new RoundedBoxGeometry(len, 0.035, 0.022, 2, 0.006), paint, [x, 2.2, z], [0, ry, 0], g); // picture rail
    mesh(new RoundedBoxGeometry(len, 0.07, 0.05, 2, 0.01), paint, [x, RH - 0.035, z], [0, ry, 0], g); // cornice
  }
  // ---- sash window: frame, two sashes with glazing bars, sill, nets + chintz drapes on a rail with pelmet ----
  const win = new THREE.Group(); win.position.set(0, 0, -RD / 2); g.add(win);
  const frameM = phys({color: '#efeae0', roughness: 0.28, clearcoat: 0.5});
  for (const [w, h, x, y] of [[1.66, 0.08, 0, 2.39], [1.66, 0.06, 0, 0.77], [0.08, 1.62, -0.83, 1.575], [0.08, 1.62, 0.83, 1.575], [1.6, 0.05, 0, 1.575], [0.035, 1.55, 0, 1.575], [1.6, 0.03, 0, 1.98], [1.6, 0.03, 0, 1.18]])
    mesh(new RoundedBoxGeometry(w, h, 0.09, 2, 0.008), frameM, [x, y, -0.02], [0, 0, 0], win);
  mesh(new RoundedBoxGeometry(1.86, 0.04, 0.22, 2, 0.01), frameM, [0, 0.76, 0.08], [0, 0, 0], win); // inner sill
  const glassM = phys({color: '#ffffff', roughness: 0.02, transmission: 1, thickness: 0.004, ior: 1.52});
  mesh(new THREE.PlaneGeometry(1.6, 1.55), glassM, [0, 1.575, -0.04], [0, 0, 0], win);
  // nets: lace half-panels with soft vertical folds
  const lace = laceAlpha();
  const folds = (w: number, h: number, depth: number, n: number) => { const geo = new THREE.PlaneGeometry(w, h, 80, 4), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin((x / w) * Math.PI * 2 * n) * depth); } geo.computeVertexNormals(); return geo; };
  const netM = new THREE.MeshStandardMaterial({color: '#f2efe6', alphaMap: lace, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 1, transparent: false});
  netM.alphaMap!.repeat.set(4, 2);
  mesh(folds(1.62, 0.8, 0.012, 9), netM, [0, 1.17, 0.05], [0, 0, 0], win);
  const chintz = phys({map: rep(T.chintz, 1.2, 1.6), normalMap: rep(T.fabricN.normalMap, 8, 8), normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.85, sheen: 0.5, sheenColor: new THREE.Color('#f0d8c0'), side: THREE.DoubleSide});
  for (const s of [-1, 1]) mesh(folds(0.62, 2.25, 0.045, 3.5), chintz, [s * 1.02, 1.32, 0.16], [0, 0, 0], win);
  mesh(new RoundedBoxGeometry(2.5, 0.2, 0.08, 2, 0.015), chintz, [0, 2.5, 0.2], [0, 0, 0], win); // pelmet
  // ---- chimney breast with a 1950s tiled fireplace, coal fire, mantel, mirror ----
  const fp = new THREE.Group(); fp.position.set(-RW / 2, 0, 0.05); fp.rotation.y = Math.PI / 2; g.add(fp); // local +z points into the room
  mesh(new THREE.BoxGeometry(1.5, RH, 0.42), wpMat(1.5, RH), [0, RH / 2, 0.21], [0, 0, 0], fp);
  const surround = new THREE.Shape(); surround.moveTo(-0.62, 0); surround.lineTo(0.62, 0); surround.lineTo(0.62, 0.95); surround.quadraticCurveTo(0.6, 1.08, 0.42, 1.1); surround.lineTo(-0.42, 1.1); surround.quadraticCurveTo(-0.6, 1.08, -0.62, 0.95); surround.lineTo(-0.62, 0);
  const op = new THREE.Path(); op.moveTo(-0.24, 0.1); op.lineTo(0.24, 0.1); op.lineTo(0.24, 0.52); op.quadraticCurveTo(0, 0.66, -0.24, 0.52); op.lineTo(-0.24, 0.1); surround.holes.push(op);
  const sg = new THREE.ExtrudeGeometry(surround, {depth: 0.06, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 24});
  const tileM = phys({map: T.tiles, color: '#ffffff', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05}); tileM.map!.wrapS = tileM.map!.wrapT = THREE.RepeatWrapping; tileM.map!.repeat.set(1.6, 1.6);
  mesh(sg, tileM, [0, 0, 0.42], [0, 0, 0], fp);
  mesh(new RoundedBoxGeometry(1.45, 0.05, 0.42, 2, 0.012), tileM, [0, 0.025, 0.63], [0, 0, 0], fp); // hearth
  mesh(new THREE.BoxGeometry(0.5, 0.56, 0.3), new THREE.MeshStandardMaterial({color: '#0b0908', roughness: 1}), [0, 0.38, 0.32], [0, 0, 0], fp); // firebox
  const grate = new THREE.MeshStandardMaterial({color: '#151413', roughness: 0.6, metalness: 0.6});
  for (let k = 0; k < 6; k++) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 8), grate, [0, 0.14 + k * 0.035, 0.46], [0, 0, Math.PI / 2], fp);
  const coalGeo = new THREE.IcosahedronGeometry(0.035, 0);
  const coal = new THREE.InstancedMesh(coalGeo, new THREE.MeshStandardMaterial({color: '#141110', roughness: 0.9, emissive: '#ff4a12', emissiveIntensity: 1}), 70);
  let r = 7; const rnd = () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; };
  for (let i = 0; i < 70; i++) { const m4 = new THREE.Matrix4().compose(new THREE.Vector3((rnd() - 0.5) * 0.36, 0.16 + rnd() * 0.12, 0.38 + rnd() * 0.08), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, 0)), new THREE.Vector3(1, 0.8, 1).multiplyScalar(0.7 + rnd() * 0.7)); coal.setMatrixAt(i, m4); coal.setColorAt(i, new THREE.Color().setHSL(0.03, 1, 0.15 + rnd() * 0.5 * (1 - Math.abs(i / 70 - 0.5)))); }
  coal.name = 'coal'; fp.add(coal);
  mesh(new RoundedBoxGeometry(1.55, 0.05, 0.24, 3, 0.012), walnut, [0, 1.15, 0.52], [0, 0, 0], fp); // mantel shelf
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.42, 64), new THREE.MeshStandardMaterial({color: '#cfd3d6', roughness: 0.03, metalness: 1})); mirror.scale.set(1, 0.72, 1); mirror.position.set(0, 1.72, 0.425); fp.add(mirror);
  const mf = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.018, 12, 96), brass); mf.scale.set(1, 0.72, 1); mf.position.set(0, 1.72, 0.43); fp.add(mf);
  fp.add(mantelClock(walnut, brass, [0, 1.175, 0.52]));
  for (const s of [-1, 1]) { const dog = chinaDog(s); dog.position.set(s * 0.58, 1.175, 0.52); dog.rotation.y = -s * 0.4; fp.add(dog); }
  // ---- flying ducks on the east wall ----
  for (let k = 0; k < 3; k++) { const dk = duck(0.24 - k * 0.04); dk.position.set(RW / 2 - 0.02, 1.55 + k * 0.22, -0.4 + k * 0.42); dk.rotation.y = -Math.PI / 2; dk.rotation.x = -0.25; g.add(dk); }
  // ---- three-piece suite: sofa on the east wall facing west, two armchairs flanking the fire ----
  const sofa = suite(3, moq, walnut); sofa.position.set(RW / 2 - 0.5, 0, 0.35); sofa.rotation.y = -Math.PI / 2; g.add(sofa);
  const ac1 = suite(1, moq, walnut); ac1.position.set(-0.2, 0, -1.15); ac1.rotation.y = 0.75; g.add(ac1);
  const ac2 = suite(1, moq, walnut); ac2.position.set(-0.6, 0, 1.15); ac2.rotation.y = Math.PI / 2 - 0.65; g.add(ac2);
  // ---- standard lamp with fringed shade, side table with tea things ----
  const lamp = standardLamp(brass); lamp.position.set(RW / 2 - 0.35, 0, -0.65); g.add(lamp);
  const table = sideTable(walnut); table.position.set(RW / 2 - 0.42, 0, 1.35); g.add(table);
  // ---- ceiling rose + glass pendant ----
  mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.03, 32), paint, [0, RH - 0.015, 0], [0, 0, 0], g);
  mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.5, 6), new THREE.MeshStandardMaterial({color: '#222'}), [0, RH - 0.27, 0], [0, 0, 0], g);
  const bowl = new THREE.LatheGeometry([[0.01, 0], [0.12, 0.02], [0.2, 0.07], [0.22, 0.11], [0.21, 0.11], [0.19, 0.075], [0.11, 0.03], [0.01, 0.015]].map(([x, y]) => new THREE.Vector2(x, y)), 48);
  mesh(bowl, phys({color: '#f1e6d0', roughness: 0.35, transmission: 0.55, thickness: 0.01, side: THREE.DoubleSide}), [0, RH - 0.63, 0], [0, 0, 0], g);
  // ---- rug ----
  const rugM = new THREE.MeshStandardMaterial({map: T.rug, normalMap: rep(T.rugN.normalMap, 5, 4), roughness: 1});
  mesh(new RoundedBoxGeometry(2.0, 0.012, 1.5, 2, 0.004), rugM, [0.05, 0.006, 0.1], [0, Math.PI / 2, 0], g);
  return g;
}
function laceAlpha() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d')!;
  x.fillStyle = '#000'; x.fillRect(0, 0, S, S); x.strokeStyle = '#fff';
  x.lineWidth = 3; for (let i = -S; i < 2 * S; i += 22) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + S, S); x.stroke(); x.beginPath(); x.moveTo(i, S); x.lineTo(i + S, 0); x.stroke(); }
  x.lineWidth = 6; for (let yy = 64; yy < S; yy += 128) for (let xx = 64; xx < S; xx += 128) { x.beginPath(); x.arc(xx, yy, 34, 0, 7); x.stroke(); x.beginPath(); x.arc(xx, yy, 14, 0, 7); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
/** 1950s three-piece suite: slim base on tall tapered splayed legs, rounded scroll arms, piped seat cushions,
 *  a deep-buttoned back with dimples, show-wood arm caps */
function suite(seats: number, fab: THREE.Material, wood: THREE.Material) {
  const g = new THREE.Group(), sw = 0.6, W = seats * sw + 0.34, D = 0.84, LEG = 0.19;
  const pipe = (fab as THREE.MeshPhysicalMaterial).clone(); pipe.color = new THREE.Color('#c9c1a6');
  mesh(new RoundedBoxGeometry(W, 0.16, D, 5, 0.05), fab, [0, LEG + 0.08, 0], [0, 0, 0], g);                     // base rail
  for (let k = 0; k < seats; k++) {
    const x = -((seats - 1) * sw) / 2 + k * sw, cw = sw - 0.015, cd = D - 0.24;
    mesh(cushion(cw, 0.13, cd, 0.3, 0.05), fab, [x, LEG + 0.235, 0.07], [0, 0, 0], g);
    for (const y of [0.17, 0.3]) { // piping round the cushion edges
      const path = new THREE.CurvePath<THREE.Vector3>(); const hw = cw / 2 - 0.02, hd = cd / 2 - 0.02;
      const pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [-hw, -hd]].map(([a, b]) => new THREE.Vector3(x + a, LEG + y + 0.005, 0.07 + b));
      for (let i = 0; i < 4; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
      mesh(new THREE.TubeGeometry(path as any, 64, 0.006, 6, true), pipe, [0, 0, 0], [0, 0, 0], g);
    }
  }
  // buttoned back: a puffed panel + a grid of buttons sunk into dimples
  const bk = cushion(W - 0.3, 0.5, 0.16, 0.12, 0.07); const bp = bk.attributes.position;
  const bx = [-1, 0, 1].flatMap((i) => [-1, 1].map((j) => [i * (W - 0.4) / 3 * (seats > 1 ? 1 : 0.4), j * 0.11]));
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i); if (z > 0.04) for (const [ax, ay] of bx) { const dd = Math.hypot(x - ax, y - ay); if (dd < 0.07) bp.setZ(i, z - 0.03 * (1 - dd / 0.07) ** 2); } }
  bk.computeVertexNormals();
  const back = mesh(bk, fab, [0, LEG + 0.55, -D / 2 + 0.12], [-0.12, 0, 0], g);
  for (const [ax, ay] of bx) mesh(new THREE.SphereGeometry(0.012, 12, 8).scale(1, 1, 0.6), pipe, [ax, ay, 0.055], [0, 0, 0], back);
  mesh(new RoundedBoxGeometry(W - 0.25, 0.6, 0.12, 5, 0.05), fab, [0, LEG + 0.48, -D / 2 + 0.04], [-0.1, 0, 0], g);
  for (const s of [-1, 1]) {
    // scroll arm: tall rounded block with a rolled top
    mesh(new RoundedBoxGeometry(0.17, 0.36, D, 6, 0.075), fab, [s * (W / 2 - 0.085), LEG + 0.3, 0.01], [0, 0, 0], g);
    mesh(new THREE.CylinderGeometry(0.1, 0.1, D, 32).rotateX(Math.PI / 2), fab, [s * (W / 2 - 0.075), LEG + 0.47, 0.01], [0, 0, 0], g);
    mesh(new RoundedBoxGeometry(0.09, 0.03, D * 0.7, 3, 0.012), wood, [s * (W / 2 - 0.07), LEG + 0.575, 0.08], [0, 0, 0], g);
    for (const z of [-1, 1]) mesh(new THREE.CylinderGeometry(0.02, 0.011, LEG + 0.02, 16), wood, [s * (W / 2 - 0.08) + s * 0.015, LEG / 2, z * (D / 2 - 0.09) + z * 0.012], [z * 0.14, 0, -s * 0.14], g);
  }
  return g;
}
function standardLamp(brass: THREE.Material) {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.04, 32), brass, [0, 0.02, 0], [0, 0, 0], g);
  mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.45, 12), brass, [0, 0.76, 0], [0, 0, 0], g);
  const shade = new THREE.MeshPhysicalMaterial({color: '#e8cf9e', roughness: 0.9, emissive: '#ffb050', emissiveIntensity: 0.55, side: THREE.DoubleSide, sheen: 0.4});
  mesh(new THREE.CylinderGeometry(0.17, 0.28, 0.32, 48, 1, true), shade, [0, 1.55, 0], [0, 0, 0], g).name = 'shade';
  // fringe: thin strands round the hem
  const fr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.06, 4), new THREE.MeshStandardMaterial({color: '#c89a5a', roughness: 0.8}), 160);
  for (let i = 0; i < 160; i++) { const a = (i / 160) * Math.PI * 2; fr.setMatrixAt(i, new THREE.Matrix4().setPosition(Math.cos(a) * 0.281, 1.36, Math.sin(a) * 0.281)); }
  g.add(fr);
  mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshStandardMaterial({color: '#fff', emissive: '#ffd9a0', emissiveIntensity: 6}), [0, 1.5, 0], [0, 0, 0], g).castShadow = false;
  return g;
}
function sideTable(wood: THREE.Material) {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.025, 48), wood, [0, 0.58, 0], [0, 0, 0], g);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; mesh(new THREE.CylinderGeometry(0.016, 0.01, 0.58, 12), wood, [Math.cos(a) * 0.17, 0.29, Math.sin(a) * 0.17], [Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18], g); }
  const china = new THREE.MeshPhysicalMaterial({color: '#f4f1ea', roughness: 0.12, clearcoat: 1});
  const cup = new THREE.LatheGeometry([[0, 0], [0.025, 0], [0.035, 0.012], [0.042, 0.05], [0.04, 0.05], [0.033, 0.014], [0.02, 0.004], [0, 0.004]].map(([x, y]) => new THREE.Vector2(x, y)), 32);
  const saucer = new THREE.LatheGeometry([[0, 0], [0.05, 0.002], [0.07, 0.012], [0.068, 0.014], [0.048, 0.005], [0, 0.005]].map(([x, y]) => new THREE.Vector2(x, y)), 32);
  for (const [x, z] of [[-0.09, 0.05], [0.1, -0.06]]) { mesh(saucer, china, [x, 0.593, z], [0, 0, 0], g); mesh(cup, china, [x, 0.6, z], [0, 0, 0], g); mesh(new THREE.TorusGeometry(0.012, 0.003, 8, 16, Math.PI), china, [x + 0.042, 0.627, z], [0, 0, -Math.PI / 2], g); }
  const pot = new THREE.LatheGeometry([[0, 0], [0.06, 0], [0.08, 0.03], [0.085, 0.07], [0.07, 0.11], [0.03, 0.125], [0.032, 0.14], [0, 0.145]].map(([x, y]) => new THREE.Vector2(x, y)), 40);
  mesh(pot, new THREE.MeshPhysicalMaterial({color: '#3a4f6b', roughness: 0.15, clearcoat: 1}), [0.0, 0.593, 0.13], [0, 0, 0], g);
  return g;
}
function mantelClock(wood: THREE.Material, brass: THREE.Material, at: [number, number, number]) {
  const g = new THREE.Group(); g.position.set(...at);
  const s = new THREE.Shape(); s.moveTo(-0.2, 0); s.lineTo(0.2, 0); s.quadraticCurveTo(0.22, 0.07, 0.14, 0.11); s.quadraticCurveTo(0.08, 0.2, 0, 0.2); s.quadraticCurveTo(-0.08, 0.2, -0.14, 0.11); s.quadraticCurveTo(-0.22, 0.07, -0.2, 0);
  mesh(new THREE.ExtrudeGeometry(s, {depth: 0.09, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 3, curveSegments: 24}), wood, [0, 0, -0.045], [0, 0, 0], g);
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!; x.fillStyle = '#f1e9d6'; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill();
  x.fillStyle = '#1b1b1b'; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; x.save(); x.translate(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); x.rotate(a); x.fillRect(-3, -11, 6, 22); x.restore(); }
  x.strokeStyle = '#111'; x.lineCap = 'round'; x.lineWidth = 7; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + 50, 128 - 30); x.stroke(); x.lineWidth = 4; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 - 18, 128 - 82); x.stroke();
  const dial = new THREE.CanvasTexture(c); dial.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.CircleGeometry(0.058, 48), new THREE.MeshPhysicalMaterial({map: dial, roughness: 0.3, clearcoat: 1}), [0, 0.105, 0.052], [0, 0, 0], g);
  mesh(new THREE.TorusGeometry(0.06, 0.006, 10, 48), brass, [0, 0.105, 0.053], [0, 0, 0], g);
  return g;
}
function chinaDog(side: number) {
  const g = new THREE.Group(), m = new THREE.MeshPhysicalMaterial({color: '#f3efe6', roughness: 0.1, clearcoat: 1}), dark = new THREE.MeshPhysicalMaterial({color: '#7a4a2a', roughness: 0.15, clearcoat: 1});
  mesh(new THREE.SphereGeometry(0.05, 24, 16).scale(0.9, 1.1, 0.8), m, [0, 0.06, 0], [0, 0, 0], g);
  mesh(new THREE.SphereGeometry(0.034, 24, 16), m, [0, 0.13, 0.015], [0, 0, 0], g);
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.016, 12, 8).scale(0.6, 1.4, 0.5), dark, [s * 0.03, 0.125, 0.01], [0, 0, s * 0.3], g);
  mesh(new THREE.SphereGeometry(0.018, 12, 8).scale(1, 0.8, 1.3), m, [0, 0.12, 0.045], [0, 0, 0], g);
  void side; return g;
}
function duck(size: number) {
  const g = new THREE.Group(), body = new THREE.MeshPhysicalMaterial({color: '#7f8a5a', roughness: 0.12, clearcoat: 1}), head = new THREE.MeshPhysicalMaterial({color: '#2f5a3c', roughness: 0.1, clearcoat: 1}), wing = new THREE.MeshPhysicalMaterial({color: '#a98a62', roughness: 0.14, clearcoat: 1});
  mesh(new THREE.SphereGeometry(size * 0.35, 24, 16).scale(1.5, 0.75, 0.55), body, [0, 0, 0.0], [0, 0, 0], g);
  mesh(new THREE.SphereGeometry(size * 0.18, 20, 14), head, [size * 0.55, size * 0.12, 0], [0, 0, 0], g);
  mesh(new THREE.ConeGeometry(size * 0.06, size * 0.18, 12).rotateZ(-Math.PI / 2), new THREE.MeshPhysicalMaterial({color: '#d9a13a', roughness: 0.2, clearcoat: 1}), [size * 0.75, size * 0.1, 0], [0, 0, 0], g);
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(size * 0.3, 16, 10).scale(1.2, 0.25, 0.9), wing, [-size * 0.05, size * 0.2, s * size * 0.12], [s * 0.6, 0, 0.3], g);
  return g;
}
