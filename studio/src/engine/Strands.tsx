// Spaghetti strands draped over branches: pale semolina-gold tubes hanging in catenary loops from points sampled on
// a tree's foliage underside, swaying in the shared wind (more at the free end), soft translucency when backlit.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {WIND, WIND_GLSL} from './wind';

const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
/** hang points: world positions on the lower canopy of `tree` (after its matrixWorld is final) */
export const hangPoints = (tree: THREE.Object3D, n: number, seed = 3, band: [number, number] = [0.25, 0.6]) => {
  tree.updateMatrixWorld(true);
  const pts: THREE.Vector3[] = [], box = new THREE.Box3().setFromObject(tree), r = rng(seed), all: THREE.Vector3[] = [];
  const y0 = box.min.y + (box.max.y - box.min.y) * band[0], y1 = box.min.y + (box.max.y - box.min.y) * band[1];
  tree.traverse((o: any) => {
    if (!o.isMesh) return; const p = o.geometry.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 7) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); if (v.y > y0 && v.y < y1) all.push(v.clone()); }
  });
  for (let i = 0; i < n && all.length; i++) pts.push(all[Math.floor(r() * all.length)]);
  return pts;
};
export const Strands: React.FC<{points: THREE.Vector3[]; t: number; perPoint?: number; length?: [number, number]; seed?: number; color?: string}> =
  ({points, t, perPoint = 7, length = [0.35, 0.75], seed = 5, color = '#e9cf86'}) => {
  const mesh = useMemo(() => {
    const r = rng(seed), geos: THREE.BufferGeometry[] = [];
    for (const p of points) for (let k = 0; k < perPoint; k++) {
      const L = length[0] + (length[1] - length[0]) * r(), a = r() * Math.PI * 2, spread = 0.02 + 0.05 * r();
      const top = p.clone().add(new THREE.Vector3(Math.cos(a) * spread, 0, Math.sin(a) * spread));
      // a strand draped over the branch: two legs hanging from the top, slight curl
      const legs = r() < 0.6 ? 2 : 1;
      for (let s = 0; s < legs; s++) {
        const dir = new THREE.Vector3(Math.cos(a + s * Math.PI), 0, Math.sin(a + s * Math.PI)).multiplyScalar(0.03 + 0.03 * r());
        const len = L * (s ? 0.6 + 0.4 * r() : 1), pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(top.clone().add(dir.clone().multiplyScalar(Math.sin(u * Math.PI) * 0.6 + u * 0.4)).add(new THREE.Vector3(Math.sin(u * 9 + a) * 0.006, -u * len, Math.cos(u * 7 + a) * 0.006))); }
        const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.0016 + 0.0006 * r(), 4, false);
        const vv = new Float32Array(g.attributes.position.count), uvs = g.attributes.uv;
        for (let i = 0; i < vv.length; i++) vv[i] = uvs.getX(i) * len; // distance from the top (m)
        g.setAttribute('aV', new THREE.BufferAttribute(vv, 1)); geos.push(g);
      }
    }
    const geo = mergeGeometries(geos);
    const m = new THREE.MeshPhysicalMaterial({color, roughness: 0.42, sheen: 0.4, sheenColor: new THREE.Color('#fff2c0'), transmission: 0.0, thickness: 0.002});
    const u = {uT: {value: 0}, uWindDir: {value: new THREE.Vector2(...WIND.dir)}, uWindS: {value: WIND.strength}, uWindG: {value: WIND.gust}};
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, u);
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float aV;' + WIND_GLSL)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float w = windAt(position.xz); float k = aV * aV;
          transformed.xz += normalize(uWindDir) * w * 0.35 * k + vec2(sin(uT*2.3 + position.x*7.0), cos(uT*1.9 + position.z*5.0)) * 0.05 * k * (0.4 + w);`);
      s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(0.08,0.06,0.02);');
    };
    const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; (me as any).userData.u = u;
    return me;
  }, [points, seed]);
  (mesh as any).userData.u.uT.value = t;
  return <primitive object={mesh} />;
};
