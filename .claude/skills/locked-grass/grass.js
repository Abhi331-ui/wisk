// Locked grass (the user's pick, video 15). Usage:
//   import { addGrass } from "./grass.js";
//   addGrass(THREE, scene, { zones: [[cx, cz, w, d, count], ...], skip: (x, z) => false, heightAt: (x, z) => 0, seed: 5 });
// One InstancedMesh of curved blades: 4 segments, 0.012 m wide tapering to the tip, 0.32 m tall, t^2 forward bend,
// dark root -> light tip, per-blade green variation, ~8% straw-yellow blades, tilt +-0.25 rad, height x0.6-1.5.
export function addGrass(THREE, scene, o = {}) {
  const { zones = [[0, 0, 20, 20, 40000]], skip = () => false, heightAt = () => 0, seed = 5, straw = 0.08 } = o;
  let s0 = seed * 16807 % 2147483647 || 1; const rnd = () => ((s0 = (s0 * 16807) % 2147483647) - 1) / 2147483646;
  const seg = 4, geo = new THREE.BufferGeometry(), pos = [], col = [], idx = [];
  for (let s = 0; s <= seg; s++) { const t = s / seg, w = 0.012 * (1 - t * 0.92), y = t * 0.32, bend = t * t * 0.09; pos.push(-w, y, bend, w, y, bend); const c = 0.42 + 0.58 * t; col.push(c * 0.78, c, c * 0.62, c * 0.78, c, c * 0.62); if (s < seg) { const k = s * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8, envMapIntensity: 0.5 });
  const pts = [];
  for (const [zx, zz, zw, zd, n] of zones) for (let i = 0; i < n; i++) { const x = zx + (rnd() - 0.5) * zw, z = zz + (rnd() - 0.5) * zd; if (!skip(x, z)) pts.push([x, z]); }
  const im = new THREE.InstancedMesh(geo, mat, pts.length), M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler(), C4 = new THREE.Color();
  pts.forEach(([x, z], i) => { E4.set((rnd() - 0.5) * 0.5, rnd() * 6.28, (rnd() - 0.5) * 0.5); Q4.setFromEuler(E4); const s = 0.6 + rnd() * 0.9; M4.compose(new THREE.Vector3(x, heightAt(x, z), z), Q4, new THREE.Vector3(1, s, 1)); im.setMatrixAt(i, M4);
    im.setColorAt(i, rnd() < straw ? C4.setRGB(0.95, 0.85, 0.5) : C4.setRGB(0.36 + rnd() * 0.18, 0.55 + rnd() * 0.22, 0.2 + rnd() * 0.1)); });
  im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return im;
}
