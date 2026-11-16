// Realistic privet hedge: a dark woody core + thousands of individual leaf cards (alpha-cut privet leaves) scattered over
// a lumpy clipped volume, facing outward with random tilt, colour-varied, darker inside. One InstancedMesh per hedge.
import * as THREE from 'three';
let _leaf: {map: THREE.Texture; alpha: THREE.Texture} | null = null;
function leafTex() {
  if (_leaf) return _leaf;
  const S = 256, c = document.createElement('canvas'), a = document.createElement('canvas'); c.width = c.height = a.width = a.height = S;
  const g = c.getContext('2d')!, ga = a.getContext('2d')!; ga.fillStyle = '#000'; ga.fillRect(0, 0, S, S);
  // 4 leaves per texture (2x2 atlas) so neighbours vary
  for (let k = 0; k < 4; k++) {
    const ox = (k % 2) * 128, oy = Math.floor(k / 2) * 128, path = new Path2D();
    path.moveTo(ox + 64, oy + 8); path.bezierCurveTo(ox + 108, oy + 34, ox + 100, oy + 96, ox + 64, oy + 122); path.bezierCurveTo(ox + 28, oy + 96, ox + 20, oy + 34, ox + 64, oy + 8);
    const gr = g.createLinearGradient(ox + 20, oy, ox + 108, oy + 128); const base = [[70, 112, 44], [58, 98, 36], [86, 126, 52], [64, 104, 40]][k];
    gr.addColorStop(0, `rgb(${base[0] + 30},${base[1] + 30},${base[2] + 10})`); gr.addColorStop(1, `rgb(${base[0] - 18},${base[1] - 18},${base[2] - 8})`);
    g.fillStyle = gr; g.fill(path); g.strokeStyle = `rgba(200,230,150,0.55)`; g.lineWidth = 2; g.beginPath(); g.moveTo(ox + 64, oy + 12); g.lineTo(ox + 64, oy + 118); g.stroke();
    g.lineWidth = 1; for (let v = 0; v < 5; v++) { const y = oy + 30 + v * 17; g.beginPath(); g.moveTo(ox + 64, y); g.lineTo(ox + 40, y - 10); g.moveTo(ox + 64, y); g.lineTo(ox + 88, y - 10); g.stroke(); }
    ga.fillStyle = '#fff'; ga.fill(path);
  }
  const map = new THREE.CanvasTexture(c), alpha = new THREE.CanvasTexture(a); map.colorSpace = THREE.SRGBColorSpace;
  _leaf = {map, alpha}; return _leaf;
}
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
/** hedge of size (w, h, d), base centred at origin; ~1100 leaves per m² of surface */
export function leafHedge(w: number, h: number, d: number, seed = 3, density = 2600) {
  const g = new THREE.Group(), r = rng(seed);
  const core = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, h * 0.92, d * 0.86), new THREE.MeshStandardMaterial({color: '#203a16', roughness: 1})); core.position.y = h * 0.46; g.add(core);
  const T = leafTex(), area = 2 * (w * h + d * h) + w * d, N = Math.floor(area * density);
  const geo = new THREE.PlaneGeometry(0.04, 0.055); // leaf card; uv picks one of 4 atlas cells via instance attr
  const cell = new Float32Array(N * 2), col = new THREE.Color();
  const mat = new THREE.MeshStandardMaterial({map: T.map, alphaMap: T.alpha, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55});
  mat.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aCell;').replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv * 0.5 + aCell;\n#endif\n#ifdef USE_ALPHAMAP\nvAlphaMapUv = vAlphaMapUv * 0.5 + aCell;\n#endif');
  };
  const im = new THREE.InstancedMesh(geo, mat, N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), n = new THREE.Vector3(), sc = new THREE.Vector3();
  const lump = (x: number, y: number, z: number) => 1 + 0.06 * Math.sin(x * 9 + z * 4) * Math.cos(y * 7 + x * 3) + 0.03 * Math.sin(x * 23 + y * 19);
  for (let i = 0; i < N; i++) {
    // pick a face by area, a point on it, push in/out a little (depth), orient toward the face normal
    const f = r() * area; let fx: number, fy: number, fz: number;
    if (f < w * d) { fx = (r() - 0.5) * w; fz = (r() - 0.5) * d; fy = h; n.set(0, 1, 0); }
    else if (f < w * d + 2 * w * h) { fx = (r() - 0.5) * w; fy = r() * h; fz = (r() < 0.5 ? -1 : 1) * d / 2; n.set(0, 0, Math.sign(fz)); }
    else { fz = (r() - 0.5) * d; fy = r() * h; fx = (r() < 0.5 ? -1 : 1) * w / 2; n.set(Math.sign(fx), 0, 0); }
    const depth = -Math.pow(r(), 1.5) * 0.14, L = lump(fx, fy, fz);
    p.set(fx, fy, fz).addScaledVector(n, depth); p.x *= L; p.z *= L; p.y = Math.min(p.y * (0.98 + 0.04 * L), h * L);
    e.set((r() - 0.5) * 2.2, (r() - 0.5) * 2.2, r() * 6.28); q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n).multiply(new THREE.Quaternion().setFromEuler(e));
    const s = 0.75 + r() * 0.6; sc.set(s, s, s); m4.compose(p, q, sc); im.setMatrixAt(i, m4);
    const shade = 0.45 + 0.55 * (1 + depth / 0.14) * (0.85 + 0.15 * r()); col.setRGB(shade * (0.9 + 0.2 * r()), shade, shade * (0.85 + 0.2 * r())); im.setColorAt(i, col);
    cell[i * 2] = (Math.floor(r() * 2)) * 0.5; cell[i * 2 + 1] = (Math.floor(r() * 2)) * 0.5;
  }
  geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 2));
  im.castShadow = true; im.receiveShadow = true; g.add(im);
  return g;
}
