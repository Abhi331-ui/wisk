// Deterministic asset loading for Remotion: every load holds the frame with delayRender until ready, cached per tab.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {continueRender, delayRender, staticFile} from 'remotion';
import {useEffect, useState} from 'react';

const cache = new Map<string, Promise<any>>();
const once = <T,>(key: string, make: () => Promise<T>): Promise<T> => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key)!;
};
const done = new Map<string, any>();

/** React hook: returns the loaded value, or null while loading (the frame is held until it resolves). */
export function useAsset<T>(key: string, make: () => Promise<T>): T | null {
  const [v, setV] = useState<T | null>(() => (done.has(key) ? done.get(key) : null));
  useEffect(() => {
    if (done.has(key)) { setV(done.get(key)); return; }
    const h = delayRender('asset ' + key, {timeoutInMilliseconds: 600000});
    once(key, make).then((x) => { done.set(key, x); setV(x); continueRender(h); })
      .catch((e) => { console.error('asset failed', key, e); continueRender(h); });
  }, [key]);
  return v;
}

const texLoader = new THREE.TextureLoader();
export const loadTex = (path: string, srgb = false) => once('tex:' + path + srgb, () => new Promise<THREE.Texture>((res, rej) =>
  texLoader.load(staticFile(path), (t) => { t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; res(t); }, undefined, rej)));

export type PBR = {map: THREE.Texture; normalMap?: THREE.Texture; roughnessMap?: THREE.Texture; aoMap?: THREE.Texture};
/** Poly Haven texture set at public/assets/tex/<id>/{diff,nor,rough,ao}.jpg */
export const loadPBR = (id: string) => once('pbr:' + id, async () => {
  const b = `assets/tex/${id}/`;
  const [map, normalMap, roughnessMap, aoMap] = await Promise.all([
    loadTex(b + 'diff.jpg', true), loadTex(b + 'nor.jpg').catch(() => undefined),
    loadTex(b + 'rough.jpg').catch(() => undefined), loadTex(b + 'ao.jpg').catch(() => undefined)]);
  return {map, normalMap, roughnessMap, aoMap} as PBR;
});
/** a material from a PBR set, repeated rx × ry times (textures are cloned so each material has its own repeat) */
export const pbrMaterial = (p: PBR, rx = 1, ry = 1, extra: THREE.MeshStandardMaterialParameters = {}) => {
  const c = (t?: THREE.Texture) => { if (!t) return undefined; const n = t.clone(); n.repeat.set(rx, ry); n.needsUpdate = true; return n; };
  return new THREE.MeshStandardMaterial({map: c(p.map), normalMap: c(p.normalMap), roughnessMap: c(p.roughnessMap), aoMap: c(p.aoMap), ...extra});
};

const gltfLoader = new GLTFLoader();
/** Poly Haven glTF at public/assets/models/<id>/<id>.gltf; returns the scene (clone it before placing twice) */
export const loadModel = (id: string) => once('gltf:' + id, () => new Promise<THREE.Group>((res, rej) =>
  gltfLoader.load(staticFile(`assets/models/${id}/${id}.gltf`), (g) => {
    g.scene.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    res(g.scene);
  }, undefined, rej)));

export const loadHDR = (id: string, res = '2k') => once('hdr:' + id + res, () => new Promise<THREE.DataTexture>((ok, rej) =>
  new RGBELoader().load(staticFile(`assets/hdri/${id}_${res}.hdr`), (t) => { t.mapping = THREE.EquirectangularReflectionMapping; ok(t); }, undefined, rej)));
/** the downscaled photographic background (scripts/prep_bg.py makes <id>_bg.jpg, 8192 wide) */
export const loadBG = (id: string) => loadTex(`assets/hdri/${id}_bg.jpg`, true).then((t) => {
  t.mapping = THREE.EquirectangularReflectionMapping; t.wrapS = THREE.RepeatWrapping; return t;
});
