// Geometry kit: boxes/planes with UVs in metres (so PBR textures keep real-world scale), merged batches, emissive glass.
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** box with UVs scaled to metres / texel size `tile` (m per texture repeat) */
export const boxUV = (w: number, h: number, d: number, tile = 1) => {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv as THREE.BufferAttribute, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [su, sv] = ax > 0.5 ? [d, h] : ay > 0.5 ? [w, d] : [w, h];
    uv.setXY(i, (uv.getX(i) * su) / tile, (uv.getY(i) * sv) / tile);
  }
  g.setAttribute('uv2', uv.clone());
  return g;
};
export const planeUV = (w: number, h: number, tile = 1) => {
  const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * h) / tile);
  return g;
};
/** collects geometries per material key and merges them into one mesh per material */
export class Batch {
  parts = new Map<string, THREE.BufferGeometry[]>();
  add(key: string, g: THREE.BufferGeometry, m: THREE.Matrix4 | [number, number, number], rotY = 0) {
    const M = Array.isArray(m) ? new THREE.Matrix4().makeRotationY(rotY).setPosition(...m) : m;
    const gg = g.index ? g.toNonIndexed() : g.clone(); gg.applyMatrix4(M);
    for (const k of Object.keys(gg.attributes)) if (!['position', 'normal', 'uv'].includes(k)) gg.deleteAttribute(k);
    if (!this.parts.has(key)) this.parts.set(key, []);
    this.parts.get(key)!.push(gg);
  }
  build(mats: Record<string, THREE.Material>, shadows = true) {
    const grp = new THREE.Group();
    for (const [k, gs] of this.parts) {
      const geo = mergeGeometries(gs); if (!geo) continue;
      const me = new THREE.Mesh(geo, mats[k] ?? new THREE.MeshStandardMaterial({color: '#ff00ff'}));
      me.castShadow = shadows; me.receiveShadow = true; me.name = k; grp.add(me);
    }
    return grp;
  }
}
/** deterministic random */
export const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export const hash = (a: number, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

/** merge every mesh under `root` into one mesh per material (world transforms baked) — far fewer draw calls */
export function mergeByMaterial(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>(), keep: THREE.Object3D[] = [];
  root.traverse((o: any) => {
    if (o.isInstancedMesh || o.isLight || o.isPoints) { keep.push(o); return; }
    if (!o.isMesh) return;
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()) as THREE.BufferGeometry;
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    const m = o.material as THREE.Material; if (!buckets.has(m)) buckets.set(m, []); buckets.get(m)!.push(g);
  });
  const out = new THREE.Group();
  for (const [m, gs] of buckets) { const geo = mergeGeometries(gs, false); if (!geo) continue; const me = new THREE.Mesh(geo, m); me.castShadow = me.receiveShadow = true; out.add(me); }
  for (const k of keep) { const c = k.clone(); c.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, k.parent!.matrixWorld)); out.add(c); }
  return out;
}
