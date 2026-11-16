// GPU-instanced grass blades: tapered, curved, colour-graded root→tip, translucent tips, swaying in the global wind.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {WIND, WIND_GLSL} from './wind';

const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export type GrassProps = {
  center: [number, number]; size: [number, number]; count: number; height?: [number, number]; seed?: number; t: number;
  base?: string; tip?: string; dry?: string; ground?: (x: number, z: number) => number; avoid?: (x: number, z: number) => boolean;
  flowers?: number; width?: number;
  /** camera position (x, z) for this set: blades are drawn nearest-first (early depth rejection) and thinned with distance */
  eye?: [number, number]; full?: number; lite?: boolean; single?: boolean;
};
export const Grass: React.FC<GrassProps> = ({center, size, count, height = [0.25, 0.6], seed = 7, t, base = '#2f4a17', tip = '#9cb04a', dry = '#b9a65a', ground, avoid, flowers = 0, width = 0.028, eye, full = 8, lite = false, single = false}) => {
  const mesh = useMemo(() => {
    console.log('GRASS BUILD', Date.now());
    const seg = 5, g = new THREE.BufferGeometry(), pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= seg; i++) {
      const v = i / seg, w = (1 - Math.pow(v, 1.6)) * 0.5;
      pos.push(-w, v, 0, w, v, 0); uv.push(0, v, 1, v);
      if (i < seg) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.computeVertexNormals();
    const r = rng(seed), N = count, inst = new THREE.InstancedBufferGeometry(); inst.copy(g as any); inst.instanceCount = N;
    const off = new Float32Array(N * 4), shp = new Float32Array(N * 4), col = new Float32Array(N * 3);
    const cB = new THREE.Color(base), cT = new THREE.Color(tip), cD = new THREE.Color(dry), c = new THREE.Color();
    let n = 0;
    while (n < N) {
      const x = center[0] + (r() - 0.5) * size[0], z = center[1] + (r() - 0.5) * size[1];
      if (avoid && avoid(x, z)) continue;
      // clumping: thin out between clumps
      const clump = 0.5 + 0.5 * Math.sin(x * 1.7 + Math.sin(z * 0.9) * 2) * Math.sin(z * 1.3 + Math.sin(x * 0.7));
      if (r() > 0.55 + 0.45 * clump) continue;
      const dEye = eye ? Math.hypot(x - eye[0], z - eye[1]) : 0;
      if (eye && dEye > full && r() > Math.pow(full / dEye, 1.6)) continue;
      const y = ground ? ground(x, z) : 0, hgt = height[0] + (height[1] - height[0]) * Math.pow(r(), 0.8) * (0.7 + 0.3 * clump);
      off.set([x, y, z, r() * Math.PI * 2], n * 4);
      shp.set([hgt, width * (0.7 + 0.6 * r()), (r() - 0.5) * 0.6 + 0.25, r()], n * 4);
      c.copy(cT).lerp(cD, Math.pow(r(), 3) * 0.7).multiplyScalar(0.8 + 0.4 * r()); col.set([c.r, c.g, c.b], n * 3); n++;
    }
    if (eye) { // nearest first: sort the instance arrays by distance to the eye
      const ord = Array.from({length: N}, (_, i) => i), d = ord.map((i) => Math.hypot(off[i * 4] - eye[0], off[i * 4 + 2] - eye[1]));
      ord.sort((a, b) => d[a] - d[b]);
      const o2 = off.slice(), s2 = shp.slice(), c2 = col.slice();
      ord.forEach((src, dst) => { off.set(o2.subarray(src * 4, src * 4 + 4), dst * 4); shp.set(s2.subarray(src * 4, src * 4 + 4), dst * 4); col.set(c2.subarray(src * 3, src * 3 + 3), dst * 3); });
    }
    inst.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4)); inst.setAttribute('aShp', new THREE.InstancedBufferAttribute(shp, 4));
    inst.setAttribute('aTip', new THREE.InstancedBufferAttribute(col, 3));
    inst.boundingSphere = new THREE.Sphere(new THREE.Vector3(center[0], 0, center[1]), Math.hypot(size[0], size[1]));
    const m = lite ? new THREE.MeshLambertMaterial({color: '#ffffff', side: single ? THREE.FrontSide : THREE.DoubleSide}) as any : new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.85, side: single ? THREE.FrontSide : THREE.DoubleSide});
    const u = {uT: {value: 0}, uWindDir: {value: new THREE.Vector2(...WIND.dir)}, uWindS: {value: WIND.strength}, uWindG: {value: WIND.gust}, uBase: {value: new THREE.Color(base)}};
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, u);
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aOff; attribute vec4 aShp; attribute vec3 aTip; varying vec3 vCol; varying float vV; uniform vec3 uBase;' + WIND_GLSL)
        .replace('#include <beginnormal_vertex>', `vec3 objectNormal = vec3(0.0,0.0,1.0);`)
        .replace('#include <begin_vertex>', `
          float v = position.y; vV = v;
          float ca = cos(aOff.w), sa = sin(aOff.w);
          vec3 p = vec3(position.x * aShp.y * 2.0, v * aShp.x, 0.0);
          // natural curve + wind bend (quadratic in height)
          float w = windAt(aOff.xz) * (0.85 + 0.3 * aShp.w);
          float sway = sin(uT * (2.2 + aShp.w) + aOff.x * 1.3 + aOff.z) * 0.18 * w;
          float bend = (aShp.z + w * 0.9 + sway) * v * v;
          p.z += bend * aShp.x; p.y -= 0.35 * bend * bend * aShp.x * 0.4;
          vec3 q = vec3(p.x * ca - p.z * sa, p.y, p.x * sa + p.z * ca);
          vec2 wd = normalize(uWindDir); q.xz += wd * w * 0.25 * v * v * aShp.x;
          vec3 transformed = q + aOff.xyz;
          vCol = mix(uBase * 0.55, aTip, smoothstep(0.0, 0.85, v));`)
        .replace('#include <defaultnormal_vertex>', `vec3 bn = normalize(vec3(-sin(aOff.w), 0.35, cos(aOff.w))); vec3 transformedNormal = normalMatrix * normalize(mix(bn, vec3(0.0,1.0,0.0), 0.55));
          #ifdef FLIP_SIDED
          transformedNormal = - transformedNormal;
          #endif`);
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vCol; varying float vV;')
        .replace('#include <color_fragment>', 'diffuseColor.rgb *= vCol;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vCol * 0.06 * smoothstep(0.5,1.0,vV);');
      (m as any).userData.u = u;
    };
    (m as any).userData.u = u;
    const me = new THREE.Mesh(inst, m); me.frustumCulled = false; me.receiveShadow = true; me.castShadow = false;
    return me;
  }, [seed, count, eye?.[0], eye?.[1], lite, single]);
  (mesh.material as any).userData.u.uT.value = t;
  return <primitive object={mesh} />;
};
