// The user's LOCKED grass look (.claude/skills/locked-grass): 4-segment blades 0.012 m wide tapering to the tip, 0.32 m tall,
// t² forward bend, vertex colour dark root → light tip, per-blade green tint RGB(0.36-0.54, 0.55-0.77, 0.20-0.30), ~8 % straw
// blades RGB(0.95, 0.85, 0.5), random yaw, tilt ±0.25 rad, height ×0.6-1.5, MeshStandardMaterial double-sided, roughness 0.8,
// envMapIntensity 0.5, receives shadows, no frustum culling, ~330 blades/m² near camera. Look values are NOT to be changed.
// Added on top (skill rule: one wind drives everything): vertex-shader sway from the shared wind field, quadratic in height.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {WIND, WIND_GLSL} from './wind';

export type Zone = [number, number, number, number, number]; // cx, cz, width, depth, count
export type GrassProps = {zones: Zone[]; t: number; skip?: (x: number, z: number) => boolean; heightAt?: (x: number, z: number) => number; seed?: number; straw?: number};
export const Grass: React.FC<GrassProps> = ({zones, t, skip = () => false, heightAt = () => 0, seed = 5, straw = 0.08}) => {
  const mesh = useMemo(() => {
    let s0 = (seed * 16807) % 2147483647 || 1; const rnd = () => ((s0 = (s0 * 16807) % 2147483647) - 1) / 2147483646;
    const seg = 4, geo = new THREE.BufferGeometry(), pos: number[] = [], col: number[] = [], idx: number[] = [], hv: number[] = [];
    for (let s = 0; s <= seg; s++) {
      const tt = s / seg, w = 0.012 * (1 - tt * 0.92), y = tt * 0.32, bend = tt * tt * 0.09;
      pos.push(-w, y, bend, w, y, bend); hv.push(tt, tt);
      const c = 0.42 + 0.58 * tt; col.push(c * 0.78, c, c * 0.62, c * 0.78, c, c * 0.62);
      if (s < seg) { const k = s * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aH', new THREE.Float32BufferAttribute(hv, 1)); geo.setIndex(idx); geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({vertexColors: true, side: THREE.DoubleSide, roughness: 0.8, envMapIntensity: 0.5});
    const u = {uT: {value: 0}, uWindDir: {value: new THREE.Vector2(...WIND.dir)}, uWindS: {value: WIND.strength}, uWindG: {value: WIND.gust}};
    mat.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, u);
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float aH;' + WIND_GLSL)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float w = windAt(wp.xz);
          float sway = (w * 0.55 + sin(uT * 2.6 + wp.x * 1.7 + wp.z * 1.1) * 0.12 * (0.4 + w)) * aH * aH * 0.32;
          vec3 wl = (inverse(mat3(instanceMatrix)) * vec3(uWindDir.x, 0.0, uWindDir.y));
          transformed += normalize(wl) * sway;`);
    };
    const pts: [number, number][] = [];
    for (const [zx, zz, zw, zd, n] of zones) for (let i = 0; i < n; i++) { const x = zx + (rnd() - 0.5) * zw, z = zz + (rnd() - 0.5) * zd; if (!skip(x, z)) pts.push([x, z]); }
    const im = new THREE.InstancedMesh(geo, mat, pts.length), M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler(), C4 = new THREE.Color();
    pts.forEach(([x, z], i) => {
      E4.set((rnd() - 0.5) * 0.5, rnd() * 6.28, (rnd() - 0.5) * 0.5); Q4.setFromEuler(E4); const sc = 0.6 + rnd() * 0.9;
      M4.compose(new THREE.Vector3(x, heightAt(x, z), z), Q4, new THREE.Vector3(1, sc, 1)); im.setMatrixAt(i, M4);
      im.setColorAt(i, rnd() < straw ? C4.setRGB(0.95, 0.85, 0.5) : C4.setRGB(0.36 + rnd() * 0.18, 0.55 + rnd() * 0.22, 0.2 + rnd() * 0.1));
    });
    im.receiveShadow = true; im.frustumCulled = false; (im as any).userData.u = u;
    return im;
  }, [seed, JSON.stringify(zones)]);
  (mesh as any).userData.u.uT.value = t;
  return <primitive object={mesh} />;
};
